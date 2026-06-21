import { describe, it, expect } from 'vitest';
import { computeStats } from '../src/lib/numbers.js';
import { formatNumber, formatStats } from '../src/lib/infobox-format.js';

const usFormat = { decimal: '.', group: ',' };
const euFormat = { decimal: ',', group: '.' };

describe('formatNumber', () => {
  it('groups the integer part', () => {
    expect(formatNumber(1234567, usFormat)).toBe('1,234,567');
  });

  it('keeps a decimal fraction and trims trailing zeros', () => {
    expect(formatNumber(2.5, usFormat)).toBe('2.5');
    expect(formatNumber(2.0, usFormat)).toBe('2');
  });

  it('respects a European locale', () => {
    expect(formatNumber(1234.56, euFormat)).toBe('1.234,56');
  });

  it('handles negatives', () => {
    expect(formatNumber(-1000, usFormat)).toBe('-1,000');
  });
});

describe('formatStats', () => {
  it('renders all five rows when there are numeric values', () => {
    const rows = formatStats(computeStats([1, 2, 3, 4]), usFormat);
    expect(rows).toEqual([
      { label: 'Count', value: '4' },
      { label: 'Sum', value: '10' },
      { label: 'Avg', value: '2.5' },
      { label: 'Min', value: '1' },
      { label: 'Max', value: '4' },
    ]);
  });

  it('renders only Count when there are no numeric values', () => {
    expect(formatStats(computeStats([]), usFormat)).toEqual([
      { label: 'Count', value: '0' },
    ]);
  });
});
