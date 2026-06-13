/* ── Admin drag-and-drop assignment module ─────────────────────── */
const Admin = {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(),
    allDresses: [],
    assignments: {},
    festivals: [],
    festivalsByDate: {},
    selectedDress: null, // For mobile tap-to-assign

    async init() {
        document.getElementById("assignPrevMonth").addEventListener("click", () => this.changeMonth(-1));
        document.getElementById("assignNextMonth").addEventListener("click", () => this.changeMonth(1));

        const filter = document.getElementById("dressFilter");
        filter.addEventListener("input", () => this.renderPalette(filter.value.trim().toLowerCase()));

        await this.loadDresses();
    },

    async loadDresses() {
        try {
            const resp = await fetch("/api/images");
            const data = await resp.json();
            this.allDresses = data.images || [];
            this.renderPalette("");
        } catch (err) {
            console.error("Failed to load dresses:", err);
        }
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
        this.renderCalendar();
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

    renderPalette(filter) {
        const palette = document.getElementById("dressPalette");
        palette.innerHTML = "";

        const filtered = filter
            ? this.allDresses.filter(d => d.filename.toLowerCase().replace(/[-_+.]/g, " ").includes(filter))
            : this.allDresses;

        filtered.forEach(dress => {
            const item = document.createElement("div");
            item.className = "palette-item";
            item.draggable = true;
            item.dataset.dress = dress.filename;

            // Drag events
            item.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", dress.filename);
                e.dataTransfer.effectAllowed = "copy";
                item.classList.add("dragging");
            });
            item.addEventListener("dragend", () => {
                item.classList.remove("dragging");
            });

            // Tap-to-select for mobile
            item.addEventListener("click", () => {
                document.querySelectorAll(".palette-item.selected").forEach(el => el.classList.remove("selected"));
                if (this.selectedDress === dress.filename) {
                    this.selectedDress = null;
                } else {
                    this.selectedDress = dress.filename;
                    item.classList.add("selected");
                }
            });

            const img = document.createElement("img");
            img.src = dress.url;
            img.alt = dress.filename;
            img.loading = "lazy";

            const label = document.createElement("span");
            label.className = "palette-label";
            label.textContent = dress.filename.replace(/\.[^/.]+$/, "").replace(/[-_+]/g, " ");

            item.appendChild(img);
            item.appendChild(label);
            palette.appendChild(item);
        });
    },

    renderCalendar() {
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        document.getElementById("assignCalendarTitle").textContent =
            `${monthNames[this.currentMonth]} ${this.currentYear}`;

        const grid = document.getElementById("assignCalendarGrid");
        grid.innerHTML = "";

        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const today = new Date();

        // Empty cells
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement("div");
            empty.className = "calendar-cell empty";
            grid.appendChild(empty);
        }

        // Day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const cell = document.createElement("div");
            cell.className = "calendar-cell droppable";

            const isToday = today.getFullYear() === this.currentYear &&
                today.getMonth() === this.currentMonth && today.getDate() === day;
            if (isToday) cell.classList.add("today");

            // Drop handlers
            cell.addEventListener("dragover", (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
                cell.classList.add("drag-over");
            });
            cell.addEventListener("dragleave", () => {
                cell.classList.remove("drag-over");
            });
            cell.addEventListener("drop", async (e) => {
                e.preventDefault();
                cell.classList.remove("drag-over");
                const dress = e.dataTransfer.getData("text/plain");
                if (dress) await this.assignDress(dateStr, dress);
            });

            // Tap-to-assign for mobile
            cell.addEventListener("click", async () => {
                if (this.selectedDress) {
                    await this.assignDress(dateStr, this.selectedDress);
                    this.selectedDress = null;
                    document.querySelectorAll(".palette-item.selected").forEach(el => el.classList.remove("selected"));
                }
            });

            // Date number
            const dateNum = document.createElement("div");
            dateNum.className = "date-number";
            dateNum.textContent = day;
            cell.appendChild(dateNum);

            // Festival badges
            const dateFestivals = this.festivalsByDate[dateStr] || [];
            const tooltipParts = [];
            dateFestivals.forEach(f => {
                if (f.type === "purnima") {
                    const moon = document.createElement("span");
                    moon.className = "moon-icon purnima";
                    moon.textContent = "\uD83C\uDF15";
                    cell.appendChild(moon);
                    tooltipParts.push("\uD83C\uDF15 Purnima");
                } else if (f.type === "amavasya") {
                    const moon = document.createElement("span");
                    moon.className = "moon-icon amavasya";
                    moon.textContent = "\uD83C\uDF11";
                    cell.appendChild(moon);
                    tooltipParts.push("\uD83C\uDF11 Amavasya");
                } else {
                    const badge = document.createElement("div");
                    badge.className = "festival-badge";
                    badge.textContent = f.name;
                    cell.appendChild(badge);
                    tooltipParts.push(f.name);
                }
                if (f.dress_comment) {
                    tooltipParts.push("Note: " + f.dress_comment);
                }
            });

            // Assigned dress
            const assignment = this.assignments[dateStr];
            if (assignment && assignment.dress) {
                const dressName = assignment.dress.replace(/\.[^/.]+$/, "").replace(/[-_+]/g, " ");

                const thumbWrap = document.createElement("div");
                thumbWrap.className = "assign-thumb-wrap";

                const thumb = document.createElement("img");
                thumb.className = "dress-thumb";
                thumb.src = `/images/${assignment.dress}`;
                thumb.alt = assignment.dress;
                thumb.loading = "lazy";
                thumbWrap.appendChild(thumb);

                const removeBtn = document.createElement("button");
                removeBtn.className = "remove-assign";
                removeBtn.textContent = "\u00D7";
                removeBtn.title = "Remove assignment";
                removeBtn.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    await this.unassignDress(dateStr);
                });
                thumbWrap.appendChild(removeBtn);

                cell.appendChild(thumbWrap);

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

    async assignDress(date, dress) {
        try {
            const resp = await fetch("/api/calendar/assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date, dress }),
            });
            if (resp.ok) {
                this.assignments[date] = { dress };
                this.renderCalendar();
                // Also update the main calendar if it's showing the same month
                if (Calendar.getMonthStr() === this.getMonthStr()) {
                    Calendar.assignments = { ...Calendar.assignments, [date]: { dress } };
                    Calendar.render();
                }
            }
        } catch (err) {
            console.error("Failed to assign dress:", err);
        }
    },

    async unassignDress(date) {
        try {
            const resp = await fetch(`/api/calendar/assign?date=${encodeURIComponent(date)}`, {
                method: "DELETE",
            });
            if (resp.ok) {
                delete this.assignments[date];
                this.renderCalendar();
                if (Calendar.getMonthStr() === this.getMonthStr()) {
                    delete Calendar.assignments[date];
                    Calendar.render();
                }
            }
        } catch (err) {
            console.error("Failed to unassign dress:", err);
        }
    },
};
