import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// ── Public layout ────────────────────────────────────────────
import Header from "./components/Header";
import Footer from "./components/Footer";

// ── Authenticated shell (replaces Header+Footer for logged-in users) ──

import AppShell from "./components/Appshell";
import ProtectedRoute from "./components/ProtectedRoute";

// ── Public pages ─────────────────────────────────────────────
import Home from "./pages/HomePage"; // your existing home
import LoginPage from "./pages/LoginPage";
import AuthCallback from "./pages/AuthCallback";
import { ForgotPasswordPage, ResetPasswordPage } from "./pages/PasswordPages";
import NotFoundPage from "./pages/Notfoundpage";

// ── Admin pages ──────────────────────────────────────────────
import AdminHome from "./pages/AdminHome";
import AdminProfile from "./pages/Adminprofile";
import AdminDashboard from "./pages/AdminDashboard";
import ManageUsers from "./pages/ManageUsers";
import CreateUser from "./pages/CreateUser";
import AdminMessages from "./pages/AdminMessages";

// ── Owner pages ──────────────────────────────────────────────
import OwnerHome from "./pages/OwnerHome";
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerPrograms from "./pages/OwnerPrograms";
import AttendancePage from "./pages/AttendancePage";
import AttendanceOverview from "./pages/AttendanceOverview";
import OwnerAnalytics from "./pages/OwnerAnalytics";

// ── Shared protected ────────────────────────────────────────
import ChangePasswordPage from "./pages/ChangePasswordPage";

import AddProgram from "./pages/AddProgram";
import AdminConfig from "./pages/AdminConfig";
import AdminAnalytics from "./pages/AdminAnalytics";

// ── Participant / Course / Certification pages ──────────────
import ParticipantList from "./pages/ParticipantList";
import ParticipantDetail from "./pages/ParticipantDetail";
import CourseManagement from "./pages/CourseManagement";
import ShikshaAnalytics from "./pages/ShikshaAnalytics";

// ─────────────────────────────────────────────────────────────
// Loading spinner (shown while session token is being validated)
// ─────────────────────────────────────────────────────────────
const Spinner = () => (
  <div
    style={{
      minHeight: "100vh",
      background: "#fdf8f0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
    }}
  >
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        border: "3px solid rgba(200,150,60,0.2)",
        borderTop: "3px solid #b85800",
        animation: "spin 0.8s linear infinite",
      }}
    />
    <p
      style={{
        fontFamily: "'Cinzel', serif",
        fontSize: "0.85rem",
        color: "#8b5c14",
        letterSpacing: "0.1em",
      }}
    >
      🪷 Loading...
    </p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const App = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <Spinner />;

  // ─────────────────────────────────────────────────────────────
  // AUTHENTICATED — AppShell (left sidebar + topbar)
  // No Header/Footer — the shell provides its own chrome.
  // Footer doesn't belong inside a full-height sidebar app layout;
  // it only makes sense on public scrollable pages like Home/Login.
  // ─────────────────────────────────────────────────────────────
  if (isAuthenticated) {
    return (
      <AppShell>
        <Routes>
          {/* ── Admin ── */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminHome /> {/* greeting landing page after login */}
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stats"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard /> {/* old stats dashboard still reachable */}
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="admin">
                <ManageUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/create-owner"
            element={
              <ProtectedRoute requiredRole="admin">
                <CreateUser mode="owner" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/create-admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <CreateUser mode="admin" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner/add-program"
            element={
              <ProtectedRoute requiredRole="owner">
                <AddProgram />
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner/programs"
            element={
              <ProtectedRoute requiredRole="owner">
                <OwnerPrograms />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/attendance/:id"
            element={
              <ProtectedRoute requiredRole="owner">
                <AttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/add-program"
            element={
              <ProtectedRoute requiredRole="admin">
                <AddProgram />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/config"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminConfig />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminAnalytics />
              </ProtectedRoute>
            }
          />

          <Route path="/admin/messages" element={<AdminMessages />} />

          {/* ── Admin: Participants, Courses, Certifications ── */}
          <Route
            path="/admin/participants"
            element={
              <ProtectedRoute requiredRole="admin">
                <ParticipantList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/participants/:id"
            element={
              <ProtectedRoute requiredRole="admin">
                <ParticipantDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute requiredRole="admin">
                <CourseManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/shiksha-analytics"
            element={
              <ProtectedRoute requiredRole="admin">
                <ShikshaAnalytics />
              </ProtectedRoute>
            }
          />

          {/* ── Owner ── */}
          <Route
            path="/owner/dashboard"
            element={
              <ProtectedRoute requiredRole="owner">
                <OwnerHome /> {/* greeting landing page */}
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/profile"
            element={
              <ProtectedRoute requiredRole="owner">
                <OwnerDashboard /> {/* existing profile dashboard */}
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner/attendance"
            element={
              <ProtectedRoute requiredRole="owner">
                <AttendanceOverview />
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner/analytics"
            element={
              <ProtectedRoute requiredRole="owner">
                <OwnerAnalytics />
              </ProtectedRoute>
            }
          />

          {/* ── Owner: Participants ── */}
          <Route
            path="/owner/participants"
            element={
              <ProtectedRoute requiredRole="owner">
                <ParticipantList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/participants/:id"
            element={
              <ProtectedRoute requiredRole="owner">
                <ParticipantDetail />
              </ProtectedRoute>
            }
          />

          {/* ── Shared ── */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />

          {/* OAuth callback can fire before we know auth state */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Root → correct dashboard */}
          <Route
            path="/"
            element={
              <Navigate
                to={
                  user?.role === "admin"
                    ? "/admin/dashboard"
                    : "/owner/dashboard"
                }
                replace
              />
            }
          />

          {/* Any unknown path while logged in → 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppShell>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // PUBLIC — classic Header + Footer layout
  // Footer stays on all public scrollable pages.
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Header />

      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate
                  to={
                    user?.role === "admin"
                      ? "/admin/dashboard"
                      : "/owner/dashboard"
                  }
                  replace
                />
              ) : (
                <LoginPage />
              )
            }
          />

          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Any unknown public path → 404 (not silently redirect to home) */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
};

// ── Reusable placeholder for "coming soon" sidebar items ─────
const ComingSoon = ({ label }) => (
  <div
    style={{
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: "40px 24px",
    }}
  >
    <span style={{ fontSize: "2.5rem", opacity: 0.55 }}>🌿</span>
    <p
      style={{
        fontFamily: "'Cinzel', serif",
        fontSize: "0.88rem",
        color: "#8b6840",
        letterSpacing: "0.08em",
      }}
    >
      {label} — Coming Soon
    </p>
  </div>
);

export default App;
