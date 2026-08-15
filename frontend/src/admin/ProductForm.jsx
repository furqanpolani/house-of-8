import { useState, useEffect, useRef } from 'react';

const CATEGORIES = ['Bed', 'Arm Chair', 'Sette', 'Coffee Table', 'Accessories'];

export default function ProductForm({ product, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '', category: 'Arm Chair', material: '', price: '', rating: '5',
  });
  // Images already on the server (for existing products)
  const [serverImages, setServerImages] = useState([]);
  // Files queued to upload (for new products and adding more to existing)
  const [pendingFiles, setPendingFiles] = useState([]);
  // Previews for pending files
  const [pendingPreviews, setPendingPreviews] = useState([]);
  // Which server image id is primary (only relevant for existing products)
  const [primaryId, setPrimaryId] = useState(null);
  // Which pending index is primary (only if no server images yet)
  const [pendingPrimary, setPendingPrimary] = useState(0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const token = localStorage.getItem('h8_admin_token');

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name, category: product.category,
        material: product.material || '', price: product.price, rating: product.rating,
      });
      const imgs = product.images || [];
      setServerImages(imgs);
      const primary = imgs.find(i => i.is_primary);
      setPrimaryId(primary ? primary.id : (imgs[0]?.id ?? null));
    }
  }, [product]);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handlePickFiles(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPendingFiles(prev => [...prev, ...files]);
    setPendingPreviews(prev => [...prev, ...newPreviews]);
    e.target.value = '';
  }

  function removePending(i) {
    setPendingFiles(prev => prev.filter((_, idx) => idx !== i));
    setPendingPreviews(prev => prev.filter((_, idx) => idx !== i));
    if (pendingPrimary === i) setPendingPrimary(0);
  }

  async function deleteServerImage(imgId) {
    if (!product) return;
    const res = await fetch(`/api/products/${product.id}/images/${imgId}`, {
      method: 'DELETE', headers: { 'x-admin-token': token },
    });
    if (!res.ok) { setError('Failed to delete image'); return; }
    const data = await res.json();
    const imgs = data.images || [];
    setServerImages(imgs);
    const primary = imgs.find(i => i.is_primary);
    setPrimaryId(primary ? primary.id : (imgs[0]?.id ?? null));
    onSave(data);
  }

  async function setServerPrimary(imgId) {
    if (!product) return;
    const res = await fetch(`/api/products/${product.id}/images/${imgId}/primary`, {
      method: 'PUT', headers: { 'x-admin-token': token },
    });
    if (!res.ok) { setError('Failed to set primary'); return; }
    const data = await res.json();
    const imgs = data.images || [];
    setServerImages(imgs);
    setPrimaryId(imgId);
    onSave(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      // 1. Save product fields
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => body.append(k, v));
      const url    = product ? `/api/products/${product.id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'x-admin-token': token }, body });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      let latest = data;

      // 2. Bulk-upload pending files if any
      if (pendingFiles.length > 0) {
        const imgBody = new FormData();
        pendingFiles.forEach(f => imgBody.append('images', f));
        const imgRes  = await fetch(`/api/products/${latest.id}/images`, {
          method: 'POST', headers: { 'x-admin-token': token }, body: imgBody,
        });
        const imgData = await imgRes.json();
        if (!imgRes.ok) throw new Error(imgData.error || 'Image upload failed');
        latest = imgData;

        // If pending primary index > 0, promote that image
        if (!product && pendingPrimary > 0) {
          const imgs = latest.images || [];
          const targetImg = imgs[pendingPrimary];
          if (targetImg) {
            const pRes  = await fetch(`/api/products/${latest.id}/images/${targetImg.id}/primary`, {
              method: 'PUT', headers: { 'x-admin-token': token },
            });
            if (pRes.ok) latest = await pRes.json();
          }
        }
      }

      onSave(latest);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const hasServerImages = serverImages.length > 0;
  const hasPending      = pendingFiles.length > 0;

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <h2>{product ? 'Edit Product' : 'Add Product'}</h2>

      <label>Product Name *
        <input name="name" value={form.name} onChange={handleChange} required />
      </label>

      <label>Category *
        <select name="category" value={form.category} onChange={handleChange}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </label>

      <label>Material
        <input name="material" value={form.material} onChange={handleChange} placeholder="e.g. Fabric · Olive Print" />
      </label>

      <div className="admin-form__row">
        <label>Price (PKR) *
          <input name="price" type="number" value={form.price} onChange={handleChange} required min="0" />
        </label>
        <label>Rating
          <input name="rating" type="number" value={form.rating} onChange={handleChange} min="1" max="5" step="0.1" />
        </label>
      </div>

      {/* Images section */}
      <div className="admin-form__images-label">
        Product Images
        <button type="button" className="admin-btn admin-btn--sm" style={{ marginLeft: 10 }}
          onClick={() => fileInputRef.current?.click()}>
          + Add Images
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePickFiles} />
      </div>

      {(hasServerImages || hasPending) && (
        <div className="admin-img-grid">
          {/* Server images */}
          {serverImages.map(img => (
            <div key={img.id} className={`admin-img-tile${img.id === primaryId ? ' admin-img-tile--primary' : ''}`}>
              <img src={`/uploads/${img.filename}`} alt="" />
              <div className="admin-img-tile__actions">
                <button type="button" title="Set as primary"
                  className={`admin-img-btn${img.id === primaryId ? ' active' : ''}`}
                  onClick={() => setServerPrimary(img.id)}>★</button>
                <button type="button" title="Remove" className="admin-img-btn admin-img-btn--del"
                  onClick={() => deleteServerImage(img.id)}>✕</button>
              </div>
              {img.id === primaryId && <span className="admin-img-tile__badge">Primary</span>}
            </div>
          ))}

          {/* Pending files (new, not yet uploaded) */}
          {pendingPreviews.map((src, i) => (
            <div key={i} className={`admin-img-tile admin-img-tile--pending${!hasServerImages && i === pendingPrimary ? ' admin-img-tile--primary' : ''}`}>
              <img src={src} alt="" />
              <div className="admin-img-tile__actions">
                {!hasServerImages && (
                  <button type="button" title="Set as primary"
                    className={`admin-img-btn${i === pendingPrimary ? ' active' : ''}`}
                    onClick={() => setPendingPrimary(i)}>★</button>
                )}
                <button type="button" title="Remove" className="admin-img-btn admin-img-btn--del"
                  onClick={() => removePending(i)}>✕</button>
              </div>
              {!hasServerImages && i === pendingPrimary && <span className="admin-img-tile__badge">Primary</span>}
              <span className="admin-img-tile__new-badge">New</span>
            </div>
          ))}
        </div>
      )}

      {!hasServerImages && !hasPending && (
        <div className="admin-img-empty" onClick={() => fileInputRef.current?.click()}>
          Click "+ Add Images" to upload product photos
        </div>
      )}

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-form__actions">
        <button type="button" className="admin-btn admin-btn--ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
          {saving ? 'Saving…' : (product ? 'Update Product' : 'Add Product')}
        </button>
      </div>
    </form>
  );
}
