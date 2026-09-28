import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import arrowBack from '../../assets/arrow-back.png';
import { ColorSelector } from '../../components/ColorSelector/ColorSelector';
import { PhoneCard } from '../../components/PhoneCard/PhoneCard';
import { SpecsList } from '../../components/SpecsList/SpecsList';
import { StorageSelector } from '../../components/StorageSelector/StorageSelector';
import { useCart } from '../../context/useCart';
import { useDragToScroll } from '../../hooks/useDragToScroll';
import { usePhone } from '../../hooks/usePhone';
import type { ColorOption, StorageOption } from '../../models/phone';
import { formatPrice } from '../../utils/format';
import styles from './index.module.css';

export function PhoneDetailView() {
  const { id } = useParams<{ id: string }>();
  const { phone, loading, error, retry } = usePhone(id);
  const { addItem } = useCart();
  const [selectedStorage, setSelectedStorage] = useState<StorageOption | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);

  useEffect(() => {
    setSelectedStorage(null);
    setSelectedColor(null);
    window.scrollTo(0, 0);
  }, [id]);

  // Custom scrollbar for the similar items row
  const {
    ref: similarListRef,
    isDragging: isDraggingSimilar,
    dragHandlers: similarDragHandlers,
  } = useDragToScroll<HTMLUListElement>();
  const scrollThumbRef = useRef<HTMLDivElement>(null);
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  function updateScrollThumb() {
    const list = similarListRef.current;
    const thumb = scrollThumbRef.current;
    const track = thumb?.parentElement;
    if (!list || !thumb || !track) return;
    const maxScroll = list.scrollWidth - list.clientWidth;
    const maxOffset = track.clientWidth - thumb.offsetWidth;
    const ratio = maxScroll > 0 ? list.scrollLeft / maxScroll : 0;
    thumb.style.transform = `translateX(${ratio * maxOffset}px)`;
  }

  function scrubTo(clientX: number) {
    const list = similarListRef.current;
    const track = scrollTrackRef.current;
    const thumb = scrollThumbRef.current;
    if (!list || !track || !thumb) return;
    const maxScroll = list.scrollWidth - list.clientWidth;
    if (maxScroll <= 0) return;
    const trackLeft = track.getBoundingClientRect().left;
    const maxThumbLeft = track.clientWidth - thumb.offsetWidth;
    const ratio = (clientX - trackLeft - thumb.offsetWidth / 2) / maxThumbLeft;
    list.scrollLeft = Math.min(1, Math.max(0, ratio)) * maxScroll;
  }

  if (loading) {
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

  function handleAdd() {
    if (!phone || !selectedStorage || !selectedColor) return;
    addItem(phone, selectedColor, selectedStorage);
  }

  return (
    <section className={styles.section} aria-labelledby="phone-heading">
      <Link to="/" className={styles.backLink}>
        <img src={arrowBack} alt="" width={20} height={20} className={styles.backIcon} />
        Back
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
          <ul
            ref={similarListRef}
            onScroll={updateScrollThumb}
            {...similarDragHandlers}
            className={`${styles.similarList}${
              isDraggingSimilar ? ` ${styles.similarListDragging}` : ''
            }`}
          >
            {phone.similarProducts.map((similar, index) => (
              <li key={`${similar.id}-${index}`}>
                <PhoneCard phone={similar} />
              </li>
            ))}
          </ul>
          {/* Custom scrollbar */}
          <div
            ref={scrollTrackRef}
            className={isScrubbing ? styles.scrollTrackScrubbing : styles.scrollTrack}
            aria-hidden="true"
            onPointerMove={(event) => {
              if (isScrubbing) scrubTo(event.clientX);
            }}
            onPointerUp={() => setIsScrubbing(false)}
            onPointerCancel={() => setIsScrubbing(false)}
          >
            <div ref={scrollThumbRef} className={styles.scrollThumb} />
          </div>
        </section>
      )}
    </section>
  );
}
