import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { usePhones } from './hooks/usePhones';
import type { PhoneDetail } from './models/phone';
import { getPhoneById } from './services/phoneService';

vi.mock('./hooks/usePhones', () => ({ usePhones: vi.fn() }));
vi.mock('./services/phoneService', () => ({
  getPhoneById: vi.fn(),
  searchPhones: vi.fn(),
}));

const mockedUsePhones = vi.mocked(usePhones);
const mockedGetPhoneById = vi.mocked(getPhoneById);

const detail: PhoneDetail = {
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
  colorOptions: [],
  storageOptions: [],
  similarProducts: [],
};

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App routing', () => {
  it('renders the catalog at the home route', () => {
    mockedUsePhones.mockReturnValue({
      phones: [],
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderAt('/');

    expect(screen.getByLabelText('Search for a smartphone')).toBeInTheDocument();
  });

  it('renders the phone detail at /product/:id', async () => {
    mockedGetPhoneById.mockResolvedValue(detail);

    renderAt('/product/SMG-S24U');

    expect(await screen.findByRole('heading', { name: 'Galaxy S24 Ultra' })).toBeInTheDocument();
  });

  it('renders the cart view at /cart', () => {
    renderAt('/cart');

    expect(screen.getByRole('heading', { name: /cart \(/i })).toBeInTheDocument();
  });

  it('redirects unknown routes to the catalog', () => {
    mockedUsePhones.mockReturnValue({
      phones: [],
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderAt('/does-not-exist');

    expect(screen.getByLabelText('Search for a smartphone')).toBeInTheDocument();
  });
});
