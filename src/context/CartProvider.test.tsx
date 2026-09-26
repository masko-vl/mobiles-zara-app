import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ColorOption, PhoneDetail, StorageOption } from '../models/phone';
import { CartProvider } from './CartProvider';
import { CART_STORAGE_KEY } from './cart-context';
import { useCart } from './useCart';

const phone: PhoneDetail = {
  id: 'SMG-S24U',
  brand: 'Samsung',
  name: 'Galaxy S24 Ultra',
  basePrice: 1329,
  imageUrl: 'https://host/s24.webp',
  description: 'A phone',
  rating: 4.6,
  specs: {
    screen: '6.8"',
    resolution: '3120 x 1440',
    processor: 'Snapdragon',
    mainCamera: '200 MP',
    selfieCamera: '12 MP',
    battery: '5000 mAh',
    os: 'Android 14',
    screenRefreshRate: '120 Hz',
  },
  colorOptions: [
    { name: 'Titanium Violet', hexCode: '#8E6F96', imageUrl: 'https://host/s24-violet.webp' },
    { name: 'Titanium Black', hexCode: '#000000', imageUrl: 'https://host/s24-black.webp' },
  ],
  storageOptions: [
    { capacity: '256 GB', price: 1229 },
    { capacity: '512 GB', price: 1329 },
  ],
  similarProducts: [],
};

const violet: ColorOption = phone.colorOptions[0];
const black: ColorOption = phone.colorOptions[1];
const storage256: StorageOption = phone.storageOptions[0];
const storage512: StorageOption = phone.storageOptions[1];

let cart: ReturnType<typeof useCart>;

function CartProbe() {
  cart = useCart();
  return null;
}

function renderProvider() {
  return render(
    <CartProvider>
      <CartProbe />
    </CartProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('CartProvider', () => {
  it('starts with an empty cart and zero totals', () => {
    renderProvider();

    expect(cart.items).toEqual([]);
    expect(cart.totalQuantity).toBe(0);
    expect(cart.totalPrice).toBe(0);
  });

  it('adds an item and computes derived totals without storing them', () => {
    renderProvider();

    act(() => {
      cart.addItem(phone, violet, storage256);
    });

    expect(cart.items).toHaveLength(1);
    expect(cart.totalQuantity).toBe(1);
    expect(cart.totalPrice).toBe(1229);
    // The stored payload must not contain derived totals.
    const stored = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY)!) as Array<
      Record<string, unknown>
    >;
    expect(stored[0]).not.toHaveProperty('totalPrice');
    expect(stored[0]).not.toHaveProperty('totalQuantity');
  });

  it('merges identical combinations and separates different ones', () => {
    renderProvider();

    act(() => {
      cart.addItem(phone, violet, storage256);
      cart.addItem(phone, violet, storage256);
      cart.addItem(phone, black, storage256);
      cart.addItem(phone, violet, storage512);
    });

    expect(cart.items).toHaveLength(3);
    expect(cart.totalQuantity).toBe(4);
    expect(cart.totalPrice).toBe(1229 * 2 + 1229 + 1329);
  });

  it('stores the color-specific image and the storage price', () => {
    renderProvider();

    act(() => {
      cart.addItem(phone, black, storage512);
    });

    expect(cart.items[0]).toMatchObject({
      imageUrl: 'https://host/s24-black.webp',
      unitPrice: 1329,
      colorName: 'Titanium Black',
      storageCapacity: '512 GB',
    });
  });

  it('removes an item by key', () => {
    renderProvider();
    act(() => {
      cart.addItem(phone, violet, storage256);
      cart.addItem(phone, black, storage256);
    });

    act(() => {
      cart.removeItem(`${phone.id}|${violet.name}|${storage256.capacity}`);
    });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].colorName).toBe('Titanium Black');
  });

  it('restores the cart from localStorage on mount', () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([
        {
          phoneId: 'SMG-S24U',
          colorName: 'Titanium Violet',
          storageCapacity: '256 GB',
          brand: 'Samsung',
          name: 'Galaxy S24 Ultra',
          imageUrl: 'https://host/s24-violet.webp',
          unitPrice: 1229,
          quantity: 2,
        },
      ]),
    );

    renderProvider();

    expect(cart.items).toHaveLength(1);
    expect(cart.totalQuantity).toBe(2);
    expect(cart.totalPrice).toBe(2458);
  });

  it('ignores corrupted or invalid localStorage content', () => {
    window.localStorage.setItem(CART_STORAGE_KEY, '{not-json');
    renderProvider();
    expect(cart.items).toEqual([]);

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([{ phoneId: 'X', quantity: 0 }]));
    renderProvider();
    expect(cart.items).toEqual([]);
  });

  it('keeps working when localStorage writes fail (quota)', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });

    renderProvider();
    act(() => {
      cart.addItem(phone, violet, storage256);
    });

    expect(cart.items).toHaveLength(1);
    setItemSpy.mockRestore();
  });
});
