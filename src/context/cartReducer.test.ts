import { describe, expect, it } from 'vitest';
import type { CartItem } from '../models/cart';
import { makeCartKey } from '../models/cart';
import { cartReducer } from './cartReducer';

function makeItem(overrides: Partial<CartItem> = {}): Omit<CartItem, 'quantity'> {
  return {
    phoneId: 'SMG-S24U',
    colorName: 'Titanium Violet',
    storageCapacity: '256 GB',
    brand: 'Samsung',
    name: 'Galaxy S24 Ultra',
    imageUrl: 'https://host/s24-violet.webp',
    unitPrice: 1229,
    ...overrides,
  };
}

describe('cartReducer', () => {
  it('adds a new item with quantity 1', () => {
    const items = cartReducer([], { type: 'add', item: makeItem() });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ phoneId: 'SMG-S24U', quantity: 1 });
  });

  it('merges repeated adds of the same phone+color+storage into one line', () => {
    let items = cartReducer([], { type: 'add', item: makeItem() });
    items = cartReducer(items, { type: 'add', item: makeItem() });

    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it('keeps different color or storage as separate lines', () => {
    let items = cartReducer([], { type: 'add', item: makeItem() });
    items = cartReducer(items, {
      type: 'add',
      item: makeItem({ colorName: 'Titanium Black' }),
    });
    items = cartReducer(items, {
      type: 'add',
      item: makeItem({ storageCapacity: '512 GB' }),
    });

    expect(items).toHaveLength(3);
    expect(items.map((i) => i.quantity)).toEqual([1, 1, 1]);
  });

  it('removes exactly the line matching the key', () => {
    let items = cartReducer([], { type: 'add', item: makeItem() });
    items = cartReducer(items, {
      type: 'add',
      item: makeItem({ colorName: 'Titanium Black' }),
    });

    items = cartReducer(items, {
      type: 'remove',
      key: makeCartKey(makeItem({ colorName: 'Titanium Black' })),
    });

    expect(items).toHaveLength(1);
    expect(items[0].colorName).toBe('Titanium Violet');
  });

  it('restore replaces the whole state (used by localStorage hydration)', () => {
    const restored: CartItem[] = [{ ...makeItem(), quantity: 3 }];

    const items = cartReducer([], { type: 'restore', items: restored });

    expect(items).toEqual(restored);
  });
});
