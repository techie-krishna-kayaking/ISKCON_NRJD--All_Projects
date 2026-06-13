import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("pms_token");
    localStorage.removeItem("pms_user");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    setToken(null);
  }, []);

  // ── NEW: update auth in-place (used after password change) ──
  const updateAuth = useCallback((newToken, newUser) => {
    localStorage.setItem("pms_token", newToken);
    localStorage.setItem("pms_user", JSON.stringify(newUser));
    api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem("pms_token");
    const savedUser = localStorage.getItem("pms_user");
    if (!savedToken || !savedUser) {
      setLoading(false);
      return;
    }
    try {
      const parsedUser = JSON.parse(savedUser);
      setToken(savedToken);
      setUser(parsedUser);
      api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
      api
        .get("/auth/me")
        .then((res) => {
          const freshUser = res.data.user;
          setUser(freshUser);
          localStorage.setItem("pms_user", JSON.stringify(freshUser));
        })
        .catch((err) => {
          if (err.response?.status === 401) logout();
        })
        .finally(() => setLoading(false));
    } catch {
      logout();
      setLoading(false);
    }
  }, [logout]);

  const loginWithCredentials = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { token: newToken, user: newUser } = res.data;
    updateAuth(newToken, newUser);
    return newUser;
  };

  const loginWithToken = async (newToken) => {
    localStorage.setItem("pms_token", newToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    setToken(newToken);
    try {
      setLoading(true);
      const res = await api.get("/auth/me");
      const newUser = res.data.user;
      localStorage.setItem("pms_user", JSON.stringify(newUser));
      setUser(newUser);
      return newUser;
    } catch (err) {
      localStorage.removeItem("pms_token");
      delete api.defaults.headers.common["Authorization"];
      setToken(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    const res = await api.get("/auth/me");
    const refreshedUser = res.data.user;
    setUser(refreshedUser);
    localStorage.setItem("pms_user", JSON.stringify(refreshedUser));
    return refreshedUser;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isOwner: user?.role === "owner",
    loginWithCredentials,
    loginWithToken,
    updateAuth,
    refreshUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
