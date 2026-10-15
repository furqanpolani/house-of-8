import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { getProducts } from '../data/productsService.js';

// Shown if the product list can't be loaded.
const FALLBACK_LINKS = ['Side Tables', 'Center Tables', 'Decor', 'Benches', 'Cushions', 'Trays'];

// Newest products for the menu, fetched once per visit and shared by
// every page's header.
let menuProductsCache = null;

export default function Header() {
  const { totalItems } = useCart();
  const [open, setOpen] = useState(false);
  const [menuProducts, setMenuProducts] = useState(menuProductsCache);
  const headerRef = useRef(null);
  const navigate = useNavigate();

  // Load the menu's products the first time it opens.
  useEffect(() => {
    if (!open || menuProducts) return;
    getProducts()
      .then(list => { menuProductsCache = list.slice(0, 6); setMenuProducts(menuProductsCache); })
      .catch(() => setMenuProducts([]));
  }, [open, menuProducts]);

  // Publish the header's real height so the menu starts right below it
  // (it differs per page and per screen size).
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function close() { setOpen(false); }
  function toggle() { setOpen(o => !o); }

  function go(path) {
    close();
    navigate(path);
  }

  return (
    <>
      <header className="header" ref={headerRef}>
        <button
          className={`hamburger${open ? ' hamburger--open' : ''}`}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={toggle}
        >
          <span /><span /><span />
        </button>
        <Link to="/" className="logo" onClick={close}>
          <img src="/assets/LgogHhouse_of_8.png" alt="House of 8" className="logo-svg" />
        </Link>
        <Link to="/basket" className="basket-link" onClick={close}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          Your Basket
          {totalItems > 0 && <span className="basket-count">{totalItems}</span>}
        </Link>
      </header>

      {/* Full-width transparent overlay below header */}
      <div
        className={`nav-overlay${open ? ' nav-overlay--open' : ''}`}
        aria-hidden={!open}
        onClick={close}
      >
        <div className="nav-overlay__inner" onClick={e => e.stopPropagation()}>

          <p className="nav-overlay__heading">Our Products</p>
          <ul className="nav-overlay__categories">
            {menuProducts?.length
              ? menuProducts.map(p => (
                  <li key={p.id}>
                    <button className="nav-overlay__cat-link" onClick={() => go(`/product/${p.id}`)}>{p.name}</button>
                  </li>
                ))
              : menuProducts && FALLBACK_LINKS.map(item => (
                  <li key={item}>
                    <button className="nav-overlay__cat-link" onClick={() => go('/shop')}>{item}</button>
                  </li>
                ))}
          </ul>

          <button className="nav-overlay__shop" onClick={() => go('/shop')}>
            Shop All
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="13 6 19 12 13 18" />
            </svg>
          </button>

          {/* <button className="nav-overlay__page-link" onClick={() => go('/about')}>About Us</button> */}
          <button className="nav-overlay__page-link" onClick={() => go('/contact')}>Contact Us</button>

          <div className="nav-overlay__follow">
            <span className="nav-overlay__follow-label">Follow Us</span>
            <a
              href="https://www.instagram.com/house0f8"
              target="_blank"
              rel="noreferrer"
              className="nav-overlay__instagram"
              onClick={close}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
              </svg>
              Houseofeight
            </a>
          </div>

        </div>
      </div>
    </>
  );
}
