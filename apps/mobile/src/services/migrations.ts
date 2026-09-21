export const schemaVersion = 2;

/** The caller runs this inside a SQLite transaction. */
export function migrateRecords(version: number, execute: (sql: string) => void) {
  if (version > schemaVersion)
    throw new Error('This library was opened by a newer app. Update the app to continue.');
  if (version < 1)
    execute(
      'CREATE TABLE records (scope TEXT NOT NULL, namespace TEXT NOT NULL, key TEXT NOT NULL, value_json TEXT NOT NULL, PRIMARY KEY (scope, namespace, key)); PRAGMA user_version = 1;',
    );
  if (version < 2)
    execute(
      'ALTER TABLE records ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0; PRAGMA user_version = 2;',
    );
}
