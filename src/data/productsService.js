// Single source of truth for product data.
// Loads once from the static JSON bundle; subsequent calls use the cache.
// The admin panel still uses /api/* directly — this is for public pages only.

let cache = null;

async function loadAll() {
  if (cache) return cache;
  const res = await fetch('/data/products.json');
  cache = await res.json();
  return cache;
}

export async function getProducts(category) {
  const all = await loadAll();
  // No category = home page showcase; skip products flagged shop-only.
  if (!category) return all.filter(p => !p.hideOnHome);
  if (category === 'See All') return all;
  return all.filter(p => p.category === category);
}

export async function getProduct(id) {
  const all = await loadAll();
  return all.find(p => p.id === Number(id)) || null;
}

export function getImageUrl(product) {
  const images = product?.images || [];
  const primary = images.find(i => i.is_primary) || images[0];
  if (primary?.filename && !primary.filename.startsWith('default-')) {
    return `/uploads/${primary.filename}`;
  }
  return null;
}

export function getAllImageUrls(product) {
  const images = (product?.images || []).filter(i => !i.filename.startsWith('default-'));
  return images.length > 0 ? images.map(i => `/uploads/${i.filename}`) : null;
}
