// Product data for public pages.
// - Home page showcase (getProducts() with no category): static JSON bundle,
//   so its pictures never change when the catalogue does.
// - Shop listing and product pages: live from the backend (/api/products).

let homeCache = null;

async function loadHome() {
  if (homeCache) return homeCache;
  const res = await fetch('/data/products.json');
  homeCache = (await res.json()).filter(p => !p.hideOnHome);
  return homeCache;
}

async function api(path) {
  const res = await fetch(path);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export async function getProducts(category) {
  if (!category) return loadHome();
  const qs = category === 'See All' ? '' : `?category=${encodeURIComponent(category)}`;
  return (await api(`/api/products${qs}`)) || [];
}

export async function getProduct(id) {
  return api(`/api/products/${encodeURIComponent(id)}`);
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
