# Demo refresh verification

Recorded on 21 September 2026 after PR #2 merged. This change refreshes the recorded review package; application code, dependencies and deployment configuration are unchanged. Public hosting is deferred until a live demonstration is requested.

## Sources and environments

- Web/Payload: local Next.js development server, Chromium, merged application source `095d22d`; 1440 × 960 captures, plus a 390 × 844 compact-web screenshot.
- Android: API 36.1 Emulator, 1080 × 2400 at the default 420 dpi, Release APK from `e43fefa`. Its mobile and shared-package source matches the merged revision. Installed APK SHA-256 matched the [recorded artifact](ARTIFACTS.md).
- iOS: existing synchronized SQLite checkpoint read from the iPhone 17 Pro Simulator. No new native playback or synchronization claim is made from this read.
- No physical devices were used. No public service was deployed.

## Observed results

| Check                 | Result                                                                                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current web screens   | Home, course, filtered search, reading and lesson captured from the merged app                                                                                          |
| Editorial publication | Temporary draft returned 404 from the public content API, then 200 after Publish changes; published title visible in the web app; fixture removed afterward             |
| Android download      | Previous local download removed through the UI; new transfer visibly advanced and became Downloaded / Available offline                                                 |
| Native controls       | Actual recorded playback advanced; backward seek moved the displayed position from 2:14 to approximately 2:00; paused screenshot and Play control confirmed afterward   |
| Offline restart       | Airplane setting 1 and Wi-Fi setting 0 verified before force-stop/reopen; Downloads opened the lesson; playback advanced from 2:03 to 2:05 with Playing offline visible |
| Web resume            | Existing synchronized native checkpoint 74.365001671 s, dirty=false; current authenticated web player 74 s before the recording began                                   |
| Cleanup               | Temporary server lesson removed; Android airplane mode off, Wi-Fi on and volume restored to 5/15; playback paused and app stopped                                       |

Capture scripts used the local seed credentials without printing them or including login screens in the published media. Temporary captures, logs and fixture details remain in the ignored `.local/demo-refresh/` directory.

## Capture corrections and scope

Early capture attempts were discarded when setup had not completed or UI inspection missed a changing playback state. The recorder was adjusted to wait for the destination screen, use inspected control positions during playback, and verify actual captured frames plus paused state afterward. An initial web-resume read occurred before hydration and returned zero; waiting for the restored position produced the comparison above. These discarded attempts are not counted as passing evidence.

The final edit retains normal-speed screen capture, with cuts and brief chapter fades. It omits startup waits and selected idle periods. The recorded progress values can differ between chapters because they were captured in separate takes. Prior physical iPhone results and the earlier full native-to-web synchronization run retain their original revisions in [validation](VALIDATION.md).

This documentation/media update does not rerun the entire application acceptance matrix. [Main-branch CI for the merged application](https://github.com/Gabrpimenta/bastiat-library/actions/runs/35603867238) passed all 39 tests and build checks. Full screen-reader, representative-hardware performance and production-release work remain separately tracked.

## Media and documentation checks

The final MP4 was decoded end to end with FFmpeg without errors. FFprobe reports H.264, 1920 × 1080, 30 fps, 94.5 seconds and no audio stream. Chapter frames and all published screenshots were inspected for layout and sensitive content. Markdown formatting, local documentation/image links and `git diff --check` passed. The [video manifest](../media/demonstration.json) records its checksum, source revisions and chapter offsets.
