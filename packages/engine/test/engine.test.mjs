/**
 * Smoke tests for the built engine.
 *
 * Runs against `dist/`, not source — the thing that ships is the thing that is
 * checked. Everything here is DOM-free: rendering is verified in a browser via
 * `test/embed.html`, but option parsing, the registry, and the manifest are
 * pure logic and worth guarding automatically.
 *
 *   node --test packages/engine/test
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = (f) => path.join(here, '..', 'dist', f);

const engine = await import(path.join(dist('index.mjs')));
const manifest = await import(path.join(dist('manifest.mjs')));
const sizes = JSON.parse(await readFile(dist('sizes.json'), 'utf8'));

test('every style is registered and well-formed', () => {
  const styles = engine.allStyles();
  assert.ok(styles.length >= 60, `expected 60+ styles, got ${styles.length}`);
  for (const s of styles) {
    assert.match(s.id, /^[a-z0-9-]+$/, `bad id: ${s.id}`);
    assert.equal(typeof s.draw, 'function', `${s.id} has no draw`);
    assert.ok(s.name && s.blurb, `${s.id} is missing name or blurb`);
    assert.ok(s.category, `${s.id} has no category`);
  }
});

test('every click effect is registered and well-formed', () => {
  const effects = engine.allEffects();
  assert.ok(effects.length >= 40, `expected 40+ effects, got ${effects.length}`);
  for (const e of effects) {
    assert.match(e.id, /^[a-z0-9-]+$/, `bad id: ${e.id}`);
    assert.equal(typeof e.spawn, 'function', `${e.id} has no spawn`);
    assert.equal(typeof e.draw, 'function', `${e.id} has no draw`);
    assert.ok(e.name && e.blurb && e.family, `${e.id} is missing metadata`);
  }
});

test('ids are unique across the library', () => {
  for (const [label, list] of [
    ['style', engine.allStyles()],
    ['effect', engine.allEffects()],
    ['hover', engine.allHovers()],
  ]) {
    const ids = list.map((d) => d.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate ${label} id`);
  }
});

test('the manifest matches the registry exactly', () => {
  assert.equal(manifest.STYLE_COUNT, engine.allStyles().length);
  assert.equal(manifest.EFFECT_COUNT, engine.allEffects().length);
  assert.equal(manifest.HOVER_COUNT, engine.allHovers().length);
  assert.equal(
    manifest.COMBINATIONS,
    manifest.STYLE_COUNT * manifest.EFFECT_COUNT * manifest.HOVER_COUNT,
  );
  // Every category and family advertised on the site must contain something,
  // or the gallery renders an empty filter.
  for (const c of manifest.CATEGORIES) {
    assert.ok(
      manifest.styleMeta.some((s) => s.category === c.id),
      `category "${c.id}" has no styles`,
    );
  }
  for (const f of manifest.FAMILIES) {
    assert.ok(
      manifest.effectMeta.some((e) => e.family === f.id),
      `family "${f.id}" has no effects`,
    );
  }
});

test('every style, effect and hover transform has a CDN chunk', () => {
  for (const s of engine.allStyles()) {
    assert.ok(sizes.styles[s.id] > 0, `no chunk built for style ${s.id}`);
  }
  for (const e of engine.allEffects()) {
    assert.ok(sizes.effects[e.id] > 0, `no chunk built for effect ${e.id}`);
  }
  for (const h of engine.allHovers()) {
    // `none` is compiled into core as the fallback, so it has no chunk.
    if (h.id === 'none') continue;
    assert.ok(sizes.hovers[h.id] > 0, `no chunk built for hover ${h.id}`);
  }
});

test('worst-case embed stays inside the 15kb budget', () => {
  // An embed is core plus one of each kind.
  const worst =
    sizes.core +
    Math.max(...Object.values(sizes.styles)) +
    Math.max(...Object.values(sizes.effects)) +
    Math.max(...Object.values(sizes.hovers));
  assert.ok(
    worst <= 15 * 1024,
    `worst case ${(worst / 1024).toFixed(2)}kb exceeds the 15kb budget`,
  );
});

test('hover chunks are individually small', () => {
  // Regression guard: `hover/base.ts` and `hover/more.ts` must not import each
  // other. When they did, tree-shaking failed and every chunk carried all
  // thirty transforms at ~3.8kb apiece, which broke the budget above.
  for (const [id, size] of Object.entries(sizes.hovers)) {
    assert.ok(size < 1536, `hover chunk ${id} is ${size}b — tree-shaking has regressed`);
  }
});

test('palettes are well-formed', () => {
  const { PALETTES } = manifest;
  assert.ok(PALETTES.length >= 20, `expected 20+ palettes, got ${PALETTES.length}`);
  const ids = new Set();
  for (const p of PALETTES) {
    assert.ok(!ids.has(p.id), `duplicate palette id ${p.id}`);
    ids.add(p.id);
    assert.match(p.color, /^[0-9a-f]{6}$/i, `${p.id} primary is not a 6-digit hex`);
    assert.match(p.color2, /^[0-9a-f]{6}$/i, `${p.id} accent is not a 6-digit hex`);
    // A trail that matches its head reads as one flat smear at speed.
    assert.notEqual(p.color.toLowerCase(), p.color2.toLowerCase(), `${p.id} has no contrast`);
    assert.ok(['dark', 'light', 'any'].includes(p.ground), `${p.id} has a bad ground`);
    assert.ok(p.name && p.note, `${p.id} is missing name or note`);
  }
});

test('every category has styles in it', () => {
  for (const c of manifest.CATEGORIES) {
    const n = manifest.styleMeta.filter((s) => s.category === c.id).length;
    assert.ok(n >= 8, `category "${c.id}" has only ${n} styles`);
  }
});

test('every category a palette claims to suit actually exists', () => {
  const known = new Set(manifest.CATEGORIES.map((c) => c.id));
  for (const p of manifest.PALETTES) {
    for (const c of p.suits || []) {
      assert.ok(known.has(c), `palette ${p.id} claims unknown category "${c}"`);
    }
  }
});

test('options are clamped, never trusted', () => {
  const { fromParams } = engine;
  const q = (s) => new URLSearchParams(s);

  assert.equal(fromParams(q('size=999')).size, 3, 'size must clamp to 3');
  assert.equal(fromParams(q('size=-5')).size, 0.4, 'size must clamp to 0.4');
  assert.equal(fromParams(q('size=abc')).size, 1, 'garbage falls back');
  assert.equal(fromParams(q('speed=0')).speed, 0.25);
  assert.equal(fromParams(q('opacity=2')).opacity, 1);

  // A blend mode outside the allow-list would become an arbitrary CSS value.
  assert.equal(fromParams(q('blend=url(evil)')).blend, 'normal');
  assert.equal(fromParams(q('blend=difference')).blend, 'difference');

  // Colours must stay hex — anything else could break out of the CSS context.
  assert.equal(fromParams(q('color=ff00ff')).color, 'ff00ff');
  assert.equal(fromParams(q('color=%23ff00ff')).color, 'ff00ff', 'leading # is stripped');
  assert.equal(fromParams(q('color=red;}body{')).color, 'ffffff', 'non-hex rejected');
  assert.equal(fromParams(q('color=javascript:alert(1)')).color, 'ffffff');
});

test('options round-trip through the query string', () => {
  const { fromParams, toParams, DEFAULTS } = engine;
  const cfg = {
    ...DEFAULTS,
    style: 'comet',
    click: 'spark-burst',
    hover: 'magnet',
    color: 'ff4d9d',
    color2: '9b5cff',
    size: 1.4,
    speed: 0.8,
    blend: 'screen',
  };
  const back = fromParams(new URLSearchParams(toParams(cfg)));
  for (const key of ['style', 'click', 'hover', 'color', 'color2', 'size', 'speed', 'blend']) {
    assert.deepEqual(back[key], cfg[key], `${key} did not survive the round trip`);
  }
});

test('defaults are omitted from the serialised query', () => {
  const { toParams, DEFAULTS } = engine;
  assert.equal(toParams(DEFAULTS), '', 'an all-default config should serialise to nothing');
  assert.equal(toParams({ ...DEFAULTS, style: 'comet' }), 'style=comet');
});

test('the default style and effect actually exist', () => {
  const { DEFAULTS, getStyle, getEffect, getHover } = engine;
  assert.ok(getStyle(DEFAULTS.style), `default style "${DEFAULTS.style}" is not registered`);
  assert.ok(getEffect(DEFAULTS.click), `default effect "${DEFAULTS.click}" is not registered`);
  assert.ok(getHover(DEFAULTS.hover), `default hover "${DEFAULTS.hover}" is not registered`);
});

test('adaptive colour restores contrast without losing hue', () => {
  const { adaptContrast, contrast, rgbToHsl, parseHex } = engine.math;
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 10, g: 13, b: 19 };

  // The failure this feature exists for: a white cursor on a white hero.
  const onWhite = adaptContrast(white, white, 3);
  assert.ok(contrast(onWhite, white) >= 3, 'white on white was not rescued');

  // Hue must survive: a magenta cursor stays magenta, it does not turn grey.
  const magenta = parseHex('ff00ff');
  const fixed = adaptContrast(magenta, white, 3);
  const dh = Math.abs(rgbToHsl(fixed).h - rgbToHsl(magenta).h);
  assert.ok(dh < 0.04 || dh > 0.96, `hue drifted by ${dh.toFixed(3)}`);
  assert.ok(contrast(fixed, white) >= 3, 'magenta on white was not rescued');

  // Already-legible colours must be returned untouched, so a deliberate choice
  // is never "corrected" for no reason.
  assert.deepEqual(adaptContrast(white, black, 3), white, 'white on dark was altered');
});

test('contrast maths matches known WCAG values', () => {
  const { contrast } = engine.math;
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };
  assert.ok(Math.abs(contrast(white, black) - 21) < 0.01, 'black on white should be 21:1');
  assert.ok(Math.abs(contrast(white, white) - 1) < 0.001, 'identical colours should be 1:1');
  // #767676 on white is the canonical 4.5:1 boundary.
  assert.ok(
    Math.abs(contrast({ r: 118, g: 118, b: 118 }, white) - 4.54) < 0.05,
    'known 4.5:1 pair drifted',
  );
});

test('adapt can be turned off through the query string', () => {
  const { fromParams, toParams, DEFAULTS } = engine;
  assert.equal(DEFAULTS.adapt, true, 'adaptation should be on by default');
  assert.equal(fromParams(new URLSearchParams('adapt=0')).adapt, false);
  assert.equal(fromParams(new URLSearchParams('')).adapt, true);
  assert.match(toParams({ ...DEFAULTS, adapt: false }), /adapt=0/);
});

test('math helpers behave at their edges', () => {
  const { clamp, damp, lerp, parseHex, rgba, angleDelta } = engine.math;
  assert.equal(clamp(5, 0, 1), 1);
  assert.equal(lerp(0, 10, 0.25), 2.5);
  // Frame-rate independence: one 100ms step must match ten 10ms steps.
  let a = 0;
  for (let i = 0; i < 10; i++) a = damp(a, 1, 5, 0.01);
  assert.ok(Math.abs(a - damp(0, 1, 5, 0.1)) < 1e-9, 'damp is not frame-rate independent');
  assert.deepEqual(parseHex('#f0f'), { r: 255, g: 0, b: 255 }, 'shorthand hex');
  assert.deepEqual(parseHex('nonsense'), { r: 255, g: 255, b: 255 }, 'falls back to white');
  assert.equal(rgba({ r: 1, g: 2, b: 3 }, 2), 'rgba(1,2,3,1)', 'alpha is clamped');
  assert.ok(Math.abs(angleDelta(0.1, Math.PI * 2 - 0.1) - -0.2) < 1e-9, 'takes the short way');
});
