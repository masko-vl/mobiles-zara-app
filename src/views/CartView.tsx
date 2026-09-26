import { Link } from 'react-router-dom';
import { useCart } from '../context/useCart';
import { makeCartKey } from '../models/cart';
import { formatPrice } from '../utils/format';
import styles from './CartView.module.css';

/**
 * Cart view (Figma): line items with image, name, chosen storage and color,
 * unit price and a remove action; footer pinned to the bottom with
 * "Continue shopping", the total and a Pay button. The payment flow itself
 * is out of scope of the challenge, so Pay is rendered but inert.
 */
export function CartView() {
  const { items, totalQuantity, totalPrice, removeItem } = useCart();

  return (
    <section className={styles.section} aria-labelledby="cart-heading">
      <h1 id="cart-heading" className={styles.heading}>
        Cart ({totalQuantity})
      </h1>

      {items.length === 0 ? (
        <p className={styles.emptyMessage} role="status">
          Your cart is empty.
        </p>
      ) : (
        <ul className={styles.lines}>
          {items.map((item) => {
            const key = makeCartKey(item);
            return (
              <li key={key} className={styles.line}>
                <img
                  src={item.imageUrl}
                  alt={`${item.brand} ${item.name}`}
                  className={styles.image}
                  width={180}
                  height={180}
                />
                <div className={styles.info}>
                  <p className={styles.name}>{item.name}</p>
                  <p className={styles.options}>
                    {item.storageCapacity} | {item.colorName}
                  </p>
                  <p className={styles.price}>{formatPrice(item.unitPrice)}</p>
                  <button
                    type="button"
                    className={styles.removeButton}
                    aria-label={`Remove ${item.name}, ${item.storageCapacity}, ${item.colorName}`}
                    onClick={() => removeItem(key)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className={styles.footer}>
        <Link to="/" className={styles.continueLink}>
          Continue shopping
        </Link>
        {items.length > 0 && (
          <>
            <div className={styles.total}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalAmount}>{formatPrice(totalPrice)}</span>
            </div>
            <button
              type="button"
              className={styles.payButton}
              // Payment is out of scope of the challenge.
              onClick={() => {}}
            >
              Pay
            </button>
          </>
        )}
      </div>
    </section>
  );
}
