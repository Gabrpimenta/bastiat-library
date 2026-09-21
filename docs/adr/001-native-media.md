# ADR 001: Native playback and explicit downloads

Status: accepted implementation decision; physical-device release validation pending.

Use Expo Audio for audio and Expo Video for foreground video. The supported Expo package set keeps native integration inside a single app runtime. A global player owns exactly one session; screen transitions do not own the audio lifecycle. Audio exposes native lock-screen metadata and background playback; video pauses when leaving the foreground.

Use explicit file downloads rather than treating a streaming cache as durable offline storage. A download is available only after its byte length and SHA-256 match the published asset. Partial files are never playable. A serial queue limits memory/network pressure, checks disk space, supports cancellation and restarts interrupted files after relaunch. Generation guards stop an old cancelled task from changing a newer request.

Consequences: no background transfer guarantee, no byte-range resume, no audio/video mode switching and no PiP. Checksum verification requires a typed byte array on native iOS; a plain ArrayBuffer passed TypeScript validation but failed in device execution. The 64 MB limit bounds that memory cost. A production catalog with larger media needs streaming checksums and a transfer strategy verified on hardware.

Alternatives: a second audio engine would add native configuration without evidence of a gap. HLS-only streaming would not satisfy the explicit file-download requirement. Revisit either decision if physical-device acceptance fails or licensed content requires DRM.
