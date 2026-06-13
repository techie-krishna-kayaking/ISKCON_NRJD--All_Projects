/* ── Auth module ────────────────────────────────────────────────── */
const Auth = {
    isAdmin: false,
    sharedToken: null,
    isSharedView: false,

    async init() {
        const path = window.location.pathname;

        // Shared view mode
        if (path.startsWith("/view/")) {
            this.sharedToken = path.split("/view/")[1];
            const resp = await fetch(`/api/shared/validate/${this.sharedToken}`);
            const data = await resp.json();
            if (!data.valid) {
                document.body.innerHTML = '<div style="text-align:center;padding:4rem;color:#e0e0e0;"><h2>Invalid or expired link</h2></div>';
                return false;
            }
            this.isSharedView = true;
            this.isAdmin = false;
            return true;
        }

        // Check admin session
        const resp = await fetch("/api/auth/status");
        const data = await resp.json();
        this.isAdmin = data.authenticated;
        if (data.shared_token) {
            this.sharedToken = data.shared_token;
        }

        // If on /login path, show login
        if (path === "/login") {
            return true;
        }

        // If on /admin and not authenticated, redirect to login
        if (path === "/admin" && !this.isAdmin) {
            this.showLogin();
            return true;
        }

        return true;
    },

    showLogin() {
        document.getElementById("loginView").style.display = "flex";
        document.getElementById("mainNav").style.display = "none";
        document.querySelectorAll(".view").forEach(v => {
            if (v.id !== "loginView") v.style.display = "none";
        });
    },

    setupLoginForm() {
        const form = document.getElementById("loginForm");
        if (!form) return;

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("loginUsername").value;
            const password = document.getElementById("loginPassword").value;
            const errorEl = document.getElementById("loginError");

            try {
                const resp = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                });
                const data = await resp.json();

                if (resp.ok) {
                    Auth.isAdmin = true;
                    Auth.sharedToken = data.shared_token;
                    document.getElementById("loginView").style.display = "none";
                    App.setupUI();
                    App.showView("calendar");
                } else {
                    errorEl.textContent = data.error || "Login failed";
                    errorEl.style.display = "block";
                }
            } catch (err) {
                errorEl.textContent = "Connection error";
                errorEl.style.display = "block";
            }
        });
    },

    async logout() {
        await fetch("/api/auth/logout", { method: "POST" });
        this.isAdmin = false;
        window.location.href = "/login";
    },
};
