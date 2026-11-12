# Native Android verification — 9 November 2026

Nudge 0.3.0 is an independent React Native Android test APK, with embedded Hermes code/assets and shared web accounts/backend. It runs without Metro or Expo Go. This checkpoint is not full web parity, physical-phone acceptance or Play Store readiness. The prior 0.2 record is preserved in [VERIFICATION-0.2.md](VERIFICATION-0.2.md).

## Current artifact

- File: [nudge-preview-0.3.0-universal.apk](../dist/nudge-preview-0.3.0-universal.apk), 39,233,880 bytes.
- SHA-256: `a205060997812761bcbf82355ace08950f4bb871004f2179d6facebd8b18d42e`.
- Package `com.projectnudge.app`, version 0.3.0/code 3; minimum API 24, target API 36, compile API 37. ARM64 and x86_64.
- Non-debuggable, embedded Hermes 2,266,264 bytes; 17 ARM64 libraries. APK v2 signature verified. Signer remains the Android **test identity**, not a protected Play upload key.
- Final permissions: Internet, vibration, generated signature-level receiver permission. No microphone/storage/biometric/overlay permission.
- Decompressed-entry scan found no private configuration files or actual private environment values. This is the stated scan, not a security certification. Development-only account-fixture/gallery entry points require both a development build and explicit test flag; neither is enabled in this release.
- ZIP 16 KB library-page padding check passed. ELF compatibility and a 16 KB Android runtime remain separate checks.

Full two-ABI native build: `.local/mobile-0.3-universal-build-retry.log`. Subsequent UI-only repack: `.local/mobile-0.3-readable-controls-build.log`, successful in 1 minute 3 seconds, reusing unchanged native C++ libraries. Artifact inspection: `.local/mobile-0.3-artifact.json`; signature: `.local/mobile-0.3-signature.log`. Do not substitute an older unversioned APK for this file.

## Source and hosted checks

**61 native tests** passed, zero failures/skips/cancellations; native TypeScript passed and seven shared-source hashes match. Tests include account-bound drafts, PKCE/callback restrictions, evidence semantics, read-versus-write failures, request identities, generation/revision conflicts, frozen retry payloads, uncertain writes, saved settings and nullable/object/array reflection normalization. A unit test is not device proof.

The web checkpoint passed **756 tests in 114 suites** at bounded concurrency 2 and a production build. Higher-concurrency testing previously hit a native V8 allocator crash; the affected isolated suite and full bounded rerun passed. This was not a confirmed JavaScript assertion failure or established out-of-memory diagnosis. No repeat was needed for subsequent native-only UI changes.

The deployed backend is available through `https://projectnudge.vercel.app`; deployment ID `dpl_HPbhdTLgRpCMw5aKUyHdpt2LFYzD`. Two marked disposable accounts passed real HTTPS native-bearer account/timezone, saved settings/isolation, optional foundation, comparison create/replay/isolation, choice/reflection, reminders/check-ins, export, learning/outcomes reads, circles/join/vote/close/rotate/leave/delete, reset/history deletion and fresh-auth account deletion. Both accounts were deleted and absence verified. Report: `.local/mobile-0.3-hosted-parity.json`. No real Google UI, installed interaction or push delivery is established by that script.

## Installed Android checks

API 36 x86_64 isolated emulator; 1080×2400 at density 461 (about 375dp wide), normal font unless stated. The exact artifact above was installed successfully and launched without Metro. The authenticated checkpoint ran on `b56a54469107a1cfc7f74891ff9baa37b91d4ffb84a3bd64d53819ea8682f102`; the only later app change is smaller horizontal action padding at large font scale, retaining the 48dp target. Its authenticated evidence is not silently reassigned to the final hash. The final hash separately passed the entire signed-out preview/restart walkthrough. Authenticated UI checks used a uniquely marked disposable account through a development-only session fixture, followed by a release upgrade. No real-user Google credentials were entered or embedded.

| Check | Observed result and boundary |
|---|---|
| Tap answer, save, advance | Passed on the authenticated b56a checkpoint; the final a205 preview also passed direct local save/advance. Existing server behavior remains authoritative. |
| Back correction | Reopened the saved answer with selection; an earlier before/after server snapshot also proves same answer count, changed existing ID, advanced revision and privacy generation. |
| Offline correction / exact retry | Passed on the authenticated b56a checkpoint: visible inline failure, preserved correction, explicit same-change retry after emulator radios restored, editor closed and next question loaded. `.local/mobile-0.3-device-retry.json`. |
| About you | Actual b56a checkpoint capture shows source question with quoted answer, self-report state, feedback and review controls. Normal small-phone screen fits; no new inferred trait was added. |
| 200% system text | Navigation now reflows into two rows with readable whole labels; About-you actions remain reachable by scrolling. This does not prove TalkBack or every screen at largest text. |
| Decide and journal | The authenticated b56a checkpoint opened the saved Mining/Trees journal record, exposed Load current comparison directly, and refreshed it to “Not enough history to rank these.” The earlier creation and draft-across-tabs path also passed. These are exercised paths, not universal factual correctness. `comparison-recovery-action.png` and `comparison-final.png` show the two observed states. |
| Android export | An earlier 0.3 release opened the actual Android share chooser with `nudge-export.json`; no recipient was chosen. Explicit temporary-file clearing and physical-device recipient behavior remain unverified. |

Final-hash signed-out walkthrough passed all six questions offline: all seven answer variants visible above Back/Skip at 375dp normal text; no early Google or Continue; direct save/advance; Back restores selection; correction and next question persist after force-stop/restart; Google appears after six responses; hardware Back reopens the last answer. Report: `.local/mobile-0.3-preview-device.json`. The marked Android test account was deleted after sign-out, absence verified, and local fixture/session files removed. Report: `.local/mobile-0.3-device-cleanup.json`. Two earlier hosted accounts were separately removed. Final-hash display checks also passed: Back/Skip and last response reachable at 200% system text and in landscape after scrolling; all seven responses visible and content bounded to the declared maximum in the tablet-sized viewport. These are synthetic configurations on the same emulator, not physical-tablet acceptance. Report: `.local/mobile-0.3-layout-device.json`. Font scale 1.0, rotation 0 with auto-rotation enabled, physical 1080×2400, density override 461 and both network radios were restored. Installed-package hash matches the delivered APK: `.local/mobile-0.3-installed-proof.json`.

Screenshots in [design/evidence](../design/evidence) are actual Android captures when identified as such. The phase boards in [design/README.md](../design/README.md) are design specifications. Older `preview-375-question-*` images show a superseded manual Continue interaction; use `preview-tap-*` for the current verified flow. Skill sources, audit, hypotheses and corrections are in [DESIGN-SKILLS-AUDIT-2026-11-09.md](DESIGN-SKILLS-AUDIT-2026-11-09.md).

## Remaining product and release work

The [parity map](PARITY.md) explicitly retains gaps: category filtering, native abandonment, arbitrary reminder dates/times, separate web timelines, reviewed AI-note intake/monthly AI recap and native push delivery. Current reminder storage/in-app check-ins do not deliver native notifications. Hosted optional AI is unavailable; discovery and manual comparison remain usable.

Real Google browser return/cancellation/process-death/revocation, physical-phone encrypted restore/account switching, TalkBack/focus order, all formats/sheets/keyboards/RTL, long lists and measured startup/scrolling/memory acceptance remain required. No measured retention, conversion, 60fps, clinical validity or error-free claim is made.

Play release also requires protected upload signing/AAB, store/identity work and accurate operator/privacy/retention/data-safety information. The owner plans Play publication later. [PLAY-STORE-READINESS.md](PLAY-STORE-READINESS.md) records release gates; no Play publication was attempted.

Cold-boot emulator recovery: the Android System UI displayed an unresponsive-system dialog after restart; choosing Wait recovered and Nudge continued. This is not recorded as a Nudge crash or a successful performance acceptance test. Profile/next reads also showed transient timeouts during network/lifecycle tests; explicit reload/restart recovered. No cause or latency improvement is inferred beyond removing one redundant profile read after question reservation.
