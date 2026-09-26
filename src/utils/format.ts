/**
 * Price rendering follows the Figma design: integer amount + " EUR"
 * suffix (e.g. "1219 EUR").
 */
export function formatPrice(price: number): string {
  // Cart totals accumulate decimal prices; rounding to cents guards against
  // floating-point artifacts such as 59.699999999999996 EUR.
  const rounded = Math.round(price * 100) / 100;
  return `${rounded} EUR`;
}
