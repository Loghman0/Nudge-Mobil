# Mobile 0.9 working brief

Status on 2026-11-11: 0.9.0 Android preview built and installed on the isolated emulator. The physical-phone checkpoint remains 0.8.1.

Keep Nudge's light blue identity: mist #edf2f7, paper #f9fbfd, ink #253348, slate #536479, blue #355db9, line #becbda. Reuse theme.ts. System sans, 30/40 hero, 22/30 question, 16/25 body and 48dp minimum controls. Left-aligned question content, no decorative headings or new font dependency.

```
Nudge                          [menu]

Today                   [Mood & topic]
Question
[answer]
[answer]
[answer]

                          [Skip]
```

The right drawer exposes Today, About you, Decide, Journal, Recent answers (five), Tools and Account. No bottom navigation. Drawer uses quiet selected rows, not a stack of cards. Short slide/fade and press response explain actions; reduced motion skips travel. Long content and large text remain scrollable rather than clipped to force one screen.

Recent answers reuses guarded corrections and deletion with confirmation. Today has no previous-answer trail; anonymous onboarding still permits Back. Notification permission is requested once after authentication/configuration, respects denial, and uses device timezone with no quiet period. Android settings retain OS control. Remove mobile export and timezone editors; preserve server/web data access and account deletion.

Mood is chosen manually from Today or Decide. Leaving the app in the background or reaching one hour clears the choice. Each mood changes the eligible question mix without locking discovery to one topic. Calm favors ordinary reflection, Sad favors comfort and support, Angry favors boundaries and priorities, and Tired favors short questions. Decision priorities suggested from mood need explicit approval and ratings. The comparison opens with options and setting together. Extra context, priorities, and ratings open on demand.

After Android permission is granted, the app registers its daily question channel and opts that installation in. The existing five-minute server job reserves one eligible question per account and sends the full prompt around noon in the account's synced phone timezone. It reuses an unanswered reservation for that date or selects a new ordinary question. A 30-day exposure check avoids repeating unanswered families. A tap opens the exact authorized question. Android controls banner height, lock-screen privacy and permission. The separate mood notification was left out so the daily question is the single proactive prompt.

The noon feature requires `00021_native_daily_questions.sql` on the existing project. Local database tests cover timezone, registration proof, same-day deduplication, lease fencing, device opt-out and unanswered reroll. The exact tap endpoint can be tested independently of the scheduled sender.

Owner approved gentle natural sounds by default, excluding futuristic/synthetic effects. Source licensed real UI sounds, retain provenance, keep volume low and provide a sound preference. Do not equate a sound waveform check with a listening review. Small milestones reflect saved distinct answers, not personality scores or pressure to maintain streaks.

Brief critique: the previous five-tab bar consumed screen height and hid recent corrections in Today Back. Replacing it with an explicit menu follows the owner's preference at the cost of one extra navigation tap. Keep location headings visible and Android Back predictable. Avoid identical bordered cards for navigation, celebration popups and unnecessary instructional copy.

The 0.9.0 universal preview APK is `mobile/dist/nudge-preview-0.9.0-universal.apk`, 42,753,778 bytes. SHA-256 is `db55eada29abd5f702b7ec83f3c0c18a5c6995de39219535d29f0c111f4020f0`. The APK has standalone Hermes bytecode, ARM64 and x86-64 libraries, a valid preview signature, and 16KB static alignment. The scan found no private environment or disposable session values.

Native TypeScript, 92 native tests, nine shared-core hashes, generated SQL consistency, and focused server tests passed. The hosted disposable account reopened its exact reserved question and received 404 for an unreserved one. The final standalone APK opened with Metro disconnected. A six-answer run verified Back, tap-to-advance, Google after the sixth answer, and 138px touch height at the emulator's 461dpi override. Emulator images are `native-0.9-onboarding.png` and `native-0.9-preview-result.png` in `mobile/design/evidence`.

Pending acceptance covers the signed-in drawer and recent answers on a physical device, notification permission and receipt on that device, sound listening, TalkBack, and Play upload signing. The owner approved Supabase 00021 and it was applied on 2026-11-11. The scheduler returned HTTP 200 with daily questions configured, and the production enrollment API accepted valid disposable device proof and rejected incorrect or disabled proof. The verified scheduled run accepted zero sends. Actual phone receipt remains separate.
