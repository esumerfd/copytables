// User preferences: defaults, merge logic, and chrome.storage.local I/O.
//
// The default/merge logic is pure and unit-tested (preferences.test.js); the
// load/save wrappers touch chrome.storage and are exercised in the browser.

export const DEFAULTS = Object.freeze({
  // Modifier sets that trigger each selection mode (see lib/modifiers.js).
  // Alt = cell, Alt+Cmd = column, Alt+Shift = row, Alt+Cmd+Shift = table.
  // Cmd (meta) is used instead of Ctrl: Ctrl-click pops the macOS context menu.
  modifiers: {
    cell: ['alt'],
    column: ['alt', 'meta'],
    row: ['alt', 'shift'],
    table: ['alt', 'meta', 'shift'],
  },
  // Locale-aware numeric parsing for the infobox.
  numberFormat: { decimal: '.', group: ',' },
  // Format used by the in-page Ctrl/Cmd+C interception.
  defaultFormat: 'asis',
  // Auto-scroll speed (px per animation frame) when dragging past the edge.
  autoScrollSpeed: 12,
  // Show the floating stats infobox while selecting.
  showInfobox: true,
});

const STORAGE_KEY = 'preferences';

/** Deep-clone a JSON-safe value. */
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Overlay stored preferences onto the defaults (one level of nested objects).
 * Never mutates DEFAULTS or the stored argument.
 * @param {object|undefined} stored
 * @returns {typeof DEFAULTS}
 */
export function mergePrefs(stored) {
  const merged = clone(DEFAULTS);
  if (!stored || typeof stored !== 'object') return merged;
  for (const [key, value] of Object.entries(stored)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      merged[key] &&
      typeof merged[key] === 'object' &&
      !Array.isArray(merged[key])
    ) {
      merged[key] = { ...merged[key], ...value };
    } else {
      merged[key] = clone(value);
    }
  }
  return merged;
}

/**
 * Load and merge preferences from chrome.storage.local.
 * @returns {Promise<typeof DEFAULTS>}
 */
export async function load() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return mergePrefs(data[STORAGE_KEY]);
}

/**
 * Persist a (partial) preferences object, merged over what's already stored.
 * @param {object} partial
 * @returns {Promise<typeof DEFAULTS>}
 */
export async function save(partial) {
  const current = await load();
  const next = mergePrefs({ ...stripDefaults(current), ...partial });
  await chrome.storage.local.set({ [STORAGE_KEY]: next });
  return next;
}

// load() returns a full object; re-saving it verbatim is fine, but keeping the
// stored blob minimal is tidier. This is a no-op passthrough for now and exists
// as a single seam if we later want to diff against DEFAULTS.
function stripDefaults(prefs) {
  return prefs;
}
