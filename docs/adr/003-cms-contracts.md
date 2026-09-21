# ADR 003: Payload with a versioned public study API

Status: implemented.

Run Payload inside the Next.js application with PostgreSQL. Editors use its admin interface, drafts and generated collection types. Mobile and web consume stable Zod DTOs from `/api/v1`, rather than importing the CMS schema. Runtime validation catches incompatible or malformed responses.

Public content reads explicitly disable Local API access overrides and use no editor identity. A lesson also requires a published parent course and usable media. Course duration and count derive from its published lessons. Catalog queries count and fetch bounded windows by collection and stable slug order, rather than loading the full catalog into each client.

Personal writes derive the owner from the authenticated session. Protected Payload collection endpoints cannot bypass the custom progress and bookmark transactions. Native clients use a SecureStore token; browsers use Payload’s HttpOnly cookie and origin checks. Role writes are editor-only. Account deletion removes related study and replay records in the same Payload request transaction.

PostgreSQL numeric columns return strings through the raw driver; the study adapter explicitly converts and validates them. A real API test exposed the initial mismatch after the first saved checkpoint.

Consequences: one deployment and one database reduce operations, but media currently requires persistent server disk. Public files are not suitable for paid content. A larger catalog may warrant a search index; the current grouped pagination is deliberate and deterministic. Hosting, object storage, email delivery and production credential provisioning are separate deployment concerns.
