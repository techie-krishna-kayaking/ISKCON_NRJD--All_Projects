import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './DashboardLayout.module.css';

const adminNav = [
  { label: 'Overview', path: '/admin', icon: '📊' },
  { label: 'Orders', path: '/admin/orders', icon: '📦' },
  { label: 'Food Items', path: '/admin/items', icon: '🍛' },
  { label: 'Raw Materials', path: '/admin/raw-materials', icon: '🥬' },
  { label: 'Recipes', path: '/admin/recipes', icon: '📝' },
  { label: 'Stock', path: '/admin/stock', icon: '📋' },
  { label: 'Procurement', path: '/admin/procurement', icon: '🛒' },
  { label: 'Invoices', path: '/admin/invoices', icon: '🧾' },
  { label: 'Payments', path: '/admin/payments', icon: '💰' },
  { label: 'Users', path: '/admin/users', icon: '👥' },
  { label: 'Import Data', path: '/admin/import', icon: '📥' },
  { label: 'Audit Logs', path: '/admin/audit', icon: '🔍' },
];

const stockNav = [
  { label: 'Daily Stock', path: '/stock', icon: '📋' },
  { label: 'Stock History', path: '/stock/history', icon: '📅' },
  { label: 'Low Stock', path: '/stock/alerts', icon: '⚠️' },
];

const procurementNav = [
  { label: 'Requirements', path: '/procurement', icon: '🛒' },
  { label: 'In Progress', path: '/procurement/active', icon: '🔄' },
  { label: 'Completed', path: '/procurement/completed', icon: '✅' },
];

export default function DashboardLayout({ role }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = role === 'admin' ? adminNav :
    role === 'stock_team' ? stockNav :
    role === 'procurement' ? procurementNav : [];

  const roleLabel = role === 'admin' ? 'Admin Dashboard' :
    role === 'stock_team' ? 'Stock Management' :
    role === 'procurement' ? 'Procurement' : 'Dashboard';

  return (
    <div className={styles.layout}>
      <div className={`${styles.overlay} ${sidebarOpen ? styles.overlayVisible : ''}`}
        onClick={() => setSidebarOpen(false)} />

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>🙏 AnandBazaar</div>
          <div className={styles.sidebarSubtitle}>{roleLabel}</div>
        </div>

        <nav className={styles.navSection}>
          <div className={styles.navSectionLabel}>Navigation</div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin' || item.path === '/stock' || item.path === '/procurement'}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.navSection}>
          <div className={styles.navSectionLabel}>Account</div>
          <div className={styles.navItem}>
            <span className={styles.navIcon}>👤</span>
            {user?.name || 'User'}
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <button className={styles.mobileToggle} onClick={() => setSidebarOpen(true)}>
          ☰ Menu
        </button>
        <Outlet />
      </main>
    </div>
  );
}
