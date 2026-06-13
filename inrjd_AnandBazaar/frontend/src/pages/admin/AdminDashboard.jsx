import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Card, CardBody } from '../../components/ui/Card';
import { Loading } from '../../components/ui/LoadingEmpty';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then((res) => setStats(res.data.dashboard))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const cards = [
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: '📦', color: '#1565C0' },
    { label: 'Pending Review', value: stats?.pendingOrders || 0, icon: '⏳', color: '#E65100' },
    { label: 'Approved', value: stats?.approvedOrders || 0, icon: '✅', color: '#2E7D32' },
    { label: 'Total Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, icon: '💰', color: '#F57F17' },
    { label: 'Pending Payments', value: `₹${(stats?.pendingPayments || 0).toLocaleString()}`, icon: '🏦', color: '#C62828' },
    { label: 'Active Users', value: stats?.totalUsers || 0, icon: '👥', color: '#283593' },
    { label: 'Low Stock Items', value: stats?.lowStockCount || 0, icon: '⚠️', color: '#BF360C' },
    { label: 'Pending Procurement', value: stats?.pendingProcurements || 0, icon: '🛒', color: '#00695C' },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-6)' }}>
        📊 Admin Dashboard
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        {cards.map((card) => (
          <Card key={card.label}>
            <CardBody>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>{card.label}</div>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: card.color }}>{card.value}</div>
                </div>
                <div style={{ fontSize: '2rem' }}>{card.icon}</div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
