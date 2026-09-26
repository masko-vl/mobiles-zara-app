import type { PhoneDetail, PhoneSummary } from '../models/phone';
import { apiGet } from './apiClient';

/**
 * The API serves image URLs over plain http, which browsers block as mixed
 * content on https deployments. The same host serves them over https, so
 * rewriting the scheme is safe and verified.
 */
function toHttpsUrl(url: string): string {
  return url.replace(/^http:\/\//, 'https://');
}

function normalizeSummary(phone: PhoneSummary): PhoneSummary {
  return { ...phone, imageUrl: toHttpsUrl(phone.imageUrl) };
}

/** Raw detail shape from the API: no top-level imageUrl (verified live). */
type RawPhoneDetail = Omit<PhoneDetail, 'imageUrl'> & { imageUrl?: string };

function normalizeDetail(detail: RawPhoneDetail): PhoneDetail {
  return {
    ...detail,
    // The detail payload has no top-level image; the first color option is
    // the default image the UI shows before any color is picked.
    imageUrl: toHttpsUrl(detail.imageUrl ?? detail.colorOptions[0]?.imageUrl ?? ''),
    colorOptions: detail.colorOptions.map((option) => ({
      ...option,
      imageUrl: toHttpsUrl(option.imageUrl),
    })),
    similarProducts: detail.similarProducts.map(normalizeSummary),
  };
}

/** Full product list (the API has no pagination). */
export function getPhones(signal?: AbortSignal): Promise<PhoneSummary[]> {
  return apiGet<PhoneSummary[]>('/products', undefined, { signal }).then((phones) =>
    phones.map(normalizeSummary),
  );
}

/**
 * Search by name or brand, executed by the API (challenge requirement:
 * never filter the already-loaded array client-side). The query is encoded
 * manually so spaces become %20 instead of the '+' that URLSearchParams
 * would produce.
 */
export function searchPhones(query: string, signal?: AbortSignal): Promise<PhoneSummary[]> {
  return apiGet<PhoneSummary[]>('/products', `search=${encodeURIComponent(query)}`, {
    signal,
  }).then((phones) => phones.map(normalizeSummary));
}

/** Full detail for one phone, including specs, options and similar products. */
export function getPhoneById(id: string, signal?: AbortSignal): Promise<PhoneDetail> {
  return apiGet<RawPhoneDetail>(`/products/${encodeURIComponent(id)}`, undefined, {
    signal,
  }).then(normalizeDetail);
}
