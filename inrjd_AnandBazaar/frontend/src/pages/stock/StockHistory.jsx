import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Loading, Empty } from '../../components/ui/LoadingEmpty';

export default function StockHistory() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stock/history').then((res) => setEntries(res.data.entries || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (entries.length === 0) return <Empty icon="📅" message="No stock history yet" />;

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-6)' }}>📅 Stock History</h1>
      {entries.map((entry) => (
        <div key={entry._id} style={{ background: 'var(--color-white)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)', border: '1px solid var(--color-border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <strong>{new Date(entry.date).toLocaleDateString()}</strong>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>By: {entry.submittedBy?.name || 'Unknown'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-2)' }}>
            {entry.items?.map((item, i) => (
              <div key={i} style={{ fontSize: 'var(--text-sm)', padding: 'var(--space-1) var(--space-2)', background: 'var(--color-cream)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontWeight: 500 }}>{item.name}</span>: {item.quantity} {item.unit}
                {item.previousQuantity !== undefined && item.previousQuantity !== item.quantity && (
                  <span style={{ color: item.quantity > item.previousQuantity ? 'var(--color-success)' : 'var(--color-error)', marginLeft: 'var(--space-1)' }}>
                    ({item.quantity > item.previousQuantity ? '↑' : '↓'} from {item.previousQuantity})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
