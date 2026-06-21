import { describe, it, expect } from 'vitest';
import { parseNumber, computeStats, statsFromTexts } from '../src/lib/numbers.js';

describe('parseNumber', () => {
  it('parses a plain integer and decimal', () => {
    expect(parseNumber('42')).toBe(42);
    expect(parseNumber('3.14')).toBe(3.14);
  });

  it('strips group separators and surrounding whitespace', () => {
    expect(parseNumber('  1,234,567  ')).toBe(1234567);
  });

  it('strips currency symbols and percent signs', () => {
    expect(parseNumber('$1,234.50')).toBe(1234.5);
    expect(parseNumber('45%')).toBe(45);
  });

  it('handles negative numbers', () => {
    expect(parseNumber('-12.5')).toBe(-12.5);
  });

  it('honors a European locale (comma decimal, dot group)', () => {
    expect(parseNumber('1.234,56', { decimal: ',', group: '.' })).toBe(1234.56);
  });

  it('returns null for non-numeric text', () => {
    expect(parseNumber('hello')).toBeNull();
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('   ')).toBeNull();
  });

  it('does not concatenate digits from prose cells with multiple numbers', () => {
    // Regression: a multi-line/price cell must not collapse into one big number.
    expect(
      parseNumber('$8/month (Go, with ads)$20/month (Plus)$200/month (Pro)')
    ).toBeNull();
    expect(parseNumber('Deep thinking, 5 stars, high quality')).toBeNull();
    expect(parseNumber('100-200')).toBeNull();
    expect(parseNumber('3 of 5')).toBeNull();
  });

  it('still parses a single value carrying units or currency', () => {
    expect(parseNumber('$200')).toBe(200);
    expect(parseNumber('12.5%')).toBe(12.5);
  });
});

describe('computeStats', () => {
  it('computes count/sum/avg/min/max', () => {
    expect(computeStats([1, 2, 3, 4])).toEqual({
      count: 4,
      sum: 10,
      avg: 2.5,
      min: 1,
      max: 4,
    });
  });

  it('returns a zeroed/empty result for no values', () => {
    expect(computeStats([])).toEqual({
      count: 0,
      sum: 0,
      avg: null,
      min: null,
      max: null,
    });
  });
});

describe('statsFromTexts', () => {
  it('counts non-empty cells and numeric values separately', () => {
    const stats = statsFromTexts(['1,000', 'n/a', '500', '']);
    expect(stats.count).toBe(3); // non-empty selected cells
    expect(stats.numericCount).toBe(2); // cells parseable as numbers
    expect(stats.sum).toBe(1500);
    expect(stats.max).toBe(1000);
    expect(stats.min).toBe(500);
  });

  it('counts text-only selections without any numeric stats', () => {
    const stats = statsFromTexts(['Best For', 'Versatile tasks', 'Writing']);
    expect(stats.count).toBe(3);
    expect(stats.numericCount).toBe(0);
    expect(stats.sum).toBe(0);
  });
});
