import { useState, useEffect } from 'react';
import api from '../../api/client';
import Badge from '../../components/ui/Badge';
import { Loading, Empty } from '../../components/ui/LoadingEmpty';

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/invoices').then((res) => setInvoices(res.data.invoices || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (invoices.length === 0) return <Empty icon="🧾" message="No invoices yet" />;

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-6)' }}>🧾 Invoices</h1>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--color-white)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <thead>
            <tr style={{ background: 'var(--color-cream)', borderBottom: '2px solid var(--color-border)' }}>
              {['Invoice #', 'Order #', 'Customer', 'Total', 'Paid', 'Pending', 'Status'].map((h) => (
                <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv._id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>{inv.invoiceNumber}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{inv.order?.orderNumber || '—'}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{inv.customerName}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>₹{inv.totalAmount?.toLocaleString()}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-success)' }}>₹{inv.paidAmount?.toLocaleString()}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-error)' }}>₹{inv.pendingAmount?.toLocaleString()}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}><Badge status={inv.paymentStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
