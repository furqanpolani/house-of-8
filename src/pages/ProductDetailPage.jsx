import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { useCart } from '../context/CartContext.jsx';
import { getProduct, getProducts } from '../data/productsService.js';

/*
  Curated external product photos — cycled deterministically by product id
  so a product always shows the same image in the shop grid, product page
  and "You might also like" grid.
*/
const SHOP_IMAGES = [
  'https://lahorefurniture.pk/cdn/shop/files/Untitled_design_31.png?v=1778113321&width=4284',
  'https://www.modumshop.com/ckeditor_assets/pictures/232/content_C-MENA-A_Design_Couchtisch_vitamin-design.jpg',
  'https://urbangalleria.com/cdn/shop/files/1200x1200_22.jpg?v=1761124214&width=3840',
  'https://m.media-amazon.com/images/I/71Jsl6fNsYL._AC_UF350,350_QL80_.jpg',
  'https://www.daals.co.uk/cdn/shop/files/BSD-141-OAK_scene1_1024x1024.jpg?v=1706551318',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRI-5pboLQ149rPey8XUidRSy4SiJuSdP78Vx5AD6hdbJlPO0zSEWdmxWhTKyY2t34Q',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfGGZZpj0wydEMTgOWCPEiACOvoyB9VdcqbDKeqIg8EmK-1A2uCo1vuPNy',
  'https://homedesign.pk/4002-large_default/holz-heavy-duty-wooden-center-table-coffee-table-hd-cct-036-.jpg',
];

const LOCAL_FALLBACK = '/assets/2/Group 31923.png';

function getImageSrc(p) {
  const images = p?.images || [];
  const primary = images.find(i => i.is_primary) || images[0];
  if (primary?.filename && !primary.filename.startsWith('default-')) {
    return `/uploads/${primary.filename}`;
  }
  const id  = Number(p?.id);
  const idx = Number.isFinite(id) ? Math.abs(id) % SHOP_IMAGES.length : 0;
  return SHOP_IMAGES[idx];
}

function getAllImageSrcs(p) {
  const images = (p?.images || []).filter(i => !i.filename.startsWith('default-'));
  if (images.length > 0) return images.map(i => `/uploads/${i.filename}`);
  return null;
}

function handleImgError(e) {
  if (e.currentTarget.src !== window.location.origin + LOCAL_FALLBACK) {
    e.currentTarget.src = LOCAL_FALLBACK;
  }
}

const TESTIMONIALS = [
  {
    initials: 'HS',
    name:     'Humera Shah',
    location: '6 BHK Villa, D.H.A Phase 6, Karachi',
    quote:    '"We had a very good experience working with IHI. The best part about getting a home done by DC is the 10-year maintenance warranty which is part of the project contract."',
  },
  {
    initials: 'AJ',
    name:     'Ansab Jahangir',
    location: 'Clothing Store, D.H.A Phase 7, Karachi',
    quote:    '"My experience with Irtiqa Hassan Interiors was very good. High-quality products are used overall in the project. Feedback and concerns if any were solved immediately. The final outcome is great and suitable for every family member."',
  },
  {
    initials: 'MJ',
    name:     'Maria Jangda',
    location: 'Car Showroom, D.H.A Phase 7, Karachi',
    quote:    '"My experience with Irtiqa Hassan Interiors was very good. High-quality products are used overall in the project. Feedback and concerns if any were solved immediately. The final outcome is great and suitable for every family member."',
  },
];

export default function ProductDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty]         = useState(2);
  const [loading, setLoading] = useState(true);
  const [added, setAdded]     = useState(false);

  useEffect(() => {
    setLoading(true);
    getProduct(id)
      .then(p => {
        if (!p) throw new Error('not found');
        setProduct(p);
        return getProducts(p.category);
      })
      .then(all => setRelated(all.filter(p => p.id !== Number(id)).slice(0, 4)))
      .catch(() => navigate('/shop'))
      .finally(() => setLoading(false));
  }, [id]);

  // Gallery: all backend images for this product, or fall back to related
  const gallery = useMemo(() => {
    if (!product) return [];
    const backendImgs = getAllImageSrcs(product);
    if (backendImgs) return backendImgs;
    const imgs = [getImageSrc(product)];
    related.slice(0, 2).forEach(r => {
      const src = getImageSrc(r);
      if (!imgs.includes(src)) imgs.push(src);
    });
    return imgs;
  }, [product, related]);

  /* ── Peeking, infinitely looping carousel ─────────────────────────
     The track renders three copies of the gallery and parks on the
     middle one, so there is always a slide to the left AND right of
     the active one — which is what keeps the "next image" sliver on
     the right edge filled, even on the last real image. Once a slide
     transition lands outside the middle copy we jump back to the
     equivalent slide with the transition switched off, so the loop is
     invisible.
  --------------------------------------------------------------- */
  const slideCount = gallery.length;

  const slides = useMemo(
    () => (slideCount
      ? Array.from({ length: slideCount * 3 }, (_, i) => gallery[i % slideCount])
      : []),
    [gallery, slideCount],
  );

  const [pos, setPos]         = useState(0);   // index into `slides`
  const [instant, setInstant] = useState(false); // skip the transition

  // Park on the middle copy whenever the product / gallery changes.
  useEffect(() => {
    if (!slideCount) return;
    setInstant(true);
    setPos(slideCount);
  }, [slideCount, id]);

  // Re-enable the transition one frame after an instant jump.
  useEffect(() => {
    if (!instant) return;
    const raf = requestAnimationFrame(() => setInstant(false));
    return () => cancelAnimationFrame(raf);
  }, [instant]);

  const step = useCallback((delta) => {
    if (slideCount < 2 || !delta) return;
    setInstant(false);
    setPos(p => p + delta);
  }, [slideCount]);

  const prev = () => step(-1);
  const next = () => step(1);

  function handleTrackTransitionEnd(e) {
    if (e.target !== e.currentTarget || !slideCount) return;
    if (pos < slideCount || pos >= slideCount * 2) {
      setInstant(true);
      setPos(slideCount + ((pos % slideCount) + slideCount) % slideCount);
    }
  }

  // Touch swipe
  const touchX = useRef(null);
  function onTouchStart(e) { touchX.current = e.touches[0].clientX; }
  function onTouchEnd(e) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
  }

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

  const price      = Number(product.price).toLocaleString('en-PK');
  const totalPrice = Number(product.price * qty).toLocaleString('en-PK');
  const refCode    = `REF. ${String(product.id).padStart(4, '0')}/${String((product.id * 73) % 999).padStart(3, '0')}`;

  /*
    Nicely-formatted spec fields. If the API doesn't provide them,
    we fall back to sensible per-category defaults so the details
    section always reads as a real product page.
  */
  const specs = {
    Material:   product.material   || 'Hand-cast cement',
    Finish:     product.finish     || 'Natural speckled matte',
    Dimensions: product.dimensions || 'H 45cm x W 38cm x D 30cm',
    Weight:     product.weight     || 'Approx. 9kg',
    Use:        product.useType    || 'Indoor use only',
    Care:       product.care       || 'Wipe with a soft, dry cloth. Avoid harsh chemicals and prolonged moisture.',
    Note:       product.note       || 'Handmade — slight variation in texture and tone is natural, not a flaw.',
  };

  const longDescription = product.description ||
    'A sculptural side table featuring a fluid twisted silhouette and soft stone-textured finish. Its organic form adds a refined, contemporary statement to modern interiors while offering a practical surface for everyday essentials.';

  return (
    <div className="page-shop pd-page">
      <Header />

      {/* ═══════════ HERO SPLIT — gallery + info ═══════════ */}
      <div className="pd-split" style={{ '--pd-pos': pos }}>
        {/* LEFT — image carousel with the next image peeking on the right */}
        <div className="pd-gallery-panel">
          <div
            className="pd-gallery-track-wrap"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div
              className={`pd-gallery-track${instant ? ' pd-gallery-track--instant' : ''}`}
              onTransitionEnd={handleTrackTransitionEnd}
            >
              {slides.map((src, i) => (
                <div
                  className={`pd-gallery-slide${i === pos ? '' : ' pd-gallery-slide--peek'}`}
                  key={i}
                  onClick={i === pos ? undefined : () => step(i - pos)}
                  aria-hidden={i === pos ? undefined : 'true'}
                >
                  <img
                    src={src}
                    alt={i % slideCount === 0 ? product.name : `${product.name} — view ${(i % slideCount) + 1}`}
                    onError={handleImgError}
                    draggable="false"
                  />
                </div>
              ))}
            </div>
          </div>

          {slideCount > 1 && (
            <div className="pd-gallery-nav">
              <button className="pd-nav-btn" onClick={prev} aria-label="Previous image">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button className="pd-nav-btn" onClick={next} aria-label="Next image">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT — product info */}
        <div className="pd-info-panel">
          <h1 className="pd-name">{product.name}</h1>
          <p className="pd-price">PKR {price}</p>
          <p className="pd-ref">{refCode}</p>

          <div className="pd-swatches">
            <button className="pd-swatch pd-swatch--stone pd-swatch--active" aria-label="Stone" />
            <button className="pd-swatch pd-swatch--walnut" aria-label="Walnut" />
          </div>

          <p className="pd-desc">
            {product.shortDescription ||
              'A sculptural side table featuring a fluid twisted silhouette'}
          </p>

          <div className="pd-qty-row">
            <span className="pd-qty-label">QTY.</span>
            <div className="pd-qty-pill">
              <button className="pd-qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span className="pd-qty-num">{String(qty).padStart(2, '0')}</span>
              <button className="pd-qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
            </div>
          </div>

          <button className="pd-order-btn" onClick={handleOrderNow}>
            <span className="pd-order-btn__label">
              {/* Two stacked labels — the default slides up on hover
                  and the "Add to Basket" text slides in from below. */}
              <span className="pd-order-btn__text pd-order-btn__text--default">
                Order Now
              </span>
              <span className="pd-order-btn__text pd-order-btn__text--hover">
                Add to Basket
              </span>
            </span>
            <span className="pd-order-btn__price">PKR {price}</span>
          </button>

          <p className="pd-delivery">PKR 600 delivery charges may apply</p>

          <button className="pd-basket-btn" onClick={handleAddToCart}>
            <span className="pd-basket-price">PKR {totalPrice}</span>
            <span className="pd-basket-divider" />
            <span className="pd-basket-label">{added ? '✓ Added' : 'Add to Basket'}</span>
          </button>
        </div>
      </div>

      {/* ═══════════ DESCRIPTION + SPECIFICATIONS ═══════════ */}
      <section className="pd-details">
        <div className="pd-details__inner">
          {/* LEFT — Description + spec table */}
          <div className="pd-details__col">
            <h3 className="pd-details__heading">Description</h3>
            <p className="pd-details__body">{longDescription}</p>
            <dl className="pd-specs">
              {Object.entries(specs).map(([k, v]) => (
                <div className="pd-specs__row" key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* RIGHT — Collapsible information panels */}
          <div className="pd-details__col">
            <details className="pd-panel" open>
              <summary>
                <span>Specifications</span>
                <span className="pd-panel__toggle" aria-hidden="true">+</span>
              </summary>
              <p className="pd-panel__body">{longDescription}</p>
            </details>

            <details className="pd-panel">
              <summary>
                <span>Shipping and Policy</span>
                <span className="pd-panel__toggle" aria-hidden="true">+</span>
              </summary>
              <div className="pd-panel__body">
                <p>We currently deliver orders across Pakistan.</p>
                <ul>
                  <li>Orders placed are usually dispatched within 3-7 working days subject to confirmation from the customer.</li>
                  <li>Please note that furniture products have a lead time of approx. 2-4 weeks and order confirmation will be subject to advance payment.</li>
                  <li>Delivery charges for heavy items such as furniture, basins, etc. will be communicated to the customer separately.</li>
                </ul>
                <p>For international orders, please contact our customer service team at +92 333 331 7120 to get a quote.</p>
              </div>
            </details>

            <details className="pd-panel">
              <summary>
                <span>Return and Refunds</span>
                <span className="pd-panel__toggle" aria-hidden="true">+</span>
              </summary>
              <div className="pd-panel__body">
                <p>Please note that our products are NOT eligible for return due to their handcrafted or fragile nature.</p>
                <p>Upon receiving your order, we strongly encourage you to open and inspect your item(s) carefully, following any care or placement instructions provided. For more information, please view our Refund Policy.</p>
              </div>
            </details>
          </div>
        </div>

      </section>

      {/* ═══════════ YOU MIGHT ALSO LIKE ═══════════ */}
      {related.length > 0 && (
        <section className="pd-related">
          <div className="pd-related__header">
            <h3 className="pd-related__title">You might also like</h3>
            <p className="pd-related__sub">
              IHI is a high-end Architecture, Interior Design and Furniture studio
              driven by exquisite taste, unparalleled service
            </p>
          </div>

          <div className="pd-related__grid">
            {related.map(p => (
              <Link
                to={`/product/${p.id}`}
                className="pd-related__card"
                key={p.id}
              >
                <div className="pd-related__img-wrap">
                  <img
                    src={getImageSrc(p)}
                    alt={p.name}
                    onError={handleImgError}
                    loading="lazy"
                  />
                </div>
                <h4 className="pd-related__name">{p.name || 'Lorem ipsum'}</h4>
                <p className="pd-related__price">
                  PKR {Number(p.price).toLocaleString('en-PK')}
                </p>
              </Link>
            ))}
          </div>

        </section>
      )}

      {/* ═══════════ BRAND VALUES ═══════════ */}
      <section className="brand" id="brand">
        <div className="brand-watermark brand-watermark--left" aria-hidden="true">8</div>
        <div className="brand-watermark brand-watermark--right" aria-hidden="true">8</div>
        <div className="brand-content">
          <p className="brand-tagline">
            &mdash;&nbsp; Some objects fill a room. Others quietly become part of it. &nbsp;&mdash;
          </p>
          <p className="brand-tagline">House of 8 makes the second kind.</p>
          <p className="brand-desc">
            IHI is a high-end Architecture, Interior Design and Furniture studio driven by exquisite taste, unparalleled service and unmatched quality. From planning spaces with utmost precision, creating unique styles from Modern Luxury to French Parisian and executing designs with high-end furniture and finishes.
          </p>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="pd-testimonials">
        <h3 className="pd-testimonials__title">What our happy clients say</h3>
        <div className="pd-testimonials__row">
          {TESTIMONIALS.map((t) => (
            <article className="pd-testimonial" key={t.name}>
              <div className="pd-testimonial__top">
                <div className="pd-testimonial__avatar" aria-hidden="true">
                  {t.initials}
                </div>
                <div className="pd-testimonial__meta">
                  <strong className="pd-testimonial__name">{t.name}</strong>
                  <span className="pd-testimonial__location">{t.location}</span>
                </div>
              </div>
              <p className="pd-testimonial__quote">{t.quote}</p>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
