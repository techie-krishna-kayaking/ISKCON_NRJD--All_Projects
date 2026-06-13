import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Wait until auth check finishes
  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner-page" />
        <p>Loading...</p>
      </div>
    );
  }

  // If not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (requiredRole && user.role !== requiredRole) {
    return (
      <Navigate
        to={user.role === "admin" ? "/admin/dashboard" : "/owner/dashboard"}
        replace
      />
    );
  }

  // Force password change if required
  if (user.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  return children;
}
