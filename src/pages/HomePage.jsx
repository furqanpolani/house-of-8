import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { getProducts } from '../data/productsService.js';

/*
   Fallback product images keyed by category — mirrors the map used
   inside ProductCard.jsx. Used by the Best Selling showcase cards so
   the 2×2 grid always renders even when the API image is missing.
*/
const PRODUCT_IMAGE_FALLBACK = {
  'Arm Chair':    '/assets/2/Mask Group 41.png',
  'Coffee Table': '/assets/2/Group 31923.png',
  'Sette':        '/assets/2/Group 31924.png',
  'Bed':          '/assets/2/Group 31923.png',
  'Accessories':  '/assets/2/Group 31924.png',
  default:        '/assets/2/Group 31923.png',
};

function getProductImage(p) {
  if (p?.image && !p.image.startsWith('default-')) return `/uploads/${p.image}`;
  return PRODUCT_IMAGE_FALLBACK[p?.category] || PRODUCT_IMAGE_FALLBACK.default;
}

const TESTIMONIALS = [
  {
    initials: 'HS',
    name: 'Humera Shah',
    location: '6 BHK Villa, D.H.A Phase 6, Karachi',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&h=240&fit=crop&crop=faces',
    quote: '"I had a very good experience working with IHI. The best part about having a home done by IHI is the 10-year maintenance warranty that is part of the project contract."',
  },
  {
    initials: 'AJ',
    name: 'Ansab Jahangir',
    location: 'Clothing Store, D.H.A Phase 7, Karachi',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&h=240&fit=crop&crop=faces',
    quote: '"My experience with Irtiqa Hassan Interiors was very good. High-quality products are used overall in the project. Feedback and concerns if any were solved immediately. The final outcome is great."',
  },
  {
    initials: 'MJ',
    name: 'Maria Jangda',
    location: 'Car Showroom, D.H.A Phase 7, Karachi',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=240&h=240&fit=crop&crop=faces',
    quote: '"My experience with Irtiqa Hassan Interiors was very good. High-quality products are used overall in the project. Feedback and concerns if any were solved immediately. The final outcome is great."',
  },
  {
    initials: 'SA',
    name: 'Sara Ahmed',
    location: 'Penthouse, Clifton Block 5, Karachi',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=240&h=240&fit=crop&crop=faces',
    quote: '"From the very first consultation to the final handover, the IHI team was professional, creative, and attentive to every detail. Our penthouse looks absolutely stunning."',
  },
];

/*
  Composited arrow used inside every .btn — a thin shaft plus an
  SVG chevron head. Both share stroke width and cap style so the
  hover state (shaft grows via CSS) reads as one continuous arrow.
*/
function BtnArrow() {
  return (
    <span className="btn-icon" aria-hidden="true">
      <span className="btn-icon__shaft" />
      <svg
        className="btn-icon__head"
        viewBox="0 0 10 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="3 1, 8 5, 3 9" />
      </svg>
    </span>
  );
}

/*
  Static fallback so the Best Selling showcase always renders even
  when /api/products is unreachable (dev machine without the backend,
  network hiccup, etc.). Enough items to fill the 2-column peek grid
  (2 visible rows + a half-row hint below).
*/
const FALLBACK_PRODUCTS = [
  { id: 1001, name: 'Arm Chair',    material: 'Fabric · Olive Print',   price: 45000 },
  { id: 1002, name: 'Side Table',   material: 'Travertine Stone',       price: 38000 },
  { id: 1003, name: 'Coffee Table', material: 'Natural Stone',          price: 55000 },
  { id: 1004, name: 'Luxury Bed',   material: 'Walnut & Linen',         price: 120000 },
  { id: 1005, name: 'Sette Sofa',   material: 'Velvet · Sage Green',    price: 85000 },
  { id: 1006, name: 'Dining Chair', material: 'Oak · Boucle',           price: 32000 },
  { id: 1007, name: 'Console',      material: 'Marble · Brass Detail',  price: 72000 },
  { id: 1008, name: 'Accent Stool', material: 'Ash · Cream Cushion',    price: 24000 },
];

export default function HomePage() {
  // Filled from the backend; the static fallback is only used if the
  // request fails, so placeholder cards never flash before real ones.
  const [products, setProducts] = useState([]);

  // References for the two coffee-table images we cross-fade during scroll.
  const heroTableRef = useRef(null);
  const bsMainRef    = useRef(null);

  // Testimonial marquee — rAF-driven so hover speed transitions are smooth
  // (a CSS `animation-duration` swap on :hover would jerk).
  const testTrackRef = useRef(null);
  const testInnerRef = useRef(null);

  /*
    Below 900px the Best Selling section drops its pinned, scroll-linked
    choreography: 400vh of pinned scroll plus per-frame transforms is
    heavy on phones and the filmstrip barely fits. Instead the strip
    becomes a plain swipeable carousel (CSS handles the scroll-snap) and
    the JS bails out early.
  */
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== 'undefined'
      && window.matchMedia('(max-width: 900px)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const onChange = (e) => setIsNarrow(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    // Load the first 6 products for the 2×3 "Best Selling" showcase grid.
    // Fetch up to 8 products so the Best Selling grid has cards to
    // reveal when the user scrolls the right column.
    // Newest products from the database, so the grid follows the catalogue.
    getProducts()
      .then(data => {
        setProducts(Array.isArray(data) && data.length > 0 ? data.slice(0, 8) : FALLBACK_PRODUCTS);
      })
      .catch(() => setProducts(FALLBACK_PRODUCTS));
  }, []);

  /*
    Hero coffee table — IntersectionObserver-based fade (unchanged).
    Fades in when the hero is on screen, out when it leaves.
  */
  useEffect(() => {
    const heroEl = heroTableRef.current;
    if (!heroEl) return;

    heroEl.classList.add('is-in-view');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio > 0.15) {
          entry.target.classList.add('is-in-view');
        } else {
          entry.target.classList.remove('is-in-view');
        }
      });
    }, {
      threshold: [0, 0.15, 0.3, 0.5, 0.75, 1],
    });

    observer.observe(heroEl);
    return () => observer.disconnect();
  }, []);

  /*
    Best-selling featured image — SCROLL-LINKED "descend from above".

    Every scroll frame, we map the section's viewport position into
    a progress 0..1 and drive the image's `translateY` and `opacity`
    from that. The travel distance is `viewport-height + 200px`, so
    at progress 0 the image floats near the top of the viewport
    while the section is still below — the user actually SEES the
    image descend into its final place while scrolling, not a fade
    that only reveals it at the last second.

    Window:
      progress 0 → section.top === viewport.height + 100  (section still
                   below the fold; image is off-screen above)
      progress 1 → section.top === 0                       (section top
                   flush with viewport top; image landed)

    Full viewport of scroll to complete the animation → clearly visible.
  */
  useEffect(() => {
    const track = bsMainRef.current;
    if (!track) return;
    const section = track.closest('.bestselling');
    if (!section) return;
    // Wrapper provides the extra scroll room used to drive phase 2
    // while the section is pinned (position: sticky). Fall back to
    // the section itself if the wrapper isn't present, preserving
    // the previous behaviour.
    const pinWrap = section.closest('.bestselling-pin-wrap') || section;
    const items = Array.from(track.querySelectorAll('.bestselling-main-item'));
    if (items.length === 0) return;

    // Narrow screens: no pin, no scroll-linked transforms. Reset every
    // inline style the wide-screen path may have written so the CSS
    // swipe carousel takes over cleanly.
    if (isNarrow) {
      track.style.transform = 'none';
      track.style.opacity   = '1';
      items.forEach((el) => {
        el.style.transform = 'none';
        el.style.opacity   = '1';
        el.classList.add('is-focused');
      });
      return;
    }

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      track.style.opacity = '1';
      track.style.transform = 'none';
      items.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.classList.add('is-focused');
      });
      return;
    }

    /*
      Two-phase scroll-linked animation.

      Phase 1 (descent, p1: 0 → 1)
        p1 = 0 when section.top = viewport.height
                 (section just entering from below)
        p1 = 1 when section.top = viewport.height - section.height
                 (section fully visible; bottom flush with viewport bottom)
        Track descends from translateY(-100vh) to translateY(0) and
        fades in.

      Phase 2 (horizontal slide, p2: 0 → 1)
        Kicks in the moment p1 = 1 and continues while the user keeps
        scrolling. Consumes an additional viewport of scroll (SLIDE_ROOM).
        Track translates from `startX` (first copy centered) to `endX`
        (last copy centered).

      Focus tracking: on each frame we pick the image whose horizontal
      center is closest to the viewport center and add `.is-focused`,
      which sets `filter: blur(0)`. All others stay blurred.
    */
    // Vertical scroll consumed by phase 2 (the horizontal filmstrip
    // slide). Higher = each item lingers longer in the center before
    // the pin releases. Must match the extra height reserved in
    // `.bestselling-pin-wrap` (100vh section + SLIDE_ROOM_VH * 100vh
    // + small dwell).
    const SLIDE_ROOM_VH = 2.0;
    const GAP_VW        = 5;      // must match `.bestselling-track` gap

    let vh = window.innerHeight, vw = window.innerWidth;
    let sh = 0;
    let startY = 0, endY = 0, endY2 = 0;
    let startX = 0, endX = 0;
    let itemW = 0, gapPx = 0;
    let rafId = 0, ticking = false;

    // Track's natural offset inside the section — measured once with
    // the transform cleared so it reflects the true final position of
    // the filmstrip inside the slider (not its scrolled state).
    let trackOffsetInSection = 0;

    function measureTrackOffset() {
      const prevTransform = track.style.transform;
      const prevOpacity   = track.style.opacity;
      track.style.transform = 'none';
      track.style.opacity   = '0';                 // avoid flash while measuring
      // Force a layout read so the getBoundingClientRect reflects the
      // untransformed layout position.
      const trackTop   = track.getBoundingClientRect().top;
      const sectionTop = section.getBoundingClientRect().top;
      trackOffsetInSection = trackTop - sectionTop;
      track.style.transform = prevTransform;
      track.style.opacity   = prevOpacity;
    }

    function recalc() {
      vh = window.innerHeight;
      vw = window.innerWidth;
      sh = section.getBoundingClientRect().height;

      // Phase 1 range — filmstrip descent.
      // startY: section top is ~0.9× vh below viewport top (section
      //         just entering, taking ~90% of one viewport of scroll
      //         for the whole descent — plenty of visible motion).
      // endY:   section top at viewport top (section header at very
      //         top of viewport; image is in its natural slot below).
      startY = vh * 0.9;
      endY = 0;

      // Phase 2 range — 1.5 viewports of extra scroll past the settle.
      endY2 = endY - vh * SLIDE_ROOM_VH;

      // Horizontal geometry
      itemW = items[0].getBoundingClientRect().width || 1;
      gapPx = vw * (GAP_VW / 100);
      startX = vw / 2 - itemW / 2;
      endX   = startX - (items.length - 1) * (itemW + gapPx);
    }

    function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

    function update() {
      ticking = false;
      const rect = section.getBoundingClientRect();
      // Wrapper rect keeps advancing while the section is pinned,
      // so phase 2's progress is driven by it. Before the pin,
      // wrapRect.top === rect.top, so phase 1 behaviour is unchanged.
      const wrapRect = pinWrap.getBoundingClientRect();

      // Phase 1 — descent (image #1 only)
      const p1 = clamp01((startY - rect.top) / ((startY - endY) || 1));
      // Position: gentle ease-in-out cubic. The middle of the descent
      // isn't compressed, so the slide from top-of-viewport into the
      // section is clearly visible.
      const p1Pos = p1 < 0.5
        ? 4 * p1 * p1 * p1
        : 1 - Math.pow(-2 * p1 + 2, 3) / 2;
      // Image #1 opacity: ramps up early so the whole descent is
      // visible (not just the end).
      const p1Op  = clamp01(p1 * 6);
      // Images 2–4 opacity: hidden through the descent, quickly fade
      // in at the very end so they're ready for the horizontal slide.
      const othersOp = clamp01((p1 - 0.85) / 0.15);

      // Phase 2 — starts only once phase 1 has settled.
      // Driven by the wrapper rect so it keeps advancing while the
      // section is pinned (position: sticky), effectively pausing
      // vertical scroll for the duration of the horizontal slide.
      const p2 = clamp01((endY - wrapRect.top) / ((endY - endY2) || 1));

      // The image's natural viewport top is (section.top + trackOffset).
      // Translate #1 so at p1=0 it sits at viewport top and at p1=1 it
      // lands at its natural position (translateY = 0).
      const naturalY = rect.top + trackOffsetInSection;
      const targetY  = -Math.max(naturalY, 0);
      const ty = targetY * (1 - p1Pos);

      // Track only carries the horizontal slide from phase 2.
      const tx = startX + (endX - startX) * p2;
      track.style.transform = `translate3d(${tx}px, 0, 0)`;
      track.style.opacity = '1';

      // Per-image: image #1 handles its own descent; images 2–4 stay
      // pinned at their flex positions and just fade in near the end.
      items[0].style.transform = `translate3d(0, ${ty}px, 0)`;
      items[0].style.opacity   = String(p1Op);
      for (let i = 1; i < items.length; i++) {
        items[i].style.transform = 'none';
        items[i].style.opacity   = String(othersOp);
      }

      // Focus tracking — closest image to viewport center is sharp.
      const centerX = vw / 2;
      let closest = 0;
      let closestDist = Infinity;
      for (let i = 0; i < items.length; i++) {
        const r = items[i].getBoundingClientRect();
        const c = r.left + r.width / 2;
        const d = Math.abs(c - centerX);
        if (d < closestDist) { closestDist = d; closest = i; }
      }
      for (let i = 0; i < items.length; i++) {
        items[i].classList.toggle('is-focused', i === closest);
      }
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      rafId = requestAnimationFrame(update);
    }

    function onResize() {
      measureTrackOffset();
      recalc();
      onScroll();
    }

    // Wait one frame so images have a measured width before the first
    // recalc — otherwise startX/endX may be off on initial paint.
    requestAnimationFrame(() => {
      measureTrackOffset();
      recalc();
      update();
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [isNarrow]);

  /*
    Testimonial marquee — JS-driven infinite scroll.

    A CSS animation-duration change on :hover jerks because the browser
    re-maps the elapsed time onto the new duration. Instead we advance
    the transform ourselves each rAF frame and smoothly lerp the current
    speed toward a target (60 px/s at rest → 20 px/s on hover), so the
    transition between speeds is continuous.

    JSX renders the testimonial list twice back-to-back. When the running
    position hits -half-width, we wrap by adding half-width back; because
    the second half is identical to the first, the loop is seamless.
  */
  useEffect(() => {
    const track = testTrackRef.current;
    const inner = testInnerRef.current;
    if (!track || !inner) return;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const BASE_SPEED  = 60;    // px per second at rest
    const HOVER_SPEED = 20;    // px per second while hovered / focused
    const SMOOTHING   = 5;     // larger = faster speed transition

    let currentSpeed = BASE_SPEED;
    let targetSpeed  = BASE_SPEED;
    let position     = 0;
    let last         = 0;
    let rafId        = 0;

    function halfWidth() {
      return inner.scrollWidth / 2;
    }

    function tick(now) {
      if (!last) last = now;
      const dt = Math.min(0.05, (now - last) / 1000);   // cap dt at 50ms
      last = now;

      currentSpeed += (targetSpeed - currentSpeed) * Math.min(1, dt * SMOOTHING);

      position -= currentSpeed * dt;
      const hw = halfWidth();
      if (hw > 0 && position <= -hw) position += hw;

      inner.style.transform = `translate3d(${position}px, 0, 0)`;
      rafId = requestAnimationFrame(tick);
    }

    function slow()   { targetSpeed = HOVER_SPEED; }
    function normal() { targetSpeed = BASE_SPEED;  }
    function onVisibility() {
      // Pause completely when tab is hidden — no drift when returning.
      if (document.hidden) targetSpeed = 0;
      else                 targetSpeed = BASE_SPEED;
    }

    track.addEventListener('mouseenter', slow);
    track.addEventListener('mouseleave', normal);
    track.addEventListener('focusin',   slow);
    track.addEventListener('focusout',  normal);
    document.addEventListener('visibilitychange', onVisibility);

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      track.removeEventListener('mouseenter', slow);
      track.removeEventListener('mouseleave', normal);
      track.removeEventListener('focusin',   slow);
      track.removeEventListener('focusout',  normal);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div className="page-home" style={{ position: 'relative' }}>
      <Header />

      {/* ══════════════ HERO ══════════════ */}
      <section className="hero">
        <div className="hero-watermark" aria-hidden="true">LUXURY</div>

        {/*
          Preload the Best Selling featured image while the user is
          still on the hero. Sits inside the hero section but is
          visually hidden — its only job is to force the browser to
          fetch & decode the asset so the scroll-linked entrance
          animation into the Bestselling section is instant.
        */}
        <img
          src="/assets/Mask Group 29.png"
          alt=""
          aria-hidden="true"
          className="hero-preload"
        />

        {/* Left vase — anchored to the far-left edge of the hero */}
        

        {/* Right vase — companion piece next to the coffee table */}
        <img
          src="/assets/Mask Group 26.png"
          alt=""
          className="hero-vase hero-vase--right"
          aria-hidden="true"
        />

        <div className="hero-inner">
          <div className="hero-left">
            <h1 className="hero-title">Sculptural. Natural. Timeless.</h1>
            <p className="hero-sub">
              What matters to us is timeless design,<br />
              sustainable quality and ecological awareness.
            </p>
<Link to="/shop" className="btn btn--green btn--swap">
  Shop Now <BtnArrow />
</Link></div>

          {/*
            hero-right holds the invisible anchor for the scroll-driven
            fly image. Keeping the anchor inside this right column ensures
            the fly clone lands on the right half of the hero and never
            overlaps the copy in .hero-left.
          */}
<div className="hero-right" >            
  <img
              ref={heroTableRef}
              src="/assets/Group 31910.png"
              alt="Stone coffee table with ceramic vase"
              className="hero-table"
            />
          </div>
        </div>

        <a
          href="#brand"
          className="hero-scroll"
          aria-label="Scroll to next section"
          onClick={(e) => {
            e.preventDefault();
            const target = document.getElementById('brand');
            if (!target) return;
            const rect     = target.getBoundingClientRect();
            const centerY  = rect.top + window.scrollY + rect.height / 2 - window.innerHeight / 2;
            window.scrollTo({ top: centerY, behavior: 'smooth' });
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="4" x2="12" y2="18" />
            <polyline points="7 13 12 18 17 13" />
          </svg>
        </a>
      </section>

      {/* ══════════════ BRAND VALUES ══════════════ */}
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

      {/* ══════════════ BEST SELLING ══════════════
        Wrapped in .bestselling-pin-wrap so the section can be pinned
        (position: sticky) while the horizontal filmstrip slides all
        the way through. Vertical page scroll effectively pauses
        (the pinned section stays put) while the extra scroll room
        provided by the wrapper drives phase 2 of the animation.
        Once phase 2 completes, the pin releases and normal vertical
        scroll resumes.
      */}
      <div className="bestselling-pin-wrap">
        <section className="bestselling">
          <div className="section-header mt-top">
            <span className="dash">&mdash;</span>
            <h2 className="section-title section-title--gold">Our Best Selling Products</h2>
            <span className="dash">&mdash;</span>
          </div>

          {/*
            Filmstrip placed FIRST (right below the section header) so
            the descent lands the image high up in the section, well
            above the Shop Now button. The 4 copies slide horizontally
            during phase 2.
          */}
          <p className="section-desc" >
            Inspired by nature.Designed to last.Made to belong.
          </p>
          <div className="bestselling-images">
            <div className="bestselling-filmstrip">
              <div className="bestselling-track" ref={bsMainRef}>
                {[0, 1, 2, 3].map((i) => (
                  <img
                    key={i}
                    src="/assets/Mask Group 29.png"
                    alt={i === 0 ? 'Best-selling stone coffee table' : ''}
                    aria-hidden={i === 0 ? undefined : 'true'}
                    className="bestselling-main-item"
                  />
                ))}
              </div>
            </div>
          </div>

          <Link to="/shop" className="btn btn--green btn--swap">
            Shop Now <BtnArrow />
          </Link>
        </section>
      </div>

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
          <a href="#" className="btn btn--green btn--swap">
            View Portfolio <BtnArrow />
          </a>
        </div>
      </section>

      {/* ══════════════ DETAILED COMFORT — SPLIT PANELS ══════════════ */}
      <section className="comfort-split">
        {/* LEFT — dark linen panel, tropical leaves overlay at top-left */}
        <div
          className="comfort-panel"
          style={{ backgroundImage: "url('/assets/Mask Group 31.png')" }}
        >
          <img
            src="/assets/tropical-leaves.png"
            alt=""
            className="comfort-leaves comfort-leaves--tl"
            aria-hidden="true"
          />
          <div className="comfort-text comfort-text--light">
            <h3 className="comfort-heading">Detailed Comfort.</h3>
            <p className="comfort-body">
              We pride ourselves in sourcing the finest leathers and woods, designing
              every detail of every piece. With each custom-made sofa, we create
              luxuriously comfortable sofas.
            </p>
          </div>
        </div>

        {/* RIGHT — stone panel, olive branch overlay at bottom-right */}
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
            className="comfort-leaves comfort-leaves--br"
            aria-hidden="true"
          />
        </div>
        
      </section>

      {/* ══════════════ DETAILED COMFORT — INTERIOR ══════════════ */}
      <section className="comfort-interior">
        <div className="comfort-interior-wrap">
          <div
            className="comfort-interior-bg bg-camel"
            aria-label="Luxury interior living room"
          />
          <img
            src="/assets/Mask Group 35.png"
            alt="Stepped travertine coffee table"
            className="comfort-interior-table"
          />
        </div>
        <div className='bg-gray-space'>

        </div>
        {/* <div className="comfort-interior-content">
          <h3 className="comfort-heading comfort-heading--lg" style={{ color: '#fff', marginBottom: 20 }}>
            Detailed Comfort.
          </h3>
          <p className="comfort-body comfort-body--light" style={{ marginBottom: 36 }}>
            We pride ourselves in sourcing the finest leathers and woods, designing
            every detail of every piece. With each custom-made sofa, we create
            luxuriously comfortable sofas.
          </p>
          <a href="#" className="btn btn--outline btn--bumpy">
            View Portfolio <span className="btn-icon">&rarr;</span>
          </a>
        </div> */}
      </section>

      {/* ══════════════ SHOP PREVIEW ══════════════
        New layout: full-bleed banner on the left (Detailed Comfort
        heading + Shop Now) paired with a 2x2 product grid on the
        right. Replaces the previous filter buttons + 4-up cards.
      */}
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
        <p className='p-center'>HI is a high-end Architecture, Interior Design and Furniture studio driven by exquisite taste, unparalleled service</p>

        
        {/*
          Two-column showcase:
            LEFT  — feature image (fills the full row height).
            RIGHT — .shop-showcase__grid, a 2-column inner grid that
                    shows 4 cards at rest and reveals more via a
                    vertical scroll inside its own container.
        */}
        <div className="shop-showcase">
          <div className="shop-showcase__feature">
            <img
              src="/assets/Group 31913.png"
              alt="Luxury interior with travertine coffee table"
              className="shop-showcase__feature-img"
              loading="lazy"
            />
            <div className="shop-showcase__feature-copy">
              <span className="shop-showcase__feature-eyebrow">Curated Collection</span>
              <h3 className="shop-showcase__feature-heading">
                Timeless pieces,<br />crafted for you.
              </h3>
              <Link to="/shop" className="btn btn--green btn--swap">
                Shop Now <BtnArrow />
              </Link>
            </div>
          </div>

          <div className="shop-showcase__grid">
            {(() => {
              const HP_IMGS = [
                'https://interwood.pk/cdn/shop/files/Berlin_ST.webp?v=1757595702',
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGB5eyoWqS0DVU2YSj_oH6aPDQ_wqcw2BeOYN_1-CwQ5r_bT4F8C0uBJI&s=10',
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrMZ7wja9FZHHcEmRuwoIfA5xUtbvQStTOLZH-kbV0zA&s',
                'https://solidwood.pk/wp-content/uploads/2026/05/Solid-Wood-Office-Tables-Pakistan.webp',
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7mvULl2jCOJ8QXUP_FrSCtN-0taoNaZopVOsyNeCDpA&s=10',
                'https://chenone.com/cdn/shop/collections/FURNITURE.png?v=1767190632',
              ];
              return products.slice(0, 8).map((p, i) => {
                const priceStr = Number(p.price).toLocaleString('en-PK');
                const idx = Math.abs(typeof p?.id === 'number' ? p.id : i) % HP_IMGS.length;
                const src = (p?.image && !p.image.startsWith('default-'))
                  ? `/uploads/${p.image}`
                  : HP_IMGS[idx];
                return (
                  <Link
                    key={p.id}
                    to={`/product/${p.id}`}
                    className="shop-showcase__card"
                  >
                    <img
                      src={src}
                      alt={p.name}
                      className="shop-showcase__card-img"
                      loading="lazy"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (img.dataset.fb === '1') return;
                        img.dataset.fb = '1';
                        img.src = '/assets/2/Group 31923.png';
                      }}
                    />
                    <div className="shop-showcase__card-overlay">
                      <h4 className="shop-showcase__card-name">{p.name || 'Lorem ipsum'}</h4>
                      <p className="shop-showcase__card-material">
                        {p.material || p.category || 'Cement'}
                      </p>
                      <p className="shop-showcase__card-price">PKR {priceStr}</p>
                    </div>
                  </Link>
                );
              });
            })()}
          </div>
        </div>
      </section>



      {/* ══════════════ DETAILED COMFORT (fabric/ottoman) ══════════════ */}
      <section className="comfort-detail">
        <div className="comfort-detail__watermark" aria-hidden="true">LUXURY</div>
        <div className="comfort-detail__container">
          {/* Olive-branch decorative leaves intentionally removed per design.
              The `.comfort-detail__leaves` rule still lives in shop.css for
              the Shop page's Detailed Comfort block. */}
          <div className="comfort-detail__text">
            <h2 className="comfort-detail__heading">Detailed Comfort.</h2>
            <p className="comfort-detail__desc">
              We pride ourselves in sourcing the finest leathers<br />
              and woods, designing every detail of every piece.<br />
              With each custom-made sofa, we create<br />
              luxuriously comfortable sofas.
            </p>
            <a href="#" className="btn btn--green btn--swap">
              View Portfolio <BtnArrow />
            </a>
          </div>
          {/*
            Ottoman/pouf — overflows the container's right and bottom
            edges. `.comfort-detail__ottoman` (shop.css) handles the
            absolute positioning, size and z-index. The asset lives in
            /assets/2/, not /assets/ — Vite serves the repo-root
            `assets` folder at /assets, so the `2/` segment matters.
          */}
          <img
            src="/assets/2/Group 31934.png"
            alt="Olive-print ottoman with sage green cushion"
            className="comfort-detail__ottoman"
          />
        </div>
      </section>
      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <section className="testimonials">
        <div className="testimonials-header">
          <h2 className="testimonials-title">What our happy clients say</h2>
        </div>

        {/*
          Auto-scrolling marquee driven by rAF in the useEffect above.
          Cards are rendered twice back-to-back — the JS advances the
          inner track by pixels-per-second and wraps at -halfWidth so
          the loop is seamless. Hovering slows it from 60 → 20 px/s
          with a smoothed lerp (no jerk).
        */}
        <div className="testimonials-track" ref={testTrackRef}>
          <div className="testimonials-inner" ref={testInnerRef}>
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <article
                className="testimonial-card"
                key={`t-${i}`}
                aria-hidden={i >= TESTIMONIALS.length ? 'true' : undefined}
              >
                <div className="testimonial-top">
                  {t.avatar ? (
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="testimonial-avatar"
                      loading="lazy"
                      onError={(e) => {
                        // Fallback to initials placeholder if the remote
                        // photo fails to load.
                        const img = e.currentTarget;
                        const placeholder = document.createElement('div');
                        placeholder.className = 'testimonial-avatar-placeholder';
                        placeholder.textContent = t.initials;
                        img.replaceWith(placeholder);
                      }}
                    />
                  ) : (
                    <div className="testimonial-avatar-placeholder">{t.initials}</div>
                  )}
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
      </section>
      <Footer />
    </div>
  );
}
