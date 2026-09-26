import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiGet } from './apiClient';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiClient', () => {
  it('sends the x-api-key header from the environment and returns parsed JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, [{ id: 'SMG-S24U' }]));
    vi.stubGlobal('fetch', fetchMock);

    const products = await apiGet<Array<{ id: string }>>('/products');

    expect(products).toEqual([{ id: 'SMG-S24U' }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.href).toContain('/products');
    expect(init.headers).toEqual({ 'x-api-key': import.meta.env.VITE_API_KEY });
  });

  it('appends query params to the URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, []));
    vi.stubGlobal('fetch', fetchMock);

    await apiGet('/products', new URLSearchParams({ search: 'galaxy' }));

    const [url] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.href).toContain('/products?search=galaxy');
  });

  it('accepts a pre-encoded query string with %20 spaces untouched', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, []));
    vi.stubGlobal('fetch', fetchMock);

    await apiGet('/products', 'search=samsung%20galaxy');

    const [url] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.search).toBe('?search=samsung%20galaxy');
  });

  it('maps a 401 response to an ApiError with the API error code', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse(401, { error: 'UNAUTHORIZED', message: 'Invalid API key' }),
        ),
    );

    const error = await apiGet('/products').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid API key' });
  });

  it('maps a 404 response to an ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(jsonResponse(404, { error: 'NOT-FOUND', message: 'Product not found' })),
    );

    await expect(apiGet('/products/NOPE')).rejects.toMatchObject({
      status: 404,
      code: 'NOT-FOUND',
    });
  });

  it('maps network failures to a NETWORK_ERROR ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(apiGet('/products')).rejects.toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
    });
  });

  it('re-throws AbortError untouched so callers can ignore cancelled requests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('The user aborted a request.', 'AbortError')),
    );

    const error = await apiGet('/products').catch((e: unknown) => e);

    expect(error).not.toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ name: 'AbortError' });
  });

  it('maps a 200 response with invalid JSON to an INVALID_JSON ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not-json', { status: 200 })));

    await expect(apiGet('/products')).rejects.toMatchObject({
      code: 'INVALID_JSON',
    });
  });
});
