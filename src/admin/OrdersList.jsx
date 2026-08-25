import { useState, useEffect } from 'react';

const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS = {
  pending:   { bg: '#fff8e1', color: '#b8860b' },
  confirmed: { bg: '#e8f5e9', color: '#2e7d32' },
  shipped:   { bg: '#e3f2fd', color: '#1565c0' },
  delivered: { bg: '#f3e5f5', color: '#6a1b9a' },
  cancelled: { bg: '#ffebee', color: '#c62828' },
};

export default function OrdersList() {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const token = localStorage.getItem('h8_admin_token');

  async function load() {
    setLoading(true);
    const res  = await fetch('/api/orders', { headers: { 'x-admin-token': token } });
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function openOrder(id) {
    const res  = await fetch(`/api/orders/${id}`, { headers: { 'x-admin-token': token } });
    const data = await res.json();
    setSelected(data);
  }

  async function updateStatus(id, status) {
    const res  = await fetch(`/api/orders/${id}/status`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body:    JSON.stringify({ status }),
    });
    const updated = await res.json();
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: updated.status } : o));
    if (selected?.id === id) setSelected(s => ({ ...s, status: updated.status }));
  }

  function fmtDate(dt) {
    return new Date(dt).toLocaleDateString('en-PK', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div className="admin-main">
      <div className="admin-topbar">
        <div>
          <h1>Orders</h1>
          <p>{orders.length} total</p>
        </div>
        <button className="admin-btn admin-btn--ghost" onClick={load}>↻ Refresh</button>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="admin-panel-overlay" onClick={() => setSelected(null)}>
          <div className="admin-panel" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontFamily: 'Poppins', fontSize: 18, fontWeight: 600 }}>
                  Order #{String(selected.id).padStart(5, '0')}
                </h2>
                <p style={{ fontSize: 13, color: '#9c9c9c', marginTop: 4 }}>{fmtDate(selected.created_at)}</p>
              </div>
              <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelected(null)}>✕ Close</button>
            </div>

            {/* Status selector */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#9c9c9c', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Status</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selected.id, s)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 500,
                      fontFamily: 'Poppins',
                      background: selected.status === s ? (STATUS_COLORS[s]?.bg || '#eee') : '#f0f0ee',
                      color: selected.status === s ? (STATUS_COLORS[s]?.color || '#333') : '#9c9c9c',
                      outline: selected.status === s ? `2px solid ${STATUS_COLORS[s]?.color}` : 'none',
                    }}
                  >{s}</button>
                ))}
              </div>
            </div>

            {/* Customer */}
            <div style={{ background: '#f9f9f7', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#9c9c9c', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>Customer</p>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{selected.customer_name}</p>
              <p style={{ fontSize: 13, color: '#9c9c9c' }}>{selected.customer_email}</p>
              {selected.customer_phone   && <p style={{ fontSize: 13, color: '#9c9c9c' }}>{selected.customer_phone}</p>}
              {selected.customer_address && <p style={{ fontSize: 13, color: '#9c9c9c', marginTop: 8 }}>{selected.customer_address}</p>}
            </div>

            {/* Items */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#9c9c9c', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>Items</p>
              {(selected.items || []).map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0ee' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500 }}>{item.product_name}</p>
                    <p style={{ fontSize: 12, color: '#9c9c9c' }}>Qty: {item.quantity} × PKR {Number(item.product_price).toLocaleString('en-PK')}</p>
                  </div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>PKR {Number(item.subtotal).toLocaleString('en-PK')}</p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, paddingTop: 12, borderTop: '2px solid #f0f0ee' }}>
              <span>Total</span>
              <span style={{ color: '#47593d' }}>PKR {Number(selected.total_amount).toLocaleString('en-PK')}</span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="admin-loading">Loading…</div>
      ) : (
        <div className="admin-table-wrap">
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 80, color: '#9c9c9c', fontSize: 15 }}>
              No orders yet. Orders placed by customers will appear here.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const sc = STATUS_COLORS[o.status] || {};
                  return (
                    <tr key={o.id}>
                      <td><strong>#{String(o.id).padStart(5, '0')}</strong></td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{o.customer_name}</div>
                        <div style={{ fontSize: 12, color: '#9c9c9c' }}>{o.customer_email}</div>
                      </td>
                      <td style={{ fontSize: 12, color: '#9c9c9c' }}>{fmtDate(o.created_at)}</td>
                      <td>{o.item_count} item{o.item_count !== 1 ? 's' : ''}</td>
                      <td><strong>PKR {Number(o.total_amount).toLocaleString('en-PK')}</strong></td>
                      <td>
                        <span style={{ ...sc, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, fontFamily: 'Poppins' }}>
                          {o.status}
                        </span>
                      </td>
                      <td>
                        <div className="admin-table__actions">
                          <button className="admin-btn admin-btn--sm" onClick={() => openOrder(o.id)}>View</button>
                          <select
                            value={o.status}
                            onChange={ev => updateStatus(o.id, ev.target.value)}
                            style={{ fontFamily: 'Poppins', fontSize: 12, padding: '6px 8px', borderRadius: 8, border: '1px solid #e0e0e0', cursor: 'pointer' }}
                          >
                            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
