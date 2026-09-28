import type { StorageOption } from '../../models/phone';
import styles from './StorageSelector.module.css';

interface StorageSelectorProps {
  options: StorageOption[];
  selected: StorageOption | null;
  onChange: (option: StorageOption) => void;
}

/**
 * Storage picker styled as bordered boxes (Figma). Real radio inputs inside a
 * fieldset keep native keyboard behaviour (arrow keys) and screen-reader
 * grouping; the visible box is the label.
 */
export function StorageSelector({ options, selected, onChange }: StorageSelectorProps) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>Storage. How much space do you need?</legend>
      <div className={styles.options}>
        {options.map((option) => {
          const isSelected = option.capacity === selected?.capacity;
          return (
            <label
              key={option.capacity}
              className={isSelected ? styles.optionSelected : styles.option}
            >
              <input
                type="radio"
                name="storage"
                value={option.capacity}
                checked={isSelected}
                onChange={() => onChange(option)}
                className="visually-hidden"
              />
              {option.capacity}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
