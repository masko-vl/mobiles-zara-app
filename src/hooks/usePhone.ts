import { useEffect, useState } from 'react';
import { isAbortError } from '../services/apiClient';
import { getPhoneById } from '../services/phoneService';
import type { PhoneDetail } from '../models/phone';

interface UsePhoneState {
  phone: PhoneDetail | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Detail state for one phone id. Refetches when the id changes (navigating
 * from one detail to another through "similar items") and supports retry.
 */
export function usePhone(id: string | undefined): UsePhoneState & { retry: () => void } {
  const [state, setState] = useState<UsePhoneState>({
    phone: null,
    loading: true,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();
    let active = true;

    setState({ phone: null, loading: true, error: null });

    getPhoneById(id, controller.signal)
      .then((phone) => {
        if (!active) return;
        setState({ phone, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!active || isAbortError(error)) return;
        setState({
          phone: null,
          loading: false,
          error: error instanceof Error ? error : new Error('Unexpected error'),
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [id, attempt]);

  return { ...state, retry: () => setAttempt((a) => a + 1) };
}
