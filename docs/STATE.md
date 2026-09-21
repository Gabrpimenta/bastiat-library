# Current project state

Updated: 21 September 2026. Phase: demo delivery. Status: merged visual refinements and refreshed recorded preview; live hosting deferred until there is interest in a live demonstration.

## Objective and references

The implemented journey covers Payload publication, mobile learning, locked audio, verified downloads and offline restart, and native-to-web progress in the same account.

Scope and policy: [implementation tracker](IMPLEMENTATION.md). Executable evidence and remaining release gates: [QA](qa/VALIDATION.md). Demonstration: [recording and screenshots](DEMO.md). Builds: [artifact identity](qa/ARTIFACTS.md). Findings: [engineering record](ai/2026-09-21.md).

## Latest demo delivery

The demonstration and primary README screenshots now show the merged visual refinements and restored studio dashboard. Current Android build identity is recorded alongside the older physical iPhone evidence. Fresh Android Emulator capture verified download and offline force-stop/reopen; the web player was compared against existing synchronized simulator progress. See [recording notes](DEMO.md) and [refresh verification](qa/DEMO_REFRESH.md).

Use the recorded demo and local setup as the review package. Do not start web/API hosting unless it is requested after interest in a live demonstration. Hosting is not an outstanding blocker for this delivery.

## Latest visual review

The web and native layouts received a conservative spacing and sizing pass. The web player no longer clips its Save action at 320 px. Tablet grids, card alignment, native text wrapping, safe areas and media proportions were refined without changing the visual identity. Chromium and WebKit were checked at four widths, and iPhone/iPad Simulators and Android Emulator were reviewed. The studio dashboard collection cards were restored by regenerating Payload’s missing import map. No physical device was used in this pass.

Local format/lint/types, 20 domain tests, 8 browser tests, production web build and Android Release build passed. See the [visual review and screenshots](qa/VISUAL_REVIEW.md). Existing physical acceptance and old build identities below remain tied to their recorded source revisions.

## Earlier verified application source

- Application source `3c98567` adds 120 ms press feedback, short state transitions, native stack navigation and live reduced-motion support. Tab switches remain immediate.
- Formatting, lint, types, 20 domain tests, 11 API tests, 5 browser tests, production web build and iOS JavaScript export passed remotely for that revision.
- Native-to-web resume passed: real iOS Simulator SQLite checkpoint 64.6597 seconds, fresh authenticated browser 65 seconds.
- Physical iPhone 16: the earlier clean Release completed 609.984 seconds while locked; the owner confirmed external pause/resume. The updated Release passed offline force-close/reopen, headphone disconnection and Siri interruption through owner confirmation. Playback was left paused.
- Android Emulator Release: fresh verified download, offline process restart, playback and reduced-motion interaction checks passed. The device owner deferred physical Android testing; do not ask again in this session.
- The temporary long-audio and publication server fixtures have been removed. The final catalog has one course, three lessons and two readings.
- The original delivery included a 1:57 edited demonstration, since replaced by the current refresh in docs/media. No credentials, private application documents or provisioning information are included.
- Local Android APK and SHA-256 metadata are retained under .local/artifacts/3c98567. The separate Android CI build uses the same application source and its own generated signing key.

## Delivery

Repository: https://github.com/Gabrpimenta/bastiat-library. Previous delivery: https://github.com/Gabrpimenta/bastiat-library/pull/1 (merged). Visual review: https://github.com/Gabrpimenta/bastiat-library/pull/2 (merged as `095d22d`). Main-branch CI passed 39 tests and build checks. Demo-refresh branch: `docs/refresh-demo`.

The final recording and documentation were inspected. The Android CI build passed and its downloaded artifact matched its SHA-256. The merged delivery PR contains that earlier source and evidence. Later documentation commits do not change the application source associated with existing native builds.

## Remaining release scope

Physical Android, complete VoiceOver/TalkBack acceptance, representative-device performance profiling and maintainer review remain open. Public HTTPS hosting is intentionally deferred. Store distribution and wider iOS provisioning are outside the recorded-demo delivery. Production acceptance remains separate from the passing automated checks.

## Decisions and constraints

Use the approved scope and AI contribution policy. Keep private application materials, credentials, device identifiers and local logs out of the repository. Follow the compact state and outcome-to-evidence practices adapted from GSD; no global framework or model configuration change was made. Never infer a passing device result from silence.
