import { useState } from 'react';
import { usePhones } from '../../hooks/usePhones';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { SEARCH_DEBOUNCE_MS, usePhoneSearch } from '../../hooks/usePhoneSearch';
import { PhoneCard } from '../../components/PhoneCard/PhoneCard';
import { SearchBar } from '../../components/SearchBar/SearchBar';
import styles from './index.module.css';

/**
 * Home view: debounced API-backed search, results counter and a grid with
 * the phones. While the search is not active (short or empty query) the
 * first 20 phones from the cached base list are shown; once active, the
 * grid renders the API search results instead.
 */
export function PhoneListView() {
  const { phones, loading, error, retry } = usePhones();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const search = usePhoneSearch(debouncedQuery);

  const displayedPhones = search.active ? search.results : phones;
  const listLoading = search.active ? search.loading : loading;
  const listError = search.active ? search.error : error;

  return (
    <section className={styles.section} aria-labelledby="phones-heading">
      <h1 id="phones-heading" className="visually-hidden">
        Smartphone catalog
      </h1>

      {loading && <div className={styles.loadingRule} aria-hidden="true" />}

      <SearchBar value={query} onChange={setQuery} />

      {loading && (
        <p role="status" className="visually-hidden">
          Loading smartphones...
        </p>
      )}

      {listError && (
        <div role="alert" className={styles.status}>
          <p>Something went wrong: {listError.message}</p>
          <button
            type="button"
            onClick={search.active ? search.retry : retry}
            className={styles.retryButton}
          >
            Try again
          </button>
        </div>
      )}

      {!listLoading && !listError && (
        <>
          <p className={styles.resultsCount} aria-live="polite">
            {displayedPhones.length} results
          </p>
          {displayedPhones.length === 0 && (
            <p role="status" className={styles.status}>
              No phones found for “{query.trim()}”. Try a different name or brand.
            </p>
          )}
          <ul className={styles.grid}>
            {displayedPhones.map((phone, index) => (
              <li key={`${phone.id}-${index}`}>
                <PhoneCard phone={phone} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
