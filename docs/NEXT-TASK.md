# Continue from the 0.9.4 Android preview

In **About you**, open **See source answers** and choose **Correct this answer** to update the answer behind a reflection. **It depends** can store a short note when written answers are available and enabled. The live service currently has written answers disabled. A disposable live account confirmed that the neutral correction persists and removes the outdated reflection. A local database test confirmed written context persists and retracts the old evidence when enabled.

0.9.3 puts a single priority and the option ratings on the first comparison screen, with additional controls behind **More comparison options**. The existing criteria engine handles the ratings and preserves missing values. Native TypeScript and all 95 tests passed.

The standalone `mobile/dist/nudge-preview-0.9.3-universal.apk` passed signature, archive alignment and 16 KB ELF checks. Its SHA-256 is `2a1bf3ef5ccb2c0b8a06424f311a4b20e2b9e6797189b4f6b077c7c1ef43cebe`. Google Auth Platform still shows the branding under review.

Migration 00022 was applied to the existing Supabase project. A post-commit query confirmed its marker and all eight question IDs. The matching Vercel deployment reached Ready and was assigned to `projectnudge.vercel.app`. A disposable signed-in account saved one new answer and received the expected scoped priority through the live API. The live API also passed saved-priority create, read and delete. The disposable account was deleted. The real-phone acceptance checks still need work. Play Store work is deferred.

## Phase 1 complete in source and Android preview

**Remember what mattered** appears on completed Android decisions. It saves a user-entered priority as a reusable comparison goal. Matching settings can show up when starting a later comparison. Users choose whether to apply one and can edit or delete it in Saved settings. Existing account APIs handle storage, and the client checks for an existing matching record after an uncertain save. Generic settings such as Everyday life require a matching decision type.

The catalog now contains 208 questions. Eight new prompts cover food, study, rest and money. Explicit responses produce scoped suggestions that the user confirms. The migration is `supabase/migrations/00022_discovery_decision_priorities.sql`. Local database, catalog, and SQL consistency checks passed. In two synthetic full profiles, each of those four areas has two suggested priorities.

Android 0.9.2, version code 12, is in `mobile/dist/nudge-preview-0.9.2-universal.apk`. The file is 42,768,098 bytes with SHA-256 `24570a828f6ad4a8dd38359b7ef4eb3475662fe40bad094cc954b9e703578e87`. All 95 native tests passed. The APK was built with the Android preview signer, and artifact checks covered the bundled JavaScript, 109 ELF segments and private configuration. Device acceptance remains open for this exact APK. The emulator disconnected before installation.

## Remaining phases

1. **Verify the Android journey.** Open a new prompt and verify save, reuse and delete from the phone. Capture the signed-in screens from the exact APK used for testing.
2. **Verify context corrections on Android.** Confirm that editing from the source answer updates the reflection. With written answers enabled in a test environment, confirm that a note is visible after reopening the answer.
3. **Verify the phone release.** Reproduce the Redmi Wi-Fi issue on the same phone and network against both hosts, then compare mobile data. Confirm Google return, scheduled noon notification and exact question routing, TalkBack, large text and offline recovery on 0.9.2 or its successor. Google branding is under review. After approval, publish if prompted and verify both chooser entry points.
4. **Prepare Play release.** Produce an upload-signed AAB, check install through a closed track, and finalize the listing, privacy disclosures and support contact. Confirm the release criteria in `PLAY-STORE-READINESS.md` before submission.

## Earlier verification

Start with [REDESIGN-0.9.md](REDESIGN-0.9.md) and [OPENING-MOTION.md](OPENING-MOTION.md). The owner chose the upper-right menu, manual mood in Today and Decide, and one daily question notification around local noon. Migration 00021 was applied with approval on 2026-11-11. The production scheduler returned HTTP 200 with `configured: true`, and a disposable production enrollment test passed before fixture cleanup. Verify the same prompt appears in an expanded background notification and opens the exact question on tap on a physical device. `accepted: 0` in the verified cron response means that run had no delivery to confirm.

When memory has no matching comparison evidence, the Android result offers **Compare with one priority** and carries the current options into the priorities form. Discovery answers provide candidate priorities, while direct journal ranking uses scoped prior choices, outcomes and named preferences. Two synthetic complete profiles (200 published answers each) yielded 179/176 observations and only 7/3 eligible priorities. Improve priority coverage by validating domain mappings and adding carefully reviewed questions; the number of answers alone is not a measure of comparison accuracy.

The 0.8.1 baseline below is the prior physical phone checkpoint. Carry its test results only to the artifacts they identify. Quiet-hours controls, native data export, and the mood popup were retired in 0.9.0.

Read NUDGE-MASTER-HANDOFF.md, VERIFICATION.md and PUSH-2026-11-10.md first. Preserve the existing native app/backend; do not recreate completed features or claim a newer hash inherits old device evidence.

Completed: reviewed note intake/confirmation, monthly recap, native push/quiet hours/opt-out, project-scoped FCM sender, protected worker, migration00020 and private five-minute scheduler. Current APK and test-signed AAB are fully identified in VERIFICATION.91 native tests and823 broad backend tests plus1 scheduler test pass.

Real Redmi15C/API35: owner-handled Google return, authenticated loading, final upgrade/session retention, daily answer save and a notification-only FCM receipt/app opening passed. ADB controls were approved only inside Nudge on that phone; Redmi blocks injection, so owner taps were used. Do not change additional phone security settings or handle Google credentials. Owner account/data must stay intact.

The marked emulator test account has been deleted and absence verified. Its private fixture files are absent and only emulator app data was cleared. Do not confuse physical owner data with disposable fixtures. Physical notification test created no decisions/answers. No pending synthetic records need deletion.

Priority remaining work:
1. Physical durable-check-in routing, quiet transitions, process-death/revocation/account switching; TalkBack, RTL, largest display/fonts, long lists, offline/conflicts, export/share cleanup and real-phone performance. Keep delivery acceptance separate from device receipt.
2. Wi-Fi SSL/network-path issue: projectnudge.vercel.app failed with ERR_SSL_PROTOCOL_ERROR on owner's Wi-Fi and worked on mobile data. Confirm DNS/router/ISP cause before changing hosting. Never disable TLS verification or silently switch to unreviewed API origins.
3. AI semantic/failure/privacy-generation evaluation. Local NVIDIA5/6 pipeline result is partial; hosted AI remains off. No automatic public prototype-free activation or invented prices.
4. Final package ID/upload signing/backup decisions and Play track installation. Current APK/AAB are debug-test-signed. Public build command supports -AppBundle. Do not publish/create a paid account/accept agreements during an ordinary preview task.
5. Accurate operator/contact/privacy/retention/Data safety/store disclosures, supported tooling dependency review and actual Play requirements. Owner is18; email signup is intentionally deferred.

Preserve light-only styling, existing theme/components,48dp targets, six easy anonymous questions, tap-save/advance and Back, no early account buttons, rejected-copy decisions and evidence-based non-clinical reflections. Mood priorities require user confirmation. Ask about meaningful product/service uncertainty.

Use relevant installed React Native/design-system skills. Update exact evidence and source package at each checkpoint. A cloud model lacking SDK/device access must clearly separate source tests from APK/device/Play validation.
