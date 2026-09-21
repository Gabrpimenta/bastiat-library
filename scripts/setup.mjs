import { mkdir, writeFile, access } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, 'apps/web/.env.local');
try {
  await access(envPath);
  console.log('Existing local configuration preserved.');
} catch {
  const secret = randomBytes(32).toString('hex');
  const password = randomBytes(18).toString('base64url');
  const databasePassword = randomBytes(24).toString('hex');
  await mkdir(path.join(root, '.local'), { recursive: true });
  await writeFile(path.join(root, '.local/db-password'), databasePassword, { mode: 0o600 });
  await writeFile(
    envPath,
    `DATABASE_URL=postgresql://bastiat:${databasePassword}@127.0.0.1:5440/bastiat\nPAYLOAD_SECRET=${secret}\nNEXT_PUBLIC_SERVER_URL=http://localhost:3000\nSEED_PASSWORD=${password}\nSEED_ADMIN_EMAIL=editor@bastiat.local\nSEED_STUDENT_EMAIL=reader@bastiat.local\nALLOW_SEED=true\n`,
    { mode: 0o600 },
  );
  await writeFile(
    path.join(root, '.local/demo-access.txt'),
    `Local demo accounts\nEditor: editor@bastiat.local\nReader: reader@bastiat.local\nSecond reader: second@bastiat.local\nPassword: ${password}\n`,
    { mode: 0o600 },
  );
  console.log(
    'Local configuration created. Demo credentials: .local/demo-access.txt (git-ignored).',
  );
}
const mobilePath = path.join(root, 'apps/mobile/.env.local');
try {
  await access(mobilePath);
} catch {
  await writeFile(mobilePath, 'EXPO_PUBLIC_API_URL=http://localhost:3000\n');
}
