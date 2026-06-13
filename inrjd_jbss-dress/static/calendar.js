/* ── Calendar module ────────────────────────────────────────────── */
const Calendar = {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(), // 0-indexed
    assignments: {},
    festivals: [],
    festivalsByDate: {},
    searchQuery: "",

    init() {
        document.getElementById("prevMonth").addEventListener("click", () => this.changeMonth(-1));
        document.getElementById("nextMonth").addEventListener("click", () => this.changeMonth(1));

        const searchInput = document.getElementById("calendarSearch");
        let searchTimeout;
        searchInput.addEventListener("input", () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchQuery = searchInput.value.trim().toLowerCase();
                this.render();
            }, 300);
        });
    },

    async load() {
        const month = this.getMonthStr();
        try {
            const resp = await fetch(`/api/calendar?month=${month}`);
            const data = await resp.json();
            this.assignments = data.assignments || {};
            this.festivals = data.festivals || [];
            this.festivalsByDate = {};
            this.festivals.forEach(f => {
                if (!this.festivalsByDate[f.date]) this.festivalsByDate[f.date] = [];
                this.festivalsByDate[f.date].push(f);
            });
        } catch (err) {
            console.error("Failed to load calendar:", err);
        }
        this.render();
    },

    getMonthStr() {
        return `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, "0")}`;
    },

    changeMonth(delta) {
        this.currentMonth += delta;
        if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
        if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; }
        this.load();
    },

    render() {
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        document.getElementById("calendarTitle").textContent =
            `${monthNames[this.currentMonth]} ${this.currentYear}`;

        const grid = document.getElementById("calendarGrid");
        grid.innerHTML = "";

        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const today = new Date();

        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement("div");
            empty.className = "calendar-cell empty";
            grid.appendChild(empty);
        }

        // Day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const cell = document.createElement("div");
            cell.className = "calendar-cell";

            const isToday = today.getFullYear() === this.currentYear &&
                today.getMonth() === this.currentMonth && today.getDate() === day;
            if (isToday) cell.classList.add("today");

            // Check search filter
            if (this.searchQuery) {
                const match = this.cellMatchesSearch(dateStr);
                if (!match) cell.classList.add("dimmed");
            }

            // Date number
            const dateNum = document.createElement("div");
            dateNum.className = "date-number";
            dateNum.textContent = day;
            cell.appendChild(dateNum);

            // Festival badges & moon icons
            const dateFestivals = this.festivalsByDate[dateStr] || [];
            const tooltipParts = [];
            dateFestivals.forEach(f => {
                if (f.type === "purnima") {
                    const moon = document.createElement("span");
                    moon.className = "moon-icon purnima";
                    moon.textContent = "\uD83C\uDF15";
                    moon.title = "Purnima";
                    cell.appendChild(moon);
                    tooltipParts.push("\uD83C\uDF15 Purnima");
                } else if (f.type === "amavasya") {
                    const moon = document.createElement("span");
                    moon.className = "moon-icon amavasya";
                    moon.textContent = "\uD83C\uDF11";
                    moon.title = "Amavasya";
                    cell.appendChild(moon);
                    tooltipParts.push("\uD83C\uDF11 Amavasya");
                } else {
                    const badge = document.createElement("div");
                    badge.className = "festival-badge";
                    badge.textContent = f.name;
                    badge.title = f.name;
                    cell.appendChild(badge);
                    tooltipParts.push(f.name);
                }
                // Dress comment from CSV
                if (f.dress_comment) {
                    const comment = document.createElement("div");
                    comment.className = "dress-comment";
                    comment.textContent = f.dress_comment;
                    comment.title = f.dress_comment;
                    cell.appendChild(comment);
                    tooltipParts.push("Note: " + f.dress_comment);
                }
            });

            // Dress thumbnail
            const assignment = this.assignments[dateStr];
            if (assignment && assignment.dress) {
                const dressName = this.formatDressName(assignment.dress);

                const thumb = document.createElement("img");
                thumb.className = "dress-thumb";
                thumb.src = `/images/${assignment.dress}`;
                thumb.alt = assignment.dress;
                thumb.loading = "lazy";
                thumb.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.showLordPhotos(assignment.dress);
                });
                cell.appendChild(thumb);

                const dressLabel = document.createElement("div");
                dressLabel.className = "dress-label";
                dressLabel.textContent = dressName;
                cell.appendChild(dressLabel);

                // Add dress name to tooltip
                if (tooltipParts.length > 0) {
                    tooltipParts.unshift(dressName);
                }
            }

            // Custom hover tooltip for festival/moon/dress info
            if (tooltipParts.length > 0) {
                const tooltip = document.createElement("div");
                tooltip.className = "cell-tooltip";
                tooltip.textContent = tooltipParts.join("\n");
                cell.appendChild(tooltip);
            }

            grid.appendChild(cell);
        }
    },

    cellMatchesSearch(dateStr) {
        const q = this.searchQuery;
        if (!q) return true;

        // Match date
        if (dateStr.includes(q)) return true;

        // Match dress
        const assignment = this.assignments[dateStr];
        if (assignment && assignment.dress) {
            const name = assignment.dress.toLowerCase().replace(/[-_+.]/g, " ");
            if (name.includes(q)) return true;
        }

        // Match festival
        const festivals = this.festivalsByDate[dateStr] || [];
        for (const f of festivals) {
            if (f.name.toLowerCase().includes(q) || f.type.includes(q)) return true;
        }

        return false;
    },

    formatDressName(filename) {
        return filename
            .replace(/\.[^/.]+$/, "")
            .replace(/[-_+]/g, " ")
            .replace(/\b\w/g, c => c.toUpperCase());
    },

    async showLordPhotos(dress) {
        const modal = document.getElementById("lordPhotoModal");
        const grid = document.getElementById("lordPhotoGrid");
        const title = document.getElementById("lordModalTitle");

        title.textContent = `Lord's Photos - ${this.formatDressName(dress)}`;
        grid.innerHTML = '<div class="spinner"></div>';
        modal.style.display = "flex";

        try {
            const resp = await fetch(`/api/lord-photos/${encodeURIComponent(dress)}`);
            const data = await resp.json();
            grid.innerHTML = "";

            if (data.photos.length === 0) {
                grid.innerHTML = '<p class="no-photos">No lord photos uploaded yet for this dress.</p>';
            } else {
                data.photos.forEach(photo => {
                    const item = document.createElement("div");
                    item.className = "lord-photo-item";

                    const img = document.createElement("img");
                    img.src = photo.url;
                    img.alt = photo.filename;
                    img.loading = "lazy";
                    item.appendChild(img);

                    if (Auth.isAdmin) {
                        const delBtn = document.createElement("button");
                        delBtn.className = "lord-photo-delete";
                        delBtn.textContent = "\u00D7";
                        delBtn.title = "Remove this photo";
                        delBtn.addEventListener("click", async (e) => {
                            e.stopPropagation();
                            await fetch(`/api/lord-photos/${encodeURIComponent(dress)}/${encodeURIComponent(photo.filename)}`, {
                                method: "DELETE",
                            });
                            this.showLordPhotos(dress);
                        });
                        item.appendChild(delBtn);
                    }

                    grid.appendChild(item);
                });
            }

            // Setup upload for admin
            if (Auth.isAdmin) {
                const uploadBtn = document.getElementById("lordUploadBtn");
                const fileInput = document.getElementById("lordPhotoFile");

                uploadBtn.onclick = () => fileInput.click();
                fileInput.onchange = async () => {
                    if (!fileInput.files.length) return;
                    const formData = new FormData();
                    formData.append("file", fileInput.files[0]);
                    await fetch(`/api/lord-photos/${encodeURIComponent(dress)}`, {
                        method: "POST",
                        body: formData,
                    });
                    fileInput.value = "";
                    this.showLordPhotos(dress);
                };
            }
        } catch (err) {
            grid.innerHTML = '<p class="no-photos">Failed to load photos.</p>';
        }
    },

    closeLordModal() {
        document.getElementById("lordPhotoModal").style.display = "none";
    },
};
