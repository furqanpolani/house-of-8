import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">

        {/* ── Brand column ── */}
        <div className="footer-brand">
          <img src="/assets/LgogHhouse_of_8.png" alt="House of 8" className="footer-logo-svg" />
          <p className="footer-tagline">Sculptural. Natural. Timeless.</p>
          <div className="footer-social">
            {/* Instagram */}
            <a href="https://www.instagram.com/houseofeight" target="_blank" rel="noreferrer" aria-label="Instagram">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
              </svg>
            </a>
            {/* WhatsApp */}
            <a href="https://wa.me/923333317121" target="_blank" rel="noreferrer" aria-label="WhatsApp">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* ── Company column ── */}
        <div className="footer-col">
          <h5 className="footer-col-title">Company</h5>
          <Link to="/about" className="footer-col-link">About Us</Link>
          <Link to="/contact" className="footer-col-link">Contact Us</Link>
        </div>

        {/* ── Products column ── */}
        <div className="footer-col">
          <h5 className="footer-col-title">Our Products</h5>
          <Link to="/shop" className="footer-col-link">Center Table</Link>
          <Link to="/shop" className="footer-col-link">Side Table</Link>
          <Link to="/shop" className="footer-col-link">Decor</Link>
          <Link to="/shop" className="footer-col-link">Cushion</Link>
        </div>

        {/* ── Contact column ── */}
        <div className="footer-contact-col">
          <div className="footer-contact-item">
            <img src="/assets/contactus/Group 43039.svg" alt="" width="38" height="38" className="footer-contact-icon" />
            <div>
              <span className="footer-contact-label">Phone / WhatsApp</span>
              <a href="tel:+923333317121" className="footer-contact-value">+92 333 3317121</a>
            </div>
          </div>
          <div className="footer-contact-item">
            <img src="/assets/contactus/Group 43041.svg" alt="" width="38" height="38" className="footer-contact-icon" />
            <div>
              <span className="footer-contact-label">Email</span>
              <a href="mailto:hello@houseofviii.com" className="footer-contact-value">hello@houseofviii.com</a>
            </div>
          </div>
        </div>

      </div>

      {/* ── Bottom bar ── */}
      <div className="footer-bottom">
        <span className="footer-copy">copyright 2026 | House of Eight</span>
      </div>
    </footer>
  );
}
