async function loadDashboard() {
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

  if (error || !member) {
    console.error(error);
    return;
  }

  document.getElementById("dash-name").textContent =
    member.first_name ? `${member.first_name} ${member.last_name || ""}`.trim() : member.email;
  document.getElementById("dash-email").textContent = member.email;

  const tierLabel = member.membership_tier === "senior" ? "Senior Member" : "General Member";
  document.getElementById("dash-tier").textContent = tierLabel;

  if (member.is_admin) {
    const adminLink = document.getElementById("nav-admin");
    if (adminLink) adminLink.style.display = "";
  }

  const statusPill = document.getElementById("dash-status");
  statusPill.textContent = member.dues_status;
  statusPill.className = `status-pill ${member.dues_status}`;

  const amount = member.membership_tier === "senior" ? "$300" : "$360";
  document.getElementById("dash-amount").textContent = amount;

  const payLink = document.getElementById("dash-pay-link");
  if (member.dues_status === "paid") {
    payLink.style.display = "none";
  } else {
    payLink.href = member.membership_tier === "senior" ? STRIPE_LINK_SENIOR : STRIPE_LINK_GENERAL;
  }

  // Member's own upcoming RSVPs
  const { data: rsvps } = await dlaSupabase
    .from("rsvps")
    .select("id, guest_count, events ( title, event_date, location )")
    .eq("member_id", session.user.id)
    .order("created_at", { ascending: false });

  const list = document.getElementById("dash-rsvps");
  list.innerHTML = "";
  if (!rsvps || rsvps.length === 0) {
    list.innerHTML = '<p class="empty-state">No event RSVPs yet. <a href="../events.html">See what\'s coming up →</a></p>';
  } else {
    rsvps.forEach((r) => {
      if (!r.events) return;
      const row = document.createElement("div");
      row.className = "event-row";
      row.innerHTML = `
        <div class="event-body">
          <h3>${r.events.title}</h3>
          <p class="event-meta">${r.events.event_date} · ${r.events.location || "Location TBA"} · Party of ${r.guest_count}</p>
        </div>`;
      list.appendChild(row);
    });
  }
}

loadDashboard();
