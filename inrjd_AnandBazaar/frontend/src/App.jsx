import { Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import MenuPage from './pages/MenuPage';
import OrderPage from './pages/OrderPage';
import MyOrders from './pages/MyOrders';
import NotificationsPage from './pages/NotificationsPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminItems from './pages/admin/AdminItems';
import AdminUsers from './pages/admin/AdminUsers';
import AdminRawMaterials from './pages/admin/AdminRawMaterials';
import AdminRecipes from './pages/admin/AdminRecipes';
import AdminInvoices from './pages/admin/AdminInvoices';
import AdminPayments from './pages/admin/AdminPayments';
import AdminImport from './pages/admin/AdminImport';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';

import StockDashboard from './pages/stock/StockDashboard';
import StockHistory from './pages/stock/StockHistory';
import StockAlerts from './pages/stock/StockAlerts';

import ProcurementDashboard from './pages/procurement/ProcurementDashboard';

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Authenticated customer routes */}
      <Route element={<PublicLayout />}>
        <Route path="/order" element={<ProtectedRoute><OrderPage /></ProtectedRoute>} />
        <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      </Route>

      {/* Admin dashboard */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><DashboardLayout role="admin" /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="items" element={<AdminItems />} />
        <Route path="raw-materials" element={<AdminRawMaterials />} />
        <Route path="recipes" element={<AdminRecipes />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="invoices" element={<AdminInvoices />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="import" element={<AdminImport />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
      </Route>

      {/* Stock team dashboard */}
      <Route path="/stock" element={<ProtectedRoute roles={['stock_team', 'admin']}><DashboardLayout role="stock" /></ProtectedRoute>}>
        <Route index element={<StockDashboard />} />
        <Route path="history" element={<StockHistory />} />
        <Route path="alerts" element={<StockAlerts />} />
      </Route>

      {/* Procurement dashboard */}
      <Route path="/procurement" element={<ProtectedRoute roles={['procurement', 'admin']}><DashboardLayout role="procurement" /></ProtectedRoute>}>
        <Route index element={<ProcurementDashboard />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={
        <div style={{ textAlign: 'center', padding: '4rem', fontFamily: 'var(--font-heading)' }}>
          <h1 style={{ fontSize: '4rem', color: 'var(--color-saffron)' }}>404</h1>
          <p>Page not found</p>
          <a href="/" style={{ color: 'var(--color-saffron)' }}>Return Home</a>
        </div>
      } />
    </Routes>
  );
}
