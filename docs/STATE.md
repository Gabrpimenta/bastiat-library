# Current project state

Updated: 21 September 2026, 05:31 UTC. Phase: native acceptance and release evidence. Status: in progress.

## Objective and references

Deliver the implemented learning journey: publish in Payload, play on mobile, keep listening with the screen locked, download and restart offline, then resume on the web with the same account.

Scope and policy: [implementation tracker](IMPLEMENTATION.md). Evidence: [QA report](qa/VALIDATION.md). Decisions: [ADRs](adr/001-native-media.md). Findings: [engineering record](ai/2026-09-21.md).

## Verified baseline

- Formatting, lint, type checks and 19 domain/SQLite/player tests passed locally.
- 11 API integration tests and 4 browser tests passed, including real studio publication and guest playback. A production web rebuild is due after the latest playback change.
- PostgreSQL initial migration applied, rolled back and reapplied in a disposable database.
- Native debug builds installed on iOS Simulator and Android Emulator. Android Release APK compiled with bundled JavaScript.
- iOS Simulator remote audio, seeking, verified download and restart with the API unavailable passed. This is not physical airplane-mode evidence.
- iOS Simulator locked playback reached 609.984 seconds of the 610-second QA fixture; lock-screen controls were not visible. Playback was stopped.
- Android Emulator Release APK passed verified download, force-stop and offline playback with airplane mode enabled and Wi-Fi disabled. Connectivity was restored.
- The initial signed iPhone Release failed at 0:00. After refreshing Pods and compiling Expo Audio from source, both an instrumented build and a clean build advanced on the physical iPhone. See ADR 004; a single upstream root cause has not been established.
- Latest dependency revisions passed the web production build, iOS JavaScript export and 11 API tests. One version-based moderate audit finding remains for a dependency with a documented local fix.

## Active work

- Physical iPhone clean-build locked test started at **05:29:49.887 UTC**, with the player at 0:00 and iPhone Mirroring quit. Do not reopen or interrupt it before 05:39:50 UTC. Observe checkpoints through a copied app SQLite database. The owner confirmed hearing narration and seeing lock-screen controls; their operation is still pending.
- Largest Dynamic Type sign-in flow passed and normal size was restored. Reduced Motion handling and measured input contrast were added; native preference toggles remain pending.
- The device owner deferred physical Android testing. Keep emulator and physical results separate; do not ask again this session.
- Complete physical media, interruption, accessibility and native-to-web resume checks, then remove the temporary ten-minute QA lesson.
- Record screenshots/demo, checks, actual commits, artifact hashes and remote CI.

## Decisions and constraints

- Internal QA uses the local API; no public service or store distribution exists.
- Device results must name actual hardware and build. Simulator results stay separate.
- Keep private application materials, credentials, device identifiers and local logs out of the repository.
- Follow compact state and evidence practices adapted from GSD; no framework installation or model/configuration change.

## Resume procedure

Inspect live build logs and connected devices before restarting work. Use the QA matrix to choose the first incomplete acceptance criterion. Update this file after meaningful outcomes; retain detailed evidence in the QA report. Never infer approval or a passing test from silence.
