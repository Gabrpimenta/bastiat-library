# Validation evidence

Recorded on 21 September 2026. This is development evidence, not a completed physical-device release certification. Local full logs and temporary artifacts are in the git-ignored `.local/` directory.

## Executed checks

| Check                                           | Observed result                                                                                                                                                  |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript across both apps and shared packages | Passed                                                                                                                                                           |
| Synchronization and media-domain tests          | 20 passed, including real SQLite upgrades/rollback, session expiry/replay, cancellation/timeout, patched URI decoding and native player startup races            |
| API integration                                 | 11 passed: contracts, drafts, ownership, roles, CSRF, media ranges, idempotency, conflicts, pagination and session revocation                                    |
| Playwright / Chromium                           | 5 passed: catalog/search/saved reading/responsive layout; session recovery; audio and second-session resume; video frames; studio publication and guest playback |
| Next.js production build                        | Passed after the latest web changes                                                                                                                              |
| iOS native debug build                          | Xcode 26.6, iPhone 17 Pro simulator, iOS 26.5: compiled and installed                                                                                            |
| Android native debug build                      | arm64-v8a, compile/target SDK 36, JDK 17: compiled and installed on an API 36.1 emulator                                                                         |
| iOS production JavaScript export                | Hermes bundle and assets exported successfully                                                                                                                   |
| PostgreSQL migration                            | Initial schema applied, rolled back and reapplied in `bastiat_migration_qa`, an isolated disposable database                                                     |
| iOS remote audio                                | Play, pause and +15-second seek executed through Maestro                                                                                                         |
| iOS download                                    | Real 1,879,533-byte MP3 verified and marked ready                                                                                                                |
| iOS process restart with API stopped            | Cached lesson opened and local media played; UI showed “Playing offline”. This tests API unavailability, not a physical-device airplane-mode run                 |

Local development observations: first measured remote playback readiness was 626 ms; a measured local readiness after restart was 276 ms. These are individual simulator observations with instrumentation, not benchmarks or release performance claims.

Remote CI: [Checks for `3c98567`](https://github.com/Gabrpimenta/bastiat-library/actions/runs/35566818578) passed formatting, lint, types, 20 domain tests, database migration/seed, the production web build, 11 API tests, 5 browser tests and the iOS JavaScript export. An earlier PR run failed on rapid keyboard seeking; the subsequent fix updates the controlled slider immediately. The [baseline run](https://github.com/Gabrpimenta/bastiat-library/actions/runs/35565042376) also passed. Native build and physical-device results are tracked separately below.

## Native procedures

The app must already be installed and connected to Metro. `.maestro/ios-media.yaml` opens the lesson, plays, seeks, pauses and downloads it. Its fresh-download precondition is intentional: remove that lesson’s previous download before rerunning it.

For `.maestro/ios-api-unavailable.yaml`, first finish the verified download, stop only the project API, terminate and reopen the app, then run the flow. Metro remains available to the development client. Restore the API afterward. This distinction is necessary when interpreting a development build’s offline evidence.

`node scripts/verify-native-resume.mjs <simulator-id>` exercises native sign-in, playback, seeking and synchronization, reads the checkpoint from the real simulator SQLite database, and checks that a new browser session resumes within two seconds of it. It requires Node 24, Maestro/JDK 17, a normally signed simulator build, Metro, the local API and a signed-out app. The second synthetic seed account is used. Private logs and screenshots are placed under `.local/native-resume/`; credential values in text artifacts are redacted. This test does not establish physical-device or airplane-mode acceptance.

On macOS, headless browser tests disable Chromium's hardware media-key handling so unrelated system pause commands cannot interrupt the assertions. Autoplay and the real media pipeline remain active. External controls require their separate device procedure.

The complete native-to-web procedure passed on 21 September at 06:02 UTC with application source `3c98567`. The real simulator SQLite checkpoint was synchronized at 64.659655504 seconds (revision 3); the authenticated web player displayed 65 seconds. The scripts and public report omit fixture credentials and account identifiers.

## Additional native observations

- iOS Simulator, iPhone 17 Pro / iOS 26.5: the 610-second synthetic QA lesson reached 609.984 seconds at 04:56:37 UTC after locking the simulator at approximately 04:46:33. SQLite checkpoints continued while locked. The app was terminated at 04:56:46. Lock-screen playback controls were not visible in the screenshot, so controls are not marked passed.
- Android Emulator, API 36.1: a Release configuration APK with bundled JavaScript downloaded the real MP3 after the asynchronous move fix. With airplane mode enabled and Wi-Fi disabled, the app was force-stopped and reopened; Maestro verified playback, “Playing offline” and “Downloaded”, then paused playback. No Metro connection was required. Airplane mode and Wi-Fi were restored afterward.
- iOS Simulator and Android Emulator: video play, forward seek and pause passed. The iOS flow then switched to the audio lesson and played/paused it successfully.
- Physical iPhone 16 / iOS 26.6.2: the Release configuration compiled, its signature verified, and the app installed and launched after the device owner trusted the development profile. Initial playback failed at 0:00 for both remote and downloaded media. After refreshing Pods and compiling Expo Audio from source, an instrumented build and a clean build advanced. The owner confirmed narration and visible lock-screen controls. A second uninterrupted locked run started at 05:41:37.713 UTC and reached 609.984 seconds at 05:51:47 UTC. USB inspection at 05:51:57 confirmed the phone remained locked; mirroring was opened afterward. The owner then confirmed that lock-screen pause and resume stopped and restored the sound. The first run was accidentally paused at 326.36 seconds and is excluded from the continuous-duration pass. ADR 004 records the diagnostic limits. This is an internal development-signed build using the local API, not store distribution.
- iOS Simulator: the sign-in form remained operable at accessibility-extra-extra-extra-large Dynamic Type after correcting brand scaling and keyboard focus. The negative-login flow submitted credentials, displayed the recovery error and retained the form. Normal text size was restored. This does not establish VoiceOver or TalkBack acceptance.
- Physical iPhone 16 / iOS 26.6.2, updated Release build from `3c98567`: installed at 06:04 UTC with bundled JavaScript and the local LAN API. The owner confirmed downloaded playback after force-closing and reopening in airplane mode with Wi-Fi off; “Playing offline” was visible. The owner also confirmed that disconnecting headphones paused sound without switching to the speaker, and that Siri interrupted playback while leaving it usable afterward. Playback was left paused. A subsequent USB SQLite snapshot retained the verified download and a 49.10-second checkpoint. These are owner-observed physical tests, separate from the earlier continuous locked run.
- Android Emulator, Release build from `3c98567`: fresh download and offline force-stop/reopen playback passed through visible library navigation. The initial automation attempted a deep link during app startup and remained on Home; the corrected flow waits for navigation to be available and uses My Library → Downloads. Connectivity and volume were restored.
- Android Emulator, same Release: a newly published temporary lesson loaded, played, sought, paused and toggled bookmarks with system reduced motion enabled. The setting was restored to its original value afterward and the temporary server lesson was removed.
- Physical Android: the device owner deferred this test session. Android results above apply only to the emulator.

## Requirement-to-evidence matrix

| Requirement                                                | Status                          | Evidence or next action                                                                                    |
| ---------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Published CMS content reaches both clients                 | Verified locally                | Recorded studio publication reached web; a newly published fixture played on Android Release               |
| Accounts cannot read or alter another account's study data | Verified locally                | API ownership, raw write denial and role tests                                                             |
| Replay and concurrent progress preserve user intent        | Verified locally                | Domain replay/backoff and API conflict tests                                                               |
| Progress continues in another client                       | Verified locally                | iOS Simulator SQLite: 64.6597 s; new authenticated web session: 65 s (21 September, 06:02 UTC)             |
| A downloaded lesson survives restart without a network     | Verified on iPhone and emulator | Owner confirmed physical iPhone offline relaunch; Android Release emulator replay also passed              |
| Ten minutes of locked audio and external controls          | Verified on iPhone              | Clean Release build: 609.984 seconds while locked; owner confirmed external pause/resume                   |
| Prior native data survives schema evolution                | Verified locally                | Real SQLite v1 fixture upgrade and transactional rollback tests                                            |
| Accessible controls and larger text remain usable          | Partial                         | Labels, target sizes and layout fixes implemented; screen-reader and larger-text device pass pending       |
| Reproducible build and remote CI                           | Verified for preview            | Remote Checks passed for `3c98567`; local iPhone/Android Release builds and artifact hash recorded         |
| Reviewable distribution and demo                           | Available for review            | Draft PR #1, internal Android APK, screenshots and edited demonstration; public/store distribution pending |

Dependency findings and mitigation are in [the dependency review](DEPENDENCIES.md). External skills and the concrete changes they informed are recorded in [the skills review](../ai/SKILLS.md).

## Interaction motion

The 21 September polish uses 120 ms press feedback and 180–220 ms state/entrance transitions, with live system reduced-motion support on native and `prefers-reduced-motion` on web. Tab switches stay immediate and stack navigation uses platform transitions. Formatting, lint, types, 20 domain tests and all five browser scenarios passed locally after this change. The native-to-web flow also passed with the new controls. Browser inspection measured the active button transform as `matrix(0.97, 0, 0, 0.97, 0, 0)`; reduced motion removed the transform and changed its transition duration to `0s`. Android Release interactions passed with system reduced motion on. No frame-rate benchmark or slow physical Android performance claim is made.

## Responsive visual review

The later [web and native visual review](VISUAL_REVIEW.md) records the current layout changes, browser coverage, simulator-only scope and screenshots. This pass adds three responsive browser regressions (eight browser scenarios total) and a reproducible native screen tour. Earlier physical-device and artifact records remain tied to their stated revisions.

## Remaining release gates

- Physical Android acceptance, deferred by the owner; extended navigation and performance profiling on representative hardware.
- VoiceOver, TalkBack and a complete focus-order/accessibility audit. Large-text, selected contrast pairs, touch targets and reduced-motion checks above are narrower evidence.
- Maintainer review of authentication, data handling, migrations and release configuration.
- A hosted HTTPS API, production signing and store or wider iOS distribution, if those are requested.

The preview includes a [demonstration and screenshots](../DEMO.md) and [artifact identity](ARTIFACTS.md). No store distribution, public hosting or full accessibility certification is inferred from the executed checks. Failure findings and fixes are recorded in [the engineering log](../ai/2026-09-21.md).
