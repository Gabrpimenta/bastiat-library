# ADR 004 — Compile the iOS audio module from the installed source

Status: accepted for the internal development preview, 21 September 2026.

## Context

The first development-signed iPhone Release build loaded both remote and downloaded MP3 files but remained at 0:00. Simulator playback worked. Fixing initial readiness and asynchronous player races did not, by itself, resolve the physical-device failure.

During diagnosis, CocoaPods references were refreshed after the dependency revisions and Expo Audio was compiled from its installed source instead of using its precompiled module. Playback advanced on the iPhone in both the instrumented build and the subsequent clean build. These changes were not isolated in a controlled A/B comparison, so the observation does not establish an upstream binary defect or a single root cause.

## Decision

Keep Expo's supported `expo.autolinking.ios.buildFromSource` configuration for `expo-audio` in the mobile package. Build the pinned source without a custom native patch. Temporary Swift logging used for diagnosis was removed, and the clean executable was checked for those diagnostic markers before installation.

## Consequences

iOS compilation takes longer. Clean builds and refreshed native dependency references are required when validating a changed lockfile. Physical playback, background duration, external controls and offline relaunch remain separate acceptance checks. A future removal of this configuration requires a controlled physical-device comparison; a successful simulator build is insufficient.
