import { useEffect, useState } from 'react';
import { isAbortError } from '../services/apiClient';
import { searchPhones } from '../services/phoneService';
import type { PhoneSummary } from '../models/phone';

/** Queries shorter than this never hit the API (not worth a request). */
export const MIN_SEARCH_LENGTH = 2;
export const SEARCH_DEBOUNCE_MS = 400;

interface PhoneSearchState {
  results: PhoneSummary[];
  loading: boolean;
  error: Error | null;
}

/**
 * API-backed search state for a (already debounced) query.
 *
 * Race-condition strategy: every effect run owns an AbortController and an
 * `active` flag. When the query changes, the previous request is aborted and
 * its late response is ignored, so only the latest query can write state.
 * Aborted requests are never surfaced as errors.
 */
export function usePhoneSearch(
  query: string,
): PhoneSearchState & { active: boolean; retry: () => void } {
  const trimmed = query.trim();
  const active = trimmed.length >= MIN_SEARCH_LENGTH;
  const [attempt, setAttempt] = useState(0);

  const [state, setState] = useState<PhoneSearchState>({
    results: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!active) return;

    const controller = new AbortController();
    let latest = true;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    searchPhones(trimmed, controller.signal)
      .then((results) => {
        if (!latest) return;
        setState({ results, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!latest || isAbortError(error)) return;
        setState({
          results: [],
          loading: false,
          error: error instanceof Error ? error : new Error('Unexpected error'),
        });
      });

    return () => {
      latest = false;
      controller.abort();
    };
  }, [trimmed, active, attempt]);

  return { ...state, active, retry: () => setAttempt((a) => a + 1) };
}
