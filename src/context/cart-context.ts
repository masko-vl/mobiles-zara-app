import { createContext } from 'react';
import type { CartItem } from '../models/cart';
import type { ColorOption, PhoneDetail, StorageOption } from '../models/phone';

/** Versioned key: changing the CartItem shape invalidates old saved carts. */
export const CART_STORAGE_KEY = 'zara-cart:v1';

export interface CartContextValue {
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
  addItem: (phone: PhoneDetail, color: ColorOption, storage: StorageOption) => void;
  removeItem: (key: string) => void;
}

export const CartContext = createContext<CartContextValue | null>(null);
