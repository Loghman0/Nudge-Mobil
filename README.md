# Nudge for Android

The latest standalone ARM64 + x86_64 test APK and its exact validation boundaries are recorded in [verification](docs/VERIFICATION.md).

An independent React Native Android application. The Android APK embeds its JavaScript and assets; the installed preview does not require a development server or Expo Go. Expo is the native build tool, not a website container.

## Native Android preview (0.8.0)

Android push implementation and hosted scheduler boundaries: [push work record](docs/PUSH-2026-11-10.md). Private server credentials never belong in the app. Latest exact APK/runtime evidence and remaining acceptance are in [verification](docs/VERIFICATION.md).

The standalone app includes the public six-question preview, answer selection, depends/neither/skip, Back, grounded reflections with exact sources, answer correction and restart. The app is light-only. Tapping a choice saves and advances; Back revisits it. Google sign-in appears after all six responses, including optional Skip, using a shared native button with Google's official G asset. The local preview works offline. Answers are encrypted using Android Keystore-backed SecureStore and expire after 24 hours. Google sign-in uses the system browser and S256 PKCE, with an encrypted verifier and session. No private key or AI call is required.

The versioned question bank, validators, evidence rules, contracts, taxonomy, response labels and local reminder-time resolver are generated copies of the current web source. Native intro copy is shorter while question/choice IDs and meanings remain unchanged. `npm run sync:core` refreshes nine explicitly allowlisted inputs; `npm run check:core` verifies their hashes. Do not independently edit `src/core/` or invent native-only personality interpretations.

After sign-in, users explicitly review and save their first answers. Today offers daily/more questions, topic and pace changes, neutral answers and pauses. About you shows evidence-linked reflections, feedback, question preferences and answer edit/exclude/delete controls. These call the same authenticated backend as the web app. Conflicts require fresh review; ambiguous failures preserve the exact retry intent. A successful save followed by a failed refresh blocks further changes until reload.

Decide includes a native four-step comparison form, saved settings, a searchable journal with combined status/category filters, and grounded result recovery. Open decisions can be explicitly set aside with Let it go. Check-ins offer presets or Android date/time pickers with an explicit Save; cancelling a picker or sheet does not schedule a check-in. Tools includes optional earlier learning, beliefs/memories, outcome summaries, bounded decision-activity and earlier-preference timelines, and circles/votes. Current source, hosted checks and installed paths are distinguished in the parity map.

Native account tools include profile/time-zone editing, optional AI choice, explicit terms review, check-ins, data export through Android's share menu, learned-pattern reset, decision-history deletion and fresh-authenticated account deletion. These use the versioned account API. The current backend adapters are deployed at `https://projectnudge.vercel.app` (`dpl_4SQi97m92KtbJvRKfsVEFj4ziZP3`); the recorded disposable-account HTTPS checks passed, with both accounts deleted and absence verified. Installed-device, provider-login and cross-client behavior must be recorded separately from source/transport checks. Remaining feature and release work is tracked in [the parity map](docs/PARITY.md).

## Native account API

All routes are under `/api/v1/account/`, use verified bearer authentication and private/no-store responses, and never accept a caller-selected account ID. Cookie requests retain the existing same-origin write check. Account data/export/deletion and terms review remain accessible when the account needs updated terms; this does not bypass terms enforcement on comparison/discovery routes.

| Route | Method | Input / behavior |
| --- | --- | --- |
| `profile` | GET | Profile basics, timezone, AI setting, memory generation, current policy metadata and deployment AI availability. |
| `basics` | PATCH | All four `full_name`, `country`, `language`, `occupation` fields, string or null; explicit field bounds. |
| `timezone` | POST | `{timezone}` validated as a real supported zone; save is checked by reading the resulting account zone. |
| `ai` | POST | `{enabled}`; enabling requires configured availability and current terms through the existing RPC. Disabling remains available when the provider is down. |
| `terms` | POST | `{version, eligible:true, accepted:true}` only after the user's explicit native review. |
| `checkins` | GET | Latest 50 owner-only check-ins. |
| `checkins/<id>` or `checkins/all` | PATCH | `{}` marks the owner's unread records read; opening a decision uses its protected native detail route. |
| `export` | GET | The same complete version-6 export service used by web. Credentials and other users' private records are excluded. Native writes a temporary app-private JSON file, opens the Android share sheet and provides explicit cleanup; unmount/next mount also clear that temporary file. Copies saved elsewhere are user-managed. |
| `reset` | POST | `{confirmation:"FORGET"}` invokes the existing canonical learning reset. |
| `history` | DELETE | `{confirmation:"DELETE HISTORY"}` deletes the owner's decisions and their cascading children. |
| `delete` | DELETE | `{confirmation:"DELETE"}` plus verified same-session OAuth/password/MFA authentication proof within ten minutes. Refreshing a token does not count as reauthentication. Admin deletion stays server-only. |

Account mutations never retry automatically. If a destructive response is lost, the UI requires a reload rather than replaying an old intent. Successful writes with failed refresh are labeled saved, and further changes are blocked until reload. A server/SDK failure never fabricates export or deletion success.

The exact callback `com.projectnudge.app://auth/callback` was registered in Supabase on 8 November 2026 with the owner's approval. The web Google client secret stays on Supabase. Before store release, evaluate verified HTTPS App Links and final package/signing identity. See [release gates](docs/PLAY-STORE-READINESS.md).

## Develop

Use supported Node 24 and JDK 21, then:

```powershell
cd mobile
npm ci
npm run check:core
npm run typecheck
npm test
npm start
```

An Android build requires Android SDK/NDK packages and Gradle. `npm run android` is for development. A standalone test APK must use `:app:assembleRelease` so the JS bundle is embedded; a debug APK alone can require Metro.

`node scripts/configure-public.mjs` copies only the two allowlisted public Supabase fields from the parent `.env.local` into `src/public-endpoints.json`. It rejects privileged keys and never copies the rest of the environment. The public demo API origin is explicit. Administrative/AI/provider secrets must never enter this directory or the native bundle.

On the configured Windows workstation, `powershell -File scripts/build-apk.ps1` checks the shared core/types/tests, generates Android, compiles an ARM64 release-mode test APK and verifies that the bundle is embedded. Its caches and default SDK downloads stay under the parent project's `.local/`. Optional `-SdkPath`, `-JavaPath` and `-Architecture x86_64` / `-Architecture universal` arguments support another configured toolchain or emulator build. The script reuses existing accepted SDK license files when present; missing SDK licenses still require normal SDK setup. It does not create a store signing identity.

The config plugin sets CMake's full object-path limit to 250 so generated dependency object names fit Windows paths in this checkout. This leaves room for CMake's hashed filenames below this project's relatively long directory path. It survives Android regeneration and does not require an OS-wide long-path setting.

The current application ID is `com.projectnudge.app`, a provisional identifier to settle before any store publication. The initial local test APK uses the generated Android test signing identity. It is not a Play Store upload identity. Keep production signing credentials separate and private when that release is prepared.

## Design and trust

The core loop is curiosity → answer → inspect the reflection → correct what does not fit. Android Back has the same meaning as the visible Back/Cancel controls. Actions use at least 48 dp targets, safe-area insets and scalable text. Runtime retains Nudge's light blue palette. Dark tokens are future-only. Contrast tests cover ordinary text, secondary text, selected answers and primary buttons. At large text sizes navigation reflows instead of shrinking labels. There are no decorative animations, permissions requested on first launch, forced questions or certainty scores.

Audience and usefulness are product hypotheses, not clinical findings. A skipped, dependent or neither response produces no inferred trait. Every reflection retains its question source. No account data is embedded in the application.

Source/build checks and actual device behavior are separate. A generated APK is not evidence of completed phone, screen-reader, landscape or largest-font testing. Record that evidence after testing an installed build.

## Current handoff

Use the versioned artifact identified in [Verification](docs/VERIFICATION.md) and `dist/latest-preview.json`. Historical versioned APKs are retained; older unversioned files are not the current handoff. The 0.7 source checkpoint passed 84 native tests, native TypeScript, nine shared-source hashes and 806 web/backend tests; its backend is deployed. [Verification](docs/VERIFICATION.md) is the authority for the final artifact hash, installed-build pairing and remaining gates. The [design skill audit](docs/DESIGN-SKILLS-AUDIT-2026-11-09.md) records the installed guidance and actual source/device follow-through. Real-provider note/recap evaluation, native push delivery, real Google browser return and physical-phone/store acceptance remain separate work; this preview is not a Play-ready release.

Tools → Add a note supports explicitly submitted AI suggestions with edit/select/review/confirm and exact uncertain-save recovery. Hosted AI is currently unavailable; manual discovery/comparison stays usable. See [Notes checkpoint](docs/NOTES-2026-11-10.md).
