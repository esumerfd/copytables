import { describe, it, expect } from 'vitest';
import { buildMatrix } from '../src/lib/matrix.js';
import { FORMATS, isTextFormat, clipboardText } from '../src/lib/clipboard-format.js';

function table2x2() {
  const t = document.createElement('table');
  t.innerHTML = '<tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr>';
  return buildMatrix(t);
}

describe('format registry', () => {
  it('lists the v1 copy formats', () => {
    expect(FORMATS.map((f) => f.id)).toEqual(['asis', 'csv', 'csv-t', 'tsv', 'tsv-t']);
  });

  it('marks asis as the only non-text format', () => {
    expect(isTextFormat('asis')).toBe(false);
    expect(isTextFormat('csv')).toBe(true);
    expect(isTextFormat('tsv-t')).toBe(true);
  });
});

describe('clipboardText', () => {
  it('builds CSV', () => {
    expect(clipboardText(table2x2(), 'csv')).toBe('a,b\nc,d');
  });

  it('builds transposed CSV', () => {
    expect(clipboardText(table2x2(), 'csv-t')).toBe('a,c\nb,d');
  });

  it('builds TSV', () => {
    expect(clipboardText(table2x2(), 'tsv')).toBe('a\tb\nc\td');
  });

  it('builds transposed TSV', () => {
    expect(clipboardText(table2x2(), 'tsv-t')).toBe('a\tc\nb\td');
  });

  it('throws for a non-text format', () => {
    expect(() => clipboardText(table2x2(), 'asis')).toThrow();
  });
});
