import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, isAuthenticated, logout, isAdmin, isStockTeam, isProcurement } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const dashboardLink = isAdmin() ? '/admin' :
    isStockTeam() ? '/stock' :
    isProcurement() ? '/procurement' : '/my-orders';

  return (
    <nav className={styles.navbar}>
      <div className={styles.navInner}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandIcon}>🙏</span>
          <div>
            <div className={styles.brandName}>AnandBazaar</div>
            <div className={styles.brandTag}>Jagannath Prasadam</div>
          </div>
        </Link>

        <div className={styles.navLinks}>
          <Link to="/" className={styles.navLink}>Home</Link>
          <Link to="/menu" className={styles.navLink}>Menu</Link>
          <Link to="/order" className={styles.navLink}>Order Now</Link>
          {isAuthenticated && (
            <Link to={dashboardLink} className={styles.navLink}>Dashboard</Link>
          )}
        </div>

        <div className={styles.navActions}>
          {isAuthenticated ? (
            <>
              <Link to="/notifications" className={styles.notifBtn} title="Notifications">
                🔔
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/order')}>Order Now</Button>
            </>
          )}
          <button className={styles.menuBtn} onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Home</Link>
          <Link to="/menu" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Menu</Link>
          <Link to="/order" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Order Now</Link>
          {isAuthenticated && (
            <>
              <Link to={dashboardLink} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <Link to="/notifications" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Notifications</Link>
            </>
          )}
          {!isAuthenticated && (
            <Link to="/login" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Login</Link>
          )}
        </div>
      )}
    </nav>
  );
}
