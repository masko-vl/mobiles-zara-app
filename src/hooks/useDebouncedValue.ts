import { useEffect, useState } from 'react';

/**
 * Returns `value` only after it has stayed unchanged for `delayMs`.
 * Used so typing in the search box does not fire one API request per
 * keystroke (challenge requirement: debounce the search).
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
