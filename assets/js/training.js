function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function formatDate(d) {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function renderRows(rows) {
  const content = document.getElementById("content");

  if (!rows || rows.length === 0) {
    content.innerHTML = '<div class="empty">No training records yet. Check back after your next session.</div>';
    return;
  }

  const rowsHtml = rows.map((r) => `
    <tr>
      <td>${escapeHtml(r.training_name)}</td>
      <td>${r.completed_date ? formatDate(r.completed_date) : "—"}</td>
      <td><span class="badge ${r.status}">${r.status}</span></td>
      <td>${r.verified_by ? escapeHtml(r.verified_by) : "—"}</td>
    </tr>
  `).join("");

  content.outerHTML = `
    <table>
      <thead>
        <tr><th>Training</th><th>Completed</th><th>Status</th><th>Verified By</th></tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;
}

async function loadTraining() {
  const { data: { session } } = await dlaSupabase.auth.getSession();

  if (!session) {
    window.location.href = "login.html";
    return;
  }

  const { data, error } = await dlaSupabase
    .from("member_training")
    .select("*")
    .eq("member_id", session.user.id)
    .order("completed_date", { ascending: false, nullsFirst: false });

  if (error) {
    document.getElementById("content").innerHTML =
      `<div class="error">Couldn't load training records: ${escapeHtml(error.message)}</div>`;
    return;
  }

  renderRows(data);
}

loadTraining();
