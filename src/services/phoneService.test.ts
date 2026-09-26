import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPhoneById, getPhones, searchPhones } from './phoneService';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('phoneService', () => {
  it('getPhones requests /products with auth and rewrites http image URLs to https', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, [
        {
          id: 'SMG-S24U',
          brand: 'Samsung',
          name: 'Galaxy S24 Ultra',
          basePrice: 1329,
          imageUrl: 'http://prueba-tecnica-api-tienda-moviles.onrender.com/images/s24.webp',
        },
      ]),
    );
    vi.stubGlobal('fetch', fetchMock);

    const phones = await getPhones();

    expect(phones[0].imageUrl).toMatch(/^https:\/\//);
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.pathname).toBe('/products');
    expect(init.headers).toEqual({ 'x-api-key': import.meta.env.VITE_API_KEY });
  });

  it('searchPhones sends the query manually encoded (%20 spaces) to the API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, []));
    vi.stubGlobal('fetch', fetchMock);

    await searchPhones('samsung galaxy');

    const [url] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.search).toBe('?search=samsung%20galaxy');
  });

  it('getPhoneById encodes the id and fills the default image from the first color', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        id: 'SMG-S24U',
        brand: 'Samsung',
        name: 'Galaxy S24 Ultra',
        basePrice: 1329,
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
          { name: 'Titanium Violet', hexCode: '#8E6F96', imageUrl: 'http://host/images/v.webp' },
        ],
        storageOptions: [{ capacity: '512 GB', price: 1329 }],
        similarProducts: [
          {
            id: 'OPP-A18',
            brand: 'OPPO',
            name: 'A18',
            basePrice: 99,
            imageUrl: 'http://host/images/a18.webp',
          },
        ],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const detail = await getPhoneById('SMG-S24U');

    // The raw payload has no top-level imageUrl; the first color wins and is
    // normalized to https like every other image.
    expect(detail.imageUrl).toBe('https://host/images/v.webp');
    expect(detail.colorOptions[0].imageUrl).toMatch(/^https:\/\//);
    expect(detail.similarProducts[0].imageUrl).toMatch(/^https:\/\//);
    const [url] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.pathname).toBe('/products/SMG-S24U');
  });
});
