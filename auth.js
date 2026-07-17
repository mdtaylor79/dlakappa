const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

async function loadEvents() {
  const list = document.getElementById("events-list");
  const select = document.getElementById("rsvp-event");

  const { data: events, error } = await dlaSupabase
    .from("events")
    .select("*")
    .gte("event_date", new Date().toISOString().slice(0, 10))
    .order("event_date", { ascending: true });

  if (error) {
    list.innerHTML = '<p class="empty-state">Could not load events right now.</p>';
    return;
  }

  if (!events || events.length === 0) {
    list.innerHTML = '<p class="empty-state">No upcoming events posted yet. Check back soon.</p>';
    select.innerHTML = '<option value="">No events open for RSVP</option>';
    return;
  }

  list.innerHTML = "";
  select.innerHTML = '<option value="">Select an event…</option>';

  events.forEach((ev) => {
    const d = new Date(ev.event_date + "T00:00:00");
    const row = document.createElement("div");
    row.className = "event-row";
    row.innerHTML = `
      <div class="event-date">
        <div class="month">${MONTHS[d.getMonth()]}</div>
        <div class="day">${d.getDate()}</div>
      </div>
      <div class="event-body">
        <h3>${ev.title}</h3>
        <p class="event-meta">${ev.event_time ? ev.event_time + " · " : ""}${ev.location || "Location TBA"}</p>
        <p>${ev.description || ""}</p>
      </div>`;
    list.appendChild(row);

    const opt = document.createElement("option");
    opt.value = ev.id;
    opt.textContent = `${ev.title} — ${ev.event_date}`;
    select.appendChild(opt);
  });
}

loadEvents();

const rsvpForm = document.getElementById("rsvp-form");
if (rsvpForm) {
  rsvpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("rsvp-status");
    const btn = rsvpForm.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Submitting…";

    const { data: { session } } = await dlaSupabase.auth.getSession();

    const payload = {
      event_id: document.getElementById("rsvp-event").value,
      guest_name: document.getElementById("rsvp-name").value.trim(),
      guest_email: document.getElementById("rsvp-email").value.trim(),
      guest_count: parseInt(document.getElementById("rsvp-count").value, 10) || 1,
      member_id: session ? session.user.id : null,
    };

    const { error } = await dlaSupabase.from("rsvps").insert(payload);

    if (error) {
      status.textContent = "Something went wrong — please try again.";
      status.classList.add("show", "err");
    } else {
      status.textContent = "You're on the list. See you there!";
      status.classList.remove("err");
      status.classList.add("show", "ok");
      rsvpForm.reset();
    }
    btn.disabled = false;
    btn.textContent = "RSVP";
  });
}
