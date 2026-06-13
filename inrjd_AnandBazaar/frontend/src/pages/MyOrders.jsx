import { useState, useEffect } from 'react';
import api from '../api/client';
import Badge from '../components/ui/Badge';
import { Loading, Empty } from '../components/ui/LoadingEmpty';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders').then((res) => setOrders(res.data.orders || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--space-6)' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-6)' }}>📦 My Orders</h1>

      {orders.length === 0 ? <Empty icon="📦" message="You haven't placed any orders yet" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {orders.map((order) => (
            <div key={order._id} style={{ background: 'var(--color-white)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', border: '1px solid var(--color-border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                <div>
                  <strong style={{ fontSize: 'var(--text-lg)' }}>#{order.orderNumber}</strong>
                  <span style={{ marginLeft: 'var(--space-2)' }}><Badge status={order.status} /></span>
                </div>
                <span style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-saffron-dark)' }}>₹{order.totalAmount?.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
                📅 {new Date(order.eventDate).toLocaleDateString()} · 📍 {order.venue}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                👥 {order.numberOfAdults} adults, {order.numberOfKids} kids
              </div>
              <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {order.items?.map((item, i) => (
                  <span key={i} style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', background: 'var(--color-cream)', borderRadius: 'var(--radius-full)' }}>
                    {item.foodItem?.name || item.name} × {item.quantity}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
