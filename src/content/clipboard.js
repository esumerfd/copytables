// Clipboard writes, performed in the content script under user activation.
//
//  - Text formats (CSV/TSV): built from the tested matrix flattener and written
//    with navigator.clipboard.writeText().
//  - "As is": a clone of the selected block with key computed styles inlined,
//    written as text/html (with a tab-delimited text/plain fallback). This is
//    the modern-API path from the design's clipboard strategy.

import { clipboardText } from '../lib/clipboard-format.js';
import { toDelimited } from '../lib/matrix.js';

// The computed-style properties that carry table fidelity into Word/Docs.
const STYLE_PROPS = [
  'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-collapse', 'background-color', 'color',
  'font-family', 'font-size', 'font-weight', 'font-style',
  'text-align', 'vertical-align', 'padding', 'white-space',
];

/** Copy a CSV/TSV (optionally transposed) format. */
export async function copyTextFormat(matrix, formatId, isSelected) {
  const text = clipboardText(matrix, formatId, { isSelected });
  await navigator.clipboard.writeText(text);
  return text;
}

function inlineStyles(source, target) {
  const cs = getComputedStyle(source);
  const decls = [];
  for (const prop of STYLE_PROPS) {
    const v = cs.getPropertyValue(prop);
    if (v) decls.push(`${prop}: ${v}`);
  }
  target.setAttribute('style', decls.join('; '));
}

/**
 * Build a styled <table> clone of the selected bounding box.
 * @returns {HTMLTableElement}
 */
export function buildStyledTable(matrix, isSelected) {
  const { grid, rows, cols } = matrix;
  const sel = isSelected ?? (() => true);

  let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (cell && sel(cell.el)) {
        minR = Math.min(minR, r); maxR = Math.max(maxR, r);
        minC = Math.min(minC, c); maxC = Math.max(maxC, c);
      }
    }
  }

  const table = document.createElement('table');
  if (maxR < minR) return table;
  inlineStyles(matrixTableOf(matrix) ?? table, table);

  for (let r = minR; r <= maxR; r++) {
    const tr = document.createElement('tr');
    for (let c = minC; c <= maxC; c++) {
      const cell = grid[r][c];
      if (!cell || !cell.isOrigin || !sel(cell.el)) continue;
      const clone = document.createElement(cell.el.tagName === 'TH' ? 'th' : 'td');
      clone.textContent = cell.el.textContent;
      // Clamp spans to the selected box so the clone stays rectangular.
      const span = spanWithin(grid, r, c, cell.el, minR, minC, maxR, maxC);
      if (span.cols > 1) clone.colSpan = span.cols;
      if (span.rows > 1) clone.rowSpan = span.rows;
      inlineStyles(cell.el, clone);
      tr.appendChild(clone);
    }
    table.appendChild(tr);
  }
  return table;
}

function spanWithin(grid, r, c, el, minR, minC, maxR, maxC) {
  let cols = 0;
  for (let cc = c; cc <= maxC && grid[r][cc] && grid[r][cc].el === el; cc++) cols++;
  let rows = 0;
  for (let rr = r; rr <= maxR && grid[rr][c] && grid[rr][c].el === el; rr++) rows++;
  return { cols: Math.max(1, cols), rows: Math.max(1, rows) };
}

function matrixTableOf(matrix) {
  for (const row of matrix.grid) {
    for (const cell of row) {
      if (cell) return cell.el.closest('table');
    }
  }
  return null;
}

/** Copy the selected block as rich, styled HTML. */
export async function copyAsIs(matrix, isSelected) {
  const table = buildStyledTable(matrix, isSelected);
  const html = table.outerHTML;
  const plain = toDelimited(matrix, { delimiter: '\t', isSelected });
  const item = new ClipboardItem({
    'text/html': new Blob([html], { type: 'text/html' }),
    'text/plain': new Blob([plain], { type: 'text/plain' }),
  });
  await navigator.clipboard.write([item]);
  return html;
}
