# Native Android verification — 9 November 2026

Nudge **0.4.0** is an independent React Native Android test APK with embedded Hermes code/assets and shared web accounts/backend. It runs without Metro or Expo Go. This checkpoint does not establish physical-phone acceptance or Play Store readiness. The earlier report is preserved in [VERIFICATION-0.3.md](VERIFICATION-0.3.md); feature coverage and remaining port work are in [PARITY.md](PARITY.md).

## Current artifact

- [nudge-preview-0.4.0-universal.apk](../dist/nudge-preview-0.4.0-universal.apk), **40,936,316 bytes**.
- SHA-256: `7c9a035590a855e1f250999fb94b31ed2e7abf9b6eafe042fd95b8a0cc092872`.
- Package `com.projectnudge.app`, version 0.4.0/code 4; minimum API 24, target API 36, compile API 37. ARM64 and x86_64.
- Embedded Hermes: 2,306,804 bytes; 17 ARM64 libraries. APK v2 signature verified; the signer is the Android **test identity**, not a protected Play upload key.
- Decompressed-entry checks found no private configuration files, actual private environment values or either of the two checked disposable-session values. This is a bounded artifact scan, not a security certification. Development-only fixture controls require a development build and explicit test flag; they are not enabled in this release.
- ZIP 16 KB library-page padding passed. ELF compatibility and a 16 KB Android runtime remain separate checks.

The final full native Gradle build passed in **3m 56s**, with no native tasks excluded: `.local/mobile-0.4-final-full-native.log`. Artifact/signature records: `.local/mobile-0.4-artifact.json` and `.local/mobile-0.4-signature.log`. The artifact scanner's `deviceRuntimeVerified:false` field describes that static scan; installed observations are recorded separately below.

An earlier intermediate APK beginning `713d3f85` failed to launch because two required native libraries were absent. It was rejected, replaced by the complete build above and retained only as private diagnostic evidence. The verifier now rejects missing required RN/Expo native producers for each packaged ABI. The rejected binary is not the handoff.

## Source and hosted checks

**73 native tests**, native TypeScript and **eight shared-source hashes** passed. These cover account-bound retries/claims, contracts, combined journal filters, confirmed abandonment, staged reminder intent, local-time validation and bounded timeline validation. **778 web/backend tests in 118 suites** passed at bounded concurrency 2, together with web TypeScript and a production build. Logs: `.local/mobile-0.4-universal-build.log`, `.local/mobile-0.4-web-tests.log`, `.local/mobile-0.4-web-typecheck.log`, `.local/mobile-0.4-web-build.log`. Unit/build checks are not device proof.

Backend deployment **`dpl_5BYrc3GEYr44CcoBxctAo83oZ4Nz`** is live at `https://projectnudge.vercel.app`. Real HTTPS native-bearer checks passed combined category/owner filtering; abandonment replay/isolation and protection of saved choices; custom reminder times/isolation; activity/preference timeline isolation; and invalid-bearer rejection. Both marked accounts were deleted and absence verified: `.local/mobile-0.4-hosted-parity.json` (**2 created / 2 removed**, no error). Earlier broad account/settings/discovery/comparison/circle coverage remains in the versioned 0.3 report. These checks do not prove Google UI, device interaction or notification delivery. No new database migration was required for this checkpoint.

## Installed final-release observations

The exact `7c9a0355…` artifact was installed on the API 36 x86_64 emulator, 1080×2400 at density 461 (about 375dp wide). It launched with **no Metro or ADB reverse mapping**, restoring the disposable account's encrypted session after upgrade. Authentication came from an earlier development-only legitimate test-session fixture; this does not establish a real Google browser-return journey.

| Exercised path | Observed result |
|---|---|
| Journal category filter | Food applied and returned the single synthetic meal decision. Filter actions remain outside the scrolling options. |
| Let it go | Cancelling preserved the meal decision as open; explicit confirmation changed it to Set aside. The retained detail state was visible. |
| Custom check-in | Android date/time pickers staged **12 November 2026, 20:45 Asia/Baku**. Explicit Save produced server time `2026-11-12T16:45:00+00:00`; `reminder_version` advanced **1 → 2**. Server snapshot: `.local/mobile-0.4-device-release-custom-saved.json`. |
| Decision activity | Four periods fit the normal 375dp viewport; Older/Newer paging and About these counts worked. Details displayed the account's UTC reporting zone. |
| Earlier preference timeline | Displayed synthetic **Quiet time** with manual source and **Walk** with inferred source, each with its recorded/reinforced timestamp. |

Actual final-release captures include [filters](../design/evidence/release-04-filters.png), [set aside](../design/evidence/release-04-aside-saved.png), [custom check-in](../design/evidence/release-04-custom-saved.png), [activity](../design/evidence/release-04-activity.png) and [preferences](../design/evidence/release-04-preferences.png). Phase boards are design proposals, not captures.

### Final large-text and signed-out regression

The final hash passed all six questions offline at 375dp: all seven responses above Back/Skip, no early authentication or Continue, direct save/advance, Back selection, correction after force-stop/restart, Google only after six responses and hardware Back reopening the last answer. `.local/mobile-0.4-preview-device.json` now records this exact final hash; the earlier intermediate result is superseded by the final rerun.

At 200% system text, filter Clear/Apply and reminder Save/Cancel remained reachable; the Google label wrapped with its full name and icon intact after scrolling. Captures: [filter](../design/evidence/release-04-filters-text-200.png), [reminder](../design/evidence/release-04-checkin-text-200.png), [Google](../design/evidence/release-04-google-text-200.png). Android recreated the activity after changing text scale, so the reminder was reopened manually on the decided Hobbies record after an automation navigation mismatch. This is not an all-screens or TalkBack pass. Report: `.local/mobile-0.4-sheet-layout.json`.

Google opened Chrome's first-run activity; Android Back returned to the unchanged reflections with the Google control enabled. No Chrome terms or credentials were submitted, and the Google provider page/PKCE return was not verified. Installed-package SHA-256 equals the handoff APK. No Metro listener/reverse mapping remained. Font 1.0, rotation 0 with auto-rotation enabled, physical 1080×2400, density override 461 and both network radios were restored. `.local/mobile-0.4-installed-proof.json` records the final hash/settings. [Current overview](../design/current-preview-0.4.png) composes four real captures without changing their UI.

### Final disposable-device account cleanup

The separate Android account was signed out and removed. Cleanup checks the fixture ID/run metadata before deletion, requires an explicit `404 user_not_found` to verify absence, and removes its two private local identity/session files. A network timeout in the first attempt was followed by successful guarded retry/absence verification. `.local/mobile-0.4-device-cleanup.json` and installed proof record success. The two hosted accounts were cleaned separately; no real-user records were used.

## Earlier debug evidence and remaining gates

`.local/mobile-0.4-debug-device.json` separately records the debug native shell with localhost Metro: explicit six-answer account claim, category draft cancellation/application, abandonment cancellation/confirmation, native pickers, unchanged server reminder after cancellation and a single custom-time save. That debug save selected 11 November at 20:30 Asia/Baku and advanced version 0 → 1; it is distinct from the final release save above. A raw-text warning found during debug checks was corrected before final packaging. No debug capture is silently reassigned to the release hash.

Real Google return/cancellation/process death/revocation, physical-phone restore/account switching, TalkBack/focus order, broader formats/keyboards/RTL and measured startup/scrolling/memory acceptance remain required. Cold emulator boots displayed Android System UI unresponsive dialogs; Wait recovered. This is not recorded as a Nudge crash or a passed performance test.

Reviewed AI-note intake/monthly AI recap and native push delivery remain unimplemented; hosted optional AI is unavailable. Saved check-ins do not prove phone notifications. A protected upload identity/AAB, store acceptance and accurate operator/privacy/retention/data-safety disclosures remain in [PLAY-STORE-READINESS.md](PLAY-STORE-READINESS.md). No Play publication, psychological validity, measured retention or error-free claim is made.
