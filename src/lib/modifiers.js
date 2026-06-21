// Pure modifier-key -> selection-mode matching.
//
// Decoupled from the DOM so the selection content script's core decision
// ("which mode is the user requesting?") is unit-tested in modifiers.test.js.

/**
 * Resolve the active modifier keys to a selection mode.
 *
 * alt, ctrl, shift and meta (Cmd) are each treated as distinct modifiers. The
 * default bindings use Cmd rather than Ctrl because Ctrl-click pops the macOS
 * context menu. A binding matches only when its set of modifiers is exactly the
 * set held down — holding Alt+Cmd selects 'column', never 'cell'.
 *
 * @param {{alt?:boolean, ctrl?:boolean, shift?:boolean, meta?:boolean}} active
 * @param {Record<string, string[]>} bindings  mode -> required modifier names.
 * @returns {string|null}  The matched mode, or null.
 */
export function matchMode(active, bindings) {
  const held = new Set();
  if (active.alt) held.add('alt');
  if (active.ctrl) held.add('ctrl');
  if (active.meta) held.add('meta');
  if (active.shift) held.add('shift');
  if (held.size === 0) return null;

  for (const [mode, mods] of Object.entries(bindings)) {
    if (mods.length === held.size && mods.every((m) => held.has(m))) {
      return mode;
    }
  }
  return null;
}
