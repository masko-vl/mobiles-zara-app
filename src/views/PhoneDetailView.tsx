import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ColorSelector } from '../components/ColorSelector/ColorSelector';
import { PhoneCard } from '../components/PhoneCard/PhoneCard';
import { SpecsList } from '../components/SpecsList/SpecsList';
import { StorageSelector } from '../components/StorageSelector/StorageSelector';
import { useCart } from '../context/useCart';
import { usePhone } from '../hooks/usePhone';
import type { ColorOption, StorageOption } from '../models/phone';
import { formatPrice } from '../utils/format';
import styles from './PhoneDetailView.module.css';

/**
 * Detail view (Figma): big image that follows the selected color, storage and
 * color pickers, live price, specs table, similar items strip and an ADD
 * button that stays disabled until both options are chosen.
 */
export function PhoneDetailView() {
  const { id } = useParams<{ id: string }>();
  const { phone, loading, error, retry } = usePhone(id);
  const { addItem } = useCart();
  const [selectedStorage, setSelectedStorage] = useState<StorageOption | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);

  // Navigating between details (similar items) reuses this component instance.
  useEffect(() => {
    setSelectedStorage(null);
    setSelectedColor(null);
  }, [id]);

  if (loading) {
    // Figma "Loading": chrome only, with the rule under the navbar. The
    // status stays available to screen readers while the area is blank.
    return (
      <div className={styles.loadingState}>
        <p role="status" className="visually-hidden">
          Loading phone...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className={styles.status}>
        <p>Something went wrong: {error.message}</p>
        <button type="button" onClick={retry} className={styles.retryButton}>
          Try again
        </button>
        <Link to="/" className={styles.backLink}>
          Back to catalog
        </Link>
      </div>
    );
  }

  if (!phone) return null;

  const canAdd = selectedStorage !== null && selectedColor !== null;
  const price = selectedStorage ? selectedStorage.price : phone.basePrice;
  const image = selectedColor?.imageUrl ?? phone.imageUrl;

  // The button is disabled unless both selections exist, so the guard below
  // is unreachable in practice; it keeps TypeScript and runtime safe.
  function handleAdd() {
    if (!phone || !selectedStorage || !selectedColor) return;
    addItem(phone, selectedColor, selectedStorage);
  }

  return (
    <section className={styles.section} aria-labelledby="phone-heading">
      <Link to="/" className={styles.backLink}>
        ‹ Back
      </Link>

      <div className={styles.topGrid}>
        <img src={image} alt={`${phone.brand} ${phone.name}`} className={styles.image} />
        <div className={styles.purchase}>
          <h1 id="phone-heading" className={styles.title}>
            {phone.name}
          </h1>
          <p className={styles.price} aria-live="polite">
            {selectedStorage ? formatPrice(price) : `From ${formatPrice(price)}`}
          </p>

          <StorageSelector
            options={phone.storageOptions}
            selected={selectedStorage}
            onChange={setSelectedStorage}
          />
          <ColorSelector
            options={phone.colorOptions}
            selected={selectedColor}
            onChange={setSelectedColor}
          />

          <button type="button" className={styles.addButton} disabled={!canAdd} onClick={handleAdd}>
            Add
          </button>
        </div>
      </div>

      <SpecsList phone={phone} />

      {phone.similarProducts.length > 0 && (
        <section className={styles.similarSection} aria-labelledby="similar-heading">
          <h2 id="similar-heading" className={styles.similarHeading}>
            Similar items
          </h2>
          <ul className={styles.similarList}>
            {phone.similarProducts.map((similar, index) => (
              <li key={`${similar.id}-${index}`}>
                <PhoneCard phone={similar} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
