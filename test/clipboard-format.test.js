import { describe, it, expect } from 'vitest';
import { buildMatrix } from '../src/lib/matrix.js';
import { FORMATS, isTextFormat, clipboardText } from '../src/lib/clipboard-format.js';

function table2x2() {
  const t = document.createElement('table');
  t.innerHTML = '<tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr>';
  return buildMatrix(t);
}

describe('format registry', () => {
  it('lists only the two selectable v1 copy actions (no TSV, no transpose)', () => {
    expect(FORMATS.map((f) => f.id)).toEqual(['asis', 'csv']);
  });

  it('marks asis as the only non-text format', () => {
    expect(isTextFormat('asis')).toBe(false);
    expect(isTextFormat('csv')).toBe(true);
  });
});

describe('clipboardText', () => {
  it('builds CSV', () => {
    expect(clipboardText(table2x2(), 'csv')).toBe('a,b\nc,d');
  });

  it('throws for a non-text format', () => {
    expect(() => clipboardText(table2x2(), 'asis')).toThrow();
  });
});
