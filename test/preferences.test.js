import { describe, it, expect } from 'vitest';
import { DEFAULTS, mergePrefs } from '../src/lib/preferences.js';

describe('DEFAULTS', () => {
  it('ships modifier bindings for every selection mode', () => {
    expect(Object.keys(DEFAULTS.modifiers).sort()).toEqual([
      'cell',
      'column',
      'row',
      'table',
    ]);
  });

  it('uses Cmd (meta), not Ctrl, for the combination bindings', () => {
    // Ctrl-click pops the macOS context menu, so Ctrl must not be a default.
    for (const mods of Object.values(DEFAULTS.modifiers)) {
      expect(mods).not.toContain('ctrl');
    }
    expect(DEFAULTS.modifiers.column).toEqual(['alt', 'meta']);
    expect(DEFAULTS.modifiers.table).toEqual(['alt', 'meta', 'shift']);
  });

  it('ships a number format and a default copy format', () => {
    expect(DEFAULTS.numberFormat).toEqual({ decimal: '.', group: ',' });
    expect(DEFAULTS.defaultFormat).toBe('asis');
  });
});

describe('mergePrefs', () => {
  it('returns the defaults when nothing is stored', () => {
    expect(mergePrefs(undefined)).toEqual(DEFAULTS);
    expect(mergePrefs({})).toEqual(DEFAULTS);
  });

  it('overlays stored values onto the defaults without dropping siblings', () => {
    const merged = mergePrefs({ defaultFormat: 'csv', numberFormat: { decimal: ',' } });
    expect(merged.defaultFormat).toBe('csv');
    expect(merged.numberFormat).toEqual({ decimal: ',', group: ',' });
    expect(merged.modifiers).toEqual(DEFAULTS.modifiers);
  });

  it('does not mutate the DEFAULTS object', () => {
    mergePrefs({ defaultFormat: 'csv' });
    expect(DEFAULTS.defaultFormat).toBe('asis');
  });
});
