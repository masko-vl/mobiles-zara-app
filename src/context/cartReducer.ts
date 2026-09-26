import type { CartItem } from '../models/cart';
import { makeCartKey } from '../models/cart';

export type CartAction =
  | { type: 'add'; item: Omit<CartItem, 'quantity'> }
  | { type: 'remove'; key: string }
  | { type: 'restore'; items: CartItem[] };

/**
 * Pure cart state transitions, kept free of React so they are trivially
 * testable. Derived values (total quantity, total price) are never stored
 * here; consumers compute them from the items.
 */
export function cartReducer(items: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'add': {
      const key = makeCartKey(action.item);
      const existing = items.find((item) => makeCartKey(item) === key);
      if (existing) {
        return items.map((item) =>
          makeCartKey(item) === key ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...items, { ...action.item, quantity: 1 }];
    }
    case 'remove':
      return items.filter((item) => makeCartKey(item) !== action.key);
    case 'restore':
      return action.items;
  }
}
