# Native Android account preview — 8 November 2026

Version 0.2 implements the public preview → Google sign-in → explicit save → Today → About you journey in native source. It is an independent React Native APK with embedded code and assets, and runs without Metro or Expo Go. This is not the complete mobile port or a Play Store release.

## Implemented

- Same six web questions, validation, evidence rules, sources, answer correction, neutral/skip responses and themes. Six allowlisted source hashes now include contracts and taxonomy.
- Android Keystore-backed encrypted device preview with 24-hour expiry and explicit review/save/discard. Sign-in alone never claims answers. Claims pin the account, frozen answers, request ID and privacy generation before transport. Account/privacy changes cannot silently reattach older evidence.
- Google through the system browser with SHA-256 PKCE, encrypted verifier/session, strict callback parsing, cancellation, foreground refresh and local sign-out. The exact `com.projectnudge.app://auth/callback` was saved in Supabase with owner approval. Only public client configuration is packaged.
- Today daily/additional questions, topic and pace changes, choice/scale/ranking/text/neutral controls, fatigue pauses and explicit continuation. Optional/written formats remain governed by server capabilities and preferences.
- About you reflections/evidence, feedback, paginated answers, correction/exclusion/reinclusion/deletion controls and question preferences. Conflicts require reload; ambiguous failures retain the exact retry. Successful saves with failed refresh block further changes until reload.
- Account sign-out and labeled system-browser links for policies/support and existing web export/deletion. Native export/deletion remains pending.

## Source and hosted checks

23 native tests passed, zero failures/skips: evidence semantics, both-theme contrast, callback restrictions, draft expiry/account binding, installed auth-SDK verifier compatibility and 14 bearer transport cases. Transport tests cover no cookie fallback, payload freezing during refresh, generation/revision/request-ID preservation, no automatic retries, conflicts/terms/distress/auth failures, malformed responses, offline uncertainty, timeouts and request bounds.

Native and web TypeScript checks passed. Expo's offline dependency check reports dependencies up to date, but warns that offline validation is less reliable; it is not a fresh registry compatibility audit.

The actual native `DiscoveryApi` passed against `https://projectnudge.vercel.app` with one uniquely marked disposable account: profile, six preview claims, identical replay, daily reservation/answer, correction, stale generation/revision rejection, exclusion, deletion and invalid bearer rejection. The account was deleted in `finally`, and absence verified. No email was sent. This proves the hosted bearer contract, not installed Android or Google UI behavior.

## Artifact

Downloadable test build: `dist/nudge-preview-0.2.0-arm64-v8a.apk` (21,785,160 bytes). SHA-256: `3391c87f34eb68eed428e7225574c4dc9a802341b374943a93b56fb8abf2d8b0`. The embedded Hermes bundle is 1,992,516 bytes; 17 ARM64 native libraries are present. APK v2 signature and 16 KB ZIP library-page padding checks passed; ELF compatibility and operation in a 16 KB Android environment remain separate device/release checks. The APK is non-debuggable. Final permissions are Internet, vibration and the generated signature-level receiver permission; unused biometric, microphone, storage and overlay declarations are removed.

Final APK metadata/hash and embedded Hermes/native-library sizes are in `.local/mobile-0.2-artifact.json`. `scripts/verify-apk.ps1` checks bundled Android code/Hermes bytecode and scans decompressed entries for private configuration files and actual private environment values locally; no values enter its report.

Application ID remains provisional `com.projectnudge.app`, version 0.2.0/code 2. Minimum API 24, target API 36, compile API 37; ARM64 only. Signing uses the generated Android test identity, separate from a future protected Play upload key. A test APK is not a store-ready signed App Bundle.

Previous APK retained at `dist/nudge-preview-0.1.0-arm64-v8a.apk`, SHA-256 `3a609e4f825667b533edaf1ce16b97652705567be4f2592b7ed4b86d2f82a6f3`. Its process-memory-only scope is superseded by encrypted 0.2 storage.

## Limits and release gates

No Android device/emulator was connected. Installation, native Google return/cancellation/process death, refresh/revocation, encrypted restore, TalkBack, largest text, landscape, offline UI recovery, cross-device UI editing and measured performance remain unverified. Build/source/hosted checks do not replace them. No web screenshot is presented as native evidence.

Decide/comparisons, journal/check-ins, reminders, circles/voting, native profile/privacy reset/export/account deletion and push remain explicit rows in [PARITY.md](PARITY.md). Store signing/AAB, privacy declarations, artwork and device/release checks are in [PLAY-STORE-READINESS.md](PLAY-STORE-READINESS.md). Nothing has been published to Google Play.

Production audit still reports five moderate and zero high/critical findings through Expo CLI/fingerprint's glob/minimatch build-tool chain. No incompatible forced override or SDK downgrade was applied. Resolve the supported-toolchain remedy and revalidate before external release. [glob advisory](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4), [minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249).

## Evidence

Private logs: `.local/mobile-0.2-tests.log`, `mobile-0.2-hosted.json`, `mobile-0.2-audit.json`, `mobile-0.2-build-final.log`, `mobile-0.2-artifact.json` and final signing/manifest/alignment logs. Earlier sandbox-blocked compiler logs remain separate from passing builds. The CMake plugin retains its validated Windows object-path setting.

The full 0.2 native build passed with 313 Gradle tasks. A later manifest-only repackage exposed Ninja's Windows cached-header path limit on an unnecessary incremental C++ rebuild. The final permission repackage reused the already compiled, unchanged native libraries and completed with 308 tasks; no C++ source or ABI changed. Its log is `mobile-0.2-permissions-final.log`. Investigate a shorter Gradle cache path for future Windows incremental native rebuilds; the failed attempt is retained in `mobile-0.2-permissions-build.log`.

Platform references: [Supabase native auth](https://supabase.com/docs/guides/auth/native-mobile-deep-linking), [encrypted storage](https://docs.expo.dev/versions/latest/sdk/securestore/), [system-browser auth](https://docs.expo.dev/versions/latest/sdk/webbrowser/), [standalone APK](https://docs.expo.dev/build-reference/apk/).

