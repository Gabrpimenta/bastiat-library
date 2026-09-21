import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  Users,
  Authors,
  Topics,
  Media,
  Courses,
  Lessons,
  Articles,
  Progress,
  Bookmarks,
  SyncOperations,
  Home,
} from './collections';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const serverURL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000';
export default buildConfig({
  secret: process.env.PAYLOAD_SECRET ?? '',
  serverURL,
  cors: [serverURL],
  csrf: [serverURL],
  admin: {
    user: 'users',
    importMap: { baseDir: dirname },
    meta: { titleSuffix: '· Bastiat Studio' },
  },
  collections: [
    Users,
    Authors,
    Topics,
    Media,
    Courses,
    Lessons,
    Articles,
    Progress,
    Bookmarks,
    SyncOperations,
  ],
  globals: [Home],
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL },
    push: process.env.NODE_ENV !== 'production' && process.env.PAYLOAD_DB_PUSH !== 'false',
    migrationDir: path.join(dirname, 'migrations'),
  }),
  sharp,
  typescript: { outputFile: path.join(dirname, 'payload-types.ts') },
  telemetry: false,
});
