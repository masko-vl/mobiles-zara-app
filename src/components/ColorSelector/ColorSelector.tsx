import type { ColorOption } from '../../models/phone';
import styles from './ColorSelector.module.css';

interface ColorSelectorProps {
  options: ColorOption[];
  selected: ColorOption | null;
  onChange: (option: ColorOption) => void;
}

/**
 * Color picker styled as swatches filled with each color's hex code (Figma).
 * Radios are visually hidden; each swatch carries a visually hidden color
 * name so screen readers announce the option, and the selected name is shown
 * as text below the swatches.
 */
export function ColorSelector({ options, selected, onChange }: ColorSelectorProps) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>
        <strong>Color</strong> — pick your favorite
      </legend>
      <div className={styles.options}>
        {options.map((option) => {
          const isSelected = option.name === selected?.name;
          return (
            <label
              key={option.name}
              className={isSelected ? styles.swatchSelected : styles.swatch}
              style={{ backgroundColor: option.hexCode }}
            >
              <input
                type="radio"
                name="color"
                value={option.name}
                checked={isSelected}
                onChange={() => onChange(option)}
                className="visually-hidden"
              />
              <span className="visually-hidden">{option.name}</span>
            </label>
          );
        })}
      </div>
      <p className={styles.selectedName} aria-live="polite">
        {selected?.name}
      </p>
    </fieldset>
  );
}
