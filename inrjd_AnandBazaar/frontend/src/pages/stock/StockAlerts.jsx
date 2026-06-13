import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Card, CardBody } from '../../components/ui/Card';
import { Loading, Empty } from '../../components/ui/LoadingEmpty';

export default function StockAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stock/alerts').then((res) => setAlerts(res.data.alerts || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (alerts.length === 0) return <Empty icon="✅" message="All stock levels are healthy!" />;

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-6)' }}>⚠️ Low Stock Alerts</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
        {alerts.map((item) => (
          <Card key={item._id} style={{ borderLeft: '4px solid var(--color-error)' }}>
            <CardBody>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-lg)' }}>{item.name}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', textTransform: 'capitalize', marginBottom: 'var(--space-2)' }}>
                {item.category?.replace('_', ' ')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-error)' }}>{item.currentStock}</span>
                  <span style={{ color: 'var(--color-text-muted)', marginLeft: 'var(--space-1)' }}>{item.unit}</span>
                </div>
                <div style={{ textAlign: 'right', fontSize: 'var(--text-sm)' }}>
                  <div style={{ color: 'var(--color-text-muted)' }}>Min required</div>
                  <div style={{ fontWeight: 600 }}>{item.minimumStock} {item.unit}</div>
                </div>
              </div>
              <div style={{
                marginTop: 'var(--space-3)', height: 6, background: '#FFCDD2', borderRadius: 'var(--radius-full)', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', background: 'var(--color-error)', borderRadius: 'var(--radius-full)',
                  width: `${Math.min(100, (item.currentStock / item.minimumStock) * 100)}%`,
                }} />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
