import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(workspaceRoot, '.env');
const outputPath = resolve(workspaceRoot, 'apps/web/public/env.js');
const fileEnvironment = {};

try {
  const contents = await readFile(envPath, 'utf8');
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    fileEnvironment[key] = rawValue.replace(/^(['"])(.*)\1$/, '$2');
  }
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const value = (key) =>
  process.env[key]?.trim() || fileEnvironment[key]?.trim() || '';
const runtimeEnvironment = {
  supabaseUrl: value('SUPABASE_URL'),
  supabasePublishableKey: value('SUPABASE_PUBLISHABLE_KEY'),
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `window.__BILIARDINO_ENV__ = Object.freeze(${JSON.stringify(runtimeEnvironment)});\n`,
  'utf8',
);
