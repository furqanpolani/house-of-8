import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

/*
  Curated external product photos. Cycled per-product by id so the
  same product always renders the same photo across re-renders.
  Note: these are hot-linked third-party URLs — if any site starts
  blocking hotlinking, replace with locally-hosted copies.
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

function getImageSrc(product) {
  const id  = Number(product?.id);
  const idx = Number.isFinite(id)
    ? Math.abs(id) % SHOP_IMAGES.length
    : 0;
  return SHOP_IMAGES[idx];
}

function handleImgError(e) {
  // If a hot-linked URL is blocked or fails, drop to a local asset
  // so the tile never renders as a broken image.
  if (e.currentTarget.src !== LOCAL_FALLBACK) {
    e.currentTarget.src = LOCAL_FALLBACK;
  }
}

/*
  Minimal shop product card.

  Default state:
    ┌────────────────┐
    │                │
    │     image      │
    │                │
    ├────────────────┤
    │ Lorem ipsum    │
    │ PKR 45,000     │
    └────────────────┘

  Hover state — a dark wash covers the image, the share icon fades in
  at top-right, and the "Add to Basket" button slides up from the bottom
  edge. Clicking the media area (or name) navigates to the product
  detail page; the basket + share buttons use stopPropagation so the
  card link isn't triggered by them.
*/
export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addItem } = useCart();

  const priceStr = Number(product.price || 0).toLocaleString('en-PK');
  const image    = getImageSrc(product);

  function handleAddToBasket(e) {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
  }

  function handleShare(e) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/product/${product.id}`;
    if (navigator.share) {
      navigator.share({ title: product.name, url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  }

  return (
    <article className="product-card-3">
      <Link
        to={`/product/${product.id}`}
        className="product-card-3__media"
        aria-label={`View ${product.name}`}
      >
        <img
          src={image}
          alt={product.name}
          className="product-card-3__img"
          loading="lazy"
          onError={handleImgError}
        />

        {/* Sepia wash + hover controls — sit above the image, invisible
            until the card is hovered / focus-within. */}
        <div className="product-card-3__overlay">
          <button
            type="button"
            className="product-card-3__share"
            onClick={handleShare}
            aria-label={`Share ${product.name}`}
          >
            {/* Share icon — three connected nodes (Feather-style).
                Reads as "share" rather than "download/upload". */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5"  r="3" />
              <circle cx="6"  cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59"  y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51"  x2="8.59"  y2="10.49" />
            </svg>
          </button>

          <button
            type="button"
            className="product-card-3__basket"
            onClick={handleAddToBasket}
          >
            Add to Basket
          </button>
        </div>
      </Link>

      <div className="product-card-3__info">
        <h3 className="product-card-3__name">
          <Link to={`/product/${product.id}`}>{product.name || 'Lorem ipsum'}</Link>
        </h3>
        <p className="product-card-3__price">PKR {priceStr}</p>
      </div>
    </article>
  );
}
