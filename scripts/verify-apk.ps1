param([string]$Artifact='', [string]$Report='')
$ErrorActionPreference='Stop'
$webRoot=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
if(!$Artifact){$Artifact=Join-Path $webRoot 'mobile/dist/nudge-preview-arm64-v8a.apk'}
if(!$Report){$Report=Join-Path $webRoot '.local/mobile-current-artifact.json'}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$privateValues=@()
foreach($line in [IO.File]::ReadAllLines((Join-Path $webRoot '.env.local'))){
 if($line -match '^([A-Z0-9_]+)=(.*)$'){
  $name=$Matches[1];$value=$Matches[2].Trim().Trim([char]34,[char]39)
  if(!$name.StartsWith('NEXT_PUBLIC_') -and $name -match '(SECRET|SERVICE_ROLE|SERVICE_ACCOUNT|PASSWORD|TOKEN|API_KEY)' -and $value.Length -ge 16){$privateValues+=,$value}
  if($name -eq 'FCM_SERVICE_ACCOUNT_JSON'){
   try{$credential=$value|ConvertFrom-Json;if($credential.private_key){$privateValues+=,[string]$credential.private_key}}catch{throw 'Could not inspect the private sender configuration safely.'}
  }
 }
}
$fixtureSession=Join-Path $webRoot '.local/nudge-native-test-session.json'
$fixtureValues=@()
if(Test-Path -LiteralPath $fixtureSession){
 $session=[IO.File]::ReadAllText($fixtureSession)|ConvertFrom-Json
 foreach($name in @('access_token','refresh_token')){
  $value=[string]$session.$name
  if($value.Length -ge 8){$fixtureValues+=,$value}
 }
}
$archive=[IO.Compression.ZipFile]::OpenRead($Artifact)
try{
 $isAppBundle=[IO.Path]::GetExtension($Artifact) -eq '.aab'
 $archiveRoot=if($isAppBundle){'base/'}else{''}
 $escapedRoot=[regex]::Escape($archiveRoot)
 $bundleEntry=$archive.GetEntry($archiveRoot+'assets/index.android.bundle')
 $dexPath=if($isAppBundle){'base/dex/classes.dex'}else{'classes.dex'}
 if(!$bundleEntry -or !$archive.GetEntry($dexPath)){throw 'Standalone native code or embedded bundle is missing.'}
 if($isAppBundle -and (!$archive.GetEntry('BundleConfig.pb') -or !$archive.GetEntry('base/manifest/AndroidManifest.xml'))){throw 'App Bundle configuration or base manifest missing.'}
 $abis=@($archive.Entries | ForEach-Object {if($_.FullName -match ('^'+$escapedRoot+'lib/([^/]+)/')){$Matches[1]}} | Sort-Object -Unique)
 if(!$abis.Count){throw 'Native libraries are missing.'}
 foreach($abi in $abis){
  # These producers are required by the current pinned RN/Expo autolinking graph.
  foreach($library in @('libappmodules.so','libreactnative.so','libhermesvm.so','libreact_codegen_safeareacontext.so')){
   if(!$archive.GetEntry("${archiveRoot}lib/$abi/$library")){throw "Missing required native library: $abi/$library"}
  }
 }
 $nativeCount=0;$bundleLength=0;$elfLoads=0
 foreach($entry in $archive.Entries){
  if($entry.FullName -match '(^|/)\.env(\.|$)|\.keystore$|\.jks$'){throw 'Private configuration file in APK.'}
  if($entry.FullName -match ('^'+$escapedRoot+'lib/arm64-v8a/.*\.so$')){$nativeCount++}
  $stream=$entry.Open();$memory=New-Object IO.MemoryStream
  try{$stream.CopyTo($memory);$data=$memory.ToArray()}finally{$stream.Dispose();$memory.Dispose()}
  if($entry.FullName -eq $archiveRoot+'assets/index.android.bundle'){
   $bundleLength=$data.Length
   if([BitConverter]::ToString($data[0..7]) -ne 'C6-1F-BC-03-C1-03-19-1F'){throw 'Expected compiled Hermes bytecode.'}
  }
  $text=[Text.Encoding]::UTF8.GetString($data)
  if($entry.FullName -match ('^'+$escapedRoot+'lib/(arm64-v8a|x86_64)/.*\.so$')){
   if($data.Length -lt 64 -or [BitConverter]::ToString($data[0..5]) -ne '7F-45-4C-46-02-01'){throw 'Expected a little-endian ELF64 library.'}
   $programOffset=[BitConverter]::ToUInt64($data,32)
   $programSize=[BitConverter]::ToUInt16($data,54)
   $programCount=[BitConverter]::ToUInt16($data,56)
   if($programSize -lt 56 -or $programCount -eq 0 -or $programOffset+$programSize*$programCount -gt $data.Length){throw 'Invalid native program headers.'}
   $libraryLoads=0
   for($i=0;$i -lt $programCount;$i++){
    $at=[int]($programOffset+$i*$programSize)
    if([BitConverter]::ToUInt32($data,$at) -eq 1){
     $offset=[BitConverter]::ToUInt64($data,$at+8);$address=[BitConverter]::ToUInt64($data,$at+16);$alignment=[BitConverter]::ToUInt64($data,$at+48)
     if($alignment -lt 16384 -or $offset%16384 -ne $address%16384){throw "Native LOAD segment lacks 16KB alignment: $($entry.FullName)"}
     $elfLoads++;$libraryLoads++
    }
   }
   if(!$libraryLoads){throw 'Native library has no LOAD segments.'}
  }
  foreach($privateValue in $privateValues){if($text.Contains($privateValue)){throw 'Private environment value found in APK. Do not distribute.'}}
  foreach($fixtureValue in $fixtureValues){if($text.Contains($fixtureValue)){throw 'Private device fixture value found in APK. Do not distribute.'}}
 }
 $result=[ordered]@{apk=$Artifact;bytes=(Get-Item -LiteralPath $Artifact).Length;sha256=(Get-FileHash -LiteralPath $Artifact -Algorithm SHA256).Hash.ToLower();embeddedHermesBytes=$bundleLength;nativeArm64Libraries=$nativeCount;elfLoadSegmentsChecked=$elfLoads;elfLoadSegments16KB=$true;privateConfigurationFiles=$false;privateEnvironmentValueFound=$false;fixtureSessionValuesChecked=$fixtureValues.Count;privateFixtureValueFound=$false;deviceRuntimeVerified=$false}
 $json=$result|ConvertTo-Json
 [IO.File]::WriteAllText($Report,$json)
 Write-Output $json
}finally{$archive.Dispose()}
