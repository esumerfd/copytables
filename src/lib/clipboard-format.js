// Copy-format registry and text rendering.
//
// Maps a v1 copy action to how it is produced. There is no user-facing format
// picker for delimited text: 'csv' is the single text action (multi-column
// selections also auto-copy as CSV — see content.js), and 'asis' is a rich-HTML
// copy driven by the DOM selection in the content script, so it has no text here.
// TSV and the transpose variants were dropped to simplify the menus and
// keystrokes (see design-overview.md "Format selection").

import { toDelimited } from './matrix.js';

/** v1 copy actions, in the order shown in the popup. */
export const FORMATS = [
  { id: 'asis', label: 'Copy As Is', text: false },
  { id: 'csv', label: 'Copy CSV', text: true, delimiter: ',', transpose: false },
];

const BY_ID = new Map(FORMATS.map((f) => [f.id, f]));

/** Is this format produced as plain text (vs. a rich DOM-selection copy)? */
export function isTextFormat(id) {
  const f = BY_ID.get(id);
  return Boolean(f && f.text);
}

/**
 * Render a text-format payload from the matrix.
 * @param {import('./matrix.js').Matrix} matrix
 * @param {string} id  One of the text format ids.
 * @param {Object} [opts]
 * @param {(el: HTMLTableCellElement) => boolean} [opts.isSelected]
 * @returns {string}
 */
export function clipboardText(matrix, id, opts = {}) {
  const f = BY_ID.get(id);
  if (!f || !f.text) {
    throw new Error(`Not a text format: ${id}`);
  }
  return toDelimited(matrix, {
    delimiter: f.delimiter,
    transpose: f.transpose,
    isSelected: opts.isSelected,
  });
}
