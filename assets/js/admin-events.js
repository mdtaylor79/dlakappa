/* ============================================================
   Master Admin Console Controller
   - One auth/admin check for the whole consolidated page
   - Lazy-initializes each tab's module on first activation
   ============================================================ */

window.DLAAdminConsole = (function () {
  let currentMember = null;
  const initialized = {};

  async function boot() {
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

    currentMember = member;
    document.getElementById("admin-content").style.display = "block";
    document.getElementById("admin-name").textContent =
      member.first_name ? `${member.first_name} ${member.last_name || ""}`.trim() : member.email;

    initTabs();
    activateTab("panel-events"); // default tab, also triggers its lazy init
  }

  function initTabs() {
    const buttons = document.querySelectorAll(".admin-tab-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        document.querySelectorAll(".admin-panel").forEach((p) => p.classList.remove("active"));
        btn.classList.add("active");
        activateTab(btn.dataset.panel);
      });
    });
  }

  function activateTab(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) panel.classList.add("active");
    if (initialized[panelId]) return;
    initialized[panelId] = true;

    switch (panelId) {
      case "panel-events":
        window.Events && window.Events.init();
        break;
      case "panel-members":
        window.MembersAdmin && window.MembersAdmin.init();
        break;
      case "panel-access":
        window.PortalAccess && window.PortalAccess.init();
        break;
      case "panel-training":
        window.Training && window.Training.init();
        break;
      case "panel-training-report":
        window.TrainingReport && window.TrainingReport.init();
        break;
      case "panel-budget":
        window.Budget && window.Budget.init();
        break;
      case "panel-blog":
        window.Blog && window.Blog.init();
        break;
      case "panel-community-service":
        window.CommunityService && window.CommunityService.init();
        break;
      case "panel-volunteer":
        window.Volunteer && window.Volunteer.init();
        break;
    }
  }

  function getMember() { return currentMember; }

  return { boot, getMember };
})();

DLAAdminConsole.boot();
