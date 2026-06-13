import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Loading, Empty } from '../components/ui/LoadingEmpty';
import Button from '../components/ui/Button';

const emojiMap = { rice: '🍚', dal: '🍲', bread: '🫓', vegetable: '🥘', sweet: '🍮', snack: '🍘', beverage: '🥤', condiment: '🫙', other: '🍽️' };

export default function MenuPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    api.get('/items?available=true').then((res) => setItems(res.data.items || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...new Set(items.map((i) => i.category))];
  const filtered = category === 'all' ? items : items.filter((i) => i.category === category);

  if (loading) return <Loading />;

  return (
    <div style={{ maxWidth: 'var(--container-xl)', margin: '0 auto', padding: 'var(--space-8) var(--space-4)' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', textAlign: 'center', marginBottom: 'var(--space-2)' }}>
        🍛 Our Prasadam Menu
      </h1>
      <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: 'var(--space-8)' }}>
        All items offered to Lord Jagannath with love and devotion
      </p>

      <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', marginBottom: 'var(--space-8)', justifyContent: 'center', flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)}
            style={{
              padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-sm)', border: 'none', cursor: 'pointer',
              background: category === cat ? 'var(--color-saffron)' : 'var(--color-cream-dark)',
              color: category === cat ? 'white' : 'var(--color-text-secondary)',
              fontWeight: 500, transition: 'all 150ms ease',
            }}>
            {cat === 'all' ? '🍽️ All Items' : `${emojiMap[cat] || ''} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Empty icon="🍽️" message="No items in this category" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-6)' }}>
          {filtered.map((item) => (
            <div key={item._id} style={{
              background: 'var(--color-white)', borderRadius: 'var(--radius-lg)',
              overflow: 'hidden', border: '1px solid var(--color-border-light)',
              transition: 'all 250ms ease',
            }}>
              <div style={{
                height: 160, background: 'linear-gradient(135deg, var(--color-saffron-50), var(--color-cream-dark))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem',
              }}>
                {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (emojiMap[item.category] || '🍽️')}
              </div>
              <div style={{ padding: 'var(--space-4)' }}>
                <div style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>{item.name}</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
                  {item.description}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ textTransform: 'capitalize', fontSize: 'var(--text-xs)', color: 'var(--color-peacock)', fontWeight: 600 }}>
                    {item.category}
                  </span>
                  {item.pricePerPlate > 0 && (
                    <span style={{ fontWeight: 700, color: 'var(--color-saffron-dark)' }}>₹{item.pricePerPlate}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 'var(--space-12)' }}>
        <Link to="/order"><Button variant="primary" size="lg">🙏 Order Prasadam Now</Button></Link>
      </div>
    </div>
  );
}
