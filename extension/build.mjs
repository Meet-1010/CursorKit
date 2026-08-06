/**
 * Assembles the unpacked extension.
 *
 * Everything here is a copy step. The extension has no build of its own on
 * purpose: its cursor engine must be byte-for-byte the one the CDN serves, or
 * a style that looks right in the extension can look wrong on a real site.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, '..', 'packages', 'engine', 'dist');

const library = path.join(dist, 'library.js');
try {
  await fs.access(library);
} catch {
  console.error('extension: packages/engine/dist/library.js is missing — run `npm run engine` first.');
  process.exit(1);
}

await fs.copyFile(library, path.join(here, 'engine.js'));

// Keep the manifest's version in step with the engine's, so a reported bug can
// be traced to an actual build.
const pkg = JSON.parse(
  await fs.readFile(path.join(here, '..', 'packages', 'engine', 'package.json'), 'utf8'),
);
const manifestPath = path.join(here, 'manifest.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
if (manifest.version !== pkg.version) {
  manifest.version = pkg.version;
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

const bytes = (await fs.stat(path.join(here, 'engine.js'))).size;
console.log(`  extension ready — engine.js ${(bytes / 1024).toFixed(0)}kb, v${manifest.version}`);
console.log('  load it: chrome://extensions → Developer mode → Load unpacked → extension/');
