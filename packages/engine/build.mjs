/**
 * Engine build.
 *
 * Produces:
 *   dist/index.mjs      ESM library, for the website and anyone with a bundler.
 *   dist/manifest.mjs   Style/effect metadata, importable from Node.
 *   dist/embed.js       Full IIFE with every style and effect. Self-booting.
 *   dist/core.js        Engine only, publishing window.CursorKit.
 *   dist/m/{s,e}-*.js   One chunk per style and per effect.
 *
 * The chunks are what make the size target reachable: a page embedding one
 * style and one click effect loads core plus two small files rather than the
 * whole library. The `@ck/math` alias is the mechanism — in the full builds it
 * resolves to the real module, and in chunk builds to a shim that reads the
 * same helpers off the already-loaded core.
 *
 * Chunk entries are discovered by introspection rather than a hand-written map:
 * each source file is compiled to a temporary ESM module, imported, and any
 * export that looks like a style or effect definition is picked up. A new style
 * is therefore shipped by exporting it — there is no second place to update.
 */
import { build } from 'esbuild';
import { execFile } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const src = (p) => path.join(root, 'src', p);
const out = (p) => path.join(root, 'dist', p);
const tmp = (p) => path.join(root, '.build-tmp', p);
const sizeOnly = process.argv.includes('--size');

const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));

const REAL_MATH = { '@ck/math': src('core/math.ts') };
const SHIM_MATH = { '@ck/math': src('core/math-shim.ts') };

const STYLE_FILES = [
  'minimal', 'geometric', 'fluid', 'trails',
  'particles', 'tech', 'playful', 'luxury',
  'neumorphic', 'brutalist', 'more',
].map((n) => `styles/${n}.ts`);

const EFFECT_FILES = [
  'ripple', 'burst', 'shock', 'ink',
  'digital', 'physics', 'portal', 'subtle',
  'material', 'chaos',
].map((n) => `effects/${n}.ts`);

// Hover transforms are chunked too — see the note in `core-entry.ts`. These are
// the definition files, deliberately not the `hover/index.ts` barrel: chunking
// from a file that imports its sibling defeats tree-shaking entirely.
const HOVER_FILES = ['hover/base.ts', 'hover/more.ts'];

const base = {
  bundle: true,
  target: ['es2020', 'chrome90', 'firefox90', 'safari15'],
  legalComments: 'none',
  logLevel: 'warning',
  define: { __VERSION__: JSON.stringify(pkg.version) },
};

const gz = (code) => gzipSync(Buffer.from(code), { level: 9 }).length;
const kb = (n) => (n / 1024).toFixed(2) + 'kb';
const toUrl = (p) => 'file://' + p.split(path.sep).join('/');

/**
 * Compile one source file to ESM and enumerate the definitions it exports.
 * Returns [{ id, exportName }].
 */
async function probe(relFile, kind) {
  const outfile = tmp(`probe-${relFile.replace(/[\\/]/g, '-')}.mjs`);
  await build({
    ...base,
    entryPoints: [src(relFile)],
    outfile,
    format: 'esm',
    platform: 'neutral',
    alias: REAL_MATH,
  });
  // Cache-bust so repeated builds in one process see fresh modules.
  const mod = await import(toUrl(outfile) + `?t=${Date.now()}`);
  const found = [];
  const seen = new Set();
  for (const [exportName, value] of Object.entries(mod)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    if (typeof value.id !== 'string' || typeof value.name !== 'string') continue;
    // Discriminated by shape: styles draw, effects spawn, hover transforms do
    // neither and are identified by exclusion.
    const looksRight =
      kind === 's'
        ? typeof value.draw === 'function'
        : kind === 'e'
          ? typeof value.spawn === 'function'
          : typeof value.draw !== 'function' && typeof value.spawn !== 'function';
    if (!looksRight) continue;
    // `hover/index.ts` re-exports everything in `hover/more.ts`, so the same
    // definition can be reached twice. First file to claim an id wins.
    if (seen.has(value.id)) continue;
    seen.add(value.id);
    found.push({ id: value.id, exportName });
  }
  return found;
}

async function main() {
  await fs.rm(out('.'), { recursive: true, force: true });
  await fs.rm(path.join(root, '.build-tmp'), { recursive: true, force: true });
  await fs.mkdir(out('m'), { recursive: true });
  await fs.mkdir(tmp('.'), { recursive: true });

  /* 1. ESM library and manifest ------------------------------------------ */
  await build({
    ...base,
    entryPoints: [src('index.ts')],
    outfile: out('index.mjs'),
    format: 'esm',
    platform: 'neutral',
    alias: REAL_MATH,
  });
  await build({
    ...base,
    entryPoints: [src('manifest.ts')],
    outfile: out('manifest.mjs'),
    format: 'esm',
    platform: 'neutral',
    alias: REAL_MATH,
  });

  /* 2. Full embed, core-only, and the embeddable dashboard ----------------*/
  for (const [entry, file] of [
    ['embed.ts', 'embed.js'],
    ['core-entry.ts', 'core.js'],
    ['dashboard.ts', 'dashboard.js'],
  ]) {
    await build({
      ...base,
      entryPoints: [src(entry)],
      outfile: out(file),
      format: 'iife',
      platform: 'browser',
      minify: true,
      alias: REAL_MATH,
    });
  }

  /* 3. Per-definition chunks --------------------------------------------- */
  const sizes = { version: pkg.version, core: 0, styles: {}, effects: {}, hovers: {} };
  const index = { styles: {}, effects: {}, hovers: {} };

  const REGISTER = { s: 'registerStyle', e: 'registerEffect', h: 'registerHover' };

  const emitChunks = async (files, kind) => {
    const register = REGISTER[kind];
    const bucket = kind === 's' ? sizes.styles : kind === 'e' ? sizes.effects : sizes.hovers;
    const idx = kind === 's' ? index.styles : kind === 'e' ? index.effects : index.hovers;
    // Deduplicate across files, not just within one: `hover/index.ts`
    // re-exports `hover/more.ts`, so both probes see the same definitions.
    const claimed = new Set();

    for (const rel of files) {
      const defs = await probe(rel, kind);
      if (!defs.length) throw new Error(`No ${kind} definitions found in ${rel}`);
      for (const { id, exportName } of defs) {
        if (claimed.has(id)) continue;
        claimed.add(id);
        const entry = tmp(`${kind}-${id}.ts`);
        // Importing the single named export lets esbuild drop the rest of the
        // category file — that is where the size win actually comes from.
        await fs.writeFile(
          entry,
          `import { ${exportName} } from ${JSON.stringify(src(rel).replace(/\.ts$/, ''))};\n` +
            `(globalThis as any).CursorKit.${register}(${exportName});\n`,
          'utf8',
        );
        const dest = out(`m/${kind}-${id}.js`);
        await build({
          ...base,
          entryPoints: [entry],
          outfile: dest,
          format: 'iife',
          platform: 'browser',
          minify: true,
          alias: SHIM_MATH,
        });
        bucket[id] = gz(await fs.readFile(dest, 'utf8'));
        idx[id] = `m/${kind}-${id}.js`;
      }
    }
  };

  await emitChunks(STYLE_FILES, 's');
  await emitChunks(EFFECT_FILES, 'e');
  await emitChunks(HOVER_FILES, 'h');

  /* 4. Types -------------------------------------------------------------- */
  if (!sizeOnly) {
    try {
      await promisify(execFile)('npx', ['tsc', '--emitDeclarationOnly'], { cwd: root });
    } catch (e) {
      const msg = (e.stdout || e.message || '').split('\n').slice(0, 12).join('\n');
      console.warn('[engine] type declarations not emitted:\n' + msg);
    }
  }

  /* 5. Report ------------------------------------------------------------- */
  sizes.core = gz(await fs.readFile(out('core.js'), 'utf8'));
  const embedSize = gz(await fs.readFile(out('embed.js'), 'utf8'));
  const dashSize = gz(await fs.readFile(out('dashboard.js'), 'utf8'));
  await fs.writeFile(out('sizes.json'), JSON.stringify(sizes, null, 2));
  await fs.writeFile(out('index.json'), JSON.stringify(index, null, 2));
  await fs.rm(path.join(root, '.build-tmp'), { recursive: true, force: true });

  const s = Object.values(sizes.styles);
  const e = Object.values(sizes.effects);
  const h = Object.values(sizes.hovers);
  const median = (a) => {
    const t = [...a].sort((x, y) => x - y);
    return t.length ? t[Math.floor(t.length / 2)] : 0;
  };
  // An embed is core + one style + one effect + one hover transform.
  const worst = sizes.core + Math.max(...s, 0) + Math.max(...e, 0) + Math.max(...h, 0);
  const typical = sizes.core + median(s) + median(e) + median(h);
  const budget = 15 * 1024;

  const heaviest = Object.entries(sizes.styles).sort((a, b) => b[1] - a[1])[0];

  console.log(`
  CursorKit engine v${pkg.version}
  ──────────────────────────────────────────────
  ${String(s.length).padStart(3)} cursor styles     ${kb(median(s)).padStart(8)} gz median
  ${String(e.length).padStart(3)} click effects     ${kb(median(e)).padStart(8)} gz median
  ${String(h.length).padStart(3)} hover transforms  ${kb(median(h)).padStart(8)} gz median
  core.js               ${kb(sizes.core).padStart(8)} gz
  ──────────────────────────────────────────────
  typical embed         ${kb(typical).padStart(8)} gz
  worst-case embed      ${kb(worst).padStart(8)} gz   (${heaviest[0]})
  embed.js (whole lib)  ${kb(embedSize).padStart(8)} gz
  dashboard.js          ${kb(dashSize).padStart(8)} gz
  ──────────────────────────────────────────────
  ${worst <= budget ? '✓' : '✗'} 15kb budget: worst case is ${kb(worst)}
`);

  if (worst > budget) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
