# Android 0.8.1 checkpoint — 10 November 2026

Independent native preview, test-signed; not a Play-ready release. Historical exact-build evidence remains versioned in VERIFICATION-0.8.md and earlier files.

## Current artifacts

| Artifact | Bytes | SHA256 |
|---|---:|---|
| mobile/dist/nudge-preview-0.8.1-universal.apk | 41662736 | f8ceca45e190665c6d8ee0cc0fe9c5692dd23d1927b75f845a0ea5944c43cbd3 |
| mobile/dist/nudge-preview-0.8.1-test-signed.aab | 29620475 | 168f7362c0d067eee14e34ddfd8dfc7a91774f3b3986aa207f7d8d3185c2514d |

Package com.projectnudge.app, version0.8.1/code9, min24,target36,compile37, ARM64+x86_64. Embedded Hermes2461736 bytes;18 ARM64 libraries. APK v2 signature and AAB JAR signature verify with the Android Debug test identity. This is not the protected Play upload identity.

The base0.8.1 build passed in10m1s. Subsequent JS fixes were repackaged against that unchanged Android payload;1105 non-JS Android entries match candidate1 byte-for-byte. A final full-source build including every native CMake task also passed in8m46s: its container SHA256 is63eedc8ed5631475a643f9605f091d337098365aaeb0d00a6d901559db2f2a0d, and all1178 decompressed entries plus signer match the device-tested version. Keep the versioned device-tested f8ce… APK as the download; do not silently substitute an unversioned file. Current APK/AAB match across38 native-library/DEX/Hermes entries. Full fresh-build reproduction uses mobile/scripts/build-apk.ps1; do not skip native compilation after dependency/config/native changes.

APK ZIP16KB alignment passed;109 ELF LOAD segments across both64-bit ABIs have at least16KB alignment and congruent offsets. Official Google bundletool1.18.3 passed validate and reports PAGE_ALIGNMENT_16K. Bundletool download matched its official release SHA256. These are static/format checks, not a Play-generated installation or16KB-device proof.

Actual private environment values, sender PEM and two disposable session values were checked absent from decompressed artifacts before fixture cleanup. Public Firebase Android SDK configuration is intentionally packaged. Compiled APK and AAB manifests disable Firebase automatic registration and Analytics collection.

## Source and hosted checks

823 web/backend tests passed in the broad run, plus one separate scheduler SQL contract test.91 native tests, both TypeScript checks and9 shared-source hashes passed. New permission tests cover late account-change results, permanent denial and non-interactive renewal.

Migration00020 applied to awlaxvfnibugdqqqvkac. Hosted role/token-column checks passed. Backend dpl_HeDwdM6m1oqLNWnZWjMdDGhpbMSi serves https://projectnudge.vercel.app. Owner-scoped push/epoch/replay/auth checks passed. Approved Vault/pg_net private five-minute scheduler is active and its real HTTPS call returned200/worker_ok=true. See PUSH-2026-11-10.md.

## Exact installed evidence

Current hash matched both the isolated API36 x86_64 emulator and the owner's physical Redmi15C/API35. Metro was stopped and ADB reverse removed.

Emulator: standalone preview tap/Back correction; actual generic release push receipt; process absence after am kill then correct decision routing; explicit opt-out cleared the server token, with a later reminder producing one in-app check-in and zero native claims. Current final patch closes phone settings before a valid notification opens its decision. Offline status says it cannot confirm instead of claiming off/unconfigured, and retains the off control. Captures native-0.8.1-final-notification-open.png and native-0.8.1-final-offline-status.png. Earlier0.8 captures remain tied to their own hash.

At font_scale2.0 account navigation wraps and settings scroll; Close and final Refresh remain reachable. Scale restored1.0. Temporary emulator Wi-Fi/mobile-data changes were restored1/1. This is bounded rendering evidence, not full TalkBack acceptance.

Physical Redmi: owner completed Google sign-in/password steps, returned to Nudge, and loaded authenticated questions over mobile data. The final APK upgrade retained sign-in. Owner accepted current terms personally and confirmed saving a daily answer. Native input injection is blocked by Redmi security, so the owner performed taps; ADB observation/screenshots stayed inside Nudge. No Google credentials were read.

Owner explicitly enabled physical notifications and disabled quiet hours for testing. The newly registered Google-account device received one generic FCM notification-only test; provider200 and owner-confirmed arrival/tap-opening of Nudge. No test decision/answer was created. This physical check is transport/app-launch evidence; durable reminder/decision routing has emulator evidence, not equivalent physical proof. Quiet hours remain the owner's preference to restore.

## Connectivity limitation

Owner's Wi-Fi produced Chrome ERR_SSL_PROTOCOL_ERROR and native load failure. The same site and app loaded on mobile data. A protected disposable profile request returned200 in about2s from the diagnostic environment. This narrows failure to the Wi-Fi connection path; it does not prove whether DNS/router/ISP is responsible. TLS verification was not weakened and no insecure fallback was added. Follow the Vercel connectivity guide if investigating further.

## Cleanup and remaining gates

Marked disposable emulator account deleted and absence verified; private fixture session files removed, isolated Nudge app data cleared, no reverse forwarding left. The physical owner's account/answers remain intact. Sanitized portable evidence is under docs/evidence; private logs/credentials stay in .local and are excluded from source packages.

Public AI stays unavailable. A bounded local NVIDIA development run passed5/6 pipeline checks, with one explicit game-setting case requiring review; cleanup verified. This is not semantic-quality/public-AI acceptance.

Open: physical process-death/account switching/revocation and durable-reminder routing/quiet transitions, TalkBack/RTL/largest-font/long-session/performance coverage, real AI quality/public configuration, supported fixes/review for five moderate tooling audit findings (no high/critical in that audit), final package/upload identity/AAB track installation, and accurate operator/privacy/retention/Data safety/store details. Public email signup remains deliberately deferred. No Play upload or publication was performed.
