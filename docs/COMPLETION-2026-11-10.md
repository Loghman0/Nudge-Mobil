# Mobile v1 completion estimate — 10 November 2026

**Planning estimate: about 75% complete, with about 25% remaining.** Core feature implementation is closer to 95%; that is different from a complete, validated mobile release. This is engineering judgment based on the current parity and verification records, not a measured progress counter, percentage of files, time estimate or promise of an error-free app. The increase reflects implemented push plus real installed release delivery, process-death tap routing and opt-out evidence; physical-phone and store acceptance remain open.

| Work category | Weight in full v1 | Estimated category completion | Contribution |
|---|---:|---:|---:|
| Feature implementation | 65% | 95% | 61.75 percentage points |
| Integration, device and accessibility acceptance | 25% | 50% | 12.5 percentage points |
| Distribution and release preparation | 10% | 10% | 1 percentage point |
| Total | 100% | | **75.25%, rounded to about 75%** |

The owner-chosen deferral of public email signup is excluded. Completing an additional feature does not automatically finish its device, privacy, failure-recovery or store checks.

## What is implemented

The independent native app includes the six-question offline preview, explicit account save, Today/discovery, evidence-linked reflections and corrections, comparison criteria, saved settings, journal filters, setting decisions aside, custom check-ins, bounded activity/preference timelines, circles/votes and account/data controls. The current source also adds optional mood-aware question selection, a daily native mood prompt and user-approved mood-related comparison priorities.

The latest source checks passed **823 web/backend tests plus one scheduler SQL test** and **91 native tests**, with zero failures. The push adapters are deployed at [projectnudge.vercel.app](https://projectnudge.vercel.app), deployment `dpl_HeDwdM6m1oqLNWnZWjMdDGhpbMSi`. Source/HTTPS checks do not establish APK runtime behavior. VERIFICATION.md identifies the current artifact, bounded installed checks, screenshots and cleanup; historical evidence remains attached to its own hash.

## Remaining work, in priority order

1. **Remaining authentication/cross-device acceptance:** owner-handled Google/PKCE return and upgrade/session retention now have real Redmi15C evidence. Complete refresh/revocation, process interruption and account switching. Earlier development-fixture authentication remains distinct from this real Google check.
2. **Native notifications acceptance:** real release delivery/process-death decision routing/opt-out have emulator evidence; one generic notification-only FCM arrival/app-open has owner-confirmed physical Redmi evidence. Complete physical durable-reminder routing, token rotation/account switching, quiet transitions and duplicate recovery. Saved check-ins and provider acceptance alone are not receipt.
3. **Remaining AI tools:** evaluate the implemented native monthly recap and reviewed note extraction/save with consent/accounting parity, configure a real provider and evaluate quality/failures. Current unavailable states must remain honest; mood selection itself requires no AI.
4. **Complete device/accessibility/reliability acceptance:** TalkBack and focus order, formats/keyboards, RTL, long lists, largest display/text settings, export/share cleanup, offline/timeout/conflict and saved-but-refresh-failed paths, startup/scrolling/memory on a real mid-range phone.
5. **Distribution preparation:** a test-signed AAB now validates with bundletool and matches APK native/DEX/Hermes payloads. Prepare the protected upload identity, actual Play-track installation, artwork/listing and accurate operator/privacy/retention/Data safety/deletion information. No upload/publication is claimed.

Recalculate this estimate when a whole work category advances, rather than increasing it for every screen or passing unit test. [PARITY.md](PARITY.md) defines scope; [VERIFICATION.md](VERIFICATION.md) remains the authority for exact artifact/runtime evidence; [PLAY-STORE-READINESS.md](PLAY-STORE-READINESS.md) records release gates.

## 0.6.0 source update

Reviewed note intake is implemented with deployed authenticated adapters; see NOTES-2026-11-10.md. Exact artifact/device scope belongs to VERIFICATION.md. Full-v1 estimate remains about 70%; live AI, physical device and store acceptance have not advanced merely because source tests pass. The owner is now 18; there is no remaining age-wait task.
