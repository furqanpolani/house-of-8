import { useState } from 'react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', message: '', source: '', agreed: false,
  });
  const [sent, setSent] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="page-contact">
      <Header />

      <main className="contact-main">

        {/* ── Left leaf decoration ── */}
        {/* <img
          src="/assets/contactus/Group 43037.png"
          alt=""
          className="contact-leaf"
          aria-hidden="true"
        /> */}
        {/* <img
          src="/assets/u3851352797_a_single_ruscus_stem_with_pointed_leaves_loose_so_9d8289cb-e609-4197-a420-f1dab77214c8_02.png"
          alt=""
          aria-hidden="true"
          className="shop-leaf"
        /> */}

        {/* ── Content split: form left, image right ── */}
        <div className="contact-split">

        <img
          src="/assets/u3851352797_a_single_ruscus_stem_with_pointed_leaves_loose_so_9d8289cb-e609-4197-a420-f1dab77214c8_02.png"
          alt=""
          aria-hidden="true"
          className="shop-leaf-contact"
        />
          {/* Left column */}
          <div className="contact-left">
            <h1 className="contact-title">Contact Us</h1>
            <p className="contact-sub">
              We will be happy to help you with your inquiries,<br />
              the services and products you receive.
            </p>

            {/* Form card */}
            <div className="contact-card">
              <p className="contact-card__heading">Connect with Us!</p>

              {sent ? (
                <div className="contact-success">
                  Thank you! We'll be in touch soon.
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit}>

                  <label className="contact-form__label">
                    Name*
                    <input
                      className="contact-form__input"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Shan Chandani"
                      required
                    />
                  </label>

                  <div className="contact-form__row">
                    <label className="contact-form__label">
                      Contact Number*
                      <input
                        className="contact-form__input"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="1300 352 287"
                        required
                      />
                    </label>
                    <label className="contact-form__label">
                      Email Address
                      <input
                        className="contact-form__input"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="contact@example.com"
                      />
                    </label>
                  </div>

                  <label className="contact-form__label">
                    Your Message*
                    <textarea
                      className="contact-form__textarea"
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Lorem ipsum dolor sit amet, consectetuer adipiscing elit…"
                      required
                    />
                  </label>

                  <label className="contact-form__label">
                    How did you find us?
                    <div className="contact-form__select-wrap">
                      <select
                        className="contact-form__select"
                        name="source"
                        value={form.source}
                        onChange={handleChange}
                      >
                        <option value="">Select…</option>
                        <option>Facebook</option>
                        <option>Instagram</option>
                        <option>Google</option>
                        <option>Word of Mouth</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </label>

                  <label className="contact-form__checkbox">
                    <input
                      type="checkbox"
                      name="agreed"
                      checked={form.agreed}
                      onChange={handleChange}
                      required
                    />
                    <span>By submitting this form, you confirm that you have read and agree to the Terms of Service</span>
                  </label>

                  <button type="submit" className="contact-form__submit">
                    Send Message →
                  </button>

                </form>
              )}
            </div>

            {/* Contact details row */}
            <div className="contact-details">
              <div className="contact-details__item">
                <img src="/assets/contactus/Group 43039.svg" alt="" width="36" height="36" />
                <div>
                  <span className="contact-details__label">Phone / WhatsApp</span>
                  <a href="tel:+923333317121" className="contact-details__value">+92 333 3317121</a>
                </div>
              </div>
              <div className="contact-details__item">
                <img src="/assets/contactus/Group 43041.svg" alt="" width="36" height="36" />
                <div>
                  <span className="contact-details__label">Email</span>
                  <a href="mailto:hello@houseofviii.com" className="contact-details__value">hello@houseofviii.com</a>
                </div>
              </div>
            </div>
          </div>

          {/* Right column — model image */}
          <div className="contact-right" aria-hidden="true" />

        </div>
      </main>

      <Footer />
    </div>
  );
}
