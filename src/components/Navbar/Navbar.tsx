import { Link } from 'react-router-dom';
import cartActive from '../../assets/cart-active.png';
import cartInactive from '../../assets/cart-inactive.png';
import styles from './Navbar.module.css';

interface NavbarProps {
  cartCount: number;
}

/**
 * Top navigation bar (Figma): logo link to home plus a link to the cart with
 * its live item count. The cart icon switches between its inactive and active
 * states depending on whether the cart holds any items.
 */
export function Navbar({ cartCount }: NavbarProps) {
  return (
    <header className={styles.navbar}>
      <Link to="/" className={styles.logoLink} aria-label="Smartphones store, go to home page">
        <img src="/logo.png" alt="" width={74} height={28} className={styles.logo} />
      </Link>
      <Link
        to="/cart"
        className={styles.cartLink}
        aria-label={`Shopping cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
      >
        <img
          src={cartCount > 0 ? cartActive : cartInactive}
          alt=""
          width={18}
          height={18}
          className={styles.cartIcon}
        />
        <span aria-hidden="true">{cartCount}</span>
      </Link>
    </header>
  );
}
