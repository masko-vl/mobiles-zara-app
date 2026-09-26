import { useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import { CART_STORAGE_KEY, CartContext } from './cart-context';
import type { CartContextValue } from './cart-context';
import { cartReducer } from './cartReducer';
import type { CartItem } from '../models/cart';

function isValidCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.phoneId === 'string' &&
    typeof item.colorName === 'string' &&
    typeof item.storageCapacity === 'string' &&
    typeof item.brand === 'string' &&
    typeof item.name === 'string' &&
    typeof item.imageUrl === 'string' &&
    typeof item.unitPrice === 'number' &&
    Number.isFinite(item.unitPrice) &&
    typeof item.quantity === 'number' &&
    Number.isInteger(item.quantity) &&
    item.quantity >= 1
  );
}

function loadInitialItems(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidCartItem) : [];
  } catch {
    // Corrupted JSON or unavailable storage: start with an empty cart.
    return [];
  }
}

/**
 * Global cart state (the only state that genuinely needs Context: navbar,
 * detail view and cart view all consume it). Persists to localStorage on
 * every change; a failed write (quota, private mode) must never crash the UI.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, undefined, loadInitialItems);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or blocked: the cart keeps working in memory.
    }
  }, [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
      addItem: (phone, color, storage) =>
        dispatch({
          type: 'add',
          item: {
            phoneId: phone.id,
            colorName: color.name,
            storageCapacity: storage.capacity,
            brand: phone.brand,
            name: phone.name,
            imageUrl: color.imageUrl,
            unitPrice: storage.price,
          },
        }),
      removeItem: (key) => dispatch({ type: 'remove', key }),
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
