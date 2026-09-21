import { createHash } from 'node:crypto';
import pg from 'pg';
import {
  progressSchema,
  bookmarkSchema,
  type Progress,
  type ProgressMutation,
  type BookmarkMutation,
  type Bookmark,
  type ProgressResult,
} from '@bastiat/contracts';
import { decideProgress } from '@bastiat/contracts/sync';
import { HttpError } from './http';

const globalDB = globalThis as typeof globalThis & { bastiatPool?: pg.Pool };
const pool =
  globalDB.bastiatPool ?? new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
globalDB.bastiatPool = pool;
const progressRow = (row: Record<string, unknown>): Progress =>
  progressSchema.parse({
    lessonSlug: row.lesson_slug,
    positionSeconds: Number(row.position_seconds),
    completed: row.completed,
    assetVersion: row.asset_version,
    revision: Number(row.revision),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  });
const bookmarkRow = (row: Record<string, unknown>): Bookmark =>
  bookmarkSchema.parse({
    targetSlug: row.target_slug,
    targetKind: row.target_kind,
    saved: row.saved,
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  });

async function operation<T>(
  owner: number,
  operationId: string,
  input: unknown,
  apply: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  const fingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [
      `operation:${owner}:${operationId}`,
    ]);
    const previous = await client.query(
      'SELECT fingerprint, result FROM sync_operations WHERE owner_id = $1 AND operation_id = $2',
      [owner, operationId],
    );
    if (previous.rows[0]) {
      if (previous.rows[0].fingerprint !== fingerprint)
        throw new HttpError(
          409,
          'An operation identifier cannot be reused for a different change.',
        );
      await client.query('COMMIT');
      return previous.rows[0].result as T;
    }
    const result = await apply(client);
    await client.query(
      'INSERT INTO sync_operations (owner_id, operation_id, fingerprint, result, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())',
      [owner, operationId, fingerprint, JSON.stringify(result)],
    );
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateProgress(
  owner: number,
  input: ProgressMutation,
  duration: number,
): Promise<ProgressResult> {
  return operation(owner, input.operationId, input, async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [
      `progress:${owner}:${input.lessonSlug}`,
    ]);
    const existing = await client.query(
      'SELECT * FROM progress WHERE owner_id = $1 AND lesson_slug = $2',
      [owner, input.lessonSlug],
    );
    const current = existing.rows[0] ? progressRow(existing.rows[0]) : null;
    const result = decideProgress(current, input, duration, new Date().toISOString());
    if (result.status === 'accepted') {
      const value = result.progress;
      await client.query(
        'INSERT INTO progress (owner_id, lesson_slug, position_seconds, completed, asset_version, revision, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,NOW(),$7) ON CONFLICT (owner_id, lesson_slug) DO UPDATE SET position_seconds=EXCLUDED.position_seconds, completed=EXCLUDED.completed, asset_version=EXCLUDED.asset_version, revision=EXCLUDED.revision, updated_at=EXCLUDED.updated_at',
        [
          owner,
          value.lessonSlug,
          value.positionSeconds,
          value.completed,
          value.assetVersion,
          value.revision,
          value.updatedAt,
        ],
      );
    }
    return result;
  });
}

export async function updateBookmark(owner: number, input: BookmarkMutation): Promise<Bookmark> {
  return operation(owner, input.operationId, input, async (client) => {
    const result = await client.query(
      'INSERT INTO bookmarks (owner_id, target_kind, target_slug, saved, created_at, updated_at) VALUES ($1,$2,$3,$4,NOW(),NOW()) ON CONFLICT (owner_id, target_kind, target_slug) DO UPDATE SET saved=EXCLUDED.saved, updated_at=EXCLUDED.updated_at RETURNING *',
      [owner, input.targetKind, input.targetSlug, input.saved],
    );
    return bookmarkRow(result.rows[0]);
  });
}

export async function getLibrary(owner: number) {
  const [progress, bookmarks] = await Promise.all([
    pool.query('SELECT * FROM progress WHERE owner_id=$1 ORDER BY updated_at DESC LIMIT 1000', [
      owner,
    ]),
    pool.query('SELECT * FROM bookmarks WHERE owner_id=$1 ORDER BY updated_at DESC LIMIT 1000', [
      owner,
    ]),
  ]);
  return { progress: progress.rows.map(progressRow), bookmarks: bookmarks.rows.map(bookmarkRow) };
}
