import { openDatabaseSync } from 'expo-sqlite';
import type { KeyValueStore } from '@bastiat/contracts/library';
import { migrateRecords } from './migrations';

const db = openDatabaseSync('bastiat-library.db');
db.execSync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
const version = db.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;
db.withTransactionSync(() => migrateRecords(version, (sql) => db.execSync(sql)));

export const storage: KeyValueStore = {
  get<T>(scope: string, namespace: string, key: string): T | null {
    const row = db.getFirstSync<{ value_json: string }>(
      'SELECT value_json FROM records WHERE scope=? AND namespace=? AND key=?',
      scope,
      namespace,
      key,
    );
    if (!row) return null;
    try {
      return JSON.parse(row.value_json) as T;
    } catch {
      return null;
    }
  },
  set(scope, namespace, key, value) {
    db.runSync(
      'INSERT INTO records (scope,namespace,key,value_json,updated_at) VALUES (?,?,?,?,?) ON CONFLICT (scope,namespace,key) DO UPDATE SET value_json=excluded.value_json, updated_at=excluded.updated_at',
      scope,
      namespace,
      key,
      JSON.stringify(value),
      Date.now(),
    );
  },
  all<T>(scope: string, namespace: string): T[] {
    return db
      .getAllSync<{ value_json: string }>(
        'SELECT value_json FROM records WHERE scope=? AND namespace=? ORDER BY updated_at DESC',
        scope,
        namespace,
      )
      .flatMap((row) => {
        try {
          return [JSON.parse(row.value_json) as T];
        } catch {
          return [];
        }
      });
  },
  remove(scope, namespace, key) {
    db.runSync(
      'DELETE FROM records WHERE scope=? AND namespace=? AND key=?',
      scope,
      namespace,
      key,
    );
  },
  clear(scope) {
    db.runSync('DELETE FROM records WHERE scope=?', scope);
  },
};
