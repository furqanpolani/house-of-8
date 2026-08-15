import { useState, useEffect } from 'react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import ProductCard from '../components/ProductCard.jsx';

const CATEGORIES = ['See All', 'Bed', 'Arm Chair', 'Sette', 'Coffee Table', 'Accessories'];

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('See All');

  useEffect(() => {
    const url = activeCategory === 'See All'
      ? '/api/products'
      : `/api/products?category=${encodeURIComponent(activeCategory)}`;
    setLoading(true);
    fetch(url)
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeCategory]);

  return (
    <div className="page-shop">
      <Header />

      {/* ── SHOP BANNER ── */}
      <section className="shop-banner">
        <img
          src="/assets/2/u3851352797_a_single_ruscus_stem_with_pointed_leaves_loose_so_9d8289cb-e609-4197-a420-f1dab77214c8_02.png"
          alt="" className="shop-banner__leaves" aria-hidden="true"
        />
        <div className="shop-banner__container">
          <div className="shop-banner__text">
            <h1 className="shop-banner__heading">High-End Furniture</h1>
            <p className="shop-banner__sub">
              What matters to us is timeless design,<br />
              sustainable quality and ecological awareness.
            </p>
          </div>
          <img src="/assets/2/Group 31934.png" alt="Arm Chair" className="shop-banner__chair" />
        </div>
      </section>

      {/* ── FILTER BAR ── */}
      <div className="filter-bar">
        <div className="filter-bar__inner">
          <div className="filter-bar__categories">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`filter-btn${activeCategory === cat ? ' filter-btn--active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="filter-bar__sort">
            <span className="sort-label">Sort By</span>
            <button className="sort-dropdown">
              Low to High
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <path d="M1 1L6 6L11 1" stroke="#292A2E" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── PRODUCT GRID ── */}
      <main className="shop-grid-section">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#9c9c9c' }}>Loading…</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#9c9c9c' }}>No products found.</div>
        ) : (
          <div className="shop-grid">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </main>

      {/* ── DETAILED COMFORT ── */}
      <section className="comfort-detail">
        <div className="comfort-detail__watermark" aria-hidden="true">LUXURY</div>
        <div className="comfort-detail__container">
          <div className="comfort-detail__text">
            <h2 className="comfort-detail__heading">Detailed Comfort.</h2>
            <p className="comfort-detail__desc">
              We pride ourselves in sourcing the finest leathers<br />
              and woods, designing every detail of every piece.<br />
              With each custom-made sofa, we create<br />
              luxuriously comfortable sofas.
            </p>
            <a href="#" className="comfort-detail__btn">
              View Portfolio
              <svg width="22" height="16" viewBox="0 0 22.024 16.405" fill="none">
                <path d="M58.212,181.476H40.685l5.523-5.523a.86.86,0,1,0-1.217-1.217L38,181.728a.886.886,0,0,0-.108.132c-.014.021-.024.044-.036.065a.888.888,0,0,0-.043.083.781.781,0,0,0-.027.087c-.007.025-.017.048-.022.074a.873.873,0,0,0,0,.337c.005.025.015.049.022.074a.807.807,0,0,0,.027.087.821.821,0,0,0,.043.082c.012.022.022.045.036.066a.855.855,0,0,0,.108.132l6.991,6.992a.86.86,0,1,0,1.217-1.217L40.685,183.2H58.212a.86.86,0,1,0,0-1.721Z" transform="translate(243.072 214.837) rotate(180)" fill="#fff" stroke="#fff" strokeWidth="0.7"/>
              </svg>
            </a>
          </div>
          <img src="/assets/2/Group 31943.png" alt="Olive Sofa" className="comfort-detail__ottoman" />
        </div>
      </section>

      <Footer />
    </div>
  );
}
