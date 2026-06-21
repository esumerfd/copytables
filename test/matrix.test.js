import { describe, it, expect } from 'vitest';
import { buildMatrix, toDelimited } from '../src/lib/matrix.js';

/** Build a <table> from a 2D array of cell descriptors and return the element. */
function makeTable(rows) {
  const table = document.createElement('table');
  for (const row of rows) {
    const tr = document.createElement('tr');
    for (const cell of row) {
      const td = document.createElement(cell.header ? 'th' : 'td');
      td.textContent = cell.text ?? '';
      if (cell.colspan) td.colSpan = cell.colspan;
      if (cell.rowspan) td.rowSpan = cell.rowspan;
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  return table;
}

describe('buildMatrix', () => {
  it('maps a simple grid one DOM cell per position', () => {
    const table = makeTable([
      [{ text: 'a' }, { text: 'b' }],
      [{ text: 'c' }, { text: 'd' }],
    ]);
    const m = buildMatrix(table);
    expect(m.rows).toBe(2);
    expect(m.cols).toBe(2);
    expect(m.grid[0][0].el.textContent).toBe('a');
    expect(m.grid[1][1].el.textContent).toBe('d');
    expect(m.grid[0][0].isOrigin).toBe(true);
  });

  it('expands colspan so spanned positions share the origin element', () => {
    const table = makeTable([
      [{ text: 'wide', colspan: 2 }],
      [{ text: 'c' }, { text: 'd' }],
    ]);
    const m = buildMatrix(table);
    expect(m.cols).toBe(2);
    expect(m.grid[0][0].el.textContent).toBe('wide');
    expect(m.grid[0][1].el.textContent).toBe('wide');
    expect(m.grid[0][0].isOrigin).toBe(true);
    expect(m.grid[0][1].isOrigin).toBe(false);
  });

  it('expands rowspan downward', () => {
    const table = makeTable([
      [{ text: 'tall', rowspan: 2 }, { text: 'b' }],
      [{ text: 'd' }],
    ]);
    const m = buildMatrix(table);
    expect(m.rows).toBe(2);
    expect(m.cols).toBe(2);
    expect(m.grid[0][0].el.textContent).toBe('tall');
    expect(m.grid[1][0].el.textContent).toBe('tall');
    expect(m.grid[1][0].isOrigin).toBe(false);
    expect(m.grid[1][1].el.textContent).toBe('d');
  });
});

describe('toDelimited', () => {
  const simple = () =>
    buildMatrix(
      makeTable([
        [{ text: 'a' }, { text: 'b' }],
        [{ text: 'c' }, { text: 'd' }],
      ])
    );

  it('renders CSV for the whole table by default', () => {
    expect(toDelimited(simple(), { delimiter: ',' })).toBe('a,b\nc,d');
  });

  it('renders TSV', () => {
    expect(toDelimited(simple(), { delimiter: '\t' })).toBe('a\tb\nc\td');
  });

  it('quotes CSV fields containing the delimiter, quotes, or newlines', () => {
    const table = makeTable([
      [{ text: 'x,y' }, { text: 'he said "hi"' }],
      [{ text: 'line1\nline2' }, { text: 'plain' }],
    ]);
    expect(toDelimited(buildMatrix(table), { delimiter: ',' })).toBe(
      '"x,y","he said ""hi"""\n"line1\nline2",plain'
    );
  });

  it('does not quote fields for TSV (tab delimiter, no embedded tabs)', () => {
    const table = makeTable([[{ text: 'a,b' }, { text: 'c' }]]);
    expect(toDelimited(buildMatrix(table), { delimiter: '\t' })).toBe('a,b\tc');
  });

  it('transposes rows and columns', () => {
    expect(toDelimited(simple(), { delimiter: ',', transpose: true })).toBe('a,c\nb,d');
  });

  it('trims to the bounding box of selected cells', () => {
    const table = makeTable([
      [{ text: 'a' }, { text: 'b' }, { text: 'c' }],
      [{ text: 'd' }, { text: 'e' }, { text: 'f' }],
      [{ text: 'g' }, { text: 'h' }, { text: 'i' }],
    ]);
    const selected = new Set(['e', 'f', 'h', 'i']);
    const out = toDelimited(buildMatrix(table), {
      delimiter: ',',
      isSelected: (el) => selected.has(el.textContent),
    });
    expect(out).toBe('e,f\nh,i');
  });

  it('puts a spanned cell value only in its origin position', () => {
    const table = makeTable([
      [{ text: 'wide', colspan: 2 }],
      [{ text: 'c' }, { text: 'd' }],
    ]);
    expect(toDelimited(buildMatrix(table), { delimiter: ',' })).toBe('wide,\nc,d');
  });
});
