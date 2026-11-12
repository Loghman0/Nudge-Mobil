# Native design evidence

The phase boards are design/specification images. They are not screenshots or usability results. The latest owner instruction makes the app light-only with save-on-tap and Back, even where earlier boards discuss future dark tokens or Continue.

| Phase | Image |
|---|---|
| 2 — Adaptation | [Board](phase-02-board.png) |
| 3 — Psychology/research | [Board](phase-03-board.png) |
| 4 — Research plan | [Board](phase-04-board.png) |
| 5 — Design directions | [Board](phase-05-board.png) |
| 6 — Tokens and contrast | [Board](phase-06-board.png) |
| 7 — Screens and copy | [Board](phase-07-board.png) |
| 8 — Interaction | [Board](phase-08-board.png) |
| 9 — Audit | [Board](phase-09-board.png) |
| 10 — Handoff | [Board](phase-10-board.png) |

Actual app captures are in [evidence](evidence). Earlier captures may show designs that later captures replace. In particular, `preview-375-question-*` initially verified fitting all seven choices at 375dp with manual Continue; the final tap-to-save captures supersede that interaction. Read `../docs/VERIFICATION.md` for the exact build and limits of each check.

## Current 0.5 actual Android captures

Current APK hash begins `15754dca`. [Mood and reviewed priorities](current-preview-0.5.png) composes two real release captures. The daily popup/Skip was exercised in the debug shell; same-day non-repetition and the saved unknown-value review were observed after release upgrade. See VERIFICATION.md for limits.

## Earlier 0.4 actual Android captures

The current 0.4 test APK SHA-256 starts `7c9a0355`. [Current overview](current-preview-0.4.png) composes four real final-APK captures without changing their UI; originals remain in evidence. See `../docs/VERIFICATION.md` for each exact build/test boundary.

| Capture | Current 0.4 evidence |
|---|---|
| [Six-response result](evidence/preview-04-results.png), [first question](evidence/preview-04-question-1.png) | Final APK: offline tap-save/advance, Back/restart correction and Google only after six responses. |
| [Journal filters](evidence/release-04-filters.png), [large text](evidence/release-04-filters-text-200.png) | Staged category selection; fixed Clear/Apply footer remains reachable at 200% text. |
| [Set aside](evidence/release-04-aside-saved.png) | Final APK: cancellation preserved the open decision, then confirmation saved Set aside. |
| [Custom check-in](evidence/release-04-custom-staged.png), [large text](evidence/release-04-checkin-text-200.png) | Android date/time selection and explicit Save; server timestamp/revision verified separately. |
| [Decision activity](evidence/release-04-activity.png), [preference timeline](evidence/release-04-preferences.png) | Final APK: bounded periods, paging, sources and timestamps. Synthetic disposable account only. |
| [Google at large text](evidence/release-04-google-text-200.png) | Full provider label wraps after scrolling; Chrome first-run cancellation returns to Nudge. No real Google return proof. |

## Earlier 0.3 evidence

The earlier test APK SHA-256 starts `a2050609`. [Earlier preview overview](current-preview.png) remains preserved with its original captures.

| Capture | Evidence |
|---|---|
| [Question one](evidence/preview-tap-question-1.png), [six-response result](evidence/preview-tap-results.png) | Final APK: direct tap save, offline completion, Back/restart correction and sign-in after six responses. |
| [Large text](evidence/preview-text-200.png), [landscape](evidence/preview-landscape.png), [tablet-sized view](evidence/preview-tablet.png) | Final APK: tested reachability/scaling configurations, not physical-device acceptance. |
| [About you](evidence/about-you-skills-final.png), [large-text navigation](evidence/about-you-text-200.png) | Earlier b56a authenticated checkpoint; source question and quoted answer, responsive navigation. Final change only adjusts large-text action padding. |
| [Comparison recovery](evidence/comparison-recovery-action.png), [refreshed comparison](evidence/comparison-final.png) | b56a authenticated checkpoint: direct refresh recovered to insufficient history, without inventing a winner. |

Use the verification report for exact hash/test boundaries. No phase board is presented as a screenshot.
