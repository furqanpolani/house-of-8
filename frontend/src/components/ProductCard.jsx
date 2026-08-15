import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

const FALLBACK = {
  'Arm Chair':    '/assets/2/Mask Group 41.png',
  'Coffee Table': '/assets/2/Group 31923.png',
  'Sette':        '/assets/2/Group 31924.png',
  'Bed':          '/assets/2/Group 31923.png',
  'Accessories':  '/assets/2/Group 31924.png',
  default:        '/assets/2/Group 31923.png',
};

function getImageSrc(product) {
  if (product.image && !product.image.startsWith('default-')) {
    return `/uploads/${product.image}`;
  }
  return FALLBACK[product.category] || FALLBACK.default;
}

export default function ProductCard({ product }) {
  const stars = Math.round(product.rating || 5);
  const navigate = useNavigate();
  const { addItem } = useCart();

  function handleOrderNow() {
    addItem(product, 1);
    navigate('/basket');
  }

  return (
    <article className="product-card-2">
      <div className="product-card-2__img">
        <img src={getImageSrc(product)} alt={product.name} />
      </div>
      <div className="product-card-2__body">
        <div className="product-card-2__dots">
          {[0,1,2,3,4].map(i => (
            <span key={i} className={`pc-dot${i === 0 ? ' pc-dot--active' : ''}`} />
          ))}
        </div>
        <div className="product-card-2__info">
          <h4 className="product-card-2__name">{product.name}</h4>
          <div className="product-card-2__rating">
            <span className="pc-stars">{'★'.repeat(stars)}</span>
            <span className="pc-rating-count">({stars})</span>
          </div>
          <p className="product-card-2__price">PKR {Number(product.price).toLocaleString('en-PK')}</p>
        </div>
        <div className="product-card-2__actions">
          <button
            className="product-card-2__view"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            View details →
          </button>
          <button className="product-card-2__order" onClick={handleOrderNow}>
            Order Now
          </button>
        </div>
      </div>
    </article>
  );
}
