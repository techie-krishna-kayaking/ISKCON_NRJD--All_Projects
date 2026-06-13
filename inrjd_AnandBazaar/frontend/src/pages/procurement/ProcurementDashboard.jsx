import { useState, useEffect } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Loading, Empty } from '../../components/ui/LoadingEmpty';
import toast from 'react-hot-toast';

export default function ProcurementDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const fetchItems = () => {
    setLoading(true);
    api.get(`/procurement?status=${filter}`).then((res) => setItems(res.data.procurements || [])).finally(() => setLoading(false));
  };

  useEffect(fetchItems, [filter]);

  const updateItem = async (id, itemId, purchasedQty) => {
    try {
      await api.put(`/procurement/${id}/items/${itemId}`, { purchasedQuantity: purchasedQty, status: 'purchased' });
      toast.success('Updated!');
      fetchItems();
    } catch (err) { toast.error('Failed'); }
  };

  const markComplete = async (id) => {
    try {
      await api.put(`/procurement/${id}/complete`);
      toast.success('Procurement marked complete');
      fetchItems();
    } catch (err) { toast.error('Failed'); }
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-6)' }}>🛒 Procurement</h1>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        {['pending', 'in_progress', 'completed'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-full)',
            background: filter === s ? 'var(--color-saffron)' : 'var(--color-cream-dark)',
            color: filter === s ? 'white' : 'var(--color-text-secondary)',
            border: 'none', cursor: 'pointer', textTransform: 'capitalize',
          }}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? <Loading /> : items.length === 0 ? <Empty icon="🛒" message={`No ${filter.replace('_', ' ')} procurements`} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {items.map((proc) => (
            <div key={proc._id} style={{ background: 'var(--color-white)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', border: '1px solid var(--color-border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                <div>
                  <strong>Order #{proc.order?.orderNumber}</strong>
                  <span style={{ marginLeft: 'var(--space-2)' }}><Badge status={proc.overallStatus} /></span>
                </div>
                {proc.overallStatus !== 'completed' && (
                  <Button variant="success" size="sm" onClick={() => markComplete(proc._id)}>Mark Complete</Button>
                )}
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Material', 'Required', 'Current Stock', 'Shortage', 'Purchased', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: 'var(--space-2)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {proc.items?.map((item) => (
                    <tr key={item._id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                      <td style={{ padding: 'var(--space-2)', fontWeight: 500 }}>{item.rawMaterial?.name || item.name}</td>
                      <td style={{ padding: 'var(--space-2)' }}>{item.requiredQuantity} {item.unit}</td>
                      <td style={{ padding: 'var(--space-2)' }}>{item.currentStock ?? '—'}</td>
                      <td style={{ padding: 'var(--space-2)', color: 'var(--color-error)', fontWeight: 600 }}>{item.shortage ?? '—'}</td>
                      <td style={{ padding: 'var(--space-2)' }}>
                        {item.status === 'purchased' ? (
                          <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>✅ {item.purchasedQuantity}</span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: 'var(--space-2)' }}>
                        {item.status !== 'purchased' && (
                          <Button variant="outline" size="sm" onClick={() => updateItem(proc._id, item._id, item.requiredQuantity)}>
                            Mark Purchased
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
