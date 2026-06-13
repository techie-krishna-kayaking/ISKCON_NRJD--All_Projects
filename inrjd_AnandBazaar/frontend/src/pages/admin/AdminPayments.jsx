import { useState, useEffect } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import { Loading, Empty } from '../../components/ui/LoadingEmpty';
import toast from 'react-hot-toast';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payments').then((res) => setPayments(res.data.payments || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (payments.length === 0) return <Empty icon="💰" message="No payments recorded" />;

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-6)' }}>💰 Payments</h1>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--color-white)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <thead>
            <tr style={{ background: 'var(--color-cream)', borderBottom: '2px solid var(--color-border)' }}>
              {['Order #', 'Amount', 'Mode', 'Reference', 'Date', 'Recorded By'].map((h) => (
                <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p._id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>{p.order?.orderNumber || '—'}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, color: 'var(--color-success)' }}>₹{p.amount?.toLocaleString()}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textTransform: 'uppercase' }}>{p.mode}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{p.upiReference || p.cashRemarks || '—'}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{new Date(p.paymentDate).toLocaleDateString()}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{p.recordedBy?.name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
