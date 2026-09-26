import { useEffect, useState } from 'react';
import { isAbortError } from '../services/apiClient';
import { getPhones } from '../services/phoneService';
import type { PhoneSummary } from '../models/phone';

/** Challenge requirement: the grid shows the first 20 phones of the list. */
const MAX_PHONES_SHOWN = 20;

// Module-level cache: the product list is identical for the whole session, so
// revisiting the home view must not refetch. Only successful results are
// cached; aborted requests never pollute it.
let phonesCache: PhoneSummary[] | null = null;

/** Test-only escape hatch to reset the module-level cache between tests. */
export function clearPhonesCache(): void {
  phonesCache = null;
}

export interface UsePhonesState {
  phones: PhoneSummary[];
  loading: boolean;
  error: Error | null;
}

export function usePhones(): UsePhonesState & { retry: () => void } {
  // Initialize from the cache so a warm revisit renders instantly with no
  // loading flash and no request.
  const [state, setState] = useState<UsePhonesState>(() =>
    phonesCache
      ? { phones: phonesCache.slice(0, MAX_PHONES_SHOWN), loading: false, error: null }
      : { phones: [], loading: true, error: null },
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (phonesCache) return;

    const controller = new AbortController();
    let active = true;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    getPhones(controller.signal)
      .then((phones) => {
        if (!active) return;
        phonesCache = phones;
        setState({ phones: phones.slice(0, MAX_PHONES_SHOWN), loading: false, error: null });
      })
      .catch((error: unknown) => {
        // Aborted superseded requests are expected; never surface them.
        if (!active || isAbortError(error)) return;
        setState({
          phones: [],
          loading: false,
          error: error instanceof Error ? error : new Error('Unexpected error'),
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  return { ...state, retry: () => setAttempt((a) => a + 1) };
}
