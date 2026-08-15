import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductForm from './ProductForm.jsx';
import OrdersList from './OrdersList.jsx';

export default function AdminDashboard() {
  const [tab, setTab]           = useState('products');
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('h8_admin_token');

  function logout() {
    localStorage.removeItem('h8_admin_token');
    navigate('/admin/login');
  }

  async function loadProducts() {
    setLoading(true);
    const res  = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }

  useEffect(() => { loadProducts(); }, []);

  function handleSaved(product) {
    setProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      return exists
        ? prev.map(p => p.id === product.id ? product : p)
        : [product, ...prev];
    });
    setShowForm(false);
    setEditProduct(null);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE', headers: { 'x-admin-token': token } });
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  return (
    <div className="admin-dashboard">

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <img src="/assets/logo.svg" alt="House of 8" className="admin-sidebar__logo" />
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            className={`admin-sidebar__link${tab === 'products' ? ' active' : ''}`}
            onClick={() => setTab('products')}
          >
            🪑 Products
          </button>
          <button
            className={`admin-sidebar__link${tab === 'orders' ? ' active' : ''}`}
            onClick={() => setTab('orders')}
          >
            📦 Orders
          </button>
        </nav>
        <button className="admin-sidebar__logout" onClick={logout}>Sign Out</button>
      </aside>

      {/* Products tab */}
      {tab === 'products' && (
        <main className="admin-main">
          <div className="admin-topbar">
            <div>
              <h1>Products</h1>
              <p>{products.length} total</p>
            </div>
            <button className="admin-btn admin-btn--primary" onClick={() => { setEditProduct(null); setShowForm(true); }}>
              + Add Product
            </button>
          </div>

          {showForm && (
            <div className="admin-panel-overlay" onClick={() => setShowForm(false)}>
              <div className="admin-panel" onClick={e => e.stopPropagation()}>
                <ProductForm
                  product={editProduct}
                  onSave={handleSaved}
                  onCancel={() => { setShowForm(false); setEditProduct(null); }}
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="admin-loading">Loading…</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th><th>Name</th><th>Category</th>
                    <th>Material</th><th>Price</th><th>Rating</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="admin-table__thumb">
                          {(() => {
                            const primary = (p.images || []).find(i => i.is_primary) || (p.images || [])[0];
                            return primary ? (
                              <img src={`/uploads/${primary.filename}`} alt={p.name} />
                            ) : (
                              <div className="admin-table__no-img">—</div>
                            );
                          })()}
                        </div>
                      </td>
                      <td><strong>{p.name}</strong></td>
                      <td><span className="admin-badge">{p.category}</span></td>
                      <td>{p.material || '—'}</td>
                      <td>PKR {Number(p.price).toLocaleString('en-PK')}</td>
                      <td>{'★'.repeat(Math.round(p.rating))} ({p.rating})</td>
                      <td>
                        <div className="admin-table__actions">
                          <button className="admin-btn admin-btn--sm" onClick={() => { setEditProduct(p); setShowForm(true); }}>Edit</button>
                          <button className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDelete(p.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: '#9c9c9c' }}>No products yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      )}

      {/* Orders tab */}
      {tab === 'orders' && <OrdersList />}
    </div>
  );
}
