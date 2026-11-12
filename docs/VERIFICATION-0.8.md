# Android 0.8 checkpoint — 10 November 2026

Standalone test APK, not Play-ready. Earlier exact-build evidence remains in VERIFICATION-0.7.md and earlier records. Push device acceptance is in progress.

## Artifact

- mobile/dist/nudge-preview-0.8.0-universal.apk, 41,660,496 bytes.
- SHA256: 47e5e88914e3f6454fac4a25c1686159e0a2dff2daa4898adc16fde3f0830117.
- com.projectnudge.app, 0.8.0/code8, ARM64+x86_64, min24,target36,compile37.
- Embedded Hermes2,459,496 bytes;18 ARM64 libraries, required runtime/registration libraries for both ABIs.
- v2 signature passed (Android Debug test signer); ZIP16KB alignment passed. All109 packaged ELF LOAD segments have at least16KB alignment and congruent offsets. This is static evidence, not real16KB-device or Play acceptance.
- Actual private environment values, FCM sender PEM and two disposable session values absent from decompressed entries. Public Firebase client config is intentional. Reports .local/mobile-0.8-artifact.json, -compiled-manifest.txt, -signature.log, -zipalign.log.
- Compiled manifest disables firebase_messaging_auto_init_enabled and firebase_analytics_collection_enabled. Build checks generated metadata. Token acquisition is explicit after opt-in; no notification prompt appeared in anonymous preview.

## Source and hosted checks

823 web/backend tests plus one separate scheduler SQL contract test passed;89 native tests, both TypeScript checks and9 shared-source hashes passed. Build11m25s. Logs .local/mobile-0.8-web-final-tests.log, -scheduler-tests.log, -web-types-final.log, -build-consent.log.

Approved migration00020 applied; hosted role/secret-column checks passed. Production backend dpl_HeDwdM6m1oqLNWnZWjMdDGhpbMSi at https://projectnudge.vercel.app. Disposable HTTPS registration/worker checks passed (.local/mobile-0.8-hosted-push.json). Approved private Supabase Vault/pg_net five-minute scheduler installed; real scheduler→worker call returned HTTP200/worker_ok=true. See PUSH-2026-11-10.md for retry/privacy boundaries.

Hosted AI stays unavailable. A bounded local NVIDIA run passed5/6 pipeline checks, with one explicit game-setting case requiring review; cleanup verified (.local/mobile-0.7-nvidia-live.json). This is partial pipeline evidence, not semantic-quality/public-AI acceptance.

## Installed work

0.8 release installed on the isolated API36 x86_64 emulator. Anonymous preview renders; tap saves/advances, Back reopens the selection and correction advances. First short questions fit at normal font without scrolling; no early sign-in control or notification permission prompt. Capture mobile/design/evidence/native-0.8-release-preview.png.

Installed hash matched (.local/mobile-0.8-installed-proof.json); Metro stopped and reverse removed. A disposable debug-harness session was encrypted and restored into the release APK; this is not Google OAuth. Real generic background notification arrived. After am kill, absence of the app process was verified; tapping the OS notification opened the exact synthetic decision. Explicit off disabled the server registration and cleared its token; the next due reminder produced one in-app check-in and zero native claims/acceptances. Captures native-0.8-release-notification.png, native-0.8-release-notification-open.png, native-0.8-release-push-off.png. At font_scale2.0 settings remained scrollable with Close and Refresh reachable; scale restored1.0. See PUSH-2026-11-10.md. Fixture remains active only for the subsequent0.8.1 checks; record final cleanup there.

## Open release gates

Real Google return/revocation/process-death/account switching; physical-phone/TalkBack/RTL/largest-font/long-session/performance; real-provider quality/public configuration; final package/upload signing/AAB and Play installation; accurate store/operator/privacy/retention/data-safety/deletion details. Five moderate tooling audit findings remain for supported patch review; no high/critical in the current audit. Overall completion is a planning estimate, not a guarantee of universal correctness.
