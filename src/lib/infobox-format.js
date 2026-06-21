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
 * Build the infobox rows from a stats object.
 * @param {ReturnType<import('./numbers.js').computeStats>} stats
 * @param {{decimal:string, group:string}} numberFormat
 * @returns {Array<{label:string, value:string}>}
 */
export function formatStats(stats, numberFormat) {
  if (stats.count === 0) {
    return [{ label: 'Count', value: '0' }];
  }
  const f = (n) => formatNumber(n, numberFormat);
  return [
    { label: 'Count', value: String(stats.count) },
    { label: 'Sum', value: f(stats.sum) },
    { label: 'Avg', value: f(stats.avg) },
    { label: 'Min', value: f(stats.min) },
    { label: 'Max', value: f(stats.max) },
  ];
}
