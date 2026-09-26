// Thin HTTP client for the phones REST API.
//
// Responsibilities:
// - Attach the `x-api-key` auth header to every request (challenge requirement).
// - Normalize every failure into a single `ApiError` type the UI can render,
//   EXCEPT `AbortError`, which is re-thrown untouched so callers can tell
//   "request cancelled" (expected, e.g. a superseded search) apart from
//   "request failed" (needs an error message).
//
// No request timeout is configured on purpose: the free-tier API can take
// 30-60s to wake up, so an aggressive default would break the first load.

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
const API_KEY = import.meta.env.VITE_API_KEY;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiErrorBody {
  error?: string;
  message?: string;
}

interface RequestOptions {
  /** Aborting this signal rejects with the native AbortError (never an ApiError). */
  signal?: AbortSignal;
}

/**
 * True when the error is a request cancellation (not a failure). Callers use
 * this to ignore superseded requests instead of rendering an error message.
 */
export function isAbortError(error: unknown): boolean {
  return (error instanceof DOMException || error instanceof Error) && error.name === 'AbortError';
}

export async function apiGet<T>(
  path: string,
  params?: URLSearchParams | string,
  { signal }: RequestOptions = {},
): Promise<T> {
  if (!API_URL || !API_KEY) {
    throw new ApiError(
      0,
      'MISSING_CONFIG',
      'Missing VITE_API_URL or VITE_API_KEY. Copy .env.example to .env and fill both values.',
    );
  }

  const url = new URL(`${API_URL}${path}`);
  if (params) {
    // URLSearchParams encodes spaces as '+', and we cannot guarantee the
    // backend decodes that; callers needing exact control pass a pre-encoded
    // string (e.g. search queries) instead.
    url.search = typeof params === 'string' ? params : params.toString();
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { 'x-api-key': API_KEY },
      signal,
    });
  } catch (error) {
    // Duck-typing on purpose: DOMException does not extend Error in every
    // environment (it does not in jsdom), so instanceof Error alone would
    // wrongly turn aborted requests into network errors.
    if (isAbortError(error)) throw error;
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Network request failed. Check your connection and try again.',
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => undefined)) as ApiErrorBody | undefined;
    throw new ApiError(
      response.status,
      body?.error ?? `HTTP_${response.status}`,
      body?.message ?? `Request failed with status ${response.status}.`,
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(response.status, 'INVALID_JSON', 'The API returned a malformed response.');
  }
}
