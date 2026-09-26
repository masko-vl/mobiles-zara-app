import { act } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../services/apiClient';
import { getPhones } from '../services/phoneService';
import type { PhoneSummary } from '../models/phone';
import { clearPhonesCache, usePhones } from './usePhones';

vi.mock('../services/phoneService', () => ({ getPhones: vi.fn() }));

const mockedGetPhones = vi.mocked(getPhones);

function makeSummaries(count: number): PhoneSummary[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `P${i}`,
    brand: 'Brand',
    name: `Phone ${i}`,
    basePrice: 100 + i,
    imageUrl: `https://host/images/p${i}.webp`,
  }));
}

beforeEach(() => {
  clearPhonesCache();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('usePhones', () => {
  it('starts loading, then exposes the list capped at the first 20 phones', async () => {
    mockedGetPhones.mockResolvedValue(makeSummaries(25));

    const { result } = renderHook(() => usePhones());
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.phones).toHaveLength(20);
    expect(result.current.error).toBeNull();
  });

  it('exposes the error when the request fails, with a retry that refetches', async () => {
    mockedGetPhones.mockRejectedValueOnce(new ApiError(0, 'NETWORK_ERROR', 'boom'));
    mockedGetPhones.mockResolvedValueOnce(makeSummaries(3));

    const { result } = renderHook(() => usePhones());
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.phones).toHaveLength(0);

    await act(async () => {
      result.current.retry();
    });
    await waitFor(() => expect(result.current.error).toBeNull());
    expect(result.current.phones).toHaveLength(3);
    expect(mockedGetPhones).toHaveBeenCalledTimes(2);
  });

  it('does not surface an error for an aborted request', async () => {
    mockedGetPhones.mockRejectedValue(new DOMException('Aborted', 'AbortError'));

    const { result } = renderHook(() => usePhones());
    await waitFor(() => expect(mockedGetPhones).toHaveBeenCalled());

    expect(result.current.error).toBeNull();
  });

  it('serves a warm revisit from cache without refetching', async () => {
    mockedGetPhones.mockResolvedValue(makeSummaries(5));

    const first = renderHook(() => usePhones());
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    expect(mockedGetPhones).toHaveBeenCalledTimes(1);

    const second = renderHook(() => usePhones());
    expect(second.result.current.loading).toBe(false);
    expect(second.result.current.phones).toHaveLength(5);
    expect(mockedGetPhones).toHaveBeenCalledTimes(1);
  });
});
