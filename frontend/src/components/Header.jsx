import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export default function Header() {
  const { totalItems } = useCart();

  return (
    <header className="header">
      <button className="hamburger" aria-label="Open menu">
        <span /><span /><span />
      </button>
      <Link to="/" className="logo">
        <img src="/assets/logo.svg" alt="House of 8" className="logo-svg" />
      </Link>
      <Link to="/basket" className="basket-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
        Your Basket
        {totalItems > 0 && <span className="basket-count">{totalItems}</span>}
      </Link>
    </header>
  );
}
