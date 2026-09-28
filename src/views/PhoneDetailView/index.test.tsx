import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePhone } from '../../hooks/usePhone';
import type { PhoneDetail } from '../../models/phone';
import { CartProvider } from '../../context/CartProvider';
import { CART_STORAGE_KEY } from '../../context/cart-context';
import { PhoneDetailView } from '.';

vi.mock('../../hooks/usePhone', () => ({ usePhone: vi.fn() }));

const mockedUsePhone = vi.mocked(usePhone);

const detail: PhoneDetail = {
  id: 'SMG-S24U',
  brand: 'Samsung',
  name: 'Galaxy S24 Ultra',
  basePrice: 1329,
  imageUrl: 'https://host/images/s24-default.webp',
  description: 'A phone',
  rating: 4.6,
  specs: {
    screen: '6.8" Dynamic AMOLED 2X',
    resolution: '3120 x 1440 pixels',
    processor: 'Snapdragon 8 Gen 3',
    mainCamera: '200 MP',
    selfieCamera: '12 MP',
    battery: '5000 mAh',
    os: 'Android 14',
    screenRefreshRate: '120 Hz',
  },
  colorOptions: [
    {
      name: 'Titanium Violet',
      hexCode: '#8E6F96',
      imageUrl: 'https://host/images/s24-violet.webp',
    },
    { name: 'Titanium Black', hexCode: '#000000', imageUrl: 'https://host/images/s24-black.webp' },
  ],
  storageOptions: [
    { capacity: '256 GB', price: 1229 },
    { capacity: '512 GB', price: 1329 },
  ],
  similarProducts: [
    {
      id: 'OPP-A18',
      brand: 'OPPO',
      name: 'A18',
      basePrice: 99,
      imageUrl: 'https://host/images/a18.webp',
    },
  ],
};

function detailState(overrides: Partial<ReturnType<typeof usePhone>> = {}) {
  mockedUsePhone.mockReturnValue({
    phone: detail,
    loading: false,
    error: null,
    retry: vi.fn(),
    ...overrides,
  });
}

function renderView() {
  return render(
    <MemoryRouter initialEntries={['/product/SMG-S24U']}>
      <CartProvider>
        <PhoneDetailView />
      </CartProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe('PhoneDetailView', () => {
  it('shows loading status while fetching', () => {
    detailState({ phone: null, loading: true });

    renderView();

    expect(screen.getByRole('status')).toHaveTextContent(/loading phone/i);
  });

  it('renders title, base price and the default image without selections', () => {
    detailState();

    renderView();

    expect(screen.getByRole('heading', { name: 'Galaxy S24 Ultra' })).toBeInTheDocument();
    expect(screen.getByText('From 1329 EUR')).toBeInTheDocument();
    expect(screen.getByAltText('Samsung Galaxy S24 Ultra')).toHaveAttribute(
      'src',
      'https://host/images/s24-default.webp',
    );
  });

  it('keeps the ADD button disabled until storage and color are selected', async () => {
    detailState();
    const user = userEvent.setup();
    renderView();

    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: '256 GB' }));
    expect(addButton).toBeDisabled(); // color still missing

    await user.click(screen.getByRole('radio', { name: 'Titanium Black' }));
    expect(addButton).toBeEnabled();
  });

  it('updates the price and image in real time from the selections', async () => {
    detailState();
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('radio', { name: '256 GB' }));
    expect(screen.getByText('1229 EUR')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Titanium Violet' }));
    expect(screen.getByAltText('Samsung Galaxy S24 Ultra')).toHaveAttribute(
      'src',
      'https://host/images/s24-violet.webp',
    );
    // The selected color name is announced as text below the swatches.
    expect(screen.getByText('Titanium Violet', { selector: 'p' })).toBeInTheDocument();
  });

  it('renders the specification rows', () => {
    detailState();

    renderView();

    const specsSection = screen.getByText('Specifications').closest('section')!;
    expect(within(specsSection).getByText('Brand')).toBeInTheDocument();
    expect(within(specsSection).getByText('Samsung')).toBeInTheDocument();
    expect(within(specsSection).getByText('Snapdragon 8 Gen 3')).toBeInTheDocument();
  });

  it('adds the selected combination to the cart (persisted in localStorage)', async () => {
    detailState();
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('radio', { name: '256 GB' }));
    await user.click(screen.getByRole('radio', { name: 'Titanium Black' }));
    await user.click(screen.getByRole('button', { name: /add/i }));

    const stored = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY)!) as Array<{
      phoneId: string;
      colorName: string;
      storageCapacity: string;
      brand: string;
      name: string;
      imageUrl: string;
      unitPrice: number;
      quantity: number;
    }>;
    expect(stored).toEqual([
      {
        phoneId: 'SMG-S24U',
        colorName: 'Titanium Black',
        storageCapacity: '256 GB',
        brand: 'Samsung',
        name: 'Galaxy S24 Ultra',
        imageUrl: 'https://host/images/s24-black.webp',
        unitPrice: 1229,
        quantity: 1,
      },
    ]);
  });

  it('renders similar items as links', () => {
    detailState();

    renderView();

    expect(screen.getByRole('link', { name: 'OPPO A18, 99 EUR' })).toBeInTheDocument();
  });

  it('shows an error alert with retry and a way back to the catalog', async () => {
    detailState({ phone: null, loading: false, error: new Error('Product not found.') });
    const user = userEvent.setup();
    const retry = vi.fn();
    detailState({ phone: null, loading: false, error: new Error('Product not found.'), retry });

    renderView();

    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: /back to catalog/i })).toHaveAttribute('href', '/');
  });
});
