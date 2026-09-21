# Dependency review

Recorded on 21 September 2026 using `pnpm audit --prod --json` and the installed dependency graph. This is a point-in-time advisory check, not a security certification.

The initial audit returned five moderate and two low advisories, with no high or critical findings. Reviewed changes:

- Pin DOMPurify to 3.4.13 to include the sanitizer fixes documented by its maintainer. It is transitive through Payload's editor UI.
- Pin the legacy esbuild instance under `@esbuild-kit/core-utils` to 0.25.12. This instance is migration tooling; the old advisory concerns its development server.
- Pin `xcode`'s uuid dependency to 11.1.1. The consumer uses `uuid.v4()` through CommonJS, which this version supports. It is native project-generation tooling.
- Backport the linear UTF-8 decoding implementation from decode-uri-component v0.5.0 into the CommonJS 0.2.2 dependency used by Expo Router's query-string. Keep the original CommonJS entry point and plus-to-space behavior: a direct 0.5.0 override changes the module contract. The committed pnpm patch retains the upstream MIT license. Regression checks exercise valid text, malformed recovery and a 36,000-character malformed parameter through the exact transitive dependency.

The subsequent audit returns one moderate advisory for decode-uri-component because its package version remains 0.2.2. The vulnerable recursive decoder is replaced by the committed patch; the finding is recorded rather than silently suppressed. Review and remove the patch when Expo Router adopts a compatible patched dependency.

Sources: [DOMPurify release](https://github.com/cure53/DOMPurify/releases/tag/3.4.13), [esbuild advisory](https://github.com/advisories/GHSA-67mh-4wv8-2f99), [uuid advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq), [URI decoder release](https://github.com/SamVerschueren/decode-uri-component/releases/tag/v0.5.0), [URI decoder advisory](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr).

Formatting, lint, types and 15 tests passed after these changes. Production builds, native bundling and migration checks must also pass against the resulting lockfile before distribution.
