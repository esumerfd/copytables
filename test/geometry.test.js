import { describe, it, expect } from 'vitest';
import { buildMatrix } from '../src/lib/matrix.js';
import { cellsForSelection, autoScrollDelta } from '../src/lib/geometry.js';

function grid3x3() {
  const table = document.createElement('table');
  const letters = [
    ['a', 'b', 'c'],
    ['d', 'e', 'f'],
    ['g', 'h', 'i'],
  ];
  for (const row of letters) {
    const tr = document.createElement('tr');
    for (const t of row) {
      const td = document.createElement('td');
      td.textContent = t;
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  return { table, m: buildMatrix(table) };
}

const find = (m, text) => {
  for (const row of m.grid) for (const c of row) if (c && c.el.textContent === text) return c.el;
  throw new Error('not found: ' + text);
};
const texts = (set) => [...set].map((el) => el.textContent).sort().join('');

describe('cellsForSelection — cell mode', () => {
  it('selects the rectangle between anchor and focus', () => {
    const { m } = grid3x3();
    const sel = cellsForSelection(m, find(m, 'a'), find(m, 'e'), 'cell');
    expect(texts(sel)).toBe('abde');
  });

  it('is order independent (focus before anchor)', () => {
    const { m } = grid3x3();
    const sel = cellsForSelection(m, find(m, 'e'), find(m, 'a'), 'cell');
    expect(texts(sel)).toBe('abde');
  });
});

describe('cellsForSelection — column mode', () => {
  it('selects whole columns spanning anchor..focus', () => {
    const { m } = grid3x3();
    expect(texts(cellsForSelection(m, find(m, 'b'), find(m, 'b'), 'column'))).toBe('beh');
    expect(texts(cellsForSelection(m, find(m, 'a'), find(m, 'b'), 'column'))).toBe('abdegh');
  });
});

describe('cellsForSelection — row mode', () => {
  it('selects whole rows spanning anchor..focus', () => {
    const { m } = grid3x3();
    expect(texts(cellsForSelection(m, find(m, 'd'), find(m, 'd'), 'row'))).toBe('def');
    expect(texts(cellsForSelection(m, find(m, 'a'), find(m, 'd'), 'row'))).toBe('abcdef');
  });
});

describe('cellsForSelection — table mode', () => {
  it('selects every cell', () => {
    const { m } = grid3x3();
    expect(texts(cellsForSelection(m, find(m, 'a'), find(m, 'a'), 'table'))).toBe(
      'abcdefghi'
    );
  });
});

describe('cellsForSelection — spans', () => {
  it('includes a spanning cell when the box touches any of its positions', () => {
    const table = document.createElement('table');
    table.innerHTML =
      '<tr><td colspan="2">wide</td><td>c</td></tr>' +
      '<tr><td>d</td><td>e</td><td>f</td></tr>';
    const m = buildMatrix(table);
    const find2 = (t) => [...table.querySelectorAll('td')].find((x) => x.textContent === t);
    // Anchor on 'd' (row1,col0), focus on 'e' (row1,col1) — box is row1 cols0-1,
    // which does not touch the wide cell in row0.
    expect(texts(cellsForSelection(m, find2('d'), find2('e'), 'cell'))).toBe('de');
    // Box from 'wide' to 'e' touches the wide cell.
    expect(
      [...cellsForSelection(m, find2('wide'), find2('e'), 'cell')].map((x) => x.textContent).sort().join('')
    ).toBe('dewide');
  });
});

describe('autoScrollDelta', () => {
  const viewport = { width: 1000, height: 800 };
  const opts = { edge: 50, speed: 10 };

  it('returns zero when the pointer is away from every edge', () => {
    expect(autoScrollDelta({ x: 500, y: 400 }, viewport, opts)).toEqual({ x: 0, y: 0 });
  });

  it('scrolls up/left near the top-left edge', () => {
    const d = autoScrollDelta({ x: 10, y: 5 }, viewport, opts);
    expect(d.x).toBeLessThan(0);
    expect(d.y).toBeLessThan(0);
  });

  it('scrolls down/right near the bottom-right edge', () => {
    const d = autoScrollDelta({ x: 995, y: 790 }, viewport, opts);
    expect(d.x).toBeGreaterThan(0);
    expect(d.y).toBeGreaterThan(0);
  });
});
