import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from './useDebouncedValue';

afterEach(() => {
  vi.useRealTimers();
});

describe('useDebouncedValue', () => {
  it('keeps the previous value until the delay elapses', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 400), {
      initialProps: { v: 'a' },
    });

    rerender({ v: 'ab' });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('ab');
  });

  it('restarts the timer on every change, emitting only the last value', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 400), {
      initialProps: { v: '' },
    });

    rerender({ v: 'g' });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    rerender({ v: 'ga' });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    rerender({ v: 'gal' });
    act(() => {
      vi.advanceTimersByTime(399);
    });
    expect(result.current).toBe('');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('gal');
  });
});
