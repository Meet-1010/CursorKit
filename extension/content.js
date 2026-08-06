/**
 * Applies the stored cursor to the page, and keeps applying it as settings
 * change.
 *
 * `engine.js` has already run in this same isolated world, so `CursorKit` is
 * populated but idle — nothing is on screen until `boot` is called here. That
 * separation is the point: a site the visitor has switched off should never see
 * a cursor appear and then vanish.
 */

let booted = false;

function apply(store) {
  const ck = window.CursorKit;
  if (!ck) return;

  if (store.off.includes(location.hostname)) {
    if (booted) {
      ck.destroy();
      booted = false;
    }
    return;
  }

  if (booted) {
    ck.update(store.cfg);
  } else {
    // Returns null on touch-only devices, where the native cursor is left alone.
    booted = !!ck.boot(store.cfg);
  }
}

function refresh() {
  chrome.storage.sync.get(CK_STORE, (raw) => {
    if (chrome.runtime.lastError) return;
    apply(ckRead(raw));
  });
}

refresh();

// The popup writes to sync storage; this is how a change reaches the tab that
// is being previewed, without the popup needing to message every tab itself.
chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === 'sync') refresh();
});
