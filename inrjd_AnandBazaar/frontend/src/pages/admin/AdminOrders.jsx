import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Loading, Empty } from '../../components/ui/LoadingEmpty';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchOrders = () => {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : '';
    api.get(`/orders${params}`).then((res) => setOrders(res.data.orders || []))
      .catch(() => toast.error('Failed to load orders')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const handleApprove = async (id) => {
    const pricePerPlate = prompt('Enter price per plate (₹):');
    if (!pricePerPlate) return;
    try {
      await api.patch(`/orders/${id}/approve`, { pricePerPlate: parseFloat(pricePerPlate) });
      toast.success('Order approved!');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve');
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      toast.success(`Status changed to ${status}`);
      fetchOrders();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const statuses = ['', 'placed', 'under_review', 'approved', 'invoiced', 'paid', 'completed', 'rejected', 'cancelled'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)' }}>📦 Orders</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '2px solid var(--color-border)', fontSize: 'var(--text-sm)' }}>
          {statuses.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
      </div>

      {loading ? <Loading /> : orders.length === 0 ? <Empty icon="📦" message="No orders found" /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--color-white)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--color-cream)', borderBottom: '2px solid var(--color-border)' }}>
                {['Order #', 'Customer', 'Event Date', 'Adults/Kids', 'Status', 'Total', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>{order.orderNumber}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div>{order.customerName || order.customer?.name || '—'}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{order.customerEmail}</div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{new Date(order.eventDate).toLocaleDateString()}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{order.numberOfAdults} / {order.numberOfKids}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}><Badge status={order.status} /></td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                    {order.totalAmount > 0 ? `₹${order.totalAmount.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                      {order.status === 'placed' && (
                        <>
                          <Button variant="primary" size="sm" onClick={() => handleApprove(order._id)}>Approve</Button>
                          <Button variant="danger" size="sm" onClick={() => handleStatus(order._id, 'rejected')}>Reject</Button>
                        </>
                      )}
                      {order.status === 'approved' && (
                        <Button variant="secondary" size="sm" onClick={() => {
                          api.post('/invoices', { orderId: order._id }).then(() => { toast.success('Invoice generated!'); fetchOrders(); })
                            .catch((e) => toast.error(e.response?.data?.error || 'Failed'));
                        }}>Invoice</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
