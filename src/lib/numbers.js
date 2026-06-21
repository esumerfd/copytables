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

  // Strip only currency symbols, a percent sign, and whitespace from the ends.
  // Crucially we do NOT remove letters or interior characters: doing so would
  // turn a prose cell ("$8 ... $20 ... $200") into one bogus concatenated
  // number, or leave a lone number plucked out of a sentence ("5 stars").
  s = s.replace(/^[\s$€£¥₹₩¢]+/, '').replace(/[\s%$€£¥₹₩¢]+$/, '');

  // What remains must be a single, complete numeric token. Any leftover letters
  // or a second number (so the cell is prose, not a value) fail this and the
  // cell is ignored by the stats.
  if (!/^[+-]?(\d+(\.\d+)?|\.\d+)([eE][+-]?\d+)?$/.test(s)) return null;

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
 * Summarise a selection's cell texts: how many non-empty cells there are
 * (`count`), and sum/avg/min/max over the subset that parses as numbers.
 * `numericCount` is how many cells contributed to those numeric stats.
 *
 * @param {string[]} texts
 * @param {Object} [opts]  Forwarded to parseNumber (decimal/group).
 * @returns {{count:number, numericCount:number, sum:number, avg:number|null, min:number|null, max:number|null}}
 */
export function statsFromTexts(texts, opts) {
  const values = [];
  let count = 0;
  for (const t of texts) {
    if (String(t ?? '').trim() !== '') count++;
    const n = parseNumber(t, opts);
    if (n !== null) values.push(n);
  }
  const numeric = computeStats(values);
  return {
    count,
    numericCount: numeric.count,
    sum: numeric.sum,
    avg: numeric.avg,
    min: numeric.min,
    max: numeric.max,
  };
}
