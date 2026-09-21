# Build identity

## Current demo and visual review

The refreshed web companion and Payload studio use merged application source [`095d22d`](https://github.com/Gabrpimenta/bastiat-library/commit/095d22dcbca6143646ef94ee23ed20333224fcd0). [Main-branch Checks](https://github.com/Gabrpimenta/bastiat-library/actions/runs/35603867238) passed formatting, lint, TypeScript, 20 domain tests, migration/seed, the production web build, 11 API tests, 8 browser tests and the iOS JavaScript export.

The current Android internal APK was built from [`e43fefa`](https://github.com/Gabrpimenta/bastiat-library/commit/e43fefaa836f67531d6ca521b1c549231f059559). There are no mobile or shared-package source differences between that revision and the merged revision above. The later studio fix affects the web import map.

- Configuration: Release, bundled JavaScript, `arm64-v8a`, generated development signing key.
- API origin: `http://10.0.2.2:3000`; online features require the local project server.
- Artifact: `.local/artifacts/e43fefa/bastiat-library-android-internal.apk`, with `build.json` and `SHA256SUMS` beside it, excluded from Git.
- The installed Android Emulator APK was hashed during the demo refresh and matches this artifact.

SHA-256:

```text
e89f474bf564bf4af9ac61367b98cb66519234c93f01474175b4343397ce4366
```

See the [visual review](VISUAL_REVIEW.md) and [refreshed demonstration](../DEMO.md) for current screenshots and observed behavior. This is a local development preview; public hosting and wider distribution are deferred. The older iPhone and CI artifacts below retain their own source identities and checksums.

## Earlier delivery builds

Application source: [`3c98567071d16e9bde20b8c26becd908149cba6e`](https://github.com/Gabrpimenta/bastiat-library/commit/3c98567071d16e9bde20b8c26becd908149cba6e), 21 September 2026. Later documentation commits do not change the application bundled in these builds.

### Earlier Android APK

The local artifact is `bastiat-library-android-internal.apk`, built with Release configuration and bundled JavaScript for `arm64-v8a`, using the generated development key. It was installed and exercised on the API 36.1 Android Emulator. Its API origin is `http://10.0.2.2:3000`, so it requires the local project server for online features. It is not a standalone hosted demo or a store-signed package.

SHA-256:

```text
9e8eabeac35d022b2fc24ae24760580a600557e308daa46dc1aaad585f959d3c
```

The artifact and its `build.json`/`SHA256SUMS` are retained locally under `.local/artifacts/3c98567/` and are intentionally excluded from Git. The [Android CI build for the same application source](https://github.com/Gabrpimenta/bastiat-library/actions/runs/35566756430) passed and produced a separate dual-architecture artifact. Its downloaded APK was verified against the workflow checksum: `fd882ce112f65fcbea61e02b67e720f1a2baba6a8757bea52c3b8f0c578a35d9`. Its generated signing key and build environment differ, so the local checksum above must not be used to verify the CI artifact. Workflow artifacts expire after 14 days; the workflow can be rerun from the recorded revision.

### Physical iPhone build

A Release configuration build from the same application source was compiled, signature-verified and installed on the owner's iPhone 16 / iOS 26.6.2 at 06:04 UTC. JavaScript is bundled and the build uses the local LAN API. Its owner-approved development signing profile remains local. No provisioning profile, private key or installable iOS distribution package is published here.

Offline restart, headphone disconnection and Siri interruption passed on this updated build through owner observation. The ten-minute locked run and external pause/resume passed on the earlier clean Release build; their timeline and the unchanged media implementation are recorded in [validation](VALIDATION.md).

### Earlier automated checks

[Checks for `3c98567`](https://github.com/Gabrpimenta/bastiat-library/actions/runs/35566818578) passed format, lint, TypeScript, 20 domain tests, migration/seed, the production web build, 11 API checks, 5 browser tests and an iOS JavaScript export. Native builds and device acceptance remain separate evidence.
