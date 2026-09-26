/**
 * A cart line. Identity is the combination phoneId + colorName +
 * storageCapacity: adding the same combination twice must merge into one
 * line with a higher quantity, never a duplicate.
 *
 * Display fields (brand, name, imageUrl, unitPrice) are denormalized on
 * purpose: the cart must survive even if the product is no longer served by
 * the API, and unitPrice is the price of the chosen storage at add time.
 */
export interface CartItem {
  phoneId: string;
  colorName: string;
  storageCapacity: string;
  brand: string;
  name: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
}

export type CartItemKey = string;

export function makeCartKey(
  item: Pick<CartItem, 'phoneId' | 'colorName' | 'storageCapacity'>,
): CartItemKey {
  return `${item.phoneId}|${item.colorName}|${item.storageCapacity}`;
}
