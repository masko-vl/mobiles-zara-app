import { useRef } from 'react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Borderless search input with the single underline from the Figma design.
 * A clear button appears once the user types; it resets the query and returns
 * focus to the input so keyboard users are not dropped on <body>.
 */
export function SearchBar({ value, onChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClear() {
    onChange('');
    inputRef.current?.focus();
  }

  return (
    <div className={styles.wrapper}>
      <label htmlFor="phone-search" className="visually-hidden">
        Search for a smartphone
      </label>
      <input
        ref={inputRef}
        id="phone-search"
        type="search"
        className={styles.input}
        placeholder="Search for a smartphone..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
      />
      {value !== '' && (
        <button
          type="button"
          className={styles.clearButton}
          aria-label="Clear search"
          onClick={handleClear}
        >
          ×
        </button>
      )}
    </div>
  );
}
