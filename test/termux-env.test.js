import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

test('startup Termux memuat file environment tanpa meng-commit secret', async () => {
  const [packageText, configText, ignoreText] = await Promise.all([
    readFile(new URL('../package.json', import.meta.url), 'utf8'),
    readFile(new URL('../config.js', import.meta.url), 'utf8'),
    readFile(new URL('../.gitignore', import.meta.url), 'utf8'),
  ]);
  const packageJson = JSON.parse(packageText);
  assert.match(packageJson.scripts['start:termux'], /--env-file-if-exists=\.env/);
  assert.match(packageJson.scripts['check:nhefinance'], /scripts\/check-nhefinance\.mjs/);
  assert.match(configText, /process\.env\.NHEFINANCE_BOT_SERVICE_SECRET/);
  assert.match(ignoreText, /^\.env$/m);
  assert.match(ignoreText, /^!\.env\.example$/m);
});

test('pemeriksaan Termux menolak secret layanan kosong', () => {
  const result = spawnSync(process.execPath, ['scripts/check-nhefinance.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, NHEFINANCE_BOT_SERVICE_SECRET: '' },
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /NHEFINANCE_BOT_SERVICE_SECRET belum diatur/);
});
