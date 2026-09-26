import { describe, expect, it } from 'vitest';
import { formatPrice } from './format';

describe('formatPrice', () => {
  it('formats an integer price with the EUR suffix', () => {
    expect(formatPrice(1219)).toBe('1219 EUR');
  });

  it('keeps decimals when the price has them', () => {
    expect(formatPrice(99.5)).toBe('99.5 EUR');
  });

  it('rounds floating-point artifacts from cart totals to cents', () => {
    expect(formatPrice(19.9 * 3)).toBe('59.7 EUR');
  });
});
