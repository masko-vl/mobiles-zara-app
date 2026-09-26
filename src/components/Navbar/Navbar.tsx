import { Link } from 'react-router-dom';
import { BagIcon } from '../BagIcon';
import styles from './Navbar.module.css';

interface NavbarProps {
  cartCount: number;
}

/**
 * Top navigation bar: logo link to home plus a link to the cart showing how
 * many items it holds. `cartCount` is 0 until the CartContext phase wires it.
 * Router `Link`s render real anchors with client-side navigation.
 */
export function Navbar({ cartCount }: NavbarProps) {
  return (
    <header className={styles.navbar}>
      <Link to="/" className={styles.logoLink} aria-label="Smartphones store, go to home page">
        <span className={styles.logo} aria-hidden="true">
          M✱BST
        </span>
      </Link>
      <Link
        to="/cart"
        className={styles.cartLink}
        aria-label={`Shopping cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
      >
        <BagIcon />
        <span aria-hidden="true">{cartCount}</span>
      </Link>
    </header>
  );
}
