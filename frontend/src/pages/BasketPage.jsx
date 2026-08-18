import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  if (p.image && !p.image.startsWith('default-')) return `/uploads/${p.image}`;
  return FALLBACK[p.category] || FALLBACK.default;
}

const TAX_RATE = 0.16;
const DELIVERY = 2000;

export default function BasketPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQty, clearCart, totalAmount } = useCart();

  const [showCheckout, setShowCheckout] = useState(false);
  const [form, setForm]     = useState({ name: '', email: '', phone: '', address: '' });
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);

  const tax       = totalAmount * TAX_RATE;
  const delivery  = items.length > 0 ? DELIVERY : 0;
  const grandTotal = totalAmount + tax + delivery;

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(err => ({ ...err, [e.target.name]: '' }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim())  e.name  = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.address.trim()) e.address = 'Delivery address is required';
    return e;
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setPlacing(true);
    try {
      const res  = await fetch('/api/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name:    form.name,
          customer_email:   form.email,
          customer_phone:   form.phone,
          customer_address: form.address,
          items: items.map(i => ({
            product_id:    i.id,
            product_name:  i.name,
            product_price: i.price,
            quantity:      i.qty,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order failed');
      clearCart();
      navigate(`/order-confirmed?id=${data.id}&name=${encodeURIComponent(form.name)}`);
    } catch (err) {
      setErrors({ submit: err.message });
      setPlacing(false);
    }
  }

  return (
    <div className="page-shop">
      <Header />

      {/* ── Checkout Overlay ── */}
      {showCheckout && (
        <div className="co-overlay" onClick={() => setShowCheckout(false)}>
          <div className="co-panel" onClick={e => e.stopPropagation()}>
            <div className="co-panel__head">
              <h2 className="co-panel__title">Delivery Details</h2>
              <button className="co-panel__close" onClick={() => setShowCheckout(false)}>✕</button>
            </div>

            <form onSubmit={handlePlaceOrder} className="co-form">
              <div className="co-form__row">
                <label className="co-form__label">
                  Full Name *
                  <input name="name" value={form.name} onChange={handleChange}
                    placeholder="e.g. Ali Hassan"
                    className={errors.name ? 'error' : ''} />
                  {errors.name && <span className="field-error">{errors.name}</span>}
                </label>
                <label className="co-form__label">
                  Email *
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="e.g. ali@email.com"
                    className={errors.email ? 'error' : ''} />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </label>
              </div>

              <label className="co-form__label">
                Phone Number
                <input name="phone" value={form.phone} onChange={handleChange}
                  placeholder="e.g. 03001234567" />
              </label>

              <label className="co-form__label">
                Delivery Address *
                <textarea name="address" value={form.address} onChange={handleChange}
                  placeholder="House no., Street, Area, City" rows={3}
                  className={errors.address ? 'error' : ''} />
                {errors.address && <span className="field-error">{errors.address}</span>}
              </label>

              {/* Mini summary */}
              <div className="co-form__summary">
                {items.map(i => (
                  <div className="co-form__row2" key={i.id}>
                    <span>{i.name} × {i.qty}</span>
                    <span>PKR {Number(i.price * i.qty).toLocaleString('en-PK')}</span>
                  </div>
                ))}
                <div className="co-form__row2">
                  <span>Tax (16%)</span>
                  <span>PKR {Math.round(tax).toLocaleString('en-PK')}</span>
                </div>
                <div className="co-form__row2">
                  <span>Delivery</span>
                  <span>PKR {delivery.toLocaleString('en-PK')}</span>
                </div>
                <div className="co-form__row2 co-form__total">
                  <span>Total</span>
                  <span>PKR {Math.round(grandTotal).toLocaleString('en-PK')}</span>
                </div>
              </div>

              {errors.submit && <p className="field-error" style={{ fontSize: 14 }}>{errors.submit}</p>}

              <button type="submit" className="co-form__submit" disabled={placing}>
                {placing ? 'Placing Order…' : 'Place Order →'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Page body ── */}
      <div className="basket-page">

        {items.length === 0 ? (
          <div className="basket-empty">
            <p>Your basket is empty.</p>
            <Link to="/shop" className="btn btn--green" style={{ marginTop: 24 }}>
              Continue Shopping →
            </Link>
          </div>
        ) : (
          <div className="basket-layout">

            {/* ── LEFT: Your Basket ────────────────────────── */}
            <div className="basket-left">
              <h1 className="basket-heading">Your Basket</h1>

              <div className="basket-grid">
                {items.map(item => {
                  const priceStr = Number(item.price).toLocaleString('en-PK');
                  const refCode  = `Ref. ${String(item.id).padStart(4,'0')}/${String((item.id * 73) % 999).padStart(3,'0')}/${String((item.id * 17) % 999).padStart(3,'0')}`;
                  const dimensions = item.dimensions || '43 x 82 x 43 cm';
                  return (
                    <div className="basket-card" key={item.id}>
                      <div className="basket-card__img-wrap">
                        <img
                          src={getImageSrc(item)}
                          alt={item.name}
                          className="basket-card__img"
                        />
                        <button
                          className="basket-card__remove"
                          onClick={() => removeItem(item.id)}
                          aria-label="Remove item"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="8"  y1="8"  x2="16" y2="16" />
                            <line x1="16" y1="8"  x2="8"  y2="16" />
                          </svg>
                        </button>
                      </div>

                      {/* Name + price on left, qty pill on right */}
                      <div className="basket-card__row">
                        <div className="basket-card__title">
                          <p className="basket-card__name">{item.name || 'Lorem ipsum'}</p>
                          <p className="basket-card__price">PKR {priceStr}</p>
                        </div>
                        <div className="basket-card__qty">
                          <button
                            className="basket-card__qty-btn"
                            onClick={() => updateQty(item.id, item.qty - 1)}
                            aria-label="Decrease quantity"
                          >−</button>
                          <span className="basket-card__qty-num">
                            {String(item.qty).padStart(2, '0')}
                          </span>
                          <button
                            className="basket-card__qty-btn"
                            onClick={() => updateQty(item.id, item.qty + 1)}
                            aria-label="Increase quantity"
                          >+</button>
                        </div>
                      </div>

                      <p className="basket-card__ref">
                        {refCode}<br />
                        {dimensions}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── RIGHT: Checkout summary ────────────────── */}
            <div className="basket-right">
              <h2 className="basket-heading">Checkout</h2>

              <div className="checkout-box">
                <p className="checkout-box__count">
                  {items.reduce((s, i) => s + i.qty, 0)} Item{items.reduce((s, i) => s + i.qty, 0) !== 1 ? 's' : ''}
                </p>

                <div className="checkout-box__divider" />

                <p className="checkout-box__label">Total items</p>

                <div className="checkout-box__rows">
                  {items.map(i => (
                    <div className="checkout-box__row" key={i.id}>
                      <span className="checkout-box__row-name">{i.name || 'Lorem ipsum'}</span>
                      <span className="checkout-box__row-value">
                        PKR {Number(i.price * i.qty).toLocaleString('en-PK')}
                      </span>
                    </div>
                  ))}
                  <div className="checkout-box__row">
                    <span>Tax (16%)</span>
                    <span className="checkout-box__row-value">
                      PKR {Math.round(tax).toLocaleString('en-PK')}
                    </span>
                  </div>
                  <div className="checkout-box__row">
                    <span>Delivery Charges</span>
                    <span className="checkout-box__row-value">
                      PKR {delivery.toLocaleString('en-PK')}
                    </span>
                  </div>
                </div>

                <div className="checkout-box__divider" />

                <div className="checkout-box__row checkout-box__row--total">
                  <span>Total</span>
                  <span>PKR {Math.round(grandTotal).toLocaleString('en-PK')}</span>
                </div>

                <button
                  className="checkout-box__btn"
                  onClick={() => setShowCheckout(true)}
                >
                  Proceed to Payment
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
