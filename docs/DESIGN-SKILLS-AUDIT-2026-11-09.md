# Native design skill audit — 9 November 2026

Applied the installed **Expo Design Systems** skill at `C:/Users/User/.codex/skills/expo-design-system/SKILL.md`, including its `references/audit.md` and `references/native-slop.md`. The reviewed official source is [expo/skills at a9e5bd3](https://github.com/expo/skills/tree/a9e5bd3fa00b4e61f632e43f85da73aee1942582/plugins/expo/skills/expo-design-system). This is a focused source/screenshot review, not a complete accessibility certification, participant study or web-parity sign-off.

## Installed sources and actual use

Three reviewed, commit-pinned skills are installed globally under C:/Users/User/.codex/skills. Their entry files match the reviewed text after normalizing Git line endings. [installed-skills.json](../design/installed-skills.json) records paths, commits and installed entry hashes. Codex can discover them on the next turn; they were read and applied manually during this turn. The first-party installer used its Git method because the bundled NDK Python lacks HTTPS support; no third-party install scripts, hooks, feedback CLI or model credentials were run.

| Skill | Pinned source | Applied to Nudge |
|---|---|---|
| Expo Design Systems | [expo/skills a9e5bd3](https://github.com/expo/skills/tree/a9e5bd3fa00b4e61f632e43f85da73aee1942582/plugins/expo/skills/expo-design-system) | Existing theme retained; common typography/action component; scalable controls and screenshot/task audit. |
| Vercel React Native Skills | [vercel-labs/agent-skills 1a2c79d](https://github.com/vercel-labs/agent-skills/tree/1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62/skills/react-native-skills) | Pressable feedback, native Modal, safe areas, boolean JSX guards, bounded virtualized journal; no unnecessary navigation/list dependencies. |
| Frontend Design | [anthropics/skills 2c5958e](https://github.com/anthropics/skills/tree/2c5958ecac7cee2b583967a2c4981d0f4a75c579/skills/frontend-design) | One approved identity; task-first entry; specific action names; removal of premature save copy; useful question context in reflections. |

The rationale uses user control, visible state and recognition from [Nielsen's usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/), with Android [48dp touch-target guidance](https://developer.android.com/guide/topics/ui/accessibility/apps). These are design principles, not causal Nudge retention results. Choice buttons explicitly submit and advance; text/ranking remain local edits until Save. Accessibility hints describe the consequence. [W3C's on-input distinction](https://www.w3.org/WAI/WCAG22/Understanding/on-input) helps review predictability but does not certify this native app.

## Scope and application

Reviewed `mobile/App.tsx`, `AccountScreen.tsx`, `QuestionInput.tsx`, `NativeTabs.tsx`, `TopicSheet.tsx` and `ProfilePanel.tsx`; read shared `native-ui.tsx` and `theme.ts` as their component/token context. Inspected the existing Android captures listed below. The root implementation agent owns code changes, builds, device interaction and final verification; this audit changed no app code.

The app has an existing plain React Native/StyleSheet system in `mobile/src/theme.ts`. Extend that system. Do not create a second theme, add Expo Router/Reanimated, copy platform-default colors, or switch to dark mode just to match skill examples. Nudge's approved light blue identity, six-question value-before-auth flow, tap-save/advance, Back correction, font scaling and independent APK remain constraints. No external feedback CLI was run and no project context was sent to the skill's feedback service.

The skill's useful lens here is concrete: task hierarchy, relationship between content and controls, consistent component states, and actual failure recovery. Its visual anti-pattern names are review prompts, not a reason to remove every card or replace Nudge's brand. It does not provide measured Nudge psychology or clinical validity.

## Findings and source follow-through

Source references below identify the inspected correction locations. **Source implemented** means the root's change is present in the current source; it does not mean a rebuilt APK has been exercised. Final implementation/build identifiers and device outcomes remain the root's verification fields.

| Priority | Observed issue | Specific correction | Current evidence / validation still needed |
|---|---|---|---|
| P2 | **A quoted answer lost its context.** `ProfilePanel.tsx:54` shortened scoped reflections to `You chose ...` without showing the question. `about-you-final.png` visibly showed “Share a skill I know” under a broad community heading. A person had to open sources to learn what that answer referred to. | Keep the actual source question above the quoted answer. Preserve the self-report state (`You said`, early/mixed evidence) rather than turn the answer into an inferred trait. | **Source implemented:** the conditional now renders `source.question.prompt` plus the quoted answer. **Final device verification pending:** inspect the new capture, source expansion, largest text and screen-reader reading order. |
| P2 | **Written-answer copy asserted a save too early.** `QuestionInput.tsx:32–34` updated local text state while its helper said it was already saved in private history. Ranking/writing require an explicit Save, so this could misdescribe unsaved work. | Remove the premature saved claim; let the explicit save state report success. Keep privacy explanation where it helps a choice rather than repeat a disclaimer under every field. | **Source implemented:** the already-saved helper was removed. **Final device verification pending:** type, leave/revisit, fail/retry and confirm the displayed status matches actual persistence. This audit did not establish draft persistence in that editor. |
| P2 | **Tab spacing missed the owner's accessibility floor.** `NativeTabs.tsx:12` used the 4dp `xs` gap, while the mobile brief requires at least 8dp between targets. This is a source geometry discrepancy, not a measured accidental-tap rate. | Use the existing 8dp `sm` token, retain minimum 48dp targets, let labels/bars grow under system scaling, and keep the full accessible About-you name despite visible `You`. | **Source implemented:** 8dp gap and typography token. **Final device verification pending:** 375dp/small width, large system text/display size, landscape and TalkBack selection/labels. |
| P2 | **Unavailable comparison recovery was described but hidden.** The earlier `comparison-final.png` asked the person to refresh/copy while the actionable controls were behind `More decision actions`. That picture shows unavailable saved reasoning, not an on-screen insufficient-evidence result. | Put the applicable recovery action inside the unavailable-explanation block: load the current comparison when open, review a copy otherwise. Preserve choices and uncertainty; do not fabricate reasoning. | **Source implemented:** `DecisionScreen.tsx:144` exposes `Load current comparison` / `Review a copy` directly. **Final device verification pending:** recapture the block and exercise its real action. The earlier screenshot at comparison-final.png was superseded; comparison-recovery-action.png now shows the direct action, and the current comparison-final.png shows its insufficient-history result. |

Supporting changes read in current source: App now reuses the shared `Action`; its label survives a busy indicator, disabled/busy/selected state is exposed, and minimum width joins minimum height. Preview answer controls describe the save-and-next consequence through an accessibility hint; `QuestionInput` receives explicit `submitOnTap` context for daily/revisited answers, without changing the explicit-save behavior of text/ranking or About-you edits. Typography now comes from the existing theme. These source changes do not by themselves prove TalkBack behavior or latency.

## Scoped token diagnostic

The skill asks for detection before wholesale conversion. Source directories are `mobile/` for App and `mobile/src/` for native implementation; the token source is `mobile/src/theme.ts`, excluded from escape searches. The diagnostic below is limited to the seven reviewed TSX files, not all source, generated Android files or backend code.

| Lexical candidate category | Before root follow-through, 668 physical source lines | After source follow-through, 656 physical source lines | After candidates per 100 lines |
|---|---:|---:|---:|
| Raw hex outside theme | 0 | 0 | 0.0 |
| Numeric `fontSize` literals | 12 | 0 | 0.0 |
| Numeric spacing outside named 0/4/8/16/24/32/48 steps | 0 | 0 | 0.0 |
| Numeric border-radius literals | 0 | 0 | 0.0 |

Counts are lexical occurrences; the denominator includes blank/comment lines. The baseline was captured while root component work was underway. This is a small drift diagnostic, not a usability score, exhaustive lint, contrast check or proof that every value is correctly chosen. For example, the original 4dp tab gap used a legitimate token and therefore passed a token scan while still missing the specific 8dp requirement.

## Screenshot evidence and limits

| Capture inspected | What it supports | Boundary |
|---|---|---|
| `about-you-final.png` | Existing one-reflection hierarchy and the context-free quoted-answer issue | Predates the source-context correction. No participant comprehension result. |
| `retry-offline-correction.png` | Visible inline network ambiguity, explicit retry/reload, preserved previous-answer view | A still image cannot establish whether a retry succeeded or duplicated data. |
| `retry-correction-recovered.png` | Later question view with Back/Skip and no choice-level Continue | Use the root's matching runtime report for actual save/retry claims. |
| `comparison-recovery-action.png`, current `comparison-final.png` | Direct Load current comparison action, followed by actual refreshed insufficient-history result | b56a authenticated checkpoint. An earlier image at comparison-final.png was reviewed before being superseded. |
| `keyboard-menu.png` | Android input-method menu overlay and visible form context | This is the operating-system keyboard menu, not a Nudge action menu defect. |
| `preview-375-question-1.png`, `today-one-screen.png` | Historical normal-size layout | These older captures still show manual Continue/Save for choice answers; they do not describe current tap autosave. Do not reuse them as current interaction proof. |

No retention rate, conversion change, response-time improvement, frame rate or research-participant outcome was measured in this audit. Expected benefits—less recall needed when reading a reflection, truthful save status, more forgiving target separation and more discoverable recovery—are design hypotheses with observable checks, not established causal improvements.

## Accessibility checks for the final build

1. With TalkBack active, answer by tap and by Skip, return with Back and correct, then exercise failure/exact retry. Verify the new prompt is understandable and focus does not remain on an unrelated old control. Current prompt announcements/hints are source evidence; this audit did not run the screen reader.
2. Verify shared `Action` keeps its accessible name during busy state and blocks repeated submission. Saved, waiting and error messages should be understandable without unnecessary focus movement. [W3C status-message guidance](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
3. At small width, largest text/display size and landscape, keep full question/answer text, expanded context and sheet actions reachable without clipping or shrinking. Check Topic & pace with long labels and the keyboard on writing screens. Test Android Back and focus return after dismissing sheets.
4. Inspect 48dp target bounds, 8dp separation and enabled text/control contrast in the rendered build; opaque palette calculations do not verify composited pressed/disabled styles. [Android accessibility guidance](https://developer.android.com/guide/topics/ui/accessibility/apps)

React Native documents that accessibility focus can vary by platform; a discoverable element is not automatically the focused element. Use the actual [React Native accessibility APIs](https://reactnative.dev/docs/accessibility) and device behavior, rather than assume a spoken prompt alone establishes correct focus.

**Implementation record:** source corrections above plus responsive navigation at 200% system text, stable accessible button names during busy state, and read errors that do not imply a write. 61 native tests and TypeScript pass. Release APK 0.3.0/code3 SHA-256 `a205060997812761bcbf82355ace08950f4bb871004f2179d6facebd8b18d42e`.

**Verification record:** final rebuilt APK installed on the API36 x86_64 emulator without Metro. The b56a authenticated checkpoint passed tap-save, Back correction, offline failure and explicit exact retry; the later large-text-padding-only a205 build passed the entire offline signed-out preview/restart flow. New About-you capture shows question context with the quoted answer. At 200% text the tab bar reflows into two rows with whole labels; remaining profile actions are reachable by scrolling. Direct comparison recovery was exercised and returned insufficient history, with no invented winner. TalkBack/physical-device/performance and full web parity remain unverified. See `VERIFICATION.md` for final preview, artifact and cleanup results.

## Additional observed large-text correction

The first 200% system-font screenshot split Today, Decide, Tools and Account inside the one-row bar. This was an observed rendered defect, rather than a token-scan finding. NativeTabs now reflows at fontScale >= 1.5 or width < 330dp, with minimum width twice the 48dp target and 8dp gaps. The final installed build shows whole labels in two rows. Normal 375dp keeps one row. Original and current source semantics/roles remain unchanged. No font scaling cap was introduced.

The shared Action reduces horizontal padding from 16dp to 8dp at large font scale so compact response groups have more room for whole words, retaining 48dp minimum width/height. Source/type checks pass; the About-you feedback row itself was not re-exercised after this final spacing-only adjustment because the disposable account had been signed out. Treat that specific rendered outcome as pending, not as a full accessibility pass.

Final a205 layout walkthrough passed: offline preview/restart; 200% preview text and landscape response/footer reachability; bounded tablet-sized presentation. Emulator settings restored; installed-package hash verified. The Android disposable account and its local session files were removed and absence verified. No real Google return, TalkBack, physical-device or retention claim follows.

## 0.4 follow-through

The same theme and shared controls now support journal filters, Android date/time selection, setting an open decision aside and descriptive activity/preference views. Filter and check-in sheets keep their Apply/Save actions outside the scrolling contents. Changes are staged until an explicit action; closing a filter restores the applied values, and cancelling a custom check-in does not write. Four activity periods per page keep the initial view bounded; exact sample/time-zone/window details are available on request. An unanswered regret follow-up stays unknown.

Signup and fresh reauthentication share `GoogleButton`, using the official unmodified G asset, readable label and stable busy state. Brand colors and the provider's 12dp/10dp internal spacing are documented exceptions to the existing Nudge tokens. No new styling system or dark mode was introduced. Provenance and restrictions are in `GOOGLE-SIGN-IN-ASSET.md`.

The 0.4 device pass caught a literal-space child inside expanded native decision actions; the same read-only TSX audit found and removed two more in the older foundation/settings tools. Final native source tests/type checks pass. The first post-prebuild packaging attempt omitted required native registration libraries and failed on launch; that APK was rejected and preserved only under the private build directory. Native producers now remain in the Gradle task graph, and APK verification rejects missing registration/runtime libraries. `VERIFICATION.md` records the rebuilt artifact and actual installed outcomes; neither a source audit nor packaging success alone is treated as runtime proof.

The development device check used a marked disposable account. It exercised filter draft cancellation/application, abandonment cancellation/confirmation and Android date/time selection. A server read verified unchanged reminder timestamp/revision after staged-date cancellation, followed by the explicitly saved custom time and one advanced reminder revision. These development results remain distinct from final release checks. No real Google authentication, native push delivery, TalkBack acceptance, physical-phone performance or measured behavior change is inferred.
