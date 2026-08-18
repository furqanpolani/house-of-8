export default function Footer() {
  return (
    <footer className="footer">
      <img
        src="/assets/r23_Realistic_image_of_tropical_leaves_in_different_poses_wit_80d95387-c7d2-42ca-a677-9c2a2ac4d703_0 copy 22.png"
        alt="" className="footer-leaves" aria-hidden="true"
      />

      <div className="footer-inner">

        {/* ── Brand column ── */}
        <div className="footer-brand">
                  <img src="/assets/LgogHhouse_of_8.png" alt="House of 8" className="footer-logo-svg" />
          {/* <p className="footer-brand-name">House of 8</p> */}
          <div className="footer-social">
            {['Component 28 – 2', 'Component 29 – 2', 'Component 32 – 2'].map((name, i) => (
              <a key={i} href="#" aria-label={`Social ${i + 1}`}>
                <img src={`/assets/2/${name}.svg`} alt="" width="20" />
              </a>
            ))}
          </div>
          <p className="footer-uan">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ marginRight: 6, flexShrink: 0 }}>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            UAN: 111-832-682
          </p>
        </div>

        {/* ── Nav columns ── */}
        <nav className="footer-nav" aria-label="Footer navigation">
          <div className="footer-col">
            <h5 className="footer-col-title">Explore</h5>
            <a href="#">Living</a>
            <a href="#">Dining</a>
            <a href="#">Bedroom</a>
            <a href="#">Office</a>
          </div>
          <div className="footer-col">
            <h5 className="footer-col-title">Services</h5>
            <a href="#">Living</a>
            <a href="#">Dining</a>
            <a href="#">Bedroom</a>
            <a href="#">Office</a>
          </div>
          <div className="footer-col">
            <h5 className="footer-col-title">Services</h5>
            <a href="#">Living</a>
            <a href="#">Dining</a>
            <a href="#">Bedroom</a>
            <a href="#">Office</a>
          </div>
        </nav>

        {/* ── Newsletter ── */}
        <div className="footer-newsletter">
          <p className="newsletter-heading">Join the IHI Family</p>
          <p className="newsletter-sub">Please fill in your details to get access to our catalog online.</p>
          <form className="newsletter-form" onSubmit={e => e.preventDefault()}>
            <input type="email" placeholder="Your email address" aria-label="Email address" />
            <button type="submit" className="btn btn--gold">Subscribe</button>
          </form>
        </div>

      </div>

      {/* ── Bottom bar ── */}
      <div className="footer-bottom">
        <p className="footer-copy">Copyright Irtiqa Hassan Interiors 2023</p>
      </div>
    </footer>
  );
}
