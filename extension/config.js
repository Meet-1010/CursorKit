/**
 * The stored shape, shared by the content script and the popup.
 *
 * Loaded as a plain script in both, rather than imported: content scripts are
 * classic scripts, and keeping one file for both ends is what stops the two
 * from drifting apart on defaults.
 */

const CK_DEFAULTS = {
  style: 'lens-ball',
  click: 'ripple-clean',
  hover: 'scale-expand',
  color: 'ffa132',
  color2: 'ffd9a0',
  size: 1,
  speed: 1,
  opacity: 1,
  adapt: true,
};

/** `off` is a list of hostnames, so "on everywhere except…" is the default. */
const CK_STORE = { cfg: CK_DEFAULTS, off: [] };

/** Normalises whatever came back from storage, which may predate a new field. */
function ckRead(raw) {
  return {
    cfg: { ...CK_DEFAULTS, ...(raw && raw.cfg) },
    off: Array.isArray(raw && raw.off) ? raw.off : [],
  };
}
