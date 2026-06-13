/* ── App router & gallery module ────────────────────────────────── */
const App = {
    currentView: "calendar",

    async init() {
        // Initialize auth
        const ok = await Auth.init();
        if (!ok) return;

        Auth.setupLoginForm();

        // Determine initial view
        const path = window.location.pathname;

        if (path === "/login" && !Auth.isAdmin) {
            Auth.showLogin();
            return;
        }

        if (path === "/admin" && !Auth.isAdmin) {
            // Already handled in Auth.init
            return;
        }

        this.setupUI();

        // Determine which view to show
        const hash = window.location.hash.slice(1);
        if (hash === "gallery" || hash === "assign" || hash === "calendar") {
            this.showView(hash);
        } else {
            this.showView("calendar");
        }
    },

    setupUI() {
        const nav = document.getElementById("mainNav");
        nav.style.display = "flex";

        // Toggle admin-only elements
        document.querySelectorAll(".admin-only").forEach(el => {
            el.style.display = Auth.isAdmin ? "" : "none";
        });

        // Nav tab clicks
        document.querySelectorAll(".nav-tab").forEach(tab => {
            tab.addEventListener("click", (e) => {
                e.preventDefault();
                const view = tab.dataset.view;
                window.location.hash = view;
                this.showView(view);
            });
        });

        // Logout
        document.getElementById("logoutBtn").addEventListener("click", () => Auth.logout());

        // Shared link copy
        document.getElementById("sharedLinkBtn").addEventListener("click", () => {
            if (Auth.sharedToken) {
                const link = `${window.location.origin}/view/${Auth.sharedToken}`;
                navigator.clipboard.writeText(link).then(() => {
                    const btn = document.getElementById("sharedLinkBtn");
                    btn.textContent = "Copied!";
                    setTimeout(() => { btn.textContent = "Share Link"; }, 2000);
                });
            }
        });

        // Lord photo modal close
        document.getElementById("lordModalClose").addEventListener("click", () => Calendar.closeLordModal());
        document.querySelector("#lordPhotoModal .modal-overlay").addEventListener("click", () => Calendar.closeLordModal());

        // Hash change
        window.addEventListener("hashchange", () => {
            const hash = window.location.hash.slice(1);
            if (hash) this.showView(hash);
        });

        // Initialize gallery
        Gallery.init();
        Calendar.init();
    },

    showView(name) {
        if (name === "assign" && !Auth.isAdmin) return;

        this.currentView = name;

        // Hide all views
        document.querySelectorAll(".view").forEach(v => v.style.display = "none");

        // Update nav tabs
        document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
        const activeTab = document.querySelector(`.nav-tab[data-view="${name}"]`);
        if (activeTab) activeTab.classList.add("active");

        // Show and load the target view
        switch (name) {
            case "calendar":
                document.getElementById("calendarView").style.display = "block";
                Calendar.load();
                break;
            case "gallery":
                document.getElementById("galleryView").style.display = "block";
                if (!Gallery.loaded) Gallery.loadAllImages();
                break;
            case "assign":
                document.getElementById("assignmentView").style.display = "block";
                Admin.load();
                if (!Admin.allDresses.length) Admin.init();
                break;
        }
    },
};

/* ── Gallery module (preserved from original app.js) ────────────── */
const Gallery = {
    loaded: false,
    currentResults: [],
    lightboxIndex: 0,

    init() {
        const searchForm = document.getElementById("searchForm");
        const searchInput = document.getElementById("searchInput");
        const clearBtn = document.getElementById("clearBtn");
        const tags = document.querySelectorAll(".tag");

        // Lightbox elements
        const lightbox = document.getElementById("lightbox");
        const lightboxClose = document.getElementById("lightboxClose");
        const lightboxPrev = document.getElementById("lightboxPrev");
        const lightboxNext = document.getElementById("lightboxNext");

        searchForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const q = searchInput.value.trim();
            if (q) this.doSearch(q);
        });

        clearBtn.addEventListener("click", () => {
            searchInput.value = "";
            tags.forEach(t => t.classList.remove("active"));
            this.loadAllImages();
        });

        tags.forEach(tag => {
            tag.addEventListener("click", () => {
                const q = tag.dataset.query;
                searchInput.value = q;
                tags.forEach(t => t.classList.remove("active"));
                tag.classList.add("active");
                this.doSearch(q);
            });
        });

        lightboxClose.addEventListener("click", () => this.closeLightbox());
        lightbox.addEventListener("click", (e) => {
            if (e.target === lightbox) this.closeLightbox();
        });
        lightboxPrev.addEventListener("click", () => this.navigateLightbox(-1));
        lightboxNext.addEventListener("click", () => this.navigateLightbox(1));

        document.addEventListener("keydown", (e) => {
            if (lightbox.style.display === "none") return;
            if (e.key === "Escape") this.closeLightbox();
            if (e.key === "ArrowLeft") this.navigateLightbox(-1);
            if (e.key === "ArrowRight") this.navigateLightbox(1);
        });
    },

    async loadAllImages() {
        const loading = document.getElementById("loading");
        const gallery = document.getElementById("gallery");
        const resultInfo = document.getElementById("resultInfo");

        loading.style.display = "block";
        gallery.innerHTML = "";
        resultInfo.textContent = "";

        try {
            const resp = await fetch("/api/images");
            const data = await resp.json();
            this.currentResults = data.images.map(img => ({ ...img, score: null }));
            resultInfo.textContent = `Showing all ${this.currentResults.length} dresses`;
            this.renderGallery(this.currentResults);
            this.loaded = true;
        } catch (err) {
            resultInfo.textContent = "Failed to load images.";
            console.error(err);
        } finally {
            loading.style.display = "none";
        }
    },

    async doSearch(query) {
        const loading = document.getElementById("loading");
        const gallery = document.getElementById("gallery");
        const resultInfo = document.getElementById("resultInfo");

        loading.style.display = "block";
        gallery.innerHTML = "";
        resultInfo.textContent = "";

        try {
            const resp = await fetch(`/api/search?q=${encodeURIComponent(query)}&top_k=45`);
            const data = await resp.json();
            this.currentResults = data.results;

            const threshold = 0.18;
            const relevant = this.currentResults.filter(r => r.score >= threshold);
            const shown = relevant.length > 0 ? relevant : this.currentResults.slice(0, 10);

            resultInfo.textContent = `Found ${shown.length} matching dresses for "${data.query}"`;
            this.renderGallery(shown);
        } catch (err) {
            resultInfo.textContent = "Search failed. Is the server running?";
            console.error(err);
        } finally {
            loading.style.display = "none";
        }
    },

    renderGallery(items) {
        const gallery = document.getElementById("gallery");
        gallery.innerHTML = "";
        items.forEach((item, index) => {
            const card = document.createElement("div");
            card.className = "card";
            card.addEventListener("click", () => this.openLightbox(index, items));

            const img = document.createElement("img");
            img.src = item.url;
            img.alt = item.filename;
            img.loading = "lazy";

            const info = document.createElement("div");
            info.className = "card-info";

            const name = document.createElement("span");
            name.className = "card-name";
            name.textContent = this.formatName(item.filename);
            info.appendChild(name);

            if (item.score !== null && item.score !== undefined) {
                const score = document.createElement("span");
                score.className = "card-score";
                score.textContent = `${(item.score * 100).toFixed(0)}% match`;
                info.appendChild(score);
            }

            card.appendChild(img);
            card.appendChild(info);
            gallery.appendChild(card);
        });
    },

    formatName(filename) {
        return filename
            .replace(/\.[^/.]+$/, "")
            .replace(/[-_+]/g, " ")
            .replace(/\b\w/g, c => c.toUpperCase());
    },

    openLightbox(index, items) {
        this.currentResults = items;
        this.lightboxIndex = index;
        this.updateLightbox();
        document.getElementById("lightbox").style.display = "flex";
        document.body.style.overflow = "hidden";
    },

    closeLightbox() {
        document.getElementById("lightbox").style.display = "none";
        document.body.style.overflow = "";
    },

    navigateLightbox(direction) {
        this.lightboxIndex = (this.lightboxIndex + direction + this.currentResults.length) % this.currentResults.length;
        this.updateLightbox();
    },

    updateLightbox() {
        const item = this.currentResults[this.lightboxIndex];
        document.getElementById("lightboxImg").src = item.url;
        let caption = this.formatName(item.filename);
        if (item.score !== null && item.score !== undefined) {
            caption += ` \u2014 ${(item.score * 100).toFixed(0)}% match`;
        }
        document.getElementById("lightboxCaption").textContent = caption;
    },
};

// ── Boot ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => App.init());
