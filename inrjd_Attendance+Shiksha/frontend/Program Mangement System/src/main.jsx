import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: "'DM Sans',sans-serif",
              fontWeight: 500,
              fontSize: "14px",
              borderRadius: "12px",
              boxShadow:
                "0 4px 24px rgba(61,23,0,0.12),0 1px 3px rgba(61,23,0,0.07)",
            },
            success: {
              iconTheme: { primary: "#c8963c", secondary: "#fff" },
              style: {
                background: "#fffbf0",
                color: "#3d1700",
                border: "1px solid rgba(200,150,60,0.3)",
              },
            },
            error: {
              iconTheme: { primary: "#8b1a1a", secondary: "#fff" },
              style: {
                background: "#fff0f0",
                color: "#3d0000",
                border: "1px solid rgba(139,26,26,0.3)",
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
