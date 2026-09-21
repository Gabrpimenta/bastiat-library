import { DatabaseSync } from 'node:sqlite';
import { it, expect } from 'vitest';
import { migrateRecords } from '../../apps/mobile/src/services/migrations';

it('upgrades a real v1 SQLite fixture without losing cached study data', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(
    'CREATE TABLE records (scope TEXT NOT NULL, namespace TEXT NOT NULL, key TEXT NOT NULL, value_json TEXT NOT NULL, PRIMARY KEY(scope,namespace,key)); PRAGMA user_version=1;',
  );
  const fixture = JSON.stringify({ positionSeconds: 42, revision: 3 });
  db.prepare('INSERT INTO records VALUES (?,?,?,?)').run('user:7', 'progress', 'lesson-a', fixture);
  db.exec('BEGIN');
  migrateRecords(1, (sql) => db.exec(sql));
  db.exec('COMMIT');
  expect(db.prepare('PRAGMA user_version').get()?.user_version).toBe(2);
  expect(db.prepare('SELECT value_json,updated_at FROM records').get()).toMatchObject({
    value_json: fixture,
    updated_at: 0,
  });
  db.close();
});
it('rolls back a failed schema upgrade and preserves the earlier schema for recovery', () => {
  const db = new DatabaseSync(':memory:');
  db.exec('BEGIN');
  try {
    migrateRecords(0, (sql) => {
      db.exec(sql);
      if (sql.startsWith('ALTER')) throw new Error('Simulated interruption');
    });
    db.exec('COMMIT');
  } catch {
    db.exec('ROLLBACK');
  }
  expect(db.prepare('PRAGMA user_version').get()?.user_version).toBe(0);
  expect(db.prepare("SELECT name FROM sqlite_master WHERE name='records'").get()).toBeUndefined();
  db.exec('BEGIN');
  migrateRecords(0, (sql) => db.exec(sql));
  db.exec('COMMIT');
  expect(db.prepare('PRAGMA user_version').get()?.user_version).toBe(2);
  db.close();
});
it('refuses an unknown future schema without issuing any writes', () => {
  const writes: string[] = [];
  expect(() => migrateRecords(3, (sql) => writes.push(sql))).toThrow('newer app');
  expect(writes).toEqual([]);
});
