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
  it('parses only the numeric cells and ignores the rest', () => {
    const stats = statsFromTexts(['1,000', 'n/a', '500', '']);
    expect(stats.count).toBe(2);
    expect(stats.sum).toBe(1500);
    expect(stats.max).toBe(1000);
    expect(stats.min).toBe(500);
  });
});
