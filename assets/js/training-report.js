let allRecords = [];   // flattened rows: {id, member_id, member_name, training_name, completed_date, status, verified_by, notes}
let totalMembers = 0;

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function displayName(m) {
  if (!m) return "Unknown member";
  const name = m.first_name ? `${m.first_name} ${m.last_name || ""}`.trim() : "";
  return name || m.email || "Unknown member";
}

async function checkAdmin() {
  const { data: { session } } = await dlaSupabase.auth.getSession();
  if (!session) { window.location.href = "login.html"; return; }

  const { data: member, error } = await dlaSupabase
    .from("members")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error || !member || !member.is_admin) {
    document.getElementById("gate").innerHTML = "You do not have access to this page.";
    return;
  }

  document.getElementById("gate").style.display = "none";
  document.getElementById("app").style.display = "block";
  await loadData();
}

async function loadData() {
  // Total member count (for completion-rate denominators)
  const { count: memberCount, error: memberCountError } = await dlaSupabase
    .from("members")
    .select("id", { count: "exact", head: true });

  totalMembers = memberCountError ? 0 : (memberCount || 0);

  // All training records, embedding the related member's name/email
  const { data, error } = await dlaSupabase
    .from("member_training")
    .select("*, members(first_name, last_name, email)")
    .order("training_name", { ascending: true });

  if (error) {
    document.getElementById("byTrainingWrap").innerHTML =
      `<div class="empty">Error loading records: ${escapeHtml(error.message)}</div>`;
    document.getElementById("tableWrap").innerHTML = "";
    return;
  }

  allRecords = (data || []).map((r) => ({
    id: r.id,
    member_id: r.member_id,
    member_name: displayName(r.members),
    training_name: r.training_name,
    completed_date: r.completed_date,
    status: r.status,
    verified_by: r.verified_by,
    notes: r.notes,
  }));

  renderStats();
  renderByTraining();
  populateTrainingFilter();
  renderTable();
}

function renderStats() {
  const total = allRecords.length;
  const complete = allRecords.filter((r) => r.status === "Complete").length;
  const outstanding = total - complete;

  document.getElementById("statTotalMembers").textContent = totalMembers;
  document.getElementById("statTotalRecords").textContent = total;
  document.getElementById("statComplete").textContent = complete;
  document.getElementById("statOutstanding").textContent = outstanding;
}

function renderByTraining() {
  const wrap = document.getElementById("byTrainingWrap");

  if (allRecords.length === 0) {
    wrap.innerHTML = '<div class="empty">No training records yet.</div>';
    return;
  }

  const byName = {};
  allRecords.forEach((r) => {
    if (!byName[r.training_name]) byName[r.training_name] = new Set();
    if (r.status === "Complete") byName[r.training_name].add(r.member_id);
  });

  const names = Object.keys(byName).sort();
  const denom = totalMembers || 1;

  wrap.innerHTML = names.map((name) => {
    const completeCount = byName[name].size;
    const pct = Math.round((completeCount / denom) * 100);
    return `
      <div class="training-row">
        <div class="name">${escapeHtml(name)}</div>
        <div class="bar-wrap"><div class="bar-fill" style="width:${Math.min(pct, 100)}%;"></div></div>
        <div class="pct">${completeCount} / ${totalMembers} (${pct}%)</div>
      </div>
    `;
  }).join("");
}

function populateTrainingFilter() {
  const select = document.getElementById("trainingFilter");
  const names = [...new Set(allRecords.map((r) => r.training_name))].sort();
  select.innerHTML = '<option value="">All trainings</option>' +
    names.map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
}

function getFilteredRecords() {
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const trainingFilter = document.getElementById("trainingFilter").value;
  const statusFilter = document.getElementById("statusFilter").value;

  return allRecords.filter((r) => {
    if (search && !r.member_name.toLowerCase().includes(search)) return false;
    if (trainingFilter && r.training_name !== trainingFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    return true;
  });
}

function renderTable() {
  const rows = getFilteredRecords();
  const wrap = document.getElementById("tableWrap");
  document.getElementById("resultCount").textContent =
    `${rows.length} record${rows.length === 1 ? "" : "s"}`;

  if (rows.length === 0) {
    wrap.innerHTML = '<div class="empty">No matching records.</div>';
    return;
  }

  const body = rows.map((r) => `
    <tr>
      <td>${escapeHtml(r.member_name)}</td>
      <td>${escapeHtml(r.training_name)}</td>
      <td>${r.completed_date || "—"}</td>
      <td><span class="badge ${r.status}">${r.status}</span></td>
      <td>${r.verified_by ? escapeHtml(r.verified_by) : "—"}</td>
    </tr>
  `).join("");

  wrap.innerHTML = `
    <table>
      <thead>
        <tr><th>Member</th><th>Training</th><th>Completed</th><th>Status</th><th>Verified By</th></tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

function exportCsv() {
  const rows = getFilteredRecords();
  if (rows.length === 0) return;

  const header = ["Member", "Training", "Completed Date", "Status", "Verified By", "Notes"];
  const csvRows = [header.join(",")];

  rows.forEach((r) => {
    const line = [
      r.member_name,
      r.training_name,
      r.completed_date || "",
      r.status,
      r.verified_by || "",
      r.notes || "",
    ].map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",");
    csvRows.push(line);
  });

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `dla-training-report-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

document.getElementById("searchInput").addEventListener("input", renderTable);
document.getElementById("trainingFilter").addEventListener("change", renderTable);
document.getElementById("statusFilter").addEventListener("change", renderTable);
document.getElementById("exportBtn").addEventListener("click", exportCsv);

checkAdmin();
