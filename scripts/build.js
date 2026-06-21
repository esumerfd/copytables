// Assemble the loadable MV3 extension into dist/.
//
// Content scripts can't be ES modules, and popup/options pages load plain
// <script> tags, so esbuild bundles each entry. The service worker is emitted
// as an ES module to match "type": "module" in the manifest.

import { build } from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'src');
const dist = resolve(root, 'dist');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const bundles = [
  { in: 'content/content.js', out: 'content.js', format: 'iife' },
  { in: 'background/service-worker.js', out: 'service-worker.js', format: 'esm' },
  { in: 'popup/popup.js', out: 'popup/popup.js', format: 'iife' },
  { in: 'options/options.js', out: 'options/options.js', format: 'iife' },
];

// Each entry needs its own format (iife for content/pages, esm for the
// service worker), so build them one at a time.
for (const b of bundles) {
  await build({
    entryPoints: [resolve(src, b.in)],
    bundle: true,
    outfile: resolve(dist, b.out),
    target: 'chrome120',
    format: b.format,
  });
}

// Static assets.
await cp(resolve(src, 'manifest.json'), resolve(dist, 'manifest.json'));
await cp(resolve(src, 'popup/popup.html'), resolve(dist, 'popup/popup.html'));
await cp(resolve(src, 'options/options.html'), resolve(dist, 'options/options.html'));

console.log('Built extension into dist/');
