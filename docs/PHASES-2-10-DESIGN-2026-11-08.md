# Nudge mobile: adaptation, research and implementation handoff

Date: 2026-11-08; specific implementation references reconciled 2026-11-09. Source companion: `PHASE-1-WEB-INVENTORY-2026-11-08.md`. Current feature/evidence status: [PARITY.md](PARITY.md). Final artifact and runtime authority: [VERIFICATION.md](VERIFICATION.md).

**Latest owner direction takes priority over earlier proposals below:** the Android app opens directly into six short questions, ordered food, humor, free time, creativity, rest and everyday problem-solving. There is no sign-in button until all six have a response (including Skip). Existing question/choice identities and evidence meanings are preserved with shorter mobile wording. Tapping a choice saves and advances; Back revisits an answer. Rankings and writing keep an explicit save because they require multiple edits. Ordinary phone layouts aim for one question per screen; large text and landscape may scroll rather than clip. The app is light-only for now. The five native destinations remain, with the visible About-you tab shortened to `You`; secondary tasks use menus. These instructions supersede the early-entry sign-in, manual Continue and shipped-dark-mode proposals in this document.

Reading this as: Nudge helps people notice patterns in their own answers and use those patterns when deciding, for people who want useful reflection without a long journal entry, with a curious, direct language, leaning toward focused blue product UI.

The owner has approved continuing every phase without another approval stop. This document makes the remaining design choices concrete. It does not certify an APK, deployed API, usability result or store release. `phase-visuals.json` describes proposal boards; those images are not app screenshots.

**Evidence labels:** **Read** means present in the inspected source; **proposed** means a design or implementation requirement; **unverified** means it still needs a runtime, device or participant check. Audience descriptions and expected improvements below are hypotheses, not measured findings. Android is first; React Native + Expo produces native screens and an independent APK. iOS behavior is a future validation target, not an existing build claim.

| Dial | Value | Reason |
|---|---:|---|
| Design variance | 6/10 | Retain Nudge's mark, name and blue identity; change hierarchy and interaction rather than imitate another product. |
| Motion intensity | 4/10 | Reduce the brief's initial 6: answers are sensitive, reading matters, and movement must explain a state change. |
| Visual density | 4/10 | Reduce the initial 5: one active question or decision step; supporting evidence stays available on request. |

## Phase 2 — mobile adaptation strategy

### Parity decisions

Every row has one decision. **Keep** preserves behavior; **adapt** changes layout while preserving the contract; **replace** uses an equivalent native interaction; **defer** remains an explicit capability/release gate; **drop** removes presentation with no unique product capability. A deferred feature must never appear to have succeeded.

| Web feature / behavior | Decision | Native destination and reason |
|---|---|---|
| `/` marketing entry and navigation | Replace | Signed-out native launch opens the first of six questions with the Nudge mark. No separate welcome/start screen or sign-in button precedes completion. |
| `/start`, six-question preview before authentication | Keep | Public preview stack. Same edition and validated question IDs; no login wall or runtime AI requirement. |
| Preview Back, Skip, neutral response, answer correction | Keep | Visible actions, including accessible alternatives to any gesture; skipping is not evidence of a preference. |
| Local preview save/delete, expiry and source disclosure | Adapt | Preserve explicit discard/delete, the current 24-hour draft rule and source/retention detail in `About these questions`; remove the owner's rejected introductory slogans, not privacy controls. |
| Preview reflection and optional sign-up to save | Keep | Answer-linked reflection, then `Save my answers` / `Review my answers`; no diagnostic score or pretend comprehensive profile. Reviewing stays inside the six-question local preview; it does not imply unlimited authenticated daily questions without an account. |
| `/discovery-save` reviewed claim after authentication | Adapt | Native review of the exact preview answers before claim. Account identity, edition and privacy generation remain pinned. |
| Google signup/sign-in and `/auth/callback` | Replace | Available after the six preview responses: system authentication browser + allowed app callback; same Supabase account. Never embed Google login in a WebView. A pre-existing verified session can open the account directly. |
| Existing email sign-in and password recovery/update | Defer | Google-first demo is the owner's selected scope. Native email/recovery UI and configured sender delivery are not complete claims; keep recovery guidance truthful. |
| Public email signup without a configured SMTP sender | Defer | Demo remains Google-first by the owner's prior choice. Do not show email signup as a working public option until actual delivery is verified. |
| `/consent`, current terms/privacy and AI choices | Keep | Versioned consent screen plus owner-accessible Account routes. Mandatory legal acknowledgement is separate from optional AI. |
| `/dashboard`, daily question and more in a session | Adapt | Today owns one question at a time. `Answer another` is explicit; no infinite feed. |
| `/discover` redirect | Drop | No separate native destination; Today is the canonical destination, preserving discovery itself. |
| Topic switch, mode/effort/depth, muted topics | Replace | `Topic & pace` opens the native sheet; Question preferences remains a separate detail. Apply commits once, Cancel does not mutate. |
| Pauses after three session answers or two skips | Keep | Offer explicit continuation and topic/reflection destinations; leaving is voluntary. No forced streak or guilt. These are session pauses, not a Continue button after every tap. |
| Exhausted eligible question pool | Keep | Explain `No more questions match these preferences`; `Change preferences` and other main destinations remain available. |
| Choice, scale, ranking and short-written formats | Adapt | Full-width choices and neutral/scale responses save and advance on tap. Ranking and multiline writing keep explicit Save because they need multiple edits. Ranking has accessible move-up/down controls. Capability and user settings both gate optional formats. |
| `/profile` About you reflections | Adapt | Visible tab `You`, full accessible name `About you`: one reflection per page, early/repeated/mixed/user-confirmed evidence language, sources and context; no personality meter. |
| Source answers, evidence, feedback, edit/exclude/reinclude/delete | Keep | Reflection detail -> source answer -> explicit action. `Use in my profile` changes inference use, not whether an answer exists. |
| Question settings, optional childhood/uncertainty, written answers, metrics opt-in | Keep | Question preferences; current defaults remain conservative. Explain unavailable server capabilities. Metrics stay off until chosen. |
| `/ask`, 2–8 option comparison | Adapt | Decide tab: options first, short context step when needed, review, comparison. Preserve option limits and validation, not the long web form. |
| Ambiguous/private terms, setting, goal and option meanings | Keep | Ask the person for the missing meaning before producing a winner. One answer can clarify several terms; no game or real-world facts invented. |
| Optional AI interpretation/draft question | Adapt | Explicit `Help me phrase this` action after AI consent. Draft setting/options/meanings require review; unavailable AI leaves manual comparison usable. |
| Personal history versus criteria/value mode | Keep | Two clearly labeled modes. History mode only uses applicable evidence; criteria mode exposes values, unknowns and weights. |
| Criteria, ranges, source provenance and unknown facts | Keep | Criteria editor + result details. `Unknown` remains unknown; an incomplete comparison can ask for facts instead of choosing. |
| Saved comparison settings, presets and aliases | Adapt | Named presets sheet; preview before applying; scope aliases to their setting. Saved data must not become hidden default truth. |
| Comparison review, reasons, chosen option, refresh, add option, copy/resume | Keep | Review/result/detail actions. Reuse revisions and stable creation IDs. Copy starts a new reviewed decision, not an in-place edit claim. |
| `/history`, journal search/category/status/pagination | Replace | Decide -> `Open your journal`; native virtualized rows with bounded pagination, filters sheet and explicit next/load-more recovery. |
| Let it go / abandon, optional reflection and follow-up | Adapt | Decision detail action menu and labeled reflection form; nullable answers stay nullable. Abandon needs its supported transport before a working button is shipped. |
| Reminder local time, change and cancel | Adapt | Native time/date controls with visible time zone; server record and in-app check-in are separate from device delivery. |
| `/notifications` read/dismiss/open related decision | Replace | Account -> Check-ins; linked row opens the owner decision, with Read/Dismiss actions available without swiping. |
| Existing browser Web Push/VAPID delivery | Defer | Native delivery needs a separate FCM/Expo provider, registration, scheduling/quiet-hours policy and physical-device tests. Browser subscription endpoints do not provide native delivery. In-app check-ins remain in scope. |
| `/discover/checks`, still true/not anymore/forget | Adapt | Tools -> Earlier checks. Preserve evidence and context; reject clears an inference rather than manufacturing its opposite. |
| `/onboarding`, optional legacy six starter questions | Adapt | Tools -> Earlier learning, optional. Do not impose a second onboarding or silently merge legacy evidence with current discovery. |
| Belief search, evidence, correct and forget | Adapt | Tools -> Earlier learning -> belief detail, with current scope and correction controls. |
| Memory library search, edit and delete | Adapt | Tools -> Saved memories, paginated; same owner data and explicit forget/delete consequences. |
| Reviewed AI note extraction/save | Defer | Existing web-only action needs an authenticated native route, consent/accounting parity and review UI. No direct auto-memory save or fabricated result. |
| Likes/dislikes timeline and earned milestones | Adapt | Tools -> Earlier learning/history. Quiet descriptive records; no lost-streak framing or artificial reward schedule. |
| `/analytics`, outcome statistics | Adapt | Tools -> Decision patterns; always show sample size and window, distinguish missing data from zero, and avoid causal claims. |
| Optional AI monthly recap | Defer | The native Tools source already marks recap unavailable. Add only with a real bearer API, consent/accounting and quality checks. Manual patterns remain useful. |
| `/groups`, circles list/create/join/leave/owner delete | Adapt | Tools -> Circles -> detail stack. Private journal and group data remain separate; role restrictions visible. |
| `/groups/[id]`, members, rotation and invite | Replace | Member list + native Share/copy invite. Do not ask for contacts permission or automatically send invitations. |
| Poll create, vote/change vote, counts, tie/no votes, close | Adapt | Circle poll detail: large choice rows, own-vote state, explicit close. Reload after an uncertain create result; no blind duplicate retries. |
| Profile basics and time zone | Adapt | Account -> Profile; keep explicit save/cancel and show time zone in scheduling. |
| AI consent/withdrawal and terms revision | Keep | Account -> AI and privacy. Withdrawal affects future sends; do not imply it recalls vendor data. Source vendor support is not configured capability. |
| Full export | Replace | Account -> Export -> platform Share sheet, then clear temporary file. Full v6 export is a paginated live export, not a transactional snapshot. |
| Learning reset, delete decision history, account deletion | Keep | Separate consequence summaries, confirmation and supported server actions. Account deletion requires same-user recent authentication, not token refresh. |
| Sign out / account switching | Keep | Clear private in-memory caches and pending intents bound to the previous account; preview claims never cross accounts silently. |
| Theme, accessibility, policies, support and licenses | Adapt | Runtime is light-only; no theme switch is shipped. Account has information links; policy text/external browser are informational content, not a web-app wrapper. Dark tokens below are future design references. |
| Hover-only help, web footer link wall, desktop multi-column forms | Replace | Labeled buttons, contextual help and readable single-column stacks; no unique capability lost. |
| Rejected introductory slogans, decorative progress/knowledge meters | Drop | The owner explicitly rejected the slogans. A meter cannot truthfully quantify how well Nudge knows a person. |

### Information architecture and reach

```text
Public: Preview question 1..6 -> Preview reflection -> Save/review -> Sign in
                                                     -> Review local preview
Authenticated shell
  Today       daily question -> Topic & pace / tap-save / session pause
  You         About you reflections -> evidence -> answer detail / correction
  Decide      comparison steps -> result -> decision detail
              Open your journal -> filters -> decision detail -> reflection/reminder
  Tools       Earlier checks / Earlier learning / Saved memories / Decision patterns
              Circles -> circle -> poll / members / invite
  Account     profile / Check-ins / privacy+AI / export+delete / app+policies
```

Five stable labeled destinations match the existing native shell, avoiding an additional flat menu of every web route. Hick's law motivates staged choice, not a universal numerical limit; Jakob's consistency heuristic motivates a predictable tab bar and Android Back. Keep tab state/drafts when switching. Back closes keyboard, open sheet/editor and nested route before leaving a tab. A modal returns focus to its invoking button. Unsaved authoritative edits require Save/Discard/Keep editing, not automatic submission.

Full-width choice rows are the primary action and save/advance on tap; no redundant Continue follows a single choice. Ranking/writing Save and other form actions follow their content above the safe-area tab bar. Long questions scroll naturally; never pin a button over choices or a keyboard. The earlier proposal to put three persistent shortcut buttons below Today is superseded: secondary actions use compact menus and destination screens. Decide, journal and Question preferences remain functional minimum-48dp controls with pressed/disabled/focus states wherever offered, never plain blue text links. Header controls remain at least 48dp with 8dp separation. On large text, allow labels to wrap and bars to grow; never shrink type to preserve a fixed bar height.

**Deep links:** the authorized authentication callback is `com.projectnudge.app://auth/callback`. Validate callback host/path and expected auth state; never log tokens or accept arbitrary destinations from URL parameters. Proposed product links are owner decision detail and circle invite routes, not yet proof of implemented App Links. Resolve invite codes server-side, show a join review, and require auth/ownership before private content. Invalid/expired links show `This link is no longer available` with a safe destination. Verified HTTPS App Links require domain association and release signing; those are release gates. Never place answer text in URLs.

### Capabilities, permissions and network states

| Capability | Decision / benefit | Permission timing and risk |
|---|---|---|
| Native Share sheet | In scope for an explicit invite/export action | No contacts or media read permission. Explain that the chosen recipient receives the export/invite; do not share on opening the screen. |
| Haptics | Proposed, sparse selection/save feedback | Honor system/user preferences; no vibration during reading or ordinary scrolling. |
| Offline preview and draft | In scope, preview already local | Preserve expiry and secure app-private storage. State that an account write has not been saved when offline. Clear account-bound data on sign-out/reset. |
| Native push | Deferred integration, user benefit is a chosen check-in | Ask only after `Remind me`, after explaining delivery; denial keeps in-app reminders useful. No first-launch prompt or repeated nag. |
| Background sync | Defer authoritative mutation queues | Stale privacy generation/revision cannot be silently rebased. Read refresh on foreground is safer than hidden writes. |
| Widget, camera, microphone, contacts | Defer; no observed web need | Avoid collecting permissions/data for hypothetical features. Widget previews could expose sensitive reflections. |
| Biometric app lock | Defer, not a replacement for server auth | Add only after threat model, recovery/accessibility and device testing; do not claim current at-rest protection from a UI lock. |

| Situation | Required behavior |
|---|---|
| Offline before account fetch | Show last verified data only if safely cached for that same account, with `Offline` and last-refresh time; otherwise an empty offline state with Retry. Do not invent placeholder reflections. |
| Offline during preview | Continue locally; distinguish local answer from account save. Claim later is explicit and reviewed. |
| Slow request | Preserve screen and draft, label pending action, prevent duplicate submit; no fake percentage. Read refresh can be cancelled without implying server-write cancellation. |
| Write times out / result unknown | Retain exact request ID, body, expected generation and revision. Offer `Check save`/exact retry where idempotency supports it; never create a fresh ID to replay unknown intent. |
| Write succeeded, refresh failed | `Saved. Refresh to see the latest version.` Block further dependent writes until refreshed. Never report failure and invite duplicate submission. |
| Conflict, reset or changed account | `Your saved information changed. Review the latest version.` Refresh and require renewed review. Do not rebase old intent onto a new privacy generation. |
| Circle/poll creation uncertain | Reload list/detail first because those RPCs lack request-ID deduplication. |
| Expired session | Keep nonsecret draft locally where permitted; sign in, verify same account, refresh, then review before retry. |

Assumption: optional mobile-only capabilities are not essential to this demo. The core discovery/decision/account loop must remain useful without AI or push.

## Phase 3 — research synthesis and ethical application

The largest opportunity is a clearer relationship between an answer, a limited reflection and a later decision. A prettier form alone cannot establish this. Remove forced introductory copy, keep uncertainty visible and let people correct what Nudge uses. No source below establishes Nudge's retention, clinical validity or a universal optimal question count.

Sources read on 2026-11-08 include [Android accessibility guidance](https://developer.android.com/guide/topics/ui/accessibility/apps), [Nielsen's usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/), [progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/), [response-time guidance](https://www.nngroup.com/articles/response-times-3-important-limits/), [GOV.UK question pages](https://design-system.service.gov.uk/patterns/question-pages/), the [Miller paper reproduction](https://psychclassics.yorku.ca/Miller/) and [W3C status-message guidance](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html). These support specific interaction choices, not invented conversion statistics. Primary Fitts/Hick paper fetches were blocked/timed out; those historical principles are used cautiously as design hypotheses. For the other named psychology effects below, original-paper verification was not completed in this review; no numerical or causal claim is made from them.

| Principle | Nudge application and user benefit | Misuse risk / limitation |
|---|---|---|
| Fitts / thumb reach | Large full-row tap-to-save answers and nearby Back/Skip reduce precision demands. Test small phone and one-handed use, not a universal thumb-zone diagram. | Enlarging only the desired answer or making Skip tiny would bias responses. |
| Hick / choice complexity | Choose options first; show criteria or meaning prompts when relevant, then review. Keep the five main destinations stable. | Fewer choices can also suppress honest answers; retain neutral/context/skip and all valid domains. |
| Jakob / consistency | Use familiar Android Back, tabs, sheets, Share and visible labels. Reuse Nudge's terms across web/mobile. | Familiar components do not make a confusing product self-explanatory; do not copy a social feed. |
| Miller / working memory | Keep current options and missing context visible on the review screen; evidence does not rely on remembering an earlier question. | The 1956 experiments are not a rule to limit every menu to seven items. Do not truncate answers to fit a myth. |
| Doherty / responsiveness | Immediate local pressed/selection feedback; async saves have honest pending state and failure recovery. Treat roughly 400ms as a brief-supplied heuristic, not a pass/fail guarantee. | Fake instant server success or hiding a slow request breaks trust. Measure input latency and endpoint duration separately. |
| Aesthetic-usability effect | Consistent blue hierarchy and generous readable controls may reduce perceived effort; usefulness still comes from evidence. | Polish can conceal weak inference or make users overtrust a winner. Test comprehension separately from attractiveness. |
| Peak-end | End a session with the reflection/source relationship and an easy Finish; no forced signup after value. | Inflated insight or celebratory certainty would make the ending memorable by misleading the person. |
| Zeigarnik / unfinished work | Preserve a draft and offer a clear `Resume comparison` when the person returns. | No unfinished-task guilt, badge pressure or repeated push reminders. Draft deletion is available. |
| Default effect | AI, sensitive optional topics and activity metrics remain off until chosen; safe settings remain visible. | A preselected consent box or hidden opt-out could turn reflection into unwanted profiling. |
| Loss aversion | Warn accurately before irreversible deletion and preserve drafts through network loss. | Do not say `Lose your progress` to block leaving or `Your streak will die`. Confirm only real consequences. |
| von Restorff / isolation | One accent primary action and a clearly labeled missing-information block guide attention. | Do not use the accent to disguise marketing, make a preferred answer salient or de-emphasize deletion. |
| Progressive disclosure | Meanings, criteria detail and source answers open from labeled controls; the first screen remains actionable. | Never hide uncertainty, price, AI sending, consent or destructive consequences as “advanced”. |
| Social proof | Prefer a person's own source answers over popularity. Circle vote counts are factual and shown with no-vote/tie states. | Do not invent community claims; show poll results after selection where feasible so popularity does not masquerade as personal fit. |
| Reciprocity | Offer a useful answer-linked preview before asking for an account. | Free value creates no obligation to register or share sensitive answers. No guilt copy. |
| Variable rewards | Question variety comes from relevant coverage and user-chosen topic changes, not a slot-machine reward schedule. | Avoid infinite feed, random unlocks, surprise streak rewards or promises that the next question will reveal the “real you”. |
| Emotional design | Direct, nonjudgmental language and easy correction make answers feel safe to revise. | Anthropomorphism or therapist-like authority can imply care or knowledge the app cannot provide. No diagnosis from a playful choice. |

For example, choosing to force open a puzzle box could reflect time pressure, humor, a game strategy or impatience. It does not establish aggression. Capture the answer/context, offer a tentative reflection if supported, and let later evidence confirm, qualify or overturn it. Question author/editor metadata does not make the bank a psychometric instrument.

### Closest functional references

These are first-party product descriptions, not independent proof that an app is effective or universally liked. Their current features were read; their interaction quality was not tested here.

| App / source | Functional overlap | Borrow / avoid |
|---|---|---|
| [Daylio](https://daylio.net/) | Low-effort repeated entries become searchable history and descriptive patterns. | Borrow quick input and the trace from entry to chart. Avoid importing streaks, achievements or interpreting correlation as cause. Nudge's private-cloud model differs from Daylio's published local-data description. |
| [Reflectly](https://reflectlyapp.com/) | Guided prompts help structure reflection, including AI assistance. | Borrow a focused prompt and concise follow-up. Avoid its mental-health companion positioning and any implication Nudge provides therapy. |
| [Finch](https://finchcare.com/) | A repeated, approachable self-care loop. | Borrow the low-pressure entry point. Avoid a dependent pet, rewards or emotional obligation as reasons to disclose more. Nudge needs no mascot to make a saved answer useful. |

| Opportunity | Expected user impact (hypothesis) | Effort / acceptance evidence |
|---|---|---|
| Show answer -> reflection -> applicability in decisions | High: makes the product's value assessable | Medium; participant can name the supporting answer and a limit. |
| Replace form wall with progressive comparison steps | High: fewer competing actions | Medium; unfamiliar comparison completes without invented meanings. |
| Native action buttons and one question hierarchy | High: findability and touch use | Low; observed task success and target/font audit. |
| Exact pending/conflict/offline recovery | High: protects trust and data | Medium/high; fault-injected owner/generation/revision tests plus device run. |
| Optional notification delivery | Moderate and uncertain | High; keep deferred until configured device delivery and permission/quiet-hours tests. |

## Phase 4 — provisional user research

No participant interviews, support-corpus analysis or funnel data were available to this design review. All three personas are hypotheses about jobs, not demographic facts or diagnoses.

| Provisional persona | Job to be done | What could disprove it |
|---|---|---|
| Curious newcomer | “Let me answer something interesting and see whether the reflection fits before I make an account.” | People may prefer starting with a real decision, or find hypothetical questions artificial. |
| Occasional decider | “Use relevant things I told you, but ask about unfamiliar context rather than guess.” | People may prefer manual criteria and reject any use of past answers. |
| Reflective returner | “Show what has changed and let me correct the record without starting over.” | People may not want a persistent profile or may treat each session as private and separate. |

Recruit **6 participants** within the requested 5–8 range: include first-time and existing users, differing Android sizes and comfort with journaling, at least two who use large text, and at least one who uses a screen reader or another assistive method. These are recruitment aims, not people already recruited. Use adults for this first study; research with minors would require a separate consent/safeguarding plan. Do not infer traits from participants' personal answers or collect unnecessary private material. Provide synthetic questions/decisions as an option.

**Interview guide, 35–45 minutes:** warm-up: “Tell me about the last time you tried to understand a preference.” Context: current alternatives, privacy expectations and when a question feels too personal. Deep dive: a recent decision, what a useful explanation would cite, how preferences change. Concepts: show the same sample answer with early/mixed/confirmed reflection labels; ask what each means before explaining. Wrap-up: “What would make you stop using this?” and “What would you want to delete?” No fabricated quotes and no leading “Do you like it?” prompts.

Counterbalance web/mobile task order to reduce learning effects. Observe first, ask retrospective questions afterward. Allow Stop/Skip at any point. Record screen/audio only with explicit participant permission; redact personal content in notes.

| Task | Success criterion | Measure / failure clue |
|---|---|---|
| Try preview, skip one question, revise one answer | Reflection reached without forced account; person knows what was skipped/revised | Unassisted completion, first wrong action, recovery, time; no inference from skipped content. |
| Explain a sample reflection and inspect its source | Correctly identifies answer and uncertainty, then changes/excludes it | Comprehension rubric: source, scope, uncertainty, control; aesthetic rating separately. |
| Change topic after a question, then stop | Finds both actions; no hidden Save on sheet cancel | Time/findability, accidental changes and reported pressure. |
| Compare unfamiliar “mining or cutting trees” | Supplies a setting/goal or chooses manual criteria; Nudge never silently assumes Minecraft | Missing-context detection; unsupported facts/winner count, task completion. |
| Save a decision, find journal, record outcome | Finds visible journal button and owner decision; saves explicit reflection | Completion and errors, not number of questions answered. |
| Simulated lost connection during save | Understands pending versus saved; recovers without duplicate | Correct status interpretation, retry behavior, duplicate records. |
| Find export, withdraw AI and explain delete | Can locate controls and distinguish consequences | Task completion, privacy misunderstanding, unnecessary sign-in barriers. |

**Short survey after each task:** ease 1–7; “What made this difficult?”; reflection fit 1–5 with “not enough information”; trust in evidence 1–5; perceived pressure 1–5; “What did Nudge actually learn?” free text. End with preferred return trigger and unwanted topics. Use distributions and observations for this small qualitative sample, not population significance.

**Metrics:** preview completion denominator includes starts and explicit skips; sign-up conversion includes only people shown Save; daily return has a stated cohort/window; perceived insight quality separates fit from understanding; correction/exclusion discovery and unsupported inference rates are safety metrics. Track “Finish for now” as a successful autonomous exit, not automatically a failure. Existing source metrics are opt-in `claim_succeeded`, `answer_submitted`, `reflection_feedback` with event names/times, not answer text. Other proposed research/funnel events require a reviewed, opt-in schema before implementation. No public-preview tracking added by this document.

Useful missing evidence: opt-in aggregate funnels, anonymized error counts/latency, voluntary feedback/support issues, prior usability notes, device mix and accessibility findings. No new permission stop is needed: continue building from source; add those sources only when actually available. Log observation (“could not find journal”) separately from interpretation (“label may be unclear”). Baselines and success improvements remain unknown until measured.

## Phase 5 — three design directions and decision

All directions preserve the existing Nudge mark and blue family. They differ in structure and the core moment, not three superficial accent swaps. Palette values appear here only as design references; components consume Phase 6 semantic tokens.

| Direction | Palette / type roles | Layout and signature | Critique |
|---|---|---|---|
| **A. Clear question — recommended** | Mist `#edf2f7`, Paper `#f9fbfd`, Ink `#253348`, Slate `#536479`, Nudge blue `#355db9`, Pale blue `#e1eaf4`. Sparse Bricolage Grotesque display from existing licensed assets; platform system body; platform tabular numerals for dates/counts. | One prompt with generous answer rows, then a compact evidence fold linking answer to reflection. Decisions use the same question/review rhythm. | Strongest fit for entry and thumb use. Must not hide the journal or make source evidence hard to reach. Distinct from generic equal-card dashboards; no cream/terracotta or decorative gradient. |
| **B. Field notes** | Paper `#f9fbfd`, Mist `#edf2f7`, Ink `#253348`, Slate `#536479`, Blue `#355db9`, Line `#becbda`. Small Bricolage section titles, system reading body, tabular date column. | A chronological notebook: question, answer and correction appear as dated blocks; today is the next writable line. Signature is an explicitly visible revision trail. | Best for returners and auditability, worse for first-run cognitive load. Avoid broadsheet hairline/zero-radius styling; retain readable rounded controls and a clear single task. |
| **C. Connections** | Mist `#edf2f7`, Paper `#f9fbfd`, Ink `#253348`, Blue `#355db9`, Pale blue `#e1eaf4`, Light blue `#a6bff0`. Bricolage relationship headings, system body, tabular evidence counts. | Pair “what you answered” with “where it applies”; source/decision scope is the structure. Signature is selecting a source and highlighting the specific reflection it supports. | Best explanation of differentiation, but weak early data can produce an empty or misleading map. No knowledge graph decoration, relationship strength scores or invented confidence. |

```text
A / Today                     A / About you
 Nudge           Topic & pace   About you (You tab)
 [current question]             [tentative reflection]
 [answer row                 ]   Based on [source answer >]
 [answer row                 ]   [Fits] [Needs context]
 [answer row                 ]   [Your answers            ]
 [Back]                 [Skip]   [Question preferences    ]
 secondary actions in Menu      source fold stays optional

B / Today                     B / About you
 Today                          Your notes
 date | [current question]      date | answered...
      | [answer rows     ]           | reflection...
      | tap answer -> next     date | corrected...
 [Open your journal         ]   [Search notes            ]

C / Today                     C / About you
 [question + answer rows    ]   [Your answer             ]
 tap answer -> next                       |
 [Where this may help      >]   [Reflection + scope      ]
                               [Used in this decision  >]
                               [Change what is used     ]
```

**Decision:** choose **A** now under the owner's approval to proceed. Borrow B's revision visibility in detail screens and C's explicit source/applicability explanation. Keep the signature small: opening a saved answer's evidence fold reveals exactly what changed in a reflection; it never claims to reveal a hidden personality. Before finishing a screen remove any second motivational subtitle, decorative badge or duplicate progress element. This is a design recommendation, not a participant-tested winner.

## Phase 6 — color and component system

The color-expert skill was used for reference -> semantic -> component mapping and independent theme checks. **Only the light theme is active in 0.3.** Dark mappings and their independent contrast calculations below are future-system references, not a shipped theme switch or a dark-mode acceptance claim. Preserve the exact sRGB palette; the OKLCH values below are calculated from those values, not a recoloring. Use OKLCH for future constrained adjustments and convert to in-gamut sRGB for React Native. These anchors are not a uniformly spaced quantitative ramp and must not be used as one.

| Reference | sRGB | OKLCH, rounded |
|---|---|---|
| mist | `#edf2f7` | `95.88% 0.0086 247.92` |
| paper | `#f9fbfd` | `98.71% 0.0034 247.86` |
| paleBlue | `#e1eaf4` | `93.32% 0.0166 250.85` |
| ink | `#253348` | `31.85% 0.0422 258.30` |
| slate | `#536479` | `49.72% 0.0396 253.91` |
| line | `#becbda` | `83.68% 0.0254 251.93` |
| blue | `#355db9` | `50.06% 0.1524 264.02` |
| night | `#152234` | `24.95% 0.0390 256.69` |
| deep | `#203147` | `30.92% 0.0458 255.25` |
| deepBlue | `#283c54` | `35.06% 0.0494 253.57` |
| bright | `#e9eef5` | `94.73% 0.0108 256.70` |
| soft | `#bac9db` | `83.01% 0.0301 252.97` |
| darkLine | `#4a5e76` | `47.52% 0.0461 253.30` |
| lightBlue | `#a6bff0` | `80.31% 0.0750 263.65` |
| white | `#ffffff` | `100% 0 0` (achromatic hue undefined) |

| Semantic token | Light reference | Dark reference | Component use |
|---|---|---|---|
| `surface` | mist | night | Screen |
| `card` | paper | deep | Question/detail surface |
| `text` | ink | bright | All primary text |
| `muted` | slate | soft | Secondary text, still normal-text contrast |
| `accent` | blue | lightBlue | Primary action, selected glyph, focus indicator |
| `onAccent` | paper | night | Text/icons on filled action |
| `selection`, `pressed` | paleBlue | deepBlue | Selected/pressed row with checkmark |
| `line` | line | darkLine | Decorative separator only |
| `controlLine` | slate | soft | Input/button outline, required boundary |
| `scrim` | black at 50% | black at 50% | Modal backdrop, not text background |
| proposed `success.text`, `warning.text`, `danger.text` | `text` | `text` | Named state labels + appropriate icon; no unverified red/green palette introduced |
| proposed `success.surface`, `warning.surface`, `danger.surface` | `card` | `card` | Status callout with explicit heading; destructive action label and confirmation distinguish its consequence |

The last two rows are semantic requirements, not claims that those keys already exist in `theme.ts`. Severity must work without hue. If future status colors are added, calculate all text/icon/border pairs again. Chart differences use labels, patterns/markers and text summaries, not blue shades alone. CVD simulation/grayscale review is still unverified.

### Calculated contrast

Computed using WCAG sRGB linearization, relative luminance and `(lighter + .05)/(darker + .05)` from the exact source values. Rounding is for display only. This is mathematical palette verification, not a rendered-app accessibility certification. All enabled normal text pairs below exceed 4.5:1, including secondary text; we do not relax small secondary text to 3:1.

| Foreground / background | Light ratio | Dark ratio |
|---|---:|---:|
| `text` / `surface` | 11.33 | 13.75 |
| `text` / `card` | 12.30 | 11.32 |
| `muted` / `surface` | 5.38 | 9.51 |
| `muted` / `card` | 5.84 | 7.83 |
| `accent` / `surface` | 5.46 | 8.65 |
| `accent` / `card` | 5.92 | 7.12 |
| `onAccent` / `accent` | 5.92 | 8.65 |
| `text` / `selection` | 10.50 | 9.66 |
| `muted` / `selection` | 4.98 | 6.69 |
| `controlLine` / `surface` | 5.38 | 9.51 |
| `controlLine` / `card` | 5.84 | 7.83 |

Decorative `line` / `surface` is only 1.46 light and 2.41 dark; it must not be the sole way to identify a control or meaningful graphic. Use `controlLine` for those boundaries. Current opacity-based pressed/disabled styles need rendered compositing review; do not claim their contrast from the opaque table. Prefer an opaque `pressed` fill for enabled controls; disabled controls retain a reason and disabled state. A focused outline uses `accent` with space from the boundary; errors also have text and focus guidance.

### Other tokens and primitives

| Group | Tokens / behavior |
|---|---|
| Type | Body 16/25, action 16/24 semibold, title 22/32 semibold, hero 30/40 bold; utility/tab 13/20 only where genuinely secondary. Sparse display face proposed; current native system-font implementation remains acceptable until asset/licensing/loading check. System font scaling enabled, no restrictive max multiplier. |
| Spacing | 4, 8, 16, 24, 32, 48; page gutter 16, section gap 24, action gap at least 8. Use logical start/end padding. |
| Radius | Small 12, card 24, pill 999. Pill only for short compact filters/status, never long answer text. |
| Size | Android target at least 48 x 48dp; future iOS at least 44pt. Icons 20 for inline/24 for main actions within full targets; single outlined icon family, consistent 2-unit stroke. No emoji as structure. |
| Width | Current readable max width 560; wide screens center one task. Tablet list/detail may split only when each pane remains readable. No phone form expanded across tablet width. |
| Elevation | Surfaces usually border/spacing rather than shadow; modal uses platform elevation and scrim. Do not encode a control's only boundary as a faint shadow. |
| Motion | Press 100ms, micro 180ms, screen 280ms entrance / 196ms exit, sheet 320ms / 224ms. Ease-out `(0.2,0,0,1)`, ease-in `(0.4,0,1,1)`; gestures track input. Reduced motion: no translation/scale, at most 90ms opacity or immediate update. Values are targets, not measured implementation. |

| Component contract | Variants / states and accessibility |
|---|---|
| `Action` | Primary, secondary, destructive-labeled; default/pressed/focused/disabled/loading/error. Stable size; visible name, button role, disabled/busy state. Never disable without nearby reason when nonobvious. |
| `ChoiceRow` | Single/multi/neutral; full row target; selection checkmark plus accessible checked/selected state. Long answer wraps; no forced ellipsis. |
| `Field` / `CriteriaRow` | Visible label, help, value, error, required state; keyboard appropriate to input. Unknown is an explicit value, not zero. |
| `TopBar` / `NativeTabs` | Labeled Back/Close, current heading; five stable destinations with selected state. Allow taller wrapping labels at large text; safe areas. |
| `Sheet` / `TopicSheet` / `ActionSheet` | Heading, Close, scrollable content and visible Apply; focus containment and return. Android Back dismisses. Drag is optional convenience. |
| `Dialog` | Consequence heading, explicit destructive label, Cancel; focus begins at heading/cancel where appropriate. No swipe to confirm deletion. |
| `Status` / `Toast` | Saved/pending/error with semantic label; announce without stealing focus. Persistent inline recovery for important failures; toast is never sole error surface. |
| `Skeleton` / `EmptyState` | Skeleton mirrors layout, hidden from screen reader; static under reduced motion. Empty state has relevant action and no invented data. |
| `PaginatedList` / `RefreshControl` | Stable keys, virtualized rows, load-more/retry; accessible manual refresh alternative. Restore reading position on return. |
| `SwipeActions` | Optional, secondary actions only with visible menu alternatives; no swipe-only delete. Resolve horizontal gesture versus system Back. |
| `EvidenceFold` | Button exposes expanded state; source count and scope remain readable; open content follows trigger in focus order. Signature, not decorative animation. |

## Phase 7 — screen and copy specifications

Use `Screen > TopBar > Scroll/list > current primary action > safe-area tabs`. The action belongs after relevant fields; on short forms it sits in the lower reachable area, on long forms it follows scrolling content. Sheet actions remain reachable above the keyboard. Except a bounded callback loader, content loading uses shape-matched static skeletons rather than replacing the page with a spinner. No unsupported success screen.

Notation below: E=empty; L=loading; X=error; O=offline; W=long content/large text. All account views additionally handle expired session and generation/revision conflict using Phase 2. Copy is proposed unless explicitly matching existing action terminology.

| Screen / purpose and compact wireframe | Primary action / real copy | Complete state behavior |
|---|---|---|
| Launch / `mark / first question` | Opens directly into preview while signed out; no entry CTA or sign-in control | E: first question; L: draft/auth initialization skeleton; X: restore/load recovery; O: local preview; W: question/answer rows wrap, no hero art or introductory slogan taking the first screen. |
| Preview / `question 2 of 6 / prompt / answer rows / Back / Skip` | Option/neutral/Skip tap persists locally and advances; Back revisits/corrects | E: choose, neutral or Skip; L: disable duplicate taps while persisting; X: preserve current screen and explain local-save failure; O: continue locally; W: full answer text and scroll rather than clipping. No redundant Continue. |
| Preview reflection / `reflection / source answers / Save my answers / Review my answers` | `Save my answers`; `Based on your answers so far` only if evidence exists | E: `Not enough answers for a reflection yet` + review; L: local derivation; X: source unavailable -> answer review; O: local result, no account-save claim; W: sources expand below heading. |
| Sign in after preview / `reflections / review answers / Save with Google` | `Save with Google`, only after six responses; existing session goes directly to account | E: six responses required, including Skip; L: `Opening Google…`; X: sign-in error with Retry; O: reconnect to sign in; W: scroll to real actions. Cancel returns to preview. Native email/recovery is deferred. |
| Auth callback / `Signing in / Cancel` | Finish only after verified identity | E: invalid link -> `This sign-in link isn't valid`; L: bounded genuine state; X: retry sign-in; O: reconnect, no token output; W: short text. Never display credentials in URL/error. |
| Consent / `What changes / terms links / separate AI choice / Continue` | `Continue`; optional AI switch off | E: current versions; L: skeleton; X: reload current terms; O: read cached copy but don't acknowledge stale version; W: reading scroll, actions separate from text. |
| Save preview review / `account identity / six answers / changes / Save reviewed answers` | `Save reviewed answers` | E: no draft -> Today; L: pending; X: exact-retry/conflict flow; O: preserve local draft and Retry; W: each answer fully inspectable. No automatic claim. |
| Today / `Today / Topic & pace / question / answers / Back / Skip` | Option/neutral/scale tap saves to account and advances; ranking/writing uses `Save answer` | E: open today's question; L: question skeleton and pending selection; X: exact-intent retry/reload; O: no claimed server save; W: full question/answers, no fixed-height card. Secondary destinations use compact menus/native tabs rather than three persistent shortcuts. |
| Session pause / `saved state / explicit more / choose topic / reflections` | Person chooses; no automatic answer/save or forced continuation at a pause | E: exhausted -> topic/preferences; L: next reservation only after action; X: Retry without duplicate answer; O: exit remains usable; W: wrap real action labels. |
| Topic / `Topic & pace / topics / pace / Cancel / Apply` | `Apply` commits once | E: no eligible topics -> preferences; L: disable Apply while saving; X: selected draft kept; O: explain cannot change server selection; W: sheet scroll/full-screen at large text. Cancel preserves current topic. |
| About you (`You` tab) / `one reflection / Previous-Next / source answers / answers-preferences controls` | `See source answers`; secondary tasks use their relevant compact controls | E: no reflection yet + Try a question; L: reflection skeleton; X: Retry; O: labeled last verified state; W: text wraps, no trait chart or cut-off. One reflection page avoids an initial wall of cards. |
| Reflection evidence / `scope + early/mixed state / source answers / feedback / correction` | `View answer`; feedback `Fits`, `Needs context`, `Doesn't fit` | E: no applicable source -> explain, no confidence; L: source skeleton; X: safe refresh; O: edits unavailable with preserved draft; W: every source separately focusable. Status doesn't imply diagnosis. |
| Answer detail/edit / `question + answer / Use in my profile / Edit / Delete` | `Save answer`; delete separately confirmed | E: deleted/missing -> back to answers; L: pending exact intent; X: revision conflict -> latest + review; O: keep edit, mark not saved; W: multiline editor and keyboard-safe actions. |
| Question preferences / `depth / topics / written / optional / metrics / Save` | `Save question preferences` | E: defaults visible; L: disabled pending; X: keep unsaved selection + Retry; O: draft only; W: full labels, no dense chip grid. Unavailable option says why. |
| Decide options / `What are you deciding between? / option fields / Add option / Continue` | `Continue`; secondary optional `Help me phrase this` | E: `Add at least two options`; L: draft action pending only; X: inline duplicate/limit errors; O: form drafting works, compare needs connection; W: keyboard scroll, focus Add option result. |
| Decide context/criteria / `setting / goal / meanings needed / mode / criteria` | `Review comparison`; `What does this mean here?` | E: missing meanings prompt once; L: optional AI clearly pending; X: unavailable AI -> manual fields; O: preserve draft; W: one open detail at a time, no guessing. Unknown/range/source remain inspectable. |
| Review/result / `confirmed options / criteria + sources / Compare / result + limitations` | `Compare` then `Choose this` only if supported; secondary `Add details` | E: insufficient evidence -> `Add details to compare these options`; L: honest pending; X: exact stable-ID recovery; O: no fake winner; W: stacked alternatives, strengths and unknowns, no wide table. |
| Journal / `Search / Filters / decision rows / Load more` | `New comparison`; row opens detail | E: `No decisions yet` + Compare options; filtered E: `No matches` + Clear filters; L: list skeleton; X: preserve loaded rows + Retry; O: last verified rows or offline empty; W: virtualized full-height rows, stable position. |
| Decision detail / `options / choice + reasons / outcome / reminder / actions` | `Record an outcome` or `Choose an option` by state | E: inaccessible/missing -> journal; L: detail skeleton; X: refresh/retry; O: read-only state; W: sections expanded by labeled controls. Copy, refresh and add-option state use actual observed revision. |
| Outcome/reminder / `reflection fields / local date+time+zone / Save or Cancel` | `Save reflection` / `Save reminder` | E: optional answers stay blank, not zero; L: pending; X: inline date/time/ownership error; O: draft remains not saved; W: native picker plus accessible editable alternative as needed. Reminder explicitly distinguishes in-app record from native delivery. |
| Check-ins / `unread count / linked decision rows / mark read / dismiss` | `Open decision`; secondary `Mark all read` | E: `No check-ins`; L: rows skeleton; X: Retry; O: read-only; W: separate controls with distinct names. No promise a phone push arrived. |
| Tools index / `Earlier checks / Earlier learning / Saved memories / Decision patterns / Circles` | Each full-width navigation button | E: show valid destinations, not empty pretend cards; L: only destination fetch; X/O: per feature; W: vertical buttons, no compressed dashboard. Deferred recap/note extraction has unavailable explanation, no enabled success action. |
| Earlier checks / `statement + context / Still true / Not anymore / Forget` | Explicit response | E: `Nothing to check right now`; L: stable statement; X: refresh generation; O: no mutation; W: statement/context full text. No inferred opposite on rejection. |
| Earlier learning/memories / `Search / rows / evidence / edit / forget` | `Save correction` or `Delete memory` | E: `No saved memories`; L: list/detail skeleton; X: uncertain mutation -> refresh; O: preserve allowed draft; W: virtualized rows, long belief text in detail. Legacy and current discovery sources labeled separately. |
| Decision patterns / `sample + period / labeled summary / rows/chart` | `Open related decisions` | E: `Not enough recorded outcomes yet`; L: summary skeleton; X: Retry; O: last verified counts labeled; W: text alternative to every chart, no false zero or causal claim. |
| Circles / `list / Create circle / Join with code` | `Create circle` / `Review invite` | E: `No circles yet`; L: rows skeleton; X: uncertain create -> reload first; O: no join/create queued; W: long name wraps, members separate detail. |
| Circle/poll / `members / active poll / choices / own vote / counts / actions` | `Save vote`; owner-only `Close poll` | E: no polls/no votes/tie explicitly named; L: pending vote; X: refresh role/latest poll; O: last verified counts; W: choices full text, menus not hover. No private journal attached. |
| Account / `Profile / Check-ins / AI and privacy / Your data / App and information / Sign out` | Named navigation buttons, no competing hero | E: defaults visible; L: profile skeleton; X: Retry; O: policy reading/Sign out remain reachable; W: full labels, no tiny footer link wall. |
| Profile/AI/data / `current value / consequence / explicit action` | `Save profile`, `Withdraw AI permission`, `Export my data` | E: missing profile fields optional; L: operation-specific; X: fix/retry; O: no destructive queued intent; W: plain consequence list, separate actions. |
| Reset/history/account delete / `what is removed / what remains / Cancel / explicit confirm` | `Reset learning`, `Delete decision history`, `Delete account` | E: already removed -> verified state; L: lock repeated submit; X: recent-auth required -> Sign in again, preserve no auto-delete; O: cannot confirm; W: readable full consequences. |
| Policies/support/licenses / `heading / readable document / contact action` | `Open support` / explicit external link | E: document unavailable -> Retry; L: skeleton; X: keep context; O: available cached version labeled; W: selectable/wrapping text, link purpose announced. |

Written distress/crisis content must follow the server's support response; a rejected answer is not saved. UI copy should say `This answer wasn't saved` and offer support/options to stop, without diagnosis, guilt or a pretend human monitoring claim. If country-specific crisis resources are added, use a vetted lookup and verify availability; do not invent numbers or claim a lookup is currently configured. Nudge is not emergency support.

## Phase 8 — interaction, motion and haptics

These are implementation targets, not measured timing, installed behavior or 60fps proof. Transform/opacity only; never animate layout width/height/top/left. Immediate selection/pending UI is allowed, but authoritative `Saved` waits for server confirmation. No decorative duration over 500ms. Unnecessary list entrance animation is removed; when a real insertion needs continuity, only the first six items may stagger 30ms and reduced motion removes it.

| Element / trigger | Motion, duration, easing | Haptic | Reduced motion / fallback |
|---|---|---|---|
| Button press | Opaque pressed surface or opacity feedback within 100ms; release 150ms; no surrounding shift | Light impact only on meaningful main action, not every tap | Immediate color/state; no scale |
| Choose answer | Checkmark/state immediately; 180ms opacity transition | Optional single selection tick | Immediate checkmark with selected announcement |
| Tap-save answer / explicit ranking-text Save | Pending state appears immediately; advance only after required persistence succeeds; 180ms state crossfade target | One success pattern after confirmed completion | Immediate text/state, polite status announcement |
| Stack push/pop | Translate/opacity 280ms ease-out / 196ms ease-in with origin continuity | None | 90ms fade or none |
| Tab switch | Immediate destination; no full-screen lateral carousel | None | Same |
| Bottom sheet open/close/drag | Bottom translation 320ms / 224ms; drag tracks finger; snap uses native spring without oversized bounce | None | 90ms fade; visible Close and Android Back always work |
| Pull to refresh | Native refresh indicator; content stays in place; actual network completion controls end | None | Accessible `Refresh` button; status announcement |
| List swipe | At most one horizontal action region; transform follows gesture, snap about 180ms | Optional tick at action reveal, never a destructive commit | Visible action menu; swipe never sole access |
| Ranking | Move row by accessible Up/Down; optional drag handle owns gesture | Optional selection tick after completed move | Instant order change; announce new position |
| Skeleton to content | 150ms opacity; no flashing or endless shimmer | None | Static skeleton -> immediate content |
| Success | Inline `Saved` + relevant context; 180ms fade; do not jump away before readable | One success haptic if enabled | Text announcement without focus theft |
| Error | Immediate inline explanation + fix; no shake, red flash or clearing form | None by default | Same; focus first invalid field only on failed submit |
| Toast in/out | 180ms entrance / 126ms exit opacity; nonessential confirmation only | None | Immediate or 90ms fade; important errors stay inline |
| Evidence fold, signature | Expand logically in document flow; only content opacity 180ms, no animated height; highlight exact source label | None | Immediate expanded state; source remains accessible |
| Filter/preset apply | Retain scroll, update labeled pending/selection state; 180ms fade after confirmed data | Optional selection tick | Immediate update, result-count status |
| Delete confirmation | No celebratory motion; remove only after confirmed server result | None | Return to meaningful parent focus with announced result |
| Share/system authentication | Use platform UI; never fake its loading/success | Platform-managed only | Platform-managed |

Gestures: vertical list scroll owns the content; a row's dedicated handle owns ranking; horizontal swipe never begins from the system Back edge. A sheet drag handle cannot steal a nested list's scroll. All gestures have visible button alternatives. Hardware Back never silently commits a draft. Reduced motion reads the system setting and updates at runtime; haptic preference is independent of motion.

## Phase 9 — critique and accessibility audit

**First impression:** Today should offer an actual question immediately. An additional motivational subtitle weakens the hierarchy. **Usability:** source answer and correction must be at most a clear labeled step from a reflection. **Consistency:** preserve Today/About you/Decide/Tools/Account and the same action names. **What works in read source:** centralized light/dark theme, minimum target primitive, selected state, separate topic Apply, source-aware discovery and bounded APIs. **What remains uncertain:** actual installed coverage, first-run clarity, largest font layout, gesture/focus behavior and request latency.

Priority fixes: (1) complete real native routes and truthful unsupported/pending states before polish; (2) verify small/landscape/large-text/screen-reader flows on the rebuilt APK; (3) verify that a person can explain an insight's source and limits, rather than merely rating its appearance. No “everything works perfectly” claim follows from static source review.

| Accessibility area | Evidence now | Required check / status |
|---|---|---|
| Perceivable: text contrast | Exact enabled palette pairs calculated in Phase 6, light/dark independently | Pass for those opaque pairs; pressed/disabled compositing and rendered screens unverified. |
| Perceivable: color meaning | Proposed checkmarks, status text and chart text alternatives | Runtime implementation/CVD simulation unverified. |
| Perceivable: scale/orientation | Source uses flexible native layouts; document forbids font shrinking/caps | Test largest Android font/display size, bold/high contrast where supported, 320/375/large phone/tablet landscape. Unverified. |
| Operable: targets/gaps | Action primitive minimum 48dp read; requirement gap at least 8dp | Audit all nested controls/tab gaps, sheet Close, remove-option, sliders and ranking. Unverified geometry. |
| Operable: keyboard/focus/Back | Topic modal `onRequestClose`/Close read; installed session Back correction preserves answer count and advances revision/generation. Separate API 36 emulator release-APK check records visible offline correction failure and successful retry closing/advancing | TalkBack focus containment/return, keyboard avoidance and switch control remain unverified. Hardware Back closes the revisited editor; Today root normally exits. Exact final-artifact and nested-screen status belongs in VERIFICATION. |
| Operable: gesture alternatives | Required in Phase 8 | Swipe/reorder/pull-to-refresh alternatives must be verified in built screens. |
| Understandable: errors and certainty | Proposed field-specific recovery, unknowns and source limits | Inject timeout, conflict, expired session and unsupported AI; observe correct status. Unverified device flow. |
| Robust: semantics/status | Primitive button and selected state read | Actual TalkBack output may vary; test expected table below. No certification asserted. |
| Privacy: stale intents | Source contracts pin account/generation/revision; legacy RPC caveats documented | Concurrent reset/account-switch/ambiguous-save tests plus hosted route verification remain required. |

WCAG 2.1 AA is used as an audit framework, supplemented by Android guidance; a native app is not certified solely by applying web criteria. Android guidance informs the target/name/contrast requirements; W3C guidance informs announcing important status without unnecessary focus changes. No screen reader run was performed by this design task.

| Element | Expected screen-reader semantics, not a recorded announcement |
|---|---|
| Today heading | Heading, “Today”; don't read decorative logo twice |
| Choice row | Full answer text, radio/checkbox-like role and checked state; grouping includes question |
| Answer action / ranking-text Save | Full answer text with selected/busy state; explicit “Save answer, button” for ranking/writing; no assumed Continue after a single choice |
| Tab | “About you, tab, selected” plus position if supported; visible shortened label is `You` |
| Topic trigger | “Topic & pace, button”; opened sheet heading focused, focus returns on close |
| Evidence fold | “View supporting answers, button, collapsed/expanded” |
| Question preferences switch | Visible label + switch state; unavailable reason follows |
| Scale/ranking | Label, value or position and adjustable actions; not an unlabeled gesture surface |
| Journal row | Decision label, status and date; distinct `More actions for [decision]` button |
| Saved/error status | Polite “Answer saved”; submit error announced once, not a repeated live-region loop |
| Delete dialog | Consequence heading, Cancel, explicit destructive action; modal context |
| Decorative skeleton/icon | Hidden from accessibility; no meaningless announcements |

Re-check gates: inspect contrast after any palette/opacity change; run target overlay and scanner; test TalkBack with real content; run large-text/landscape screenshot review; repeat failure recovery after route changes. Record actual device/build and outcome in verification docs rather than changing “unverified” here without evidence.

## Phase 10 — developer handoff

### Common layout, responsiveness and state contracts

Use `surface`, `card`, `text`, `muted`, `accent`, `onAccent`, `controlLine`, `selection`, named spacing/radius/type/motion tokens. Raw color values belong only in references. Respect top/bottom safe areas; fixed navigation adds its own inset once, not twice. Body text and buttons wrap. Missing decorative assets fall back to textual Nudge; never leave a broken image blocking work.

| Viewport / content edge case | Required response |
|---|---|
| Small phone, including 320dp and 375 width | Single column, 16dp gutter, minimum targets, 8dp target separation; no horizontal form scroll. Five tabs retain readable labels and may grow; if system sizing cannot fit, use a reviewed adaptive navigation layout rather than clip or shrink labels. |
| Large phone | Same content max width; no gratuitous second column or far-corner action. |
| Tablet portrait/landscape | Center one question/form at readable width; optionally use list/detail for journal/circles when panes meet minimum readable width. Tabs remain stable. |
| Landscape phone / keyboard | Scroll to focused field; action after fields stays reachable, navigation cannot cover fields. Avoid a fixed full-height card. |
| Largest text/bold/high contrast | Grow rows/bars, wrap labels, preserve full wording, no max font multiplier. Verify platform high-contrast/bold support rather than infer it from font scaling. |
| Long names/options/scripts | Full text in detail, meaningful preview truncation only in list with accessible full label; support Unicode, combining marks and line breaks without corrupting validation. |
| Hundreds of answers/decisions/memories | Virtualized stable-key list, bounded API pagination, debounced search, preserve loaded data and position after retry. No loading every owner record on tab mount. |
| RTL | Logical start/end; mirror directional navigation icons only, not logo/checkmarks/numbers indiscriminately; locale-aware date/time/number formatting; test actual RTL, not CSS inference. |
| Time zones/DST | Store canonical server contract, display chosen profile zone and local date; invalid/nonexistent times need correction, not silent shift. Test reminder changes across DST. |
| No evidence/ties/unknowns | Explicit empty/tie/insufficient evidence copy; no winner manufactured and no default numeric zero. |

### Screen-to-component/API/event map

The following endpoint names are source contracts, not proof of a deployed route. Discovery responses are plain contracts; decisions/account/tools use their validated native client contracts. Do not force them through one guessed envelope. Do not add a generic PATCH/DELETE decision call where none exists.

Existing opt-in server metric names are `claim_succeeded`, `answer_submitted`, `reflection_feedback`; preserve them and do not send duplicate native events. All other rows say **none** unless a later reviewed analytics contract is added. UI content, question answers, decision text, invite codes and tokens never become telemetry payloads.

| Screen group | Components / required props | Data/action contract | Existing metric |
|---|---|---|---|
| Preview/reflection | `PreviewQuestion(question, response, onChange, onSkip, onBack)`, `EvidenceFold(sources, expanded)` | Local validated catalog/draft; edition/expiry; option tap commits/advances; no pre-preview entry/auth screen or AI request | None |
| Authentication/consent | `AuthActions(pending,error)`, `ConsentPanel(versions,aiChoice)` | Supabase system auth callback; current consent route; exact account identity | None |
| Save preview | `ClaimReview(answers,account,generation,pending)` | POST `/api/v1/discovery/claim`, max six, stable request/body/generation | `claim_succeeded` when enabled, server only |
| Today/topic | `QuestionPanel(question,format,value,pending)`, `TopicSheet(topic,mode,onApply,onCancel)` | GET `/api/v1/discovery/profile`; POST `/next` reserves only; POST `/answers` saves reserved answer | `answer_submitted` when enabled, server only |
| About you/evidence/answers | `ReflectionList`, `EvidenceFold`, `AnswerEditor(answer,expectedRevision,useInProfile)` | GET profile; POST `/api/v1/discovery/insights/feedback`; PATCH/DELETE `/answers/:id` with generation/revision/request ID | `reflection_feedback` when enabled, server only |
| Preferences | `PreferencesForm(settings,capabilities,dirty)` | POST `/api/v1/discovery/settings`; never enable capability from client alone | None |
| Decide options/context | `OptionEditor(options,limits)`, `MeaningFields(domain,goal,meanings)`, `CriteriaEditor(unknowns,sources)` | Existing validated comparison client/service; optional suggestions are drafts, not automatic writes. POST discovery `/suggestions` only for its supported suggestion contract | None |
| Review/result/detail | `ComparisonReview`, `ResultReasons`, `DecisionActions(revision)` | POST `/api/v1/decisions` confirmed stable creation ID; GET `/:id`; POST `/:id/comparison`, `choice` with observed state | None |
| Journal/outcome/reminder | `PaginatedList`, `JournalFilters`, `ReflectionForm`, `ReminderForm(zone)` | GET decisions bounded query; POST `/:id/reflection`, `/:id/reminder`; no invented generic deletion/edit endpoint | None |
| Account/profile/AI/terms | `AccountSections`, `ProfileForm`, `ConsentPanel` | `/api/v1/account/*` profile, basics, timezone, ai, terms; terms gate ordinary writes but owner data/deletion stay accessible | None |
| Check-ins | `CheckinRow(decisionId,read,dismissible)` | Account check-ins and `checkins/:id|all` actions; browser push endpoint is not native registration | None |
| Export/reset/delete | `ConsequenceDialog(kind,pending)`, `ExportAction` | Account export/reset/history/delete; same captured bearer + recent AMR required for delete | None |
| Earlier checks/learning/memories | `EarlierCheck`, `BeliefDetail(evidence)`, `MemoryEditor(expectedGeneration)` | `/api/v1/tools/*` validated earlier-check/pattern, beliefs/evidence and memories routes; legacy generation preflight is not atomic CAS | None |
| Decision patterns | `OutcomeSummary(sample,window,missing)` and text chart alternative | Tools bounded outcomes; optional recap remains unavailable until actual native route | None |
| Circles/poll/member/invite | `CircleList`, `MemberList(role)`, `PollChoices(ownVote,closed)`, `InviteShare` | Tools circles/detail, create/join/manage, poll/vote/close; role server-enforced; uncertain creates reload first | None |
| Policies/support/licenses | `InformationDocument(version)`, `ExternalAction(url,label)` | Existing policy documents/approved support address; no invented operator/retention values | None |

### Mutation and focus acceptance

```text
User edits -> local dirty draft
User confirms -> pin userId + generation + revision + stable intent ID/body
  confirmed save -> mark Saved -> refresh -> next dependent action
  save confirmed / refresh failed -> Saved + refresh needed; dependent writes blocked
  network ambiguity -> retain exact intent; check/retry only as contract allows
  auth/account/generation/revision change -> refresh and renewed review, never rebase
  server validation/support response -> inline explanation; preserve safe draft or stop
```

Focus order is heading -> explanatory context -> fields/choices -> relevant error -> primary/secondary actions -> tab bar. Submitting errors brings focus to the first invalid field or error summary; loading/success status announces without moving focus. Closing a sheet/dialog restores its trigger. New page focus goes to its heading; returning to a paginated list restores its meaningful row. Decorative components never add focus stops. Labels distinguish repeated remove/edit buttons using the associated option/decision text.

**Implementation sequence:** semantic tokens and primitive gallery -> public preview/auth -> Today/About you/edit/preferences -> Decide/journal/outcomes -> Account/data safety -> Tools/circles -> fault/device/accessibility review -> rebuilt APK evidence. Existing source already implements parts of this; build on it, do not scaffold a second product. Prior delivered APKs and current source are different evidence until a new build is installed and exercised.

**Completion boundary:** Phases 2–10 have concrete design deliverables and autonomous choices. Current 0.3 source now implements the core native discovery, decision/journal, account and supporting-tools surfaces. Real hosted account/settings/foundation/tools checks passed with two disposable accounts, both deleted with absence verified. A standalone 0.3 APK runs without Metro; installed Back correction, an insufficient-evidence Mining/Trees comparison and offline-correction exact-retry recovery have specific API 36 emulator evidence. That does not validate every proposal, Google browser return, physical-device accessibility/performance or store readiness. Current port gaps include native category filtering/abandonment, arbitrary local reminder time and the separate web timelines; they are not completed by showing related status/summary data. See PARITY for per-feature boundaries and VERIFICATION for final APK hash, installed screenshots and final retry/Back regressions. No fake data or screenshot substitutes a successful end-to-end action.
