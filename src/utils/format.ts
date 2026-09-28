/**
 * Price rendering: integer amount + " EUR"
 * suffix (e.g. "1219 EUR").
 */
export function formatPrice(price: number): string {
  // Cart totals accumulate decimal prices; rounding to cents guards against
  const rounded = Math.round(price * 100) / 100;
  return `${rounded} EUR`;
}
