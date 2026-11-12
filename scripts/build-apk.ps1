param(
  [string]$SdkPath='',
  [string]$JavaPath='',
  [ValidateSet('arm64-v8a','x86_64','universal')][string]$Architecture='arm64-v8a',
  [switch]$AppBundle
)
$ErrorActionPreference='Stop'
$mobileRoot=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$webRoot=(Resolve-Path -LiteralPath (Join-Path $mobileRoot '..')).Path
$cacheRoot=Join-Path $webRoot '.local'
$bundledNode=Join-Path $webRoot '.playwright-runtime/node-v24.19.0-win-x64/node.exe'
$buildNode=if(Test-Path -LiteralPath $bundledNode){$bundledNode}else{(Get-Command node -ErrorAction Stop).Source}
if(!$JavaPath){$JavaPath=Join-Path $env:ProgramFiles 'Android/Android Studio/jbr'}
if(!(Test-Path -LiteralPath (Join-Path $JavaPath 'bin/javac.exe'))){throw 'A JDK is required. Supply -JavaPath with its directory.'}
if(!$SdkPath){$SdkPath=Join-Path $cacheRoot 'android-sdk'}
New-Item -ItemType Directory -Path $SdkPath -Force | Out-Null
$sdkLicenses=Join-Path $env:LOCALAPPDATA 'Android/Sdk/licenses'
if(!(Test-Path -LiteralPath (Join-Path $SdkPath 'licenses')) -and (Test-Path -LiteralPath $sdkLicenses)){
 Copy-Item -LiteralPath $sdkLicenses -Destination $SdkPath -Recurse
}
$env:JAVA_HOME=$JavaPath
$env:ANDROID_HOME=$SdkPath
$env:ANDROID_SDK_ROOT=$SdkPath
$env:GRADLE_USER_HOME=Join-Path $cacheRoot 'gradle-home'
$env:EXPO_NO_TELEMETRY='1'
$env:EXPO_OFFLINE='1'
$env:CI='1'
Remove-Item Env:EXPO_PUBLIC_NATIVE_TEST_HARNESS -ErrorAction SilentlyContinue
$env:PATH=(Split-Path -Parent $buildNode)+[IO.Path]::PathSeparator+$env:PATH
Push-Location -LiteralPath $mobileRoot
try{
 & $buildNode scripts/sync-core.mjs --check
 if($LASTEXITCODE -ne 0){throw 'Refresh and review the shared web core first.'}
 & $buildNode scripts/check-notification-config.mjs
 if($LASTEXITCODE -ne 0){throw 'Android notification client configuration check failed.'}
 & $buildNode node_modules/typescript/bin/tsc --noEmit
 if($LASTEXITCODE -ne 0){throw 'Native typecheck failed.'}
 & $buildNode --import ./tests/register.mjs --test tests/*.test.ts
 if($LASTEXITCODE -ne 0){throw 'Native preview tests failed.'}
 & $buildNode node_modules/expo/bin/cli prebuild --platform android --no-install
 if($LASTEXITCODE -ne 0){throw 'Android project generation failed.'}
 & $buildNode scripts/check-push-manifest.mjs
 if($LASTEXITCODE -ne 0){throw 'Generated Android push consent settings failed.'}
 Set-Content -LiteralPath 'android/local.properties' -Value ('sdk.dir='+$SdkPath.Replace('\','/')) -Encoding ascii
 # Ninja's dependency database can retain include paths beyond Windows' limit.
 # Remove only these generated cache files; preserve source and compiled outputs.
 foreach($relative in @('android/app/.cxx','node_modules/expo-modules-core/android/.cxx')){
  $cachePath=Join-Path $mobileRoot $relative
  if(Test-Path -LiteralPath $cachePath){Get-ChildItem -LiteralPath $cachePath -Recurse -File -Filter '.ninja_deps' | ForEach-Object {
   if(!$_.FullName.StartsWith($mobileRoot+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Unexpected native cache path.'}
   Remove-Item -LiteralPath $_.FullName
  }}
 }
 $abis=if($Architecture -eq 'universal'){'arm64-v8a,x86_64'}else{$Architecture}
 $androidTask=if($AppBundle){':app:bundleRelease'}else{':app:assembleRelease'}
 & './android/gradlew.bat' -p android $androidTask "-PreactNativeArchitectures=$abis" '-Dorg.gradle.jvmargs=-Xmx1536m -XX:MaxMetaspaceSize=512m' '-Pkotlin.compiler.execution.strategy=in-process' --no-daemon --max-workers=1 --console=plain
 if($LASTEXITCODE -ne 0){throw 'Android compilation failed; no APK is declared ready.'}
 $artifactExtension=if($AppBundle){'aab'}else{'apk'}
 $artifact=Join-Path $mobileRoot "dist/nudge-preview-$Architecture.$artifactExtension"
 New-Item -ItemType Directory -Path (Split-Path -Parent $artifact) -Force | Out-Null
 $builtArtifact=if($AppBundle){'android/app/build/outputs/bundle/release/app-release.aab'}else{'android/app/build/outputs/apk/release/app-release.apk'}
 Copy-Item -LiteralPath $builtArtifact -Destination $artifact
 Add-Type -AssemblyName System.IO.Compression.FileSystem
 $zip=[IO.Compression.ZipFile]::OpenRead($artifact)
 try{
  $bundlePath=if($AppBundle){'base/assets/index.android.bundle'}else{'assets/index.android.bundle'}
  $dexPath=if($AppBundle){'base/dex/classes.dex'}else{'classes.dex'}
  if(!$zip.GetEntry($bundlePath)){throw 'The artifact does not contain its standalone JS bundle.'}
  if(!$zip.GetEntry($dexPath)){throw 'The artifact does not contain Android application code.'}
 }finally{$zip.Dispose()}
 Get-FileHash -LiteralPath $artifact -Algorithm SHA256
 Write-Output "Android test artifact (preview signer): $artifact"
}finally{Pop-Location}
