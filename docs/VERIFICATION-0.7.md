# Android 0.7 checkpoint — 10 November 2026

Standalone test APK, not a Play-ready release. Earlier exact-build evidence remains versioned separately.

## Artifact

- `mobile/dist/nudge-preview-0.7.0-universal.apk`, 40,966,436 bytes.
- SHA-256 `dfa78806958d2d5439a4bf021f387ad5053d4e72495d612a394c4235f01c9ca7`.
- `com.projectnudge.app`, 0.7.0/code7, ARM64+x86_64, API24 minimum, target36/compile37.
- Embedded Hermes 2,336,924 bytes, 17 ARM64 libraries; required runtime/registration libraries checked for both packaged ABIs.
- Actual private-environment values and two active fixture-token values absent from decompressed entries. No private configuration files found. APK v2 signature verified with Android Debug test identity, not protected Play upload signing. ZIP16KB library padding passed; ELF/16KB device acceptance remains separate.
- Build passed in9m52s; `.local/mobile-0.7-build.log`, `-artifact.json`, `-signature.log`.

## Source and hosted checks

Both TypeScript checks, 806 web/backend tests, 84 native tests and the existing nine shared-core hashes pass. Logs `.local/mobile-0.7-web-tests.log`, `-native-tests.log`, `-focused.log`. Recap tests cover object/array/null relations, rolling-window and owner boundaries, newest100/101 sampling, no-data/capacity/timeout/malformed output, privacy changes and explicit authenticated confirmation.

Production backend `dpl_4SQi97m92KtbJvRKfsVEFj4ziZP3` at https://projectnudge.vercel.app now uses a shared owner-bound recap service for web and native. No automatic generation. Retained web recap text is cleared before refresh, including failed refreshes. Real HTTPS checks passed for invalid bearer, missing confirmation, identity injection and no-store/off-consent response: `.local/mobile-0.7-hosted-recap.json`. The public backend still reports AI unavailable; no live-model quality is established.

## Installed checks and captures

The delivered release APK was installed on API36 x86_64 emulator5554, its base APK hash matched, and Metro/reverse forwarding were stopped/removed. A marked disposable account was first authenticated through the development-only fixture mechanism; its encrypted session was restored into the release app. This is not real Google/PKCE evidence.

In the release app, Tools → Outcome patterns → 30-day recap → Write my recap returned the honest AI-off state. Tools → Add a note retained explicitly typed synthetic text when extraction returned unavailable. Captures `mobile/design/evidence/native-0.7-release-recap.png` and `native-0.7-release-note-off.png`; corresponding `.local/mobile-0.7-release-*.log`.

Separate development-gallery checks used a clearly labeled synthetic transport, no real AI: compact note editing/type/selection controls; separate full-text confirmation; one-entry save and input reset; recap explicit generation, displayed sample/window, and dismissal. Captures `native-0.7-dev-note-review.png`, `native-0.7-dev-note-confirm.png`, `native-0.7-dev-recap.png`. Normal-font controls in these short fixtures fit the viewport; long notes/selected lists and large accessibility fonts may scroll. This is not complete device/accessibility acceptance.

The backend fixture was deleted and absence verified, then only the isolated Nudge emulator app's data was cleared. `.local/mobile-0.7-device-cleanup.json`, `-installed-proof.json`. No real-user data was used.

## Open work

Native push implementation/delivery is next. With owner approval, Firebase was added to the existing `nudge-502812` Google project; Android package `com.projectnudge.app` registered as app `1:304091688877:android:ca8c5c9b57008a9ea47b24`; FCM API reads ENABLED. This setup alone is not push delivery. No sender service-account identity/key, native registration transport or delivery proof exists at this checkpoint.

Real Google return/revocation/process-death/account switching, physical-phone/TalkBack/RTL/large text/long-session/performance checks, real-provider quality, protected upload signing/AAB, and accurate store/privacy/operator/data-safety information remain open. Overall planning estimate stays about70%; no universal correctness or Play readiness claim.
