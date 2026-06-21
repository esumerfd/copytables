import { describe, it, expect } from 'vitest';
import { matchMode } from '../src/lib/modifiers.js';

// Cmd (meta) is the default secondary modifier — Ctrl-click pops the macOS
// context menu, so Ctrl is not used in the default bindings.
const bindings = {
  cell: ['alt'],
  column: ['alt', 'meta'],
  row: ['alt', 'shift'],
  table: ['alt', 'meta', 'shift'],
};

describe('matchMode', () => {
  it('matches a single-modifier binding exactly', () => {
    expect(matchMode({ alt: true }, bindings)).toBe('cell');
  });

  it('requires an exact set match, not a subset', () => {
    expect(matchMode({ alt: true, meta: true }, bindings)).toBe('column');
    expect(matchMode({ alt: true, shift: true }, bindings)).toBe('row');
    expect(matchMode({ alt: true, meta: true, shift: true }, bindings)).toBe('table');
  });

  it('treats meta (Cmd) and ctrl as distinct modifiers', () => {
    // Cmd matches the meta binding...
    expect(matchMode({ alt: true, meta: true }, bindings)).toBe('column');
    // ...but Ctrl does not (it would otherwise trigger the macOS context menu).
    expect(matchMode({ alt: true, ctrl: true }, bindings)).toBeNull();
  });

  it('matches a ctrl binding only when ctrl is configured', () => {
    const ctrlBindings = { column: ['alt', 'ctrl'] };
    expect(matchMode({ alt: true, ctrl: true }, ctrlBindings)).toBe('column');
    expect(matchMode({ alt: true, meta: true }, ctrlBindings)).toBeNull();
  });

  it('returns null when no binding is active', () => {
    expect(matchMode({}, bindings)).toBeNull();
    expect(matchMode({ ctrl: true }, bindings)).toBeNull();
  });
});
