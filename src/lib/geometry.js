// Pure selection geometry and auto-scroll math.
//
// Given a span-aware matrix and an anchor/focus cell, decide which cells a
// drag selects in each mode. And given a pointer near the viewport edge,
// decide how far to auto-scroll. Both are unit-tested in geometry.test.js;
// the content script only wires DOM events to these functions.

/** Map a cell element to the grid positions it occupies. */
function positionsOf(matrix, el) {
  const positions = [];
  for (let r = 0; r < matrix.rows; r++) {
    for (let c = 0; c < matrix.cols; c++) {
      const cell = matrix.grid[r][c];
      if (cell && cell.el === el) positions.push({ r, c });
    }
  }
  return positions;
}

function boundsOf(positions) {
  let minR = Infinity;
  let maxR = -Infinity;
  let minC = Infinity;
  let maxC = -Infinity;
  for (const { r, c } of positions) {
    if (r < minR) minR = r;
    if (r > maxR) maxR = r;
    if (c < minC) minC = c;
    if (c > maxC) maxC = c;
  }
  return { minR, maxR, minC, maxC };
}

/**
 * Compute the set of cell elements selected by dragging from anchor to focus.
 * @param {import('./matrix.js').Matrix} matrix
 * @param {HTMLTableCellElement} anchorEl
 * @param {HTMLTableCellElement} focusEl
 * @param {'cell'|'column'|'row'|'table'} mode
 * @returns {Set<HTMLTableCellElement>}
 */
export function cellsForSelection(matrix, anchorEl, focusEl, mode) {
  const a = boundsOf(positionsOf(matrix, anchorEl));
  const f = boundsOf(positionsOf(matrix, focusEl));

  let rowStart = Math.min(a.minR, f.minR);
  let rowEnd = Math.max(a.maxR, f.maxR);
  let colStart = Math.min(a.minC, f.minC);
  let colEnd = Math.max(a.maxC, f.maxC);

  if (mode === 'column' || mode === 'table') {
    rowStart = 0;
    rowEnd = matrix.rows - 1;
  }
  if (mode === 'row' || mode === 'table') {
    colStart = 0;
    colEnd = matrix.cols - 1;
  }

  const selected = new Set();
  for (let r = rowStart; r <= rowEnd; r++) {
    for (let c = colStart; c <= colEnd; c++) {
      const cell = matrix.grid[r] && matrix.grid[r][c];
      if (cell) selected.add(cell.el);
    }
  }
  return selected;
}

/**
 * How far to auto-scroll given a pointer position relative to the viewport.
 * Returns px deltas; magnitude ramps up the closer the pointer is to an edge.
 * @param {{x:number, y:number}} pointer  Client coordinates.
 * @param {{width:number, height:number}} viewport
 * @param {{edge?:number, speed?:number}} [opts]
 * @returns {{x:number, y:number}}
 */
export function autoScrollDelta(pointer, viewport, opts = {}) {
  const edge = opts.edge ?? 50;
  const speed = opts.speed ?? 12;

  const axis = (pos, size) => {
    if (pos < edge) {
      const intensity = (edge - pos) / edge; // 0..1, strongest at the edge
      return -Math.ceil(speed * intensity);
    }
    if (pos > size - edge) {
      const intensity = (pos - (size - edge)) / edge;
      return Math.ceil(speed * intensity);
    }
    return 0;
  };

  return { x: axis(pointer.x, viewport.width), y: axis(pointer.y, viewport.height) };
}
