# Android 0.6 verification — 10 November 2026

Standalone test APK; not Play-ready. Preserve older versioned artifacts and verification records separately.

## Artifact and source

- `mobile/dist/nudge-preview-0.6.0-universal.apk`: **40,958,520 bytes**.
- SHA-256: **1b0894c2a93075f8e3c11fc462332b17864de42a3359b04d1a450bff844a8ed7**.
- Package `com.projectnudge.app`, version 0.6.0/code 6; ARM64 + x86_64, min API24, target36/compile37.
- Embedded Hermes bytecode: 2,329,004 bytes; 17 ARM64 native libraries. Required registration/runtime libraries verified for both packaged ABIs. No private configuration files or actual private environment values found in decompressed entries. Fixture files had already been deleted, so this run checked zero fixture token values; it does not claim an extra token scan.
- Release build passed in 8m35s after sandbox permission prevented clang execution in the first attempt. No native task was bypassed and no computer security setting changed. `.local/mobile-0.6-build-retry.log`, `.local/mobile-0.6-artifact.json`.
- Both TypeScript checks, 800 web/backend tests, 81 native tests and nine shared-core hashes pass. `.local/mobile-notes-web-tests.log`, `.local/mobile-notes-native-tests.log`.
- Production backend: `dpl_J6jAxv6w4dJVY3dL9AGUcRZd6MMb`. Real HTTPS reviewed-note save/replay/consent checks passed on a marked disposable account; it was deleted and absence verified. A second isolated readiness account confirmed `aiAvailable: false`, made no real generation request and was also deleted. `.local/mobile-0.6-hosted-notes.json`, `-device-cleanup.json`, `-ai-readiness.json`, `-ai-cleanup.json`.

## Installed release checks

Installed on API36 x86_64 emulator `emulator-5554`; installed base APK hash matches the delivered artifact (`.local/mobile-0.6-installed-proof.json`). At fontScale1.0/density461, question1 controls fit the viewport without a sign-in button. Tapping an answer advanced to question2; Back returned to question1 with that answer selected. Logs: `.local/mobile-0.6-preview-ui.log`, `-question2-ui.log`, `-back-ui.log`.

Actual capture: `mobile/design/evidence/native-0.6-preview-ready.png`. Initial cold boot displayed **Android System UI isn't responding**; choosing Wait recovered. The initial capture `native-0.6-preview.png` includes that system dialog and is not clean UI evidence or a Nudge crash diagnosis. No physical-device or performance acceptance is inferred.

## Boundaries and next work

Reviewed notes now have source/native-transport/hosted save checks; see NOTES-2026-11-10.md. Hosted AI is unavailable, and real-generation quality is unverified. Source support for a provider or a key present locally is not proof of a configured hosted provider. Development-gallery screenshots, if recorded below, use an explicitly synthetic transport and are not AI or release-auth evidence.

Real Google/PKCE return, session expiry/revocation/account switching on physical devices; TalkBack, largest fonts/RTL/keyboard and long sessions; monthly recap; native push; protected upload signing, AAB, store artwork/listing and accurate privacy/operator/data-safety disclosures remain outstanding. Overall planning estimate remains about70%, not a measured progress counter.

## Additional artifact and development-only checks

APK v2 signature verified with Android Debug test identity (not a protected Play upload key), non-debuggable release manifest, and ZIP 16KB library padding check passed. ELF/real 16KB device acceptance remains separate. Logs: `.local/mobile-0.6-signature.log`, `-manifest.log`.

A separate development APK plus local Metro exercised the real NoteReview component with a clearly labeled synthetic transport, no account/session and no external AI: typing a note; obtaining two unselected suggestions; selecting one; moving to the second without selecting it; explicit reviewed confirmation; mock save of exactly one entry; input clearing and visible receipt. `mobile/design/evidence/native-0.6-dev-note-review.png` and `-dev-note-saved.png`, `.local/mobile-0.6-dev-note-*.log`. This is UI interaction evidence, not real generation, Google auth or release-account-path proof. The gallery is development-and-test-flag gated. The test-gallery extension was made after release packaging; production components were unchanged.

The review footer needs scrolling at the tested width. Controls remain reachable, but a more compact review/confirmation layout remains a UX follow-up; do not claim every screen fits one viewport. The development keyboard's clipboard panel initially intercepted taps; closing that panel allowed the interaction. No clipboard permission or clipboard service was enabled.

After the test, the preserved release APK was reinstalled, Metro stopped and the ADB reverse removed. Both created disposable backend accounts were deleted and absence verified; no fixture session was injected into the app during this UI test.
