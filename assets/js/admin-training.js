window.Training = (function () {
  let members = [];
  let editingId = null;
  let didInit = false;

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  function showMsg(text, type) {
    const box = document.getElementById("msgBox");
    box.innerHTML = `<div class="msg ${type}">${escapeHtml(text)}</div>`;
    setTimeout(() => { box.innerHTML = ""; }, 4000);
  }

  function displayName(m) {
    const name = m.first_name ? `${m.first_name} ${m.last_name || ""}`.trim() : "";
    return name || m.email || "Unknown member";
  }

  function init() {
    if (didInit) return;
    didInit = true;
    loadMembers();
    loadRecords();

    document.getElementById("cancelEditBtn").addEventListener("click", resetForm);

    document.getElementById("trainingForm").addEventListener("submit", async (e) => {
      e.preventDefault();

      const payload = {
        member_id: document.getElementById("memberSelect").value,
        training_name: document.getElementById("trainingName").value.trim(),
        completed_date: document.getElementById("completedDate").value || null,
        status: document.getElementById("status").value,
        verified_by: document.getElementById("verifiedBy").value.trim() || null,
        notes: document.getElementById("notes").value.trim() || null,
      };

      let error;
      if (editingId) {
        ({ error } = await dlaSupabase.from("member_training").update(payload).eq("id", editingId));
      } else {
        ({ error } = await dlaSupabase.from("member_training").insert(payload));
      }

      if (error) { showMsg("Save failed: " + error.message, "err"); return; }

      showMsg(editingId ? "Record updated." : "Record added.", "ok");
      resetForm();
      loadRecords();
    });
  }

  async function loadMembers() {
    const { data, error } = await dlaSupabase
      .from("members")
      .select("id, first_name, last_name, email")
      .order("last_name", { ascending: true });

    if (error) { showMsg("Could not load members: " + error.message, "err"); return; }

    members = data || [];
    const select = document.getElementById("memberSelect");
    select.innerHTML = members.map((m) =>
      `<option value="${m.id}">${escapeHtml(displayName(m))}</option>`
    ).join("");
  }

  function memberName(id) {
    const m = members.find((m) => m.id === id);
    return m ? displayName(m) : "Unknown member";
  }

  let cachedRecords = [];

  async function loadRecords() {
    const wrap = document.getElementById("tableWrap");
    wrap.innerHTML = '<div class="loading">Loading&hellip;</div>';

    const { data, error } = await dlaSupabase
      .from("member_training")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      wrap.innerHTML = `<div class="empty">Error loading records: ${escapeHtml(error.message)}</div>`;
      return;
    }

    if (!data || data.length === 0) {
      wrap.innerHTML = '<div class="empty">No training records yet.</div>';
      return;
    }

    const rows = data.map((r) => `
      <tr>
        <td>${escapeHtml(memberName(r.member_id))}</td>
        <td>${escapeHtml(r.training_name)}</td>
        <td>${r.completed_date || "—"}</td>
        <td><span class="badge ${r.status}">${r.status}</span></td>
        <td>${escapeHtml(r.verified_by) || "—"}</td>
        <td class="actions">
          <button type="button" data-edit-record="${r.id}">Edit</button>
          <button type="button" class="danger" data-delete-record="${r.id}">Delete</button>
        </td>
      </tr>
    `).join("");

    wrap.innerHTML = `
      <table>
        <thead>
          <tr><th>Member</th><th>Training</th><th>Completed</th><th>Status</th><th>Verified By</th><th>Actions</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    cachedRecords = data;

    wrap.querySelectorAll("[data-edit-record]").forEach((btn) => {
      btn.addEventListener("click", () => editRecord(btn.dataset.editRecord));
    });
    wrap.querySelectorAll("[data-delete-record]").forEach((btn) => {
      btn.addEventListener("click", () => deleteRecord(btn.dataset.deleteRecord));
    });
  }

  function editRecord(id) {
    const r = cachedRecords.find((r) => r.id === id);
    if (!r) return;
    editingId = id;
    document.getElementById("recordId").value = id;
    document.getElementById("memberSelect").value = r.member_id;
    document.getElementById("trainingName").value = r.training_name;
    document.getElementById("completedDate").value = r.completed_date || "";
    document.getElementById("status").value = r.status;
    document.getElementById("verifiedBy").value = r.verified_by || "";
    document.getElementById("notes").value = r.notes || "";
    document.getElementById("formTitle").textContent = "Edit Training Record";
    document.getElementById("submitBtn").textContent = "Save Changes";
    document.getElementById("cancelEditBtn").style.display = "inline-block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteRecord(id) {
    if (!confirm("Delete this training record?")) return;
    const { error } = await dlaSupabase.from("member_training").delete().eq("id", id);
    if (error) { showMsg("Delete failed: " + error.message, "err"); return; }
    showMsg("Record deleted.", "ok");
    loadRecords();
  }

  function resetForm() {
    editingId = null;
    document.getElementById("trainingForm").reset();
    document.getElementById("recordId").value = "";
    document.getElementById("formTitle").textContent = "Add Training Record";
    document.getElementById("submitBtn").textContent = "Add Record";
    document.getElementById("cancelEditBtn").style.display = "none";
  }

  return { init };
})();
