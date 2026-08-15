import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { useCart } from '../context/CartContext.jsx';

const FALLBACK = {
  'Arm Chair':    '/assets/2/Mask Group 41.png',
  'Coffee Table': '/assets/2/Group 31923.png',
  'Sette':        '/assets/2/Group 31924.png',
  'Bed':          '/assets/2/Group 31923.png',
  'Accessories':  '/assets/2/Group 31924.png',
  default:        '/assets/2/Group 31923.png',
};

function getImageSrc(p) {
  if (p?.image && !p.image.startsWith('default-')) return `/uploads/${p.image}`;
  return FALLBACK[p?.category] || FALLBACK.default;
}

export default function ProductDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty]         = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded]     = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(0);

  useEffect(() => {
    setLoading(true);
    setGalleryIdx(0);
    fetch(`/api/products/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(p => {
        setProduct(p);
        return fetch(`/api/products?category=${encodeURIComponent(p.category)}`);
      })
      .then(r => r.json())
      .then(all => setRelated(all.filter(p => p.id !== Number(id)).slice(0, 4)))
      .catch(() => navigate('/shop'))
      .finally(() => setLoading(false));
  }, [id]);

  // Gallery: product image + first 2 related images
  const gallery = useMemo(() => {
    if (!product) return [];
    const imgs = [getImageSrc(product)];
    related.slice(0, 2).forEach(r => {
      const src = getImageSrc(r);
      if (!imgs.includes(src)) imgs.push(src);
    });
    return imgs;
  }, [product, related]);

  function prev() { setGalleryIdx(i => Math.max(0, i - 1)); }
  function next() { setGalleryIdx(i => Math.min(gallery.length - 1, i + 1)); }

  function handleAddToCart() {
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleOrderNow() {
    addItem(product, qty);
    navigate('/basket');
  }

  if (loading) return (
    <div className="page-shop">
      <Header />
      <div style={{ padding: '200px 0', textAlign: 'center', color: '#9c9c9c' }}>Loading…</div>
    </div>
  );

  if (!product) return null;

  const price = Number(product.price).toLocaleString('en-PK');
  const totalPrice = Number(product.price * qty).toLocaleString('en-PK');

  return (
    <div className="page-shop">
      <Header />

      {/* ── Full-height split panel ── */}
      <div className="pd-split">

        {/* LEFT — image carousel */}
        <div className="pd-gallery-panel">
          {/* Sliding track */}
          <div className="pd-gallery-track-wrap">
            <div
              className="pd-gallery-track"
              style={{ transform: `translateX(calc(-${galleryIdx} * (var(--slide-w) + var(--slide-gap))))` }}
            >
              {gallery.map((src, i) => (
                <div className="pd-gallery-slide" key={i}>
                  <img src={src} alt={i === 0 ? product.name : `View ${i + 1}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation arrows */}
          <div className="pd-gallery-nav">
            <button
              className="pd-nav-btn"
              onClick={prev}
              disabled={galleryIdx === 0}
              aria-label="Previous image"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              className="pd-nav-btn"
              onClick={next}
              disabled={galleryIdx === gallery.length - 1}
              aria-label="Next image"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* RIGHT — product info */}
        <div className="pd-info-panel">
          <h1 className="pd-name">{product.name.toUpperCase()}</h1>
          <p className="pd-price">PKR {price}</p>
          <p className="pd-ref">REF. {String(product.id).padStart(4, '0')}/{String(product.id * 73 % 999).padStart(3, '0')}</p>

          {/* Colour swatches */}
          <div className="pd-swatches">
            <button className="pd-swatch pd-swatch--stone pd-swatch--active" aria-label="Stone" />
            <button className="pd-swatch pd-swatch--walnut" aria-label="Walnut" />
          </div>

          <p className="pd-desc">
            {product.description ||
              `Chair with an ash structure and a plaited seagrass base and back.`}
          </p>

          {/* QTY */}
          <div className="pd-qty-row">
            <span className="pd-qty-label">QTY.</span>
            <div className="pd-qty-pill">
              <button className="pd-qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span className="pd-qty-num">{String(qty).padStart(2, '0')}</span>
              <button className="pd-qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
            </div>
          </div>

          {/* Order Now */}
          <button className="pd-order-btn" onClick={handleOrderNow}>
            <span>Order Now</span>
            <span>PKR {price}</span>
          </button>

          <p className="pd-delivery">PKR 600 delivery charges may apply</p>

          {/* Add to Basket — split button */}
          <button className="pd-basket-btn" onClick={handleAddToCart}>
            <span className="pd-basket-price">PKR {totalPrice}</span>
            <span className="pd-basket-divider" />
            <span className="pd-basket-label">{added ? '✓ Added' : 'Add to Basket'}</span>
          </button>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="related">
          <div className="section-header" style={{ marginBottom: 40 }}>
            <span className="dash">—</span>
            <h2 className="section-title section-title--gold">You might be interested</h2>
            <span className="dash">—</span>
          </div>
          <div className="related-grid">
            {related.map(p => (
              <Link to={`/product/${p.id}`} className="related-card" key={p.id}>
                <img
                  src={getImageSrc(p)}
                  alt={p.name}
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
