/**
 * The builder, as a popup.
 *
 * The style, effect and hover lists are read off the engine rather than
 * hard-coded, so adding a style to the library adds it here with no second
 * place to update — the same rule the website's gallery follows.
 *
 * The popup boots a real cursor over itself, scoped to the stage: previewing on
 * a picture of a cursor is not previewing.
 */

const $ = (id) => document.getElementById(id);

const CATEGORY_ORDER = [
  'minimal', 'geometric', 'fluid', 'trail', 'particle',
  'tech', 'playful', 'luxury', 'neumorphic', 'brutalist',
];
const CATEGORY_NAME = {
  minimal: 'Minimal', geometric: 'Geometric', fluid: 'Fluid', trail: 'Trails',
  particle: 'Particles', tech: 'Tech', playful: 'Playful', luxury: 'Luxury',
  neumorphic: 'Soft UI', brutalist: 'Brutalist',
};

const SWATCHES = ['ffa132', 'ff3b6b', '4cc9f0', '9d4edd', '2ec4b6', 'ffffff'];

let store = ckRead(null);
let writeTimer = 0;

/* ------------------------------------------------------------- controls -- */

function fillStyles(select) {
  const byCat = new Map();
  for (const s of CursorKit.allStyles()) {
    if (!byCat.has(s.category)) byCat.set(s.category, []);
    byCat.get(s.category).push(s);
  }
  const cats = [...byCat.keys()].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b),
  );
  for (const cat of cats) {
    const g = document.createElement('optgroup');
    g.label = CATEGORY_NAME[cat] || cat;
    for (const s of byCat.get(cat)) g.appendChild(new Option(s.name, s.id));
    select.appendChild(g);
  }
}

function fillFlat(select, defs) {
  for (const d of defs) select.appendChild(new Option(d.name, d.id));
}

function fillSwatches() {
  for (const hex of SWATCHES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.style.background = `#${hex}`;
    b.title = `#${hex}`;
    b.addEventListener('click', () => {
      $('color').value = `#${hex}`;
      set({ color: hex });
    });
    $('swatches').appendChild(b);
  }
}

/* --------------------------------------------------------------- state -- */

/** Live-updates the preview immediately; storage catches up on a debounce. */
function set(patch) {
  Object.assign(store.cfg, patch);
  CursorKit.update(store.cfg);
  save();
}

function save() {
  clearTimeout(writeTimer);
  // Dragging a slider must not spend the sync-storage write quota.
  writeTimer = setTimeout(() => chrome.storage.sync.set(store), 180);
}

function paint() {
  const c = store.cfg;
  $('style').value = c.style;
  $('click').value = c.click;
  $('hover').value = c.hover;
  $('color').value = `#${c.color}`;
  $('adapt').checked = c.adapt;
  for (const k of ['size', 'speed', 'opacity']) {
    $(k).value = c[k];
    $(k + 'Out').textContent = Number(c[k]).toFixed(2);
  }
}

/* ---------------------------------------------------------------- boot -- */

async function init() {
  fillStyles($('style'));
  fillFlat($('click'), CursorKit.allEffects());
  fillFlat($('hover'), CursorKit.allHovers());
  fillSwatches();
  $('count').textContent = `${CursorKit.allStyles().length} styles`;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let host = '';
  try {
    host = new URL(tab.url).hostname;
  } catch {
    /* chrome:// and the new-tab page have no host we can act on */
  }
  $('host').textContent = host || 'this page';
  $('enabled').disabled = !host;

  store = ckRead(await chrome.storage.sync.get(CK_STORE));
  $('enabled').checked = !store.off.includes(host);
  paint();

  // The stage wears the cursor; the controls keep the native pointer, so the
  // panel stays usable while a 96px lens ball is being tried out.
  CursorKit.boot({ ...store.cfg, ignore: '[data-native]' });

  $('style').addEventListener('change', (e) => set({ style: e.target.value }));
  $('click').addEventListener('change', (e) => set({ click: e.target.value }));
  $('hover').addEventListener('change', (e) => set({ hover: e.target.value }));
  $('color').addEventListener('input', (e) => set({ color: e.target.value.slice(1) }));
  $('adapt').addEventListener('change', (e) => set({ adapt: e.target.checked }));

  for (const k of ['size', 'speed', 'opacity']) {
    $(k).addEventListener('input', (e) => {
      const v = Number(e.target.value);
      $(k + 'Out').textContent = v.toFixed(2);
      set({ [k]: v });
    });
  }

  $('enabled').addEventListener('change', (e) => {
    if (!host) return;
    store.off = e.target.checked
      ? store.off.filter((h) => h !== host)
      : [...new Set([...store.off, host])];
    save();
  });

  $('reset').addEventListener('click', () => {
    store.cfg = { ...CK_DEFAULTS };
    paint();
    CursorKit.update(store.cfg);
    save();
  });

  // Click effects fire from real clicks on the page; the stage is a page.
  $('stage').addEventListener('pointerdown', (e) => {
    CursorKit.engine?.fire(e.clientX, e.clientY);
  });
}

init();
