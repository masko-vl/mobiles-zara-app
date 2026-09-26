import { act } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../services/apiClient';
import { getPhoneById } from '../services/phoneService';
import type { PhoneDetail } from '../models/phone';
import { usePhone } from './usePhone';

vi.mock('../services/phoneService', () => ({ getPhoneById: vi.fn() }));

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

beforeEach(() => {
  vi.clearAllMocks();
});

describe('usePhone', () => {
  it('loads the detail for the given id', async () => {
    mockedGetPhoneById.mockResolvedValue(detail);

    const { result } = renderHook(() => usePhone('SMG-S24U'));
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.phone).toEqual(detail);
    expect(result.current.error).toBeNull();
  });

  it('refetches when the id changes', async () => {
    mockedGetPhoneById.mockResolvedValue(detail);

    const { result, rerender } = renderHook(({ id }) => usePhone(id), {
      initialProps: { id: 'SMG-S24U' },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({ id: 'GPX-8A' });
    expect(result.current.loading).toBe(true);
    expect(result.current.phone).toBeNull();
    expect(mockedGetPhoneById).toHaveBeenLastCalledWith('GPX-8A', expect.any(AbortSignal));

    // Flush the pending fetch so its state update lands inside this test.
    await act(async () => {});
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('exposes the error (e.g. 404 not found) and supports retry', async () => {
    mockedGetPhoneById.mockRejectedValueOnce(new ApiError(404, 'NOT-FOUND', 'Product not found'));
    mockedGetPhoneById.mockResolvedValueOnce(detail);

    const { result } = renderHook(() => usePhone('NOPE'));
    await waitFor(() => expect(result.current.error).not.toBeNull());

    await act(async () => {
      result.current.retry();
    });
    await waitFor(() => expect(result.current.error).toBeNull());
    expect(result.current.phone).toEqual(detail);
  });

  it('does nothing without an id (malformed URL)', () => {
    renderHook(() => usePhone(undefined));

    expect(mockedGetPhoneById).not.toHaveBeenCalled();
  });
});
