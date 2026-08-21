#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const args = parseArgs(process.argv.slice(2));
const repoRoot = path.resolve(args.get('repo-root') ?? process.cwd());
const sourceArgument = args.get('source');
const month = args.get('month');

if (!sourceArgument || !month) {
  fail('Usage: npm run badge:prepare -- --source <image> --month YYYY-MM');
}

if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
  fail(`Invalid month "${month}". Use YYYY-MM.`);
}

const sourcePath = path.resolve(sourceArgument);
const outputDirectory = path.join(repoRoot, 'apps', 'web', 'public', 'trophies');
const registryPath = path.join(
  repoRoot,
  'apps',
  'web',
  'src',
  'app',
  'core',
  'trophy-artwork.ts',
);
const registryKey = `${month}-01`;

await assertSource(sourcePath);
await fs.mkdir(outputDirectory, { recursive: true });

for (const size of [1024, 256]) {
  const outputPath = path.join(outputDirectory, `${month}-${size}.webp`);
  await sharp(sourcePath)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ alphaQuality: 100, effort: 5, quality: 90 })
    .toFile(outputPath);
  console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
}

await registerArtwork(registryPath, registryKey, month);
console.log(`Registered ${registryKey} in ${path.relative(repoRoot, registryPath)}`);

async function assertSource(source) {
  let metadata;
  try {
    metadata = await sharp(source).metadata();
  } catch (error) {
    fail(`Cannot read image "${source}": ${error.message}`);
  }

  if (!['png', 'webp'].includes(metadata.format)) {
    fail(`Unsupported image format "${metadata.format ?? 'unknown'}". Use PNG or WebP.`);
  }

  const { width, height } = metadata;
  if (!width || !height || width !== height) {
    fail(`Image must be square; received ${width ?? '?'}×${height ?? '?'}.`);
  }
  if (width < 1024) {
    fail(`Image must be at least 1024×1024; received ${width}×${height}.`);
  }
  if (width > 4096) {
    fail(`Image must not exceed 4096×4096; received ${width}×${height}.`);
  }
  if (!metadata.hasAlpha || (metadata.channels ?? 0) < 4) {
    fail('Image must contain an alpha channel for transparent artwork.');
  }

  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const alphaAt = (x, y) => data[(y * info.width + x) * info.channels + 3];
  const corners = [
    alphaAt(0, 0),
    alphaAt(info.width - 1, 0),
    alphaAt(0, info.height - 1),
    alphaAt(info.width - 1, info.height - 1),
  ];
  if (corners.some((alpha) => alpha !== 0)) {
    fail('All four image corners must be fully transparent.');
  }

  let transparentPixels = 0;
  for (let offset = 3; offset < data.length; offset += info.channels) {
    if (data[offset] < 255) {
      transparentPixels += 1;
    }
  }
  if (transparentPixels === 0) {
    fail('Image has an alpha channel but no transparent pixels.');
  }

  console.log(
    `Validated ${path.basename(source)} (${width}×${height}, ${metadata.format}, alpha)`,
  );
}

async function registerArtwork(registryFile, key, monthKey) {
  const source = await fs.readFile(registryFile, 'utf8');
  const registryPattern =
    /(const TROPHY_IMAGE_BY_MONTH: Record<string, TrophyImages> = \{\n)([\s\S]*?)(\n\};)/m;
  const match = source.match(registryPattern);
  if (!match) {
    fail(`Cannot find the trophy registry in ${registryFile}.`);
  }

  if (match[2].includes(`'${key}':`)) {
    return;
  }

  const entry = `  '${key}': {\n    thumbnail: '/trophies/${monthKey}-256.webp',\n    hero: '/trophies/${monthKey}-1024.webp',\n  },`;
  const body = `${match[2]}${match[2].trim() ? '\n' : ''}${entry}`;
  const updated = source.replace(registryPattern, `$1${body}$3`);
  await fs.writeFile(registryFile, updated);
}

function parseArgs(values) {
  const parsed = new Map();
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith('--')) {
      fail(`Unexpected argument "${value}".`);
    }
    const key = value.slice(2);
    const next = values[index + 1];
    if (!next || next.startsWith('--')) {
      fail(`Missing value for --${key}.`);
    }
    parsed.set(key, next);
    index += 1;
  }
  return parsed;
}

function fail(message) {
  console.error(`Badge preparation failed: ${message}`);
  process.exit(1);
}
