import { useState, useEffect } from 'react';
import api from '../api/client';
import { Loading, Empty } from '../components/ui/LoadingEmpty';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    setLoading(true);
    api.get('/notifications').then((res) => setNotifications(res.data.notifications || [])).finally(() => setLoading(false));
  };

  useEffect(fetchNotifications, []);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) { toast.error('Failed'); }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch (err) { toast.error('Failed'); }
  };

  if (loading) return <Loading />;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)' }}>🔔 Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--color-saffron)', cursor: 'pointer', fontWeight: 600 }}>
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? <Empty icon="🔔" message="No notifications" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {notifications.map((n) => (
            <div key={n._id} onClick={() => !n.isRead && markRead(n._id)}
              style={{
                padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', cursor: n.isRead ? 'default' : 'pointer',
                background: n.isRead ? 'var(--color-white)' : 'var(--color-cream)',
                border: `1px solid ${n.isRead ? 'var(--color-border-light)' : 'var(--color-saffron-light)'}`,
              }}>
              <div style={{ fontWeight: n.isRead ? 400 : 600, marginBottom: 'var(--space-1)' }}>{n.title}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{n.message}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
                {new Date(n.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
