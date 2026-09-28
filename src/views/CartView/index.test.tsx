import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { CartProvider } from '../../context/CartProvider';
import { CART_STORAGE_KEY } from '../../context/cart-context';
import type { CartItem } from '../../models/cart';
import { CartView } from '.';

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    phoneId: 'SMG-S24U',
    colorName: 'Titanium Violet',
    storageCapacity: '512 GB',
    brand: 'Samsung',
    name: 'Galaxy S24 Ultra',
    imageUrl: 'https://host/s24-violet.webp',
    unitPrice: 1329,
    quantity: 1,
    ...overrides,
  };
}

function seedCart(items: CartItem[]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

function renderView() {
  return render(
    <MemoryRouter initialEntries={['/cart']}>
      <CartProvider>
        <CartView />
      </CartProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('CartView', () => {
  it('renders each line with image, name, chosen options and unit price', () => {
    seedCart([
      makeItem(),
      makeItem({
        phoneId: 'GPX-8A',
        brand: 'Google',
        name: 'Pixel 8a',
        colorName: 'Obsidian',
        storageCapacity: '128 GB',
        unitPrice: 459,
        imageUrl: 'https://host/pixel.webp',
      }),
    ]);

    renderView();

    expect(screen.getByRole('heading', { name: 'Cart (2)' })).toBeInTheDocument();
    expect(screen.getByAltText('Samsung Galaxy S24 Ultra')).toHaveAttribute(
      'src',
      'https://host/s24-violet.webp',
    );
    expect(screen.getByText('512 GB | Titanium Violet')).toBeInTheDocument();
    expect(screen.getByText('1329 EUR')).toBeInTheDocument();
    expect(screen.getByText('128 GB | Obsidian')).toBeInTheDocument();
  });

  it('shows the sum of all lines as the total', () => {
    seedCart([
      makeItem({ quantity: 2 }),
      makeItem({
        phoneId: 'GPX-8A',
        brand: 'Google',
        name: 'Pixel 8a',
        colorName: 'Obsidian',
        storageCapacity: '128 GB',
        unitPrice: 459,
        imageUrl: 'https://host/pixel.webp',
      }),
    ]);

    renderView();

    expect(screen.getByText('3117 EUR')).toBeInTheDocument();
  });

  it('removes a single line and updates heading and total', async () => {
    const user = userEvent.setup();
    seedCart([
      makeItem({ quantity: 2 }),
      makeItem({
        phoneId: 'GPX-8A',
        brand: 'Google',
        name: 'Pixel 8a',
        colorName: 'Obsidian',
        storageCapacity: '128 GB',
        unitPrice: 459,
        imageUrl: 'https://host/pixel.webp',
      }),
    ]);

    renderView();
    await user.click(
      screen.getByRole('button', {
        name: 'Remove Galaxy S24 Ultra, 512 GB, Titanium Violet',
      }),
    );

    expect(screen.getByRole('heading', { name: 'Cart (1)' })).toBeInTheDocument();
    expect(screen.getByText('459 EUR', { selector: 'span' })).toBeInTheDocument();
    expect(screen.queryByText('Galaxy S24 Ultra')).not.toBeInTheDocument();
    // Persistence stays in sync after the removal.
    const stored = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY)!) as CartItem[];
    expect(stored).toHaveLength(1);
    expect(stored[0].phoneId).toBe('GPX-8A');
  });

  it('shows an empty cart without totals or pay', () => {
    seedCart([]);

    renderView();

    expect(screen.getByRole('heading', { name: 'Cart (0)' })).toBeInTheDocument();
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    expect(screen.queryByText('Total')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pay' })).not.toBeInTheDocument();
  });

  it('links back to the catalog via Continue shopping', () => {
    seedCart([makeItem()]);

    renderView();

    expect(screen.getByRole('link', { name: /continue shopping/i })).toHaveAttribute('href', '/');
  });
});
