# ADR 002: Account-scoped outbox and revision conflicts

Status: implemented; domain and API tests exercise the protocol.

SQLite holds native public cache, download records and personal study records. Web uses localStorage behind the same small key-value interface. Keys include an account scope; guest progress is not silently imported. Logout clears that account’s local records after revoking the remote session. Public media remains available.

Progress writes carry a UUID operation ID, asset edition and base server revision. PostgreSQL advisory locks serialize an operation and a user/lesson pair inside one transaction. The operation fingerprint prevents reusing an ID with different data. A committed response is stored with the mutation, so a lost response can be replayed safely.

The client persists an immutable in-flight mutation before sending it. Playback can advance while it is pending; a successful response advances the base revision without deleting that newer checkpoint. Retry backoff survives subsequent local checkpoints. A user-generation guard discards late responses after account changes.

Do not use the greatest timestamp or playback position to resolve conflicts: device clocks differ and a reader may deliberately rewind. A stale revision returns both positions to the client. The reader can keep this device or the server position. Completion is an explicit independent action. An incompatible asset edition starts at zero; it must not inherit an unrelated timestamp.

Bookmarks are explicit save/remove operations with replay protection, using last-arriving-write semantics across devices. They do not have progress-style conflict prompts. Server operation records have no automatic expiry in this demo, so retention limits and a bounded replay window require a later operational decision.

Native schema version 2 adds timestamps to version 1 records. Older clients reject a newer unknown schema rather than silently treating it as compatible. Rollback must restore a matching backup or ship a forward fix; it must not discard study data automatically.
