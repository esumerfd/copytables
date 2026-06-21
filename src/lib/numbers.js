// Locale-aware number parsing and infobox statistics.
//
// Feeds the floating infobox (count/sum/avg/min/max) shown while selecting.
// Pure functions, unit-tested in test/numbers.test.js.

/**
 * Parse a cell's text into a number, tolerating currency symbols, percent
 * signs, group separators and locale-specific decimal markers.
 *
 * @param {string} text
 * @param {Object} [opts]
 * @param {string} [opts.decimal='.']  Decimal separator for the active locale.
 * @param {string} [opts.group=',']    Thousands/group separator for the locale.
 * @returns {number|null}  The parsed value, or null if not numeric.
 */
export function parseNumber(text, opts = {}) {
  const { decimal = '.', group = ',' } = opts;
  if (text == null) return null;

  let s = String(text).trim();
  if (s === '') return null;

  // Drop the group separator, normalise the decimal separator to '.'.
  s = s.split(group).join('');
  if (decimal !== '.') s = s.split(decimal).join('.');

  // Strip everything that is not part of a JS numeric literal (currency,
  // percent, stray letters), keeping digits, sign, dot and exponent marker.
  s = s.replace(/[^0-9.eE+-]/g, '');
  if (s === '' || s === '-' || s === '+' || s === '.') return null;

  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

/**
 * Reduce a list of numbers to summary statistics.
 * @param {number[]} values
 * @returns {{count:number, sum:number, avg:number|null, min:number|null, max:number|null}}
 */
export function computeStats(values) {
  if (values.length === 0) {
    return { count: 0, sum: 0, avg: null, min: null, max: null };
  }
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    sum += v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { count: values.length, sum, avg: sum / values.length, min, max };
}

/**
 * Parse a list of cell texts and compute stats over the numeric ones.
 * @param {string[]} texts
 * @param {Object} [opts]  Forwarded to parseNumber (decimal/group).
 * @returns {ReturnType<typeof computeStats>}
 */
export function statsFromTexts(texts, opts) {
  const values = [];
  for (const t of texts) {
    const n = parseNumber(t, opts);
    if (n !== null) values.push(n);
  }
  return computeStats(values);
}
