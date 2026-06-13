import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Loading, Empty } from '../../components/ui/LoadingEmpty';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/audit-logs').then((res) => setLogs(res.data.logs || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (logs.length === 0) return <Empty icon="📋" message="No audit logs yet" />;

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-6)' }}>📋 Audit Logs</h1>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--color-white)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <thead>
            <tr style={{ background: 'var(--color-cream)', borderBottom: '2px solid var(--color-border)' }}>
              {['Action', 'Entity', 'Performed By', 'Date', 'Details'].map((h) => (
                <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--color-cream)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' }}>{log.entity} #{log.entityId?.slice(-6)}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' }}>{log.performedBy?.name || '—'}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' }}>{new Date(log.createdAt).toLocaleString()}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.changes ? JSON.stringify(log.changes).slice(0, 100) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
