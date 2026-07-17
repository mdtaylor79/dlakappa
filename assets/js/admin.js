let currentEditEventId = null;

/* ---------- Guard + boot ---------- */
async function bootAdmin() {
  const { data: { session } } = await dlaSupabase.auth.getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  const { data: member, error } = await dlaSupabase
    .from("members")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error || !member || !member.is_admin) {
    document.getElementById("admin-guard").classList.add("show");
    document.getElementById("admin-content").style.display = "none";
    return;
  }

  document.getElementById("admin-content").style.display = "block";
  document.getElementById("admin-name").textContent =
    member.first_name ? `${member.first_name} ${member.last_name || ""}`.trim() : member.email;

  initTabs();
  loadEventsAdmin();
  loadMembersAdmin();
}

function initTabs() {
  const buttons = document.querySelectorAll(".admin-tab-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".admin-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.panel).classList.add("active");
    });
  });
}

/* ============================================================
   Events
   ============================================================ */
async function loadEventsAdmin() {
  const holder = document.getElementById("admin-events-list");
  holder.innerHTML = '<p class="empty-state">Loading…</p>';

  const { data: events, error } = await dlaSupabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });

  if (error) {
    holder.innerHTML = '<p class="empty-state">Could not load events.</p>';
    return;
  }
  if (!events || events.length === 0) {
    holder.innerHTML = '<p class="empty-state">No events yet — add the first one.</p>';
    return;
  }

  holder.innerHTML = "";
  for (const ev of events) {
    const { count } = await dlaSupabase
      .from("rsvps")
      .select("id", { count: "exact", head: true })
      .eq("event_id", ev.id);

    const row = document.createElement("div");
    row.className = "event-row";
    row.innerHTML = `
      <div class="event-body" style="flex:1;">
        <h3 style="display:flex; align-items:center; gap:10px;">
          ${ev.title} <span class="count-tag">${count || 0} RSVP${count === 1 ? "" : "s"}</span>
        </h3>
        <p class="event-meta">${ev.event_date}${ev.event_time ? " · " + ev.event_time : ""} · ${ev.location || "Location TBA"}</p>
        <div class="row-actions">
          <button class="btn-link" data-edit="${ev.id}">Edit</button>
          <button class="btn-link muted" data-delete="${ev.id}">Delete</button>
        </div>
      </div>`;
    holder.appendChild(row);

    row.querySelector(`[data-edit="${ev.id}"]`).addEventListener("click", () => editEvent(ev));
    row.querySelector(`[data-delete="${ev.id}"]`).addEventListener("click", () => deleteEvent(ev.id));
  }
}

function editEvent(ev) {
  currentEditEventId = ev.id;
  document.getElementById("event-title").value = ev.title || "";
  document.getElementById("event-date").value = ev.event_date || "";
  document.getElementById("event-time").value = ev.event_time || "";
  document.getElementById("event-location").value = ev.location || "";
  document.getElementById("event-description").value = ev.description || "";
  document.getElementById("event-form-title").textContent = "Edit event";
  document.getElementById("event-submit-btn").textContent = "Save changes";
  document.getElementById("event-cancel-btn").style.display = "inline-block";
  window.scrollTo({ top: document.getElementById("event-form").offsetTop - 100, behavior: "smooth" });
}

function resetEventForm() {
  currentEditEventId = null;
  document.getElementById("event-form").reset();
  document.getElementById("event-form-title").textContent = "Add an event";
  document.getElementById("event-submit-btn").textContent = "Add event";
  document.getElementById("event-cancel-btn").style.display = "none";
}

async function deleteEvent(id) {
  if (!confirm("Delete this event? This also removes its RSVPs.")) return;
  const { error } = await dlaSupabase.from("events").delete().eq("id", id);
  if (error) {
    alert("Could not delete: " + error.message);
    return;
  }
  loadEventsAdmin();
}

const eventForm = document.getElementById("event-form");
if (eventForm) {
  eventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("event-submit-btn");
    btn.disabled = true;

    const payload = {
      title: document.getElementById("event-title").value.trim(),
      event_date: document.getElementById("event-date").value,
      event_time: document.getElementById("event-time").value.trim(),
      location: document.getElementById("event-location").value.trim(),
      description: document.getElementById("event-description").value.trim(),
    };

    let error;
    if (currentEditEventId) {
      ({ error } = await dlaSupabase.from("events").update(payload).eq("id", currentEditEventId));
    } else {
      ({ error } = await dlaSupabase.from("events").insert(payload));
    }

    btn.disabled = false;
    if (error) {
      alert("Could not save: " + error.message);
      return;
    }
    resetEventForm();
    loadEventsAdmin();
  });
}

const cancelBtn = document.getElementById("event-cancel-btn");
if (cancelBtn) cancelBtn.addEventListener("click", resetEventForm);

/* ============================================================
   Members / dues
   ============================================================ */
let allMembers = [];

async function loadMembersAdmin() {
  const { data: members, error } = await dlaSupabase
    .from("members")
    .select("*")
    .order("last_name", { ascending: true });

  if (error) {
    document.getElementById("members-table-body").innerHTML =
      `<tr><td colspan="5">Could not load members.</td></tr>`;
    return;
  }
  allMembers = members || [];
  renderMembers(allMembers);
}

function renderMembers(members) {
  const body = document.getElementById("members-table-body");
  if (!members || members.length === 0) {
    body.innerHTML = `<tr><td colspan="5">No members yet.</td></tr>`;
    return;
  }

  body.innerHTML = "";
  members.forEach((m) => {
    const tr = document.createElement("tr");
    const name = m.first_name ? `${m.first_name} ${m.last_name || ""}`.trim() : "—";
    const tier = m.membership_tier === "senior" ? "Senior ($300)" : m.membership_tier === "general" ? "General ($360)" : "—";

    tr.innerHTML = `
      <td>${name}</td>
      <td>${m.email || "—"}</td>
      <td>${tier}</td>
      <td>
        <select data-member="${m.id}">
          <option value="unpaid" ${m.dues_status === "unpaid" ? "selected" : ""}>Unpaid</option>
          <option value="pending" ${m.dues_status === "pending" ? "selected" : ""}>Pending</option>
          <option value="paid" ${m.dues_status === "paid" ? "selected" : ""}>Paid</option>
        </select>
      </td>
      <td>${m.join_date || "—"}</td>
    `;
    body.appendChild(tr);

    tr.querySelector("select").addEventListener("change", (e) => updateDuesStatus(m.id, e.target.value, e.target));
  });
}

async function updateDuesStatus(memberId, status, selectEl) {
  selectEl.disabled = true;
  const { error } = await dlaSupabase
    .from("members")
    .update({
      dues_status: status,
      dues_paid_at: status === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", memberId);
  selectEl.disabled = false;

  if (error) {
    alert("Could not update: " + error.message);
    return;
  }
  const m = allMembers.find((x) => x.id === memberId);
  if (m) m.dues_status = status;
}

const memberSearch = document.getElementById("member-search");
if (memberSearch) {
  memberSearch.addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) {
      renderMembers(allMembers);
      return;
    }
    renderMembers(
      allMembers.filter((m) =>
        `${m.first_name || ""} ${m.last_name || ""} ${m.email || ""}`.toLowerCase().includes(q)
      )
    );
  });
}

bootAdmin();
