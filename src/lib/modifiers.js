// Pure modifier-key -> selection-mode matching.
//
// Decoupled from the DOM so the selection content script's core decision
// ("which mode is the user requesting?") is unit-tested in modifiers.test.js.

/**
 * Resolve the active modifier keys to a selection mode.
 *
 * meta (Cmd) is folded into ctrl so Mac users get the same bindings as the
 * Ctrl-based defaults. A binding matches only when its set of modifiers is
 * exactly the set held down — holding Alt+Ctrl selects 'column', never 'cell'.
 *
 * @param {{alt?:boolean, ctrl?:boolean, shift?:boolean, meta?:boolean}} active
 * @param {Record<string, string[]>} bindings  mode -> required modifier names.
 * @returns {string|null}  The matched mode, or null.
 */
export function matchMode(active, bindings) {
  const held = new Set();
  if (active.alt) held.add('alt');
  if (active.ctrl || active.meta) held.add('ctrl');
  if (active.shift) held.add('shift');
  if (held.size === 0) return null;

  for (const [mode, mods] of Object.entries(bindings)) {
    if (mods.length === held.size && mods.every((m) => held.has(m))) {
      return mode;
    }
  }
  return null;
}
