import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import ProductCard from '../components/ProductCard.jsx';

const SHOP_CATEGORIES = ['See All', 'Bed', 'Arm Chair', 'Sette', 'Coffee Table', 'Accessories'];

const TESTIMONIALS = [
  {
    initials: 'HS',
    name: 'Humera Shah',
    location: '6 BHK Villa, D.H.A Phase 6, Karachi',
    quote: '"I had a very good experience working with IHI. The best part about having a home done by IHI is the 10-year maintenance warranty that is part of the project contract."',
  },
  {
    initials: 'AJ',
    name: 'Ansab Jahangir',
    location: 'Clothing Store, D.H.A Phase 7, Karachi',
    quote: '"My experience with Irtiqa Hassan Interiors was very good. High-quality products are used overall in the project. Feedback and concerns if any were solved immediately. The final outcome is great."',
  },
  {
    initials: 'MJ',
    name: 'Maria Jangda',
    location: 'Car Showroom, D.H.A Phase 7, Karachi',
    quote: '"My experience with Irtiqa Hassan Interiors was very good. High-quality products are used overall in the project. Feedback and concerns if any were solved immediately. The final outcome is great."',
  },
  {
    initials: 'SA',
    name: 'Sara Ahmed',
    location: 'Penthouse, Clifton Block 5, Karachi',
    quote: '"From the very first consultation to the final handover, the IHI team was professional, creative, and attentive to every detail. Our penthouse looks absolutely stunning."',
  },
];

function lerp(a, b, t) { return a + (b - a) * t; }

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('See All');
  const trackRef   = useRef(null);
  const isDragging = useRef(false);
  const startX     = useRef(0);
  const startLeft  = useRef(0);

  // scroll-driven hero→bestselling animation
  const heroTableRef = useRef(null);
  const bsMainRef    = useRef(null);
  const flyImgRef    = useRef(null);
  const animDataRef  = useRef(null);

  useEffect(() => {
    const url = activeCategory === 'See All'
      ? '/api/products'
      : `/api/products?category=${encodeURIComponent(activeCategory)}`;
    fetch(url)
      .then(r => r.json())
      .then(data => setProducts(data.slice(0, 4)))
      .catch(() => {});
  }, [activeCategory]);

  useEffect(() => {
    const heroEl = heroTableRef.current;
    const bsEl   = bsMainRef.current;
    const flyEl  = flyImgRef.current;
    if (!heroEl || !bsEl || !flyEl) return;

    function computeAnimData() {
      const scrollY    = window.scrollY;
      const vh         = window.innerHeight;
      const heroRect   = heroEl.getBoundingClientRect();
      const bsRect     = bsEl.getBoundingClientRect();
      // document-space (absolute) positions — consistent with position:absolute coordinates
      const heroAbsTop  = heroRect.top  + scrollY;
      const heroAbsLeft = heroRect.left; // left is already viewport==document (no h-scroll)
      const bsAbsTop    = bsRect.top   + scrollY;

      const animStart = Math.max(0, heroAbsTop + heroRect.height * 0.5 - vh * 0.5);
      const animEnd   = bsAbsTop - vh * 0.5;

      animDataRef.current = {
        animStart, animEnd,
        heroAbsTop, heroAbsLeft, bsAbsTop,
        heroW: heroRect.width,  heroH: heroRect.height,
        bsW:   bsRect.width,    bsH:   bsRect.height,
      };
    }

    function onScroll() {
      if (!animDataRef.current) computeAnimData();
      const d = animDataRef.current;
      if (!d || d.animEnd <= d.animStart) return;

      const raw = (window.scrollY - d.animStart) / (d.animEnd - d.animStart);
      const t   = Math.max(0, Math.min(1, raw));

      // ONE image only — no static copies, no handoffs.
      // Fly element is always the only visible version.
      // t=0 → sits at hero position, t=1 → sits at bestselling position.
      flyEl.style.display = 'block';
      flyEl.style.top     = lerp(d.heroAbsTop, d.bsAbsTop, t) + 'px';
      flyEl.style.left    = d.heroAbsLeft + 'px';
      flyEl.style.width   = d.heroW + 'px';
      flyEl.style.height  = d.heroH + 'px';
    }

    function onResize() { computeAnimData(); onScroll(); }

    computeAnimData();
    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  function scrollTestimonials(dir) {
    const card = trackRef.current?.querySelector('.testimonial-card');
    const cardW = card ? card.offsetWidth + 20 : 500;
    trackRef.current?.scrollBy({ left: dir * cardW, behavior: 'smooth' });
  }

  function onDragStart(e) {
    isDragging.current = true;
    startX.current    = e.pageX || e.touches?.[0]?.pageX;
    startLeft.current = trackRef.current.scrollLeft;
    trackRef.current.style.cursor = 'grabbing';
    trackRef.current.style.userSelect = 'none';
  }

  function onDragMove(e) {
    if (!isDragging.current) return;
    const x = e.pageX || e.touches?.[0]?.pageX;
    trackRef.current.scrollLeft = startLeft.current - (x - startX.current);
  }

  function onDragEnd() {
    isDragging.current = false;
    if (trackRef.current) {
      trackRef.current.style.cursor = 'grab';
      trackRef.current.style.userSelect = '';
    }
  }

  return (
    <div className="page-home" style={{ position: 'relative' }}>
      <Header />

      {/* ══════════════ HERO ══════════════ */}
      <section className="hero">
        <div className="hero-watermark" aria-hidden="true">LUXURY</div>

        <img
          src="/assets/Mask Group 26.png"
          alt=""
          className="hero-vase"
          aria-hidden="true"
        />

        <div className="hero-inner">
          <div className="hero-left">
            <h1 className="hero-title">Design. Detail. Luxury</h1>
            <p className="hero-sub">
              What matters to us is timeless design,<br />
              sustainable quality and ecological awareness.
            </p>
            <Link to="/shop" className="btn btn--green">Shop Now &rarr;</Link>
          </div>
          {/* spacer keeps hero-left at 50% width */}
          <div className="hero-right" />
        </div>

        {/* table is a direct child of hero so left:50% centers in the full hero section */}
        {/* invisible anchor — only used for position measurement */}
        <img
          ref={heroTableRef}
          src="/assets/Group 31910.png"
          alt=""
          aria-hidden="true"
          className="hero-table"
          style={{ opacity: 0, pointerEvents: 'none' }}
        />

        <div className="hero-scroll" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* ══════════════ BRAND VALUES ══════════════ */}
      <section className="brand">
        <div className="brand-watermark brand-watermark--left" aria-hidden="true">8</div>
        <div className="brand-watermark brand-watermark--right" aria-hidden="true">8</div>
        <div className="brand-content">
          <p className="brand-tagline">
            &mdash;&nbsp; What matters to us is a timeless design, sustainable quality
            and ecological awareness. &nbsp;&mdash;
          </p>
          <p className="brand-desc">
            IHI is a high-end Architecture, Interior Design and Furniture studio driven
            by exquisite taste, unparalleled service and unmatched quality. From planning
            spaces with utmost precision, creating unique styles from Modern Luxury to
            French Parisian and executing designs with high-end furniture and finishes.
          </p>
        </div>
      </section>

      {/* ══════════════ BEST SELLING ══════════════ */}
      <section className="bestselling">
        <div className="section-header">
          <span className="dash">&mdash;</span>
          <h2 className="section-title section-title--gold">Our Best Selling Products</h2>
          <span className="dash">&mdash;</span>
        </div>
        <p className="section-desc" style={{ marginTop: 16, marginBottom: 36 }}>
          IHI is a high-end Architecture, Interior Design and Furniture studio driven by
          exquisite taste, unparalleled service
        </p>
        <Link to="/shop" className="btn btn--green">Shop Now &rarr;</Link>

        <div className="bestselling-images">
          <img
            src="/assets/Group 31915.png"
            alt=""
            className="bestselling-side bestselling-side--left"
            aria-hidden="true"
          />
          {/* invisible anchor — only used for position measurement */}
          <img
            ref={bsMainRef}
            src="/assets/Group 31910.png"
            alt=""
            aria-hidden="true"
            className="bestselling-main"
            style={{ opacity: 0, pointerEvents: 'none' }}
          />
          <img
            src="/assets/Group 31915.png"
            alt=""
            className="bestselling-side bestselling-side--right"
            aria-hidden="true"
          />
        </div>
      </section>

      {/* ══════════════ EXPLORE PROJECTS ══════════════ */}
      <section className="explore">
        <div
          className="explore-bg"
          style={{ backgroundImage: "url('/assets/Group 31913.png')" }}
          role="img"
          aria-label="Luxury interior living room with travertine coffee table"
        />
        <div className="explore-content">
          <h2 className="explore-title">
            &mdash;&ensp;EXPLORE PROJECTS WE ARE PROUD OF&ensp;&mdash;
          </h2>
          <a href="#" className="btn btn--green">View Portfolio &rarr;</a>
        </div>
      </section>

      {/* ══════════════ DETAILED COMFORT — SPLIT PANELS ══════════════ */}
      <section className="comfort-split">
        <div
          className="comfort-panel"
          style={{ backgroundImage: "url('/assets/Mask Group 31.png')" }}
        >
          <div className="comfort-text comfort-text--light">
            <h3 className="comfort-heading">Detailed Comfort.</h3>
            <p className="comfort-body">
              We pride ourselves in sourcing the finest leathers and woods, designing
              every detail of every piece. With each custom-made sofa, we create
              luxuriously comfortable sofas.
            </p>
          </div>
        </div>

        <div
          className="comfort-panel"
          style={{ backgroundImage: "url('/assets/Mask Group 32.png')" }}
        >
          <div className="comfort-text comfort-text--dark">
            <h3 className="comfort-heading">Detailed Comfort.</h3>
            <p className="comfort-body">
              We pride ourselves in sourcing the finest leathers and woods, designing
              every detail of every piece. With each custom-made sofa, we create
              luxuriously comfortable sofas.
            </p>
          </div>
          <img
            src="/assets/Mask Group 33.png"
            alt=""
            className="comfort-leaves"
            aria-hidden="true"
          />
        </div>
      </section>

      {/* ══════════════ DETAILED COMFORT — INTERIOR ══════════════ */}
      <section className="comfort-interior">
        <div
          className="comfort-interior-bg"
          style={{ backgroundImage: "url('/assets/Group 31914.png')" }}
          role="img"
          aria-label="Luxury interior living room"
        />
        <div className="comfort-interior-content">
          <h3 className="comfort-heading comfort-heading--lg" style={{ color: '#fff', marginBottom: 20 }}>
            Detailed Comfort.
          </h3>
          <p className="comfort-body comfort-body--light" style={{ marginBottom: 36 }}>
            We pride ourselves in sourcing the finest leathers and woods, designing
            every detail of every piece. With each custom-made sofa, we create
            luxuriously comfortable sofas.
          </p>
          <a href="#" className="btn btn--outline">View Portfolio &rarr;</a>
        </div>
        <img
          src="/assets/Mask Group 35.png"
          alt="Stepped travertine coffee table"
          className="comfort-interior-table"
        />
      </section>

      {/* ══════════════ SHOP PREVIEW ══════════════ */}
      <section className="shop" id="shop">
        <img
          src="/assets/u3851352797_a_single_ruscus_stem_with_pointed_leaves_loose_so_9d8289cb-e609-4197-a420-f1dab77214c8_02.png"
          alt=""
          aria-hidden="true"
          className="shop-leaf"
        />
        <div className="section-header">
          <span className="dash">&mdash;</span>
          <h2 className="section-title section-title--gold">Our Best Selling Products</h2>
          <span className="dash">&mdash;</span>
        </div>

        <div className="shop-filters" style={{ marginTop: 32 }}>
          {SHOP_CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`filter-btn${activeCategory === cat ? ' filter-btn--active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {products.length > 0 && (
          <div className="home-product-grid">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 56 }}>
          <Link to="/shop" className="btn btn--green">Show All &rarr;</Link>
        </div>
      </section>

      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <section className="testimonials">
        <div className="testimonials-header">
          <h2 className="testimonials-title">What our happy clients say</h2>
        </div>

        <div
          className="testimonials-track"
          ref={trackRef}
          onMouseDown={onDragStart}
          onMouseMove={onDragMove}
          onMouseUp={onDragEnd}
          onMouseLeave={onDragEnd}
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
        >
          <div className="testimonials-inner">
            {TESTIMONIALS.map((t, i) => (
              <article className="testimonial-card" key={i}>
                <div className="testimonial-top">
                  <div className="testimonial-avatar-placeholder">{t.initials}</div>
                  <div className="testimonial-meta">
                    <strong className="testimonial-name">{t.name}</strong>
                    <span className="testimonial-location">{t.location}</span>
                  </div>
                </div>
                <p className="testimonial-quote">{t.quote}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="testimonials-nav">
          <button className="t-arrow t-arrow--prev" aria-label="Previous" onClick={() => scrollTestimonials(-1)}>&#8592;</button>
          <button className="t-arrow t-arrow--next" aria-label="Next" onClick={() => scrollTestimonials(1)}>&#8594;</button>
        </div>
      </section>

      {/* ══════════════ DETAILED COMFORT (fabric/ottoman) ══════════════ */}
      <section className="comfort-detail">
        <div className="comfort-detail__watermark" aria-hidden="true">LUXURY</div>
        <div className="comfort-detail__container">
          <img
            src="/assets/2/ChatGPT Image Aug 1, 2026, 09_18_12 PM.png"
            alt=""
            className="comfort-detail__leaves"
            aria-hidden="true"
          />
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
          <img
            src="/assets/2/Group 31943.png"
            alt="Olive Sofa"
            className="comfort-detail__ottoman"
          />
        </div>
      </section>

      {/* absolute flying clone — document-space coords, no zoom mismatch */}
      <img
        ref={flyImgRef}
        src="/assets/Group 31910.png"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          display: 'none',
          objectFit: 'contain',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      <Footer />
    </div>
  );
}
