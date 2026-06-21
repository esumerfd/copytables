// Display formatting for the floating infobox.
//
// Turns computeStats() output into locale-formatted label/value rows. Pure and
// unit-tested; the infobox content module renders these rows into the DOM.

/**
 * Format a number for display using the active locale's separators.
 * Trailing zeros in the fraction are trimmed.
 * @param {number} n
 * @param {{decimal:string, group:string}} numberFormat
 * @returns {string}
 */
export function formatNumber(n, numberFormat) {
  const { decimal = '.', group = ',' } = numberFormat;
  const negative = n < 0;
  // Up to 4 fraction digits, then strip trailing zeros and any bare '.'.
  let s = Math.abs(n).toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  let [intPart, fracPart] = s.split('.');

  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  let out = fracPart ? intPart + decimal + fracPart : intPart;
  return negative ? '-' + out : out;
}

/**
 * Build the infobox rows from a stats summary. Count is always shown (the
 * number of selected cells); the numeric rows appear only when the selection
 * contains values that parse as numbers.
 * @param {{count:number, numericCount?:number, sum:number, avg:number|null, min:number|null, max:number|null}} stats
 * @param {{decimal:string, group:string}} numberFormat
 * @returns {Array<{label:string, value:string}>}
 */
export function formatStats(stats, numberFormat) {
  const rows = [{ label: 'Count', value: String(stats.count) }];
  // Fall back to `count` so a plain numeric stats object still renders its rows.
  const numericCount = stats.numericCount ?? stats.count;
  if (numericCount > 0) {
    const f = (n) => formatNumber(n, numberFormat);
    rows.push(
      { label: 'Sum', value: f(stats.sum) },
      { label: 'Avg', value: f(stats.avg) },
      { label: 'Min', value: f(stats.min) },
      { label: 'Max', value: f(stats.max) }
    );
  }
  return rows;
}
