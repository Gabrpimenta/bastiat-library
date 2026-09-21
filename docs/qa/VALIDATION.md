# Validation evidence

Recorded on 21 September 2026. This is development evidence, not a completed physical-device release certification. Local full logs and temporary artifacts are in the git-ignored `.local/` directory.

## Executed checks

| Check                                           | Observed result                                                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| TypeScript across both apps and shared packages | Passed                                                                                                                                           |
| Synchronization and media-domain tests          | 19 passed, including real SQLite upgrades/rollback, cancellation/timeout, patched URI decoding and native player startup races                   |
| API integration                                 | 11 passed: contracts, drafts, ownership, roles, CSRF, media ranges, idempotency, conflicts, pagination and session revocation                    |
| Playwright / Chromium                           | 4 passed: catalog/search/saved reading/responsive layout; audio and second-session resume; video frames; studio publication and guest playback   |
| Next.js production build                        | Passed after the latest web changes                                                                                                              |
| iOS native debug build                          | Xcode 26.6, iPhone 17 Pro simulator, iOS 26.5: compiled and installed                                                                            |
| Android native debug build                      | arm64-v8a, compile/target SDK 36, JDK 17: compiled and installed on an API 36.1 emulator                                                         |
| iOS production JavaScript export                | Hermes bundle and assets exported successfully                                                                                                   |
| PostgreSQL migration                            | Initial schema applied, rolled back and reapplied in `bastiat_migration_qa`, an isolated disposable database                                     |
| iOS remote audio                                | Play, pause and +15-second seek executed through Maestro                                                                                         |
| iOS download                                    | Real 1,879,533-byte MP3 verified and marked ready                                                                                                |
| iOS process restart with API stopped            | Cached lesson opened and local media played; UI showed “Playing offline”. This tests API unavailability, not a physical-device airplane-mode run |

Local development observations: first measured remote playback readiness was 626 ms; a measured local readiness after restart was 276 ms. These are individual simulator observations with instrumentation, not benchmarks or release performance claims.

## Native procedures

The app must already be installed and connected to Metro. `.maestro/ios-media.yaml` opens the lesson, plays, seeks, pauses and downloads it. Its fresh-download precondition is intentional: remove that lesson’s previous download before rerunning it.

For `.maestro/ios-api-unavailable.yaml`, first finish the verified download, stop only the project API, terminate and reopen the app, then run the flow. Metro remains available to the development client. Restore the API afterward. This distinction is necessary when interpreting a development build’s offline evidence.

## Additional native observations

- iOS Simulator, iPhone 17 Pro / iOS 26.5: the 610-second synthetic QA lesson reached 609.984 seconds at 04:56:37 UTC after locking the simulator at approximately 04:46:33. SQLite checkpoints continued while locked. The app was terminated at 04:56:46. Lock-screen playback controls were not visible in the screenshot, so controls are not marked passed.
- Android Emulator, API 36.1: a Release configuration APK with bundled JavaScript downloaded the real MP3 after the asynchronous move fix. With airplane mode enabled and Wi-Fi disabled, the app was force-stopped and reopened; Maestro verified playback, “Playing offline” and “Downloaded”, then paused playback. No Metro connection was required. Airplane mode and Wi-Fi were restored afterward.
- iOS Simulator and Android Emulator: video play, forward seek and pause passed. The iOS flow then switched to the audio lesson and played/paused it successfully.
- Physical iPhone 16 / iOS 26.6.2: the Release configuration compiled, its signature verified, and the app installed and launched after the device owner trusted the development profile. Initial playback failed at 0:00 for both remote and downloaded media. After refreshing Pods and compiling Expo Audio from source, an instrumented build and a clean build advanced. The owner confirmed narration and visible lock-screen controls. Continuous duration and external control operation are still being tested; ADR 004 records the diagnostic limits. This is an internal development-signed build using the local API, not store distribution.
- iOS Simulator: the sign-in form remained operable at accessibility-extra-extra-extra-large Dynamic Type after correcting brand scaling and keyboard focus. The negative-login flow submitted credentials, displayed the recovery error and retained the form. Normal text size was restored. This does not establish VoiceOver or TalkBack acceptance.
- Physical Android: the device owner deferred this test session. Android results above apply only to the emulator.

## Requirement-to-evidence matrix

| Requirement                                                | Status               | Evidence or next action                                                                                 |
| ---------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------- |
| Published CMS content reaches both clients                 | Partial              | Public API and both clients load seeded published content; complete the recorded editor-publish journey |
| Accounts cannot read or alter another account's study data | Verified locally     | API ownership, raw write denial and role tests                                                          |
| Replay and concurrent progress preserve user intent        | Verified locally     | Domain replay/backoff and API conflict tests                                                            |
| Progress continues in another client                       | Partial              | Browser-to-browser resume passed; native-to-web journey pending                                         |
| A downloaded lesson survives restart without a network     | Verified on emulator | Android Release airplane-mode run; physical run pending                                                 |
| Ten minutes of locked audio and external controls          | Partial              | iOS Simulator duration passed; physical duration and controls pending                                   |
| Prior native data survives schema evolution                | Verified locally     | Real SQLite v1 fixture upgrade and transactional rollback tests                                         |
| Accessible controls and larger text remain usable          | Partial              | Labels, target sizes and layout fixes implemented; screen-reader and larger-text device pass pending    |
| Reproducible build and remote CI                           | Partial              | Local native/web builds passed before the latest dependency revision; remote run pending                |
| Reviewable distribution and demo                           | Pending              | Final commit-associated artifacts, repository, screenshots and recording                                |

Dependency findings and mitigation are in [the dependency review](DEPENDENCIES.md). External skills and the concrete changes they informed are recorded in [the skills review](../ai/SKILLS.md).

## Remaining release gates

- Physical iPhone and Android: ten continuous minutes of audio with the screen locked, external controls, headphone disconnection and an interruption, with device/OS/build recorded.
- Installed preview/release without Metro: force-stop and relaunch in airplane mode, play the verified download and retain the checkpoint.
- Physical-device media journey and extended native navigation checks.
- VoiceOver, TalkBack, larger text, reduced motion and measured touch/contrast checks.
- Final checks after subsequent fixes and remote CI results.
- Maintainer review, public API environment, signing and an installable distribution artifact.

No physical-device result, store distribution or public hosting is inferred from a successful simulator, browser or compile check. Failure findings and fixes are recorded in [the engineering log](../ai/2026-09-21.md).
