import { describe, it, expect } from 'vitest';
import { matchMode } from '../src/lib/modifiers.js';

const bindings = {
  cell: ['alt'],
  column: ['alt', 'ctrl'],
  row: ['alt', 'shift'],
  table: ['alt', 'ctrl', 'shift'],
};

describe('matchMode', () => {
  it('matches a single-modifier binding exactly', () => {
    expect(matchMode({ alt: true }, bindings)).toBe('cell');
  });

  it('requires an exact set match, not a subset', () => {
    expect(matchMode({ alt: true, ctrl: true }, bindings)).toBe('column');
    expect(matchMode({ alt: true, shift: true }, bindings)).toBe('row');
    expect(matchMode({ alt: true, ctrl: true, shift: true }, bindings)).toBe('table');
  });

  it('treats meta (Cmd) as ctrl for Mac parity', () => {
    expect(matchMode({ alt: true, meta: true }, bindings)).toBe('column');
  });

  it('returns null when no binding is active', () => {
    expect(matchMode({}, bindings)).toBeNull();
    expect(matchMode({ ctrl: true }, bindings)).toBeNull();
  });
});
