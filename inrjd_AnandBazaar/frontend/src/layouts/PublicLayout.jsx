import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <footer style={{
        background: 'var(--color-text-primary)',
        color: 'var(--color-text-light)',
        textAlign: 'center',
        padding: 'var(--space-8) var(--space-4)',
        marginTop: 'var(--space-16)',
      }}>
        <div style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)', color: 'var(--color-gold-light)' }}>
          🙏 Hare Krishna
        </div>
        <p style={{ fontSize: 'var(--text-sm)', maxWidth: '600px', margin: '0 auto var(--space-4)' }}>
          All items are first offered to Lord Jagannath and then lovingly served as prasadam. Prepared by devotees with love and devotion.
        </p>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          © {new Date().getFullYear()} AnandBazaar Jagannath Prasadam Service. Jai Jagannath!
        </div>
      </footer>
    </>
  );
}
