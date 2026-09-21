import { spawnSync } from 'node:child_process';
import { accessSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = path.join(root, '.local/postgres');
const binaries = process.env.PG_BIN ?? '/opt/homebrew/opt/postgresql@17/bin';
function run(name, args, check = true) {
  const result = spawnSync(path.join(binaries, name), args, { stdio: 'inherit' });
  if (check && result.status !== 0) throw new Error(`${name} exited with ${result.status}`);
  return result.status;
}
accessSync(path.join(binaries, 'pg_ctl'));
if (process.argv[2] === 'stop') {
  run('pg_ctl', ['-D', data, 'stop', '-m', 'fast']);
} else {
  mkdirSync(path.join(root, '.local'), { recursive: true });
  const passwordPath = path.join(root, '.local/db-password');
  if (!existsSync(passwordPath)) throw new Error('Run pnpm run setup first.');
  if (!existsSync(path.join(data, 'PG_VERSION'))) {
    run('initdb', [
      '-D',
      data,
      '-U',
      'bastiat',
      '--pwfile',
      passwordPath,
      '--auth=scram-sha-256',
      '--encoding=UTF8',
      '--locale=C',
    ]);
    writeFileSync(
      path.join(data, 'postgresql.auto.conf'),
      "listen_addresses = '127.0.0.1'\nport = 5440\nunix_socket_directories = ''\n",
    );
  }
  if (run('pg_ctl', ['-D', data, 'status'], false) !== 0)
    run('pg_ctl', ['-D', data, '-l', path.join(root, '.local/postgres.log'), 'start']);
  const { default: pg } = await import('pg');
  const client = new pg.Client({
    host: '127.0.0.1',
    port: 5440,
    user: 'bastiat',
    password: readFileSync(passwordPath, 'utf8').trim(),
    database: 'postgres',
  });
  await client.connect();
  const result = await client.query("SELECT 1 FROM pg_database WHERE datname = 'bastiat'");
  if (!result.rowCount) await client.query('CREATE DATABASE bastiat');
  await client.end();
  console.log('Project database ready at 127.0.0.1:5440.');
}
