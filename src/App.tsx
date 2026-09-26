import { Navigate, Route, Routes } from 'react-router-dom';
import { CartProvider } from './context/CartProvider';
import { useCart } from './context/useCart';
import { Navbar } from './components/Navbar/Navbar';
import { CartView } from './views/CartView';
import { PhoneDetailView } from './views/PhoneDetailView';
import { PhoneListView } from './views/PhoneListView';
import styles from './App.module.css';

function AppLayout() {
  const { totalQuantity } = useCart();

  return (
    <div className={styles.canvas}>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <Navbar cartCount={totalQuantity} />
      <main id="main">
        <Routes>
          <Route path="/" element={<PhoneListView />} />
          <Route path="/product/:id" element={<PhoneDetailView />} />
          <Route path="/cart" element={<CartView />} />
          {/* Unknown URLs fall back to the catalog. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <AppLayout />
    </CartProvider>
  );
}

export default App;
