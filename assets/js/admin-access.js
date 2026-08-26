window.PortalAccess = (function () {
  let allAccessMembers = [];
  let currentAccessFilter = "all";
  let didInit = false;

  function init() {
    if (didInit) return;
    didInit = true;
    loadPortalAccess();
  }

  async function loadPortalAccess() {
    const body = document.getElementById("access-table-body");
    if (!body) return;
    body.innerHTML = '<tr><td colspan="5">Loading…</td></tr>';

    const { data: members, error } = await dlaSupabase
      .from("members")
      .select("id, first_name, last_name, email, is_admin, last_active, join_date")
      .order("last_active", { ascending: false, nullsFirst: false });

    if (error) {
      body.innerHTML = `<tr><td colspan="5">Could not load access data: ${error.message}</td></tr>`;
      return;
    }

    allAccessMembers = members || [];
    updateAccessCounts();
    renderAccessTable(applyAccessFilter(allAccessMembers));

    const searchEl = document.getElementById("access-search");
    if (searchEl) {
      searchEl.addEventListener("input", () => {
        renderAccessTable(applyAccessFilter(allAccessMembers));
      });
    }
  }

  function updateAccessCounts() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const active = allAccessMembers.filter((m) => m.last_active && m.last_active > thirtyDaysAgo).length;
    const total = allAccessMembers.length;
    const activeEl = document.getElementById("access-active-count");
    const totalEl = document.getElementById("access-total-count");
    if (activeEl) activeEl.textContent = `${active} active`;
    if (totalEl) totalEl.textContent = `${total} total`;
  }

  function applyAccessFilter(members) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const searchEl = document.getElementById("access-search");
    const q = searchEl ? searchEl.value.trim().toLowerCase() : "";

    let filtered = members;
    if (currentAccessFilter === "active") {
      filtered = members.filter((m) => m.last_active && m.last_active > thirtyDaysAgo);
    } else if (currentAccessFilter === "admin") {
      filtered = members.filter((m) => m.is_admin);
    } else if (currentAccessFilter === "never") {
      filtered = members.filter((m) => !m.last_active);
    }

    if (q) {
      filtered = filtered.filter((m) =>
        `${m.first_name || ""} ${m.last_name || ""} ${m.email || ""}`.toLowerCase().includes(q)
      );
    }
    return filtered;
  }

  function setAccessFilter(filter, btn) {
    currentAccessFilter = filter;
    document.querySelectorAll(".access-filter-btn").forEach((b) => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    renderAccessTable(applyAccessFilter(allAccessMembers));
  }

  function renderAccessTable(members) {
    const body = document.getElementById("access-table-body");
    if (!body) return;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    if (!members.length) {
      body.innerHTML = '<tr><td colspan="5" style="color:#999;font-style:italic;">No members match this filter.</td></tr>';
      return;
    }

    body.innerHTML = "";
    members.forEach((m) => {
      const name = m.first_name ? `${m.first_name} ${m.last_name || ""}`.trim() : "—";
      const isActive = m.last_active && m.last_active > thirtyDaysAgo;
      const dotColor = !m.last_active ? "#ccc" : isActive ? "#2ecc71" : "#f39c12";
      const statusLabel = !m.last_active ? "Never logged in" : isActive ? "Active" : "Inactive";
      const lastLogin = m.last_active
        ? new Date(m.last_active).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
        : "—";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-weight:500;">${name}</td>
        <td style="color:#555;font-size:.85rem;">${m.email || "—"}</td>
        <td style="font-size:.82rem;color:#555;">${lastLogin}</td>
        <td>
          <span class="access-status-dot" style="background:${dotColor};"></span>
          <span style="font-size:.82rem;">${statusLabel}</span>
        </td>
        <td>
          <label class="access-toggle" title="${m.is_admin ? "Remove admin" : "Grant admin"}">
            <input type="checkbox" ${m.is_admin ? "checked" : ""} data-member-id="${m.id}">
            <span class="access-toggle-slider"></span>
          </label>
        </td>`;
      body.appendChild(tr);

      tr.querySelector('input[type="checkbox"]').addEventListener("change", function () {
        toggleAdmin(m.id, this.checked, this);
      });
    });
  }

  async function toggleAdmin(memberId, isAdmin, checkboxEl) {
    checkboxEl.disabled = true;
    const { error } = await dlaSupabase
      .from("members")
      .update({ is_admin: isAdmin })
      .eq("id", memberId);

    checkboxEl.disabled = false;
    if (error) {
      alert("Could not update admin status: " + error.message);
      checkboxEl.checked = !isAdmin;
      return;
    }

    const m = allAccessMembers.find((x) => x.id === memberId);
    if (m) m.is_admin = isAdmin;
    updateAccessCounts();
  }

  return { init, setAccessFilter };
})();
