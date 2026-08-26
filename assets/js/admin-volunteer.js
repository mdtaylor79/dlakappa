window.Volunteer = (function () {
  let allVolunteers = [];
  let filtered = [];
  let sortKey = "full_name";
  let sortAsc = true;
  let didInit = false;
  let refreshTimer = null;

  function init() {
    if (didInit) return;
    didInit = true;

    const season = getVolunteerSeason();
    document.getElementById("seasonTag").textContent = "Season " + season.label;

    document.getElementById("filterName").addEventListener("input", applyFilters);
    document.getElementById("filterTabc").addEventListener("change", applyFilters);
    document.getElementById("filterAssignment").addEventListener("change", applyFilters);
    document.getElementById("filterDate").addEventListener("change", applyFilters);
    document.getElementById("clearFilters-volunteer-btn").addEventListener("click", clearFilters);
    document.getElementById("exportCSV-volunteer-btn").addEventListener("click", exportCSV);
    document.getElementById("printVolunteer-btn").addEventListener("click", () => window.print());

    document.querySelectorAll("#dataTable th[data-sort]").forEach((th) => {
      th.addEventListener("click", () => sortTable(th.dataset.sort));
    });

    loadData();
    refreshTimer = setInterval(loadData, 120000); // refresh every 2 min while tab has been opened
  }

  function getVolunteerSeason() {
    const today = new Date();
    const yr = today.getFullYear();
    const mo = today.getMonth();
    const startYear = mo >= 7 ? yr : yr - 1;
    return { startYear, endYear: startYear + 1, label: startYear + "–" + (startYear + 1) };
  }

  function isExpiringSoon(dateStr) {
    if (!dateStr) return false;
    const exp = new Date(dateStr);
    const today = new Date();
    const diff = (exp - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  }

  function isExpired(dateStr) {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }

  function formatDate(str) {
    if (!str) return "—";
    const [y, m, d] = str.split("-");
    const mo = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return mo[parseInt(m) - 1] + " " + parseInt(d) + ", " + y;
  }

  async function loadData() {
    const { data, error } = await dlaSupabase
      .from("volunteers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      document.getElementById("tableBody").innerHTML =
        '<tr><td colspan="10" class="empty">Error loading data: ' + error.message + '</td></tr>';
      return;
    }

    allVolunteers = data || [];
    computeStats();
    applyFilters();
  }

  function computeStats() {
    const today = new Date();
    let totalHours = 0, tabcCount = 0, expiringCount = 0, upcomingDates = new Set();

    allVolunteers.forEach((v) => {
      totalHours += parseFloat(v.total_hours) || 0;
      if (v.tabc_certified) tabcCount++;
      if (v.tabc_certified && isExpiringSoon(v.tabc_expiry)) expiringCount++;
      (v.volunteer_dates || []).forEach((d) => {
        if (new Date(d) >= today) upcomingDates.add(d);
      });
    });

    const avgEvents = allVolunteers.length
      ? (allVolunteers.reduce((s, v) => s + (v.previous_events || 0), 0) / allVolunteers.length).toFixed(1)
      : 0;

    document.getElementById("statTotal").textContent = allVolunteers.length;
    document.getElementById("statTabc").textContent = tabcCount;
    document.getElementById("statExpiring").textContent = expiringCount;
    document.getElementById("statHours").textContent = totalHours.toFixed(0);
    document.getElementById("statAvgEvents").textContent = avgEvents;
    document.getElementById("statUpcoming").textContent = upcomingDates.size;
  }

  function applyFilters() {
    const name = document.getElementById("filterName").value.toLowerCase();
    const tabc = document.getElementById("filterTabc").value;
    const assn = document.getElementById("filterAssignment").value;
    const date = document.getElementById("filterDate").value;

    filtered = allVolunteers.filter((v) => {
      if (name && !((v.full_name || "").toLowerCase().includes(name) || (v.email || "").toLowerCase().includes(name))) return false;
      if (tabc === "yes" && !v.tabc_certified) return false;
      if (tabc === "no" && v.tabc_certified) return false;
      if (tabc === "expiring" && !isExpiringSoon(v.tabc_expiry)) return false;
      if (assn && v.preferred_assignment !== assn) return false;
      if (date && !(v.volunteer_dates || []).includes(date)) return false;
      return true;
    });

    sortData();
    renderTable();
  }

  function sortTable(key) {
    if (sortKey === key) sortAsc = !sortAsc;
    else { sortKey = key; sortAsc = true; }
    sortData();
    renderTable();
  }

  function sortData() {
    filtered.sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (Array.isArray(va)) va = (va[0] || "");
      if (Array.isArray(vb)) vb = (vb[0] || "");
      if (va == null) va = "";
      if (vb == null) vb = "";
      if (typeof va === "boolean") return sortAsc ? (va === vb ? 0 : va ? -1 : 1) : (va === vb ? 0 : va ? 1 : -1);
      return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }

  function renderTable() {
    const tbody = document.getElementById("tableBody");
    document.getElementById("tableCount").textContent = filtered.length + " volunteer" + (filtered.length !== 1 ? "s" : "");

    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="10" class="empty">No volunteers match the current filters.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map((v) => {
      const certified = v.tabc_certified;
      const expiring = certified && isExpiringSoon(v.tabc_expiry);
      const expired = certified && isExpired(v.tabc_expiry);
      const tabcBadge = !certified
        ? '<span class="badge badge-no">No</span>'
        : expiring
          ? '<span class="badge badge-expiring">Expiring</span>'
          : expired
            ? '<span class="badge badge-no">Expired</span>'
            : '<span class="badge badge-yes">Yes</span>';

      const dates = (v.volunteer_dates || []).map(formatDate).join("<br>") || "—";

      return `<tr>
        <td><strong>${v.full_name || "—"}</strong></td>
        <td>${v.email || "—"}</td>
        <td>${v.mobile_phone || "—"}</td>
        <td style="font-size:.78rem;">${dates}</td>
        <td style="text-align:center;">${v.previous_events ?? 0}</td>
        <td style="text-align:center;">${v.total_hours ?? 0}</td>
        <td>${v.preferred_assignment || "—"}</td>
        <td>${tabcBadge}</td>
        <td style="font-size:.78rem;${expiring ? "color:#854d0e;font-weight:600;" : ""}">${formatDate(v.tabc_expiry)}</td>
        <td><span class="badge badge-yes">${v.status || "Registered"}</span></td>
      </tr>`;
    }).join("");
  }

  function clearFilters() {
    document.getElementById("filterName").value = "";
    document.getElementById("filterTabc").value = "";
    document.getElementById("filterAssignment").value = "";
    document.getElementById("filterDate").value = "";
    applyFilters();
  }

  function exportCSV() {
    const headers = ["Name", "Email", "Phone", "Volunteer Dates", "Previous Events", "Total Hours", "Assignment", "TABC Certified", "TABC Expiry", "Status"];
    const rows = filtered.map((v) => [
      v.full_name, v.email, v.mobile_phone,
      (v.volunteer_dates || []).join("; "),
      v.previous_events, v.total_hours,
      v.preferred_assignment || "",
      v.tabc_certified ? "Yes" : "No",
      v.tabc_expiry || "",
      v.status || "Registered",
    ].map((c) => '"' + String(c || "").replace(/"/g, '""') + '"'));

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dlgrf-volunteers-" + new Date().toISOString().split("T")[0] + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return { init };
})();
