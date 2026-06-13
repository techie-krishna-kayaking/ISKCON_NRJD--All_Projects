import { useState, useEffect } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Loading } from '../../components/ui/LoadingEmpty';
import toast from 'react-hot-toast';

export default function StockDashboard() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    api.get('/stock').then((res) => {
      const items = res.data.stock || [];
      setMaterials(items);
      const qtyMap = {};
      items.forEach((m) => { qtyMap[m._id] = m.currentStock; });
      setQuantities(qtyMap);
    }).finally(() => setLoading(false));
  }, []);

  const updateQty = (id, delta) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }));
  };

  const setQty = (id, val) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, parseFloat(val) || 0) }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const items = materials.map((m) => ({
        rawMaterial: m._id,
        quantity: quantities[m._id] || 0,
      }));
      await api.post('/stock/daily', { items });
      toast.success('Daily stock submitted! 📋');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const categories = ['all', ...new Set(materials.map((m) => m.category))];
  const filtered = categoryFilter === 'all' ? materials : materials.filter((m) => m.category === categoryFilter);

  if (loading) return <Loading />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)' }}>📋 Daily Stock Taking</h1>
        <Button variant="primary" size="lg" onClick={handleSubmit} loading={submitting}>
          Submit Stock Entry
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setCategoryFilter(cat)} style={{
            padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-full)',
            background: categoryFilter === cat ? 'var(--color-saffron)' : 'var(--color-cream-dark)',
            color: categoryFilter === cat ? 'white' : 'var(--color-text-secondary)',
            border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 500,
            textTransform: 'capitalize',
          }}>
            {cat === 'all' ? 'All' : cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        {filtered.map((m) => {
          const isLow = (quantities[m._id] || 0) <= m.minimumStock;
          return (
            <Card key={m._id} style={{ borderLeft: isLow ? '4px solid var(--color-error)' : '4px solid var(--color-success)' }}>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-2)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{m.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                      {m.category.replace('_', ' ')} · {m.unit}
                    </div>
                  </div>
                  {isLow && <span style={{ fontSize: 'var(--text-xs)', background: '#FFEBEE', color: '#C62828', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>LOW</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                  <button onClick={() => updateQty(m._id, -1)} style={{
                    width: 36, height: 36, borderRadius: '50%', background: 'var(--color-error)',
                    color: 'white', fontSize: '1.2rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>−</button>
                  <input type="number" min="0" step="0.1" value={quantities[m._id] || 0}
                    onChange={(e) => setQty(m._id, e.target.value)}
                    style={{
                      width: 80, textAlign: 'center', padding: 'var(--space-2)',
                      border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-lg)', fontWeight: 600,
                    }} />
                  <button onClick={() => updateQty(m._id, 1)} style={{
                    width: 36, height: 36, borderRadius: '50%', background: 'var(--color-success)',
                    color: 'white', fontSize: '1.2rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>+</button>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{m.unit}</span>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
                  Min stock: {m.minimumStock} {m.unit}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
