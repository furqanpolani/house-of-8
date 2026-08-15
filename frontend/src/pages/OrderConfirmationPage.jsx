import { useSearchParams, Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

export default function OrderConfirmationPage() {
  const [params] = useSearchParams();
  const orderId  = params.get('id');
  const name     = params.get('name') || 'Valued Customer';

  return (
    <div className="page-shop">
      <Header />

      <div className="order-confirmed">
        <div className="order-confirmed__card">
          <div className="order-confirmed__icon">✓</div>
          <h1 className="order-confirmed__title">Order Placed!</h1>
          <p className="order-confirmed__sub">
            Thank you, <strong>{name}</strong>. Your order has been received and is being processed.
          </p>
          {orderId && (
            <p className="order-confirmed__id">
              Order ID: <strong>#{String(orderId).padStart(5, '0')}</strong>
            </p>
          )}
          <p className="order-confirmed__note">
            You will receive a confirmation email shortly.<br />
            Delivery takes 7–14 working days.
          </p>
          <div className="order-confirmed__actions">
            <Link to="/shop" className="btn btn--green">Continue Shopping →</Link>
            <Link to="/" className="btn btn--outline" style={{ color: '#47593d', border: '1.5px solid #47593d', background: 'transparent' }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
