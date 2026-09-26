import { Link } from 'react-router-dom';
import type { PhoneSummary } from '../../models/phone';
import { formatPrice } from '../../utils/format';
import styles from './PhoneCard.module.css';

interface PhoneCardProps {
  phone: PhoneSummary;
}

/**
 * Grid card for one phone. Rendered as a single router link: the whole card
 * is the click target (challenge: click on a phone goes to its detail view).
 * The image is decorative because the link label already carries name and
 * brand.
 */
export function PhoneCard({ phone }: PhoneCardProps) {
  return (
    <Link
      to={`/product/${encodeURIComponent(phone.id)}`}
      className={styles.card}
      aria-label={`${phone.brand} ${phone.name}, ${formatPrice(phone.basePrice)}`}
    >
      <img
        src={phone.imageUrl}
        alt=""
        loading="lazy"
        className={styles.image}
        width={250}
        height={250}
      />
      <div className={styles.meta}>
        <span className={styles.brand}>{phone.brand}</span>
        <div className={styles.row}>
          <span className={styles.name}>{phone.name}</span>
          <span className={styles.price}>{formatPrice(phone.basePrice)}</span>
        </div>
      </div>
    </Link>
  );
}
