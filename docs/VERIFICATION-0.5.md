# Android 0.5 verification — 10 November 2026

This is a standalone test APK, not Play-ready or a guarantee that every feature is error-free. Full handoff: `../../NUDGE-MASTER-HANDOFF.md`; feature scope: `PARITY.md`; earlier exact-build evidence: `VERIFICATION-0.4.md`.

## Artifact

- `mobile/dist/nudge-preview-0.5.0-universal.apk`, **40,948,128 bytes**.
- SHA-256 **15754dcae642b1806d939734fa15344bf7c6a6eacde80d992115d18c5030e0af**.
- `com.projectnudge.app`, 0.5.0/code5, minimum API24, target36, compile37; ARM64 + x86_64.
- Embedded Hermes 2,318,612 bytes; 17 ARM64 libraries. Required runtime/registration libraries verified for both packaged ABIs.
- APK v2 signature; Android Debug test identity, not a protected Play upload key. Non-debuggable manifest. Internet/vibration/generated signature receiver permissions.
- Actual private-environment values and two private fixture-session values absent from decompressed entries. No private configuration files. Native test entry point is development-and-flag gated, not enabled in release.
- ZIP 16KB library padding passed; ELF and real 16KB Android acceptance remain separate.

Records: `.local/mobile-0.5-artifact.json`, signature/manifest/zipalign logs, `.local/mobile-0.5-installed-proof.json`. Installed base APK hash equals the delivered APK.

## Source and production

**795 web/backend tests in 119 suites**, zero failures; web TypeScript and production build passed. **77 native tests**, native TypeScript and nine shared-source hashes passed. Logs: `.local/mobile-0.5-web-tests.log`, `-web-typecheck.log`, `-web-build.log`, `-native-tests.log`.

Production `https://projectnudge.vercel.app`: deployment **dpl_FZscRbDMijvYZgmBo2JxeZhGHFF4**, READY. Real HTTPS disposable-account checks passed: eight valid moods keep existing eligibility; invalid mood rejected; daily resume stable; explicit change reserves another question; same-request replay stable; no answer/profile mood saved. `.local/mobile-0.5-hosted-mood.json`. No new migration was needed.

## Device observations and boundaries

API36 x86_64 isolated emulator, 1080×2400/density461 (~375dp), normal text. Legitimate marked test session was imported through a development-only fixture, then the app was upgraded to the release APK. This is **not real Google browser/PKCE return proof**.

| Check | Observed evidence |
|---|---|
| Daily mood popup and Skip | Debug0.5 shell/Metro: appeared after explicit preview discard, all eight emotions available, Skip opened Today. Separate exact release upgrade resumed Today without repeating the same-day popup. |
| Manual mood settings | Final release: all eight choices, separate Mood/Pace/Topic sections, fixed action footer; selecting Angry and closing left the applied mood unchanged. Final two-column layout keeps No preference readable. |
| Reviewed priorities | Debug: selected Angry, opened Consider how I feel; no criterion appeared before explicit Use Effort needed. Addition selected criteria basis with generic importance3 and both option values Unknown. |
| Draft across release upgrade | Exact release reopened the saved review step: Effort needed, lower is better, importance3/5, both values Unknown. No comparison was submitted during this device check. Backend tests separately prove unknown ratings cannot produce a supported winner. |
| Standalone and sign-out | Exact release launched with no Metro/reverse; sign-out returned to question1 with no early auth/mood prompt. The full six-question offline walkthrough remains specifically verified on the earlier0.4 hash, not silently reassigned. |

Actual final-release images: `../design/evidence/release-05-mood-settings.png`, `release-05-priority-review.png`, `release-05-preview.png`. `../design/current-preview-0.5.png` composes two unchanged release screenshots. Debug images have `debug-05-` prefixes and stay distinct.

The daily repository's account/day isolation, malformed data and no-emotion storage are unit-tested. New-day expiry/deferred-editor effects were source-reviewed; real overnight/clock-zone switching and all large-text/TalkBack states remain device acceptance work. Mood preferences are comfort heuristics, not diagnoses or guarantees of correct answers. Native popup mood is session context; approved manual priorities may persist in the decision draft. Web mood is saved as a journal note only if explicitly chosen there.

## Cleanup and build recovery

The marked device account was signed out, deleted after identity/run-metadata verification, and absence confirmed by explicit404 user_not_found. Its local identity/session files were removed. `.local/mobile-0.5-device-cleanup.json`; installed proof confirms removal. Real users' data was not used.

The full release build passed in10m17s. A later layout repack hit Ninja's overlong Windows dependency-cache path; deleting only verified generated `.ninja_deps` files and retaining **all native producers** resolved it. Final retry passed in3m54s. No Windows security/registry change or native-task skip was used. Logs: `.local/mobile-0.5-release-build.log`, `-final-package.log`, `-final-package-retry.log`.

Cold boot again showed an Android System UI unresponsive dialog; Wait recovered. This is not a Nudge crash or successful performance acceptance. Emulator font1.0, rotation0/auto1, density461 and both radios enabled; no Metro listener or reverse remained.

## Remaining

Real Google return/refresh/revocation/account switching; physical-phone/TalkBack/keyboard/RTL/long-session/performance acceptance; reviewed AI note intake/monthly recap and configured-provider evaluation; native push delivery; protected upload signing/AAB/store and accurate privacy/operator/data-safety disclosures. See the master plan's P1–P6. Planning estimate remains about70% full mobilev1 complete, not a measured progress counter.
