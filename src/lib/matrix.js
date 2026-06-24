// Span-aware matrix model for HTML tables.
//
// buildMatrix() walks <tr>/<td>/<th> into a row/col-indexed grid, expanding
// rowspan/colspan so every grid position maps to the DOM cell occupying it.
// toDelimited() flattens that grid to delimited text (CSV for user copies; the
// tab delimiter is used only for the "as is" rich-copy plain-text fallback),
// trimmed to the selected cells.
//
// This module has zero DOM-mutation side effects, which makes it the one piece
// of the codebase that is unit-tested directly (see test/matrix.test.js).

/**
 * @typedef {Object} GridCell
 * @property {HTMLTableCellElement} el  The cell occupying this position.
 * @property {boolean} isOrigin  True only at the cell's top-left position.
 */

/**
 * @typedef {Object} Matrix
 * @property {GridCell[][]} grid  grid[row][col]
 * @property {number} rows
 * @property {number} cols
 */

/**
 * Walk a table into a dense, span-expanded grid.
 * @param {HTMLTableElement} table
 * @returns {Matrix}
 */
export function buildMatrix(table) {
  const trs = Array.from(table.querySelectorAll('tr')).filter(
    (tr) => tr.closest('table') === table
  );
  const grid = [];

  const ensure = (r, c) => {
    while (grid.length <= r) grid.push([]);
    const row = grid[r];
    while (row.length <= c) row.push(null);
  };

  for (let r = 0; r < trs.length; r++) {
    let c = 0;
    for (const el of trs[r].children) {
      if (el.tagName !== 'TD' && el.tagName !== 'TH') continue;
      // Skip past positions already filled by a span from an earlier row.
      while (grid[r] && grid[r][c]) c++;
      const colspan = Math.max(1, el.colSpan || 1);
      const rowspan = Math.max(1, el.rowSpan || 1);
      for (let dr = 0; dr < rowspan; dr++) {
        for (let dc = 0; dc < colspan; dc++) {
          ensure(r + dr, c + dc);
          grid[r + dr][c + dc] = { el, isOrigin: dr === 0 && dc === 0 };
        }
      }
      c += colspan;
    }
  }

  const rows = grid.length;
  const cols = grid.reduce((max, row) => Math.max(max, row.length), 0);
  // Pad ragged rows so every position is addressable.
  for (const row of grid) {
    while (row.length < cols) row.push(null);
  }

  return { grid, rows, cols };
}

/**
 * Flatten a matrix to delimited text (CSV/TSV), trimmed to the selected cells.
 * @param {Matrix} matrix
 * @param {Object} [opts]
 * @param {string} [opts.delimiter=',']  ',' for CSV, '\t' for TSV.
 * @param {boolean} [opts.transpose=false]  Swap rows and columns.
 * @param {(el: HTMLTableCellElement) => boolean} [opts.isSelected]  Defaults to all cells.
 * @returns {string}
 */
export function toDelimited(matrix, opts = {}) {
  const { delimiter = ',', transpose = false } = opts;
  const isSelected = opts.isSelected ?? (() => true);
  const { grid, rows, cols } = matrix;

  // Bounding box of selected positions.
  let minR = Infinity;
  let minC = Infinity;
  let maxR = -Infinity;
  let maxC = -Infinity;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (cell && isSelected(cell.el)) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }
  if (maxR < minR) return '';

  const lines = [];
  for (let r = minR; r <= maxR; r++) {
    const fields = [];
    for (let c = minC; c <= maxC; c++) {
      const cell = grid[r][c];
      // Only the origin position of a (selected) cell carries its text.
      const text =
        cell && cell.isOrigin && isSelected(cell.el) ? cell.el.textContent ?? '' : '';
      fields.push(text);
    }
    lines.push(fields);
  }

  const matrixOut = transpose ? transpose2d(lines) : lines;
  return matrixOut
    .map((row) => row.map((f) => quoteField(f, delimiter)).join(delimiter))
    .join('\n');
}

/**
 * Width (in grid columns) of the bounding box of the selected cells. This is the
 * number of columns a CSV copy of the selection would produce, so callers use it
 * to decide whether a selection is "multi-column" and should auto-copy as CSV.
 * @param {Matrix} matrix
 * @param {(el: HTMLTableCellElement) => boolean} [isSelected]  Defaults to all cells.
 * @returns {number}  0 when nothing is selected.
 */
export function selectedColumnSpan(matrix, isSelected) {
  const sel = isSelected ?? (() => true);
  const { grid, rows, cols } = matrix;
  let minC = Infinity;
  let maxC = -Infinity;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (cell && sel(cell.el)) {
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }
  return maxC < minC ? 0 : maxC - minC + 1;
}

function transpose2d(rows) {
  if (rows.length === 0) return [];
  const out = [];
  for (let c = 0; c < rows[0].length; c++) {
    out.push(rows.map((row) => row[c]));
  }
  return out;
}

function quoteField(field, delimiter) {
  // Tab-delimited (TSV) is not quoted; CSV quotes per RFC 4180.
  if (delimiter !== ',') return field;
  if (/[",\n\r]/.test(field)) {
    return '"' + field.replace(/"/g, '""') + '"';
  }
  return field;
}
