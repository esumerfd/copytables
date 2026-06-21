// Copy-format registry and text rendering.
//
// Maps a v1 format id to how it is produced. Text formats (CSV/TSV, with or
// without transpose) flatten the matrix here; 'asis' is a rich-HTML copy
// driven by the DOM selection in the content script, so it has no text here.

import { toDelimited } from './matrix.js';

/** v1 copy formats, in the order shown in the popup. */
export const FORMATS = [
  { id: 'asis', label: 'Copy As Is', text: false },
  { id: 'csv', label: 'Copy as CSV', text: true, delimiter: ',', transpose: false },
  { id: 'csv-t', label: 'Copy as CSV (transposed)', text: true, delimiter: ',', transpose: true },
  { id: 'tsv', label: 'Copy as TSV', text: true, delimiter: '\t', transpose: false },
  { id: 'tsv-t', label: 'Copy as TSV (transposed)', text: true, delimiter: '\t', transpose: true },
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
