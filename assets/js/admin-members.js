window.MembersAdmin = (function () {
  let allMembers = [];
  let didInit = false;

  function init() {
    if (didInit) return;
    didInit = true;
    loadMembersAdmin();

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
  }

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
      body.innerHTML = `<tr><td colspan="4">No members yet.</td></tr>`;
      return;
    }

    body.innerHTML = "";
    members.forEach((m) => {
      const tr = document.createElement("tr");
      const name = m.first_name ? `${m.first_name} ${m.last_name || ""}`.trim() : "—";
      const tier = m.membership_tier === "new" ? "New Member" : m.membership_tier === "subscribing" ? "Subscribing Member" : "—";

      tr.innerHTML = `
        <td>${name}</td>
        <td>${m.email || "—"}</td>
        <td>${tier}</td>
        <td>${m.join_date || "—"}</td>
      `;
      body.appendChild(tr);
    });
  }

  return { init };
})();
