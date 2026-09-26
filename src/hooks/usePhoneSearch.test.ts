import { act } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { searchPhones } from '../services/phoneService';
import type { PhoneSummary } from '../models/phone';
import { usePhoneSearch } from './usePhoneSearch';

vi.mock('../services/phoneService', () => ({ searchPhones: vi.fn() }));

const mockedSearchPhones = vi.mocked(searchPhones);

function makeSummary(id: string): PhoneSummary {
  return {
    id,
    brand: 'Brand',
    name: `Phone ${id}`,
    basePrice: 100,
    imageUrl: `https://h/${id}.webp`,
  };
}

describe('usePhoneSearch', () => {
  it('does not call the API for queries shorter than 2 characters', () => {
    renderHook(() => usePhoneSearch('g'));
    renderHook(() => usePhoneSearch('   '));

    expect(mockedSearchPhones).not.toHaveBeenCalled();
  });

  it('requests the trimmed query and exposes the results', async () => {
    mockedSearchPhones.mockResolvedValue([makeSummary('A'), makeSummary('B')]);

    const { result } = renderHook(() => usePhoneSearch('  galaxy  '));

    expect(mockedSearchPhones).toHaveBeenCalledWith('galaxy', expect.any(AbortSignal));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.results).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('keeps loading while a request is in flight', () => {
    mockedSearchPhones.mockReturnValue(new Promise(() => {})); // never settles

    const { result } = renderHook(() => usePhoneSearch('galaxy'));

    expect(result.current.active).toBe(true);
    expect(result.current.loading).toBe(true);
  });

  it('ignores superseded responses and only the latest query writes state', async () => {
    let resolveFirst: (phones: PhoneSummary[]) => void = () => {};
    let resolveSecond: (phones: PhoneSummary[]) => void = () => {};
    mockedSearchPhones
      .mockImplementationOnce(
        () => new Promise<PhoneSummary[]>((resolve) => (resolveFirst = resolve)),
      )
      .mockImplementationOnce(
        () => new Promise<PhoneSummary[]>((resolve) => (resolveSecond = resolve)),
      );

    const { result, rerender } = renderHook(({ q }) => usePhoneSearch(q), {
      initialProps: { q: 'gal' },
    });
    rerender({ q: 'gala' });

    await act(async () => {
      resolveSecond([makeSummary('LATEST')]);
    });
    expect(result.current.results).toHaveLength(1);

    // The first request resolves late (it was aborted): must be ignored.
    await act(async () => {
      resolveFirst([makeSummary('OLD-1'), makeSummary('OLD-2'), makeSummary('OLD-3')]);
    });
    expect(result.current.results).toHaveLength(1);
  });

  it('exposes the error for a failed search', async () => {
    mockedSearchPhones.mockRejectedValue(new Error('Network request failed.'));

    const { result } = renderHook(() => usePhoneSearch('galaxy'));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.results).toHaveLength(0);
  });
});
