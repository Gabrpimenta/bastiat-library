# Release and recovery

The current app is a development preview. A release requires a commit-associated artifact, automated checks, the device evidence in the QA matrix, and the maintainer’s review of authentication, data handling, migrations and configuration.

## Web and CMS

1. Provision PostgreSQL 17 and persistent media storage. Set `DATABASE_URL`, a random `PAYLOAD_SECRET` and the final HTTPS `NEXT_PUBLIC_SERVER_URL`. Do not reuse demo credentials. Keep `ALLOW_SEED` unset in production.
2. Back up the database and media as a matching pair before a migration. Verify the backup can be restored into a disposable environment.
3. Run the committed Payload migrations using the deployment’s environment, build with the frozen lockfile, and start Next.js. Production disables schema push.
4. Verify `/api/health`, public content, a media range request, authentication, synchronization and a negative cross-account authorization check.
5. On failure, stop promotion. Restore the previous application image and its compatible database/media backup, or ship a reviewed forward fix. Do not run a destructive initial-schema down migration against production data.

The seed is a development-only operation. An editor can provision accounts through Payload after a secure initial administrative bootstrap. Email delivery and self-service password recovery are not configured; do not expose a public account-registration promise.

## Native

Set `APP_ENV=production` and an HTTPS `EXPO_PUBLIC_API_URL` before prebuild. Increment the app version when native capabilities or persistent-schema compatibility change. Regenerate native projects and build against the pinned package set. Development builds allow local HTTP; production configuration disables that exception.

`eas.json` defines development, preview and production profiles, but no EAS project, hosted API or OTA channel has been provisioned. Internal iPhone QA used the owner’s existing development identity and an explicitly trusted device profile; wider iOS distribution still requires an appropriate provisioning and distribution process. Android debug APKs require Metro. Internal Android Release configuration APKs bundle JavaScript but currently use the generated development signing key and local API; they are QA artifacts, not a public release.

Verify installation and launch without Metro for a preview/release artifact. Record its SHA-256, source commit, runtime, API environment, device/OS and executed tests. Store signing material in the platform’s protected secret store and follow configured environment approvals.

Keep Xcode's normal simulator code signing enabled when testing authentication. An unsigned app can launch and play media while SecureStore fails with a missing Keychain entitlement. Apple documents how the [application identifier contributes to Keychain access](https://developer.apple.com/documentation/security/sharing-access-to-keychain-items-among-a-collection-of-apps). A media-only simulator pass does not establish successful session storage.

The manual Android internal QA workflow accepts an API origin reachable from the device and produces a Release configuration APK with bundled JavaScript, a SHA-256 checksum and build metadata tied to the actual source commit. It uses the generated development signing key. The default origin targets an Android emulator's host; physical devices require a reachable LAN or HTTPS API origin. This workflow does not establish physical-device acceptance or store readiness.

## Local schema recovery

Native SQLite uses transactional upgrades. A future unknown version is rejected. For an actual rollback, preserve the device database, restore a compatible backup or release a forward-compatible fix. Uninstalling clears local progress and is not a recovery procedure for user data.

Destructive migration tests belong only in the explicitly disposable test database. Keep their outcome separate from a production restore rehearsal.
