# Native implementation checkpoint — 8 November 2026

## Product behavior

- Independent React Native screens and embedded Hermes code; shared Supabase accounts and production HTTPS backend. Google authentication uses the system browser and strict native callback, not a login WebView.
- Six short introductory questions, starting with food and humor. No login button before completion. Choices, neutral answers and Skip persist in encrypted local storage; tapping saves and advances. Back permits correction. Valid interrupted drafts resume at the first unanswered question, with a 24-hour maximum age.
- Light-only UI. No theme switch or rejected welcome slogans. Normal 375dp preview layouts were exercised with all seven answer choices visible without scrolling before the tap interaction change; final APK interaction evidence is recorded separately.
- Five native destinations: Today, You, Decide, Tools, Account. Daily choices save on tap; rankings and text retain an explicit save. Session Back edits the existing owner-scoped answer/revision instead of appending another answer.
- Today has a compact question surface and topic/pace sheet. About you presents one reflection per page, explicit sources, correction/feedback and answer/preferences menus.
- Native Decide, criteria with unknown values, saved setting/alias application, reviewed meaning, journal, choosing, reflection and reminder settings. Encrypted working drafts and pinned pending create intents survive tab changes; sign-out fences late device writes.
- Native account basics, time zone, terms and AI choices, check-ins, temporary JSON export/share, learning reset, history deletion and fresh-auth account deletion.
- Supporting tools: optional earlier foundation questions and milestones, learning verification/evidence, memory library, descriptive outcomes, circles, invitation controls, shared polls/votes/closure and leaving/deleting circles.

## Backend validation and deployment

Current web validation: 756 tests passed, 0 failed at concurrency 2; production build passed. Native validation: 60 tests passed, 0 failed, covering shared evidence, auth protocol, drafts, transports and a regression for real nullable/object Supabase reflection relations. Seven exact source hashes verify shared contracts/rules; shorter mobile presentation copy is separate.

Production deployment: `dpl_HPbhdTLgRpCMw5aKUyHdpt2LFYzD`, aliased to `https://projectnudge.vercel.app`. The new account, settings, foundation and tools routes are deployed. No migration or environment changes were needed in this checkpoint.

Live HTTPS verification used two marked disposable accounts and checked basics/time zone, settings plus cross-account denial, optional foundation, comparison creation/replay/isolation, choice, reflection, reminder settings, earlier/memory/outcome reads, circle creation/join/vote/close/rotate/leave/delete, export/check-ins, history deletion/reset and fresh account deletion. Both accounts were deleted and absence verified. Report: `.local/mobile-0.3-hosted-parity.json`.

The live test exposed a native comparison-read bug: the existing Supabase reflection relation returns null or an object, while the client accepted only arrays. The client now normalizes all supported shapes and still rejects malformed reflections. A regression test and successful live comparison/choice/reflection checks cover the fix.

## Design deliverables

`PHASE-1-WEB-INVENTORY-2026-11-08.md` contains the source inventory. `PHASES-2-10-DESIGN-2026-11-08.md` contains the adaptation/research/design/audit/handoff. `../design/phase-02-board.png` through `phase-10-board.png` are labeled specification boards, not screenshots. `../design/evidence/` contains actual Android captures with filenames identifying the tested state.

The research plan and personas remain hypotheses. The questions are authored reflection prompts, not a clinically validated psychometric test. No participant or measured retention findings are claimed.

## Release boundary

APK build/install/runtime evidence belongs in `VERIFICATION.md`; source and transport checks alone do not prove an APK or physical-device behavior. The development-only session fixture and component gallery require both a development build and the explicit local test flag; the release build clears that flag. No test password or server credential is embedded in source or APK.

Play Store publication remains a later release: durable upload signing/AAB, real Google browser-return verification, physical-device/TalkBack/performance acceptance, and completed store/privacy/operator requirements. Native push delivery has not been implemented; persisted reminder settings and in-app check-ins do not imply push delivery. Optional AI remains unavailable on the current hosted demo. No Play Store publication was attempted.
