window.Budget = (function () {
  let allRows = [];
  let didInit = false;

  function esc(str) { return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function init() {
    if (didInit) return;
    didInit = true;

    document.getElementById("searchInput-budget").addEventListener("input", applyFilters);
    document.getElementById("filterStatus-budget").addEventListener("change", applyFilters);
    document.getElementById("filterPriority-budget").addEventListener("change", applyFilters);
    document.getElementById("filterCommittee-budget").addEventListener("change", applyFilters);
    document.getElementById("exportCSV-budget-btn").addEventListener("click", exportCSV);
    document.getElementById("modalBg-budget").addEventListener("click", closeModal);
    document.getElementById("modalClose-budget-btn").addEventListener("click", () => {
      document.getElementById("modalBg-budget").classList.remove("open");
    });

    loadData();
  }

  async function loadData() {
    const { data, error } = await dlaSupabase
      .from("budget_requests")
      .select("*")
      .order("created_at", { ascending: false });

    document.getElementById("loadingMsg-budget").style.display = "none";
    document.getElementById("mainTable-budget").style.display = "";

    if (error || !data) {
      document.getElementById("tableBody-budget").innerHTML = '<tr class="empty-row"><td colspan="7">Error loading data. Check Supabase table name.</td></tr>';
      return;
    }

    allRows = data;
    updateAnalytics(data);
    populateCommitteeFilter(data);
    renderTable(data);
  }

  function updateAnalytics(data) {
    const pending = data.filter((r) => r.status === "Pending").length;
    const approved = data.filter((r) => r.status === "Approved").length;
    const total = data.reduce((s, r) => s + (r.total_amount || 0), 0);
    const approvedAmt = data.filter((r) => r.status === "Approved").reduce((s, r) => s + (r.total_amount || 0), 0);
    document.getElementById("statTotal-budget").textContent = data.length;
    document.getElementById("statPending-budget").textContent = pending;
    document.getElementById("statApproved-budget").textContent = approved;
    document.getElementById("statAmount-budget").textContent = "$" + total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById("statApprovedAmt-budget").textContent = "$" + approvedAmt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function populateCommitteeFilter(data) {
    const committees = [...new Set(data.map((r) => r.committee).filter(Boolean))].sort();
    const sel = document.getElementById("filterCommittee-budget");
    committees.forEach((c) => {
      const opt = document.createElement("option"); opt.value = c; opt.textContent = c; sel.appendChild(opt);
    });
  }

  function renderTable(data) {
    const tbody = document.getElementById("tableBody-budget");
    if (!data.length) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No requests found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map((r) => {
      const date = r.request_date ? new Date(r.request_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
      const amount = r.total_amount != null ? "$" + Number(r.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—";
      const status = r.status || "Pending";
      const badgeClass = { Pending: "badge-pending", Approved: "badge-approved", Denied: "badge-denied", "Under Review": "badge-review" }[status] || "badge-pending";
      const pClass = { Low: "p-low", Medium: "p-medium", High: "p-high", Urgent: "p-urgent" }[r.priority] || "p-medium";
      return `<tr>
        <td style="white-space:nowrap;color:#6a5a50;font-size:.78rem;">${date}</td>
        <td><strong>${esc(r.full_name || "—")}</strong><br><span style="font-size:.75rem;color:#aaa;">${esc(r.email || "")}</span></td>
        <td>${esc(r.committee || "—")}</td>
        <td><span class="priority-dot ${pClass}"></span>${esc(r.priority || "Medium")}</td>
        <td class="amount-cell">${amount}</td>
        <td><span class="badge ${badgeClass}">${status}</span></td>
        <td style="white-space:nowrap;display:flex;gap:.4rem;align-items:center;">
          <button class="action-btn" style="border-color:#c69a3f;color:#8a6020;background:#fffbf0;" data-view="${r.id}">View</button>
          ${status !== "Approved" ? `<button class="action-btn action-approve" data-approve="${r.id}">✓</button>` : ""}
          ${status !== "Denied" ? `<button class="action-btn action-deny" data-deny="${r.id}">✕</button>` : ""}
        </td>
      </tr>`;
    }).join("");

    tbody.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => openModal(b.dataset.view)));
    tbody.querySelectorAll("[data-approve]").forEach((b) => b.addEventListener("click", () => updateStatus(b.dataset.approve, "Approved")));
    tbody.querySelectorAll("[data-deny]").forEach((b) => b.addEventListener("click", () => updateStatus(b.dataset.deny, "Denied")));
  }

  function applyFilters() {
    const search = document.getElementById("searchInput-budget").value.toLowerCase();
    const status = document.getElementById("filterStatus-budget").value;
    const priority = document.getElementById("filterPriority-budget").value;
    const committee = document.getElementById("filterCommittee-budget").value;
    const filtered = allRows.filter((r) =>
      (!search || (r.full_name || "").toLowerCase().includes(search) || (r.committee || "").toLowerCase().includes(search) || (r.email || "").toLowerCase().includes(search)) &&
      (!status || r.status === status) &&
      (!priority || r.priority === priority) &&
      (!committee || r.committee === committee)
    );
    renderTable(filtered);
  }

  async function updateStatus(id, newStatus) {
    const { error } = await dlaSupabase.from("budget_requests").update({ status: newStatus }).eq("id", id);
    if (!error) {
      const row = allRows.find((r) => r.id === id);
      if (row) row.status = newStatus;
      updateAnalytics(allRows);
      applyFilters();
      document.getElementById("modalBg-budget").classList.remove("open");
    }
  }

  function openModal(id) {
    const r = allRows.find((r) => r.id === id);
    if (!r) return;
    document.getElementById("modalTitle-budget").textContent = r.full_name + " — " + (r.committee || "");
    const lines = Array.isArray(r.line_items) ? r.line_items : [];
    const linesHtml = lines.length ? `
      <div class="detail-item full"><div class="lbl">Line Items</div>
      <div class="line-mini"><table>
        <thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
        <tbody>${lines.map((l) => `<tr><td>${esc(l.description || "")}</td><td>${l.qty}</td><td>$${Number(l.unit_cost).toFixed(2)}</td><td>$${Number(l.total).toFixed(2)}</td></tr>`).join("")}</tbody>
      </table></div></div>` : "";

    document.getElementById("modalBody-budget").innerHTML = `
      <div class="detail-grid">
        <div class="detail-item"><div class="lbl">Name</div><div class="val">${esc(r.full_name || "—")}</div></div>
        <div class="detail-item"><div class="lbl">Email</div><div class="val">${esc(r.email || "—")}</div></div>
        <div class="detail-item"><div class="lbl">Committee</div><div class="val">${esc(r.committee || "—")}</div></div>
        <div class="detail-item"><div class="lbl">Role</div><div class="val">${esc(r.role || "—")}</div></div>
        <div class="detail-item"><div class="lbl">Request Date</div><div class="val">${r.request_date || "—"}</div></div>
        <div class="detail-item"><div class="lbl">Event Date</div><div class="val">${r.event_date || "—"}</div></div>
        <div class="detail-item"><div class="lbl">Priority</div><div class="val">${r.priority || "—"}</div></div>
        <div class="detail-item"><div class="lbl">Total Requested</div><div class="val" style="font-family:'Cinzel',serif;font-weight:700;color:#70110c;">$${Number(r.total_amount || 0).toFixed(2)}</div></div>
        <div class="detail-item full"><div class="lbl">Purpose</div><div class="val">${esc(r.purpose || "—")}</div></div>
        <div class="detail-item full"><div class="lbl">Expected Impact</div><div class="val">${esc(r.impact || "—")}</div></div>
        ${linesHtml}
        <div class="detail-item"><div class="lbl">Vendor</div><div class="val">${esc(r.vendor || "—")}</div></div>
        <div class="detail-item"><div class="lbl">Payment Method</div><div class="val">${esc(r.pay_method || "—")}</div></div>
        <div class="detail-item full"><div class="lbl">Notes</div><div class="val">${esc(r.notes || "—")}</div></div>
      </div>`;

    const status = r.status || "Pending";
    document.getElementById("modalActions-budget").innerHTML = `
      ${status !== "Approved" ? `<button class="action-btn action-approve" data-modal-approve="${r.id}">✓ Approve</button>` : ""}
      ${status !== "Under Review" ? `<button class="action-btn" style="border-color:#c7d7f0;color:#3730a3;background:#eef2ff;" data-modal-review="${r.id}">⏳ Under Review</button>` : ""}
      ${status !== "Denied" ? `<button class="action-btn action-deny" data-modal-deny="${r.id}">✕ Deny</button>` : ""}`;

    const modalActions = document.getElementById("modalActions-budget");
    const approveBtn = modalActions.querySelector("[data-modal-approve]");
    const reviewBtn = modalActions.querySelector("[data-modal-review]");
    const denyBtn = modalActions.querySelector("[data-modal-deny]");
    if (approveBtn) approveBtn.addEventListener("click", () => updateStatus(r.id, "Approved"));
    if (reviewBtn) reviewBtn.addEventListener("click", () => updateStatus(r.id, "Under Review"));
    if (denyBtn) denyBtn.addEventListener("click", () => updateStatus(r.id, "Denied"));

    document.getElementById("modalBg-budget").classList.add("open");
  }

  function closeModal(e) {
    if (e.target === document.getElementById("modalBg-budget")) {
      document.getElementById("modalBg-budget").classList.remove("open");
    }
  }

  function exportCSV() {
    const headers = ["Date", "Name", "Email", "Committee", "Role", "Priority", "Total", "Status", "Purpose", "Vendor", "Pay Method", "Notes"];
    const rows = allRows.map((r) => [
      r.request_date, r.full_name, r.email, r.committee, r.role,
      r.priority, r.total_amount, r.status, r.purpose, r.vendor, r.pay_method, r.notes,
    ].map((v) => '"' + String(v || "").replace(/"/g, '""') + '"'));
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "DLA_BudgetRequests_" + new Date().toISOString().split("T")[0] + ".csv";
    a.click();
  }

  return { init };
})();
