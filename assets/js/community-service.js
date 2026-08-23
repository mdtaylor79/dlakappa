// community-service.js
// Relies on `dlaSupabase` already created by supabase-client.js (loaded before this file).

// Keep this list in sync with the same array in admin-community-service.js
const CS_PRESET_LOCATIONS = [
  "Chapter Meeting Space",
  "Local Elementary School",
  "Local Middle/High School",
  "Food Bank / Pantry",
  "Community Center",
  "Church / Place of Worship",
  "Nursing Home / Senior Center",
  "Park / Outdoor Cleanup Site",
  "Virtual / Remote",
  "Other"
];

const EDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

let csCurrentUser = null;
let csEntries = [];
let csFraternityYearStartMonth = 9; // fallback default (September)

document.addEventListener('DOMContentLoaded', async () => {
  populateLocationSelect(document.getElementById('cs-location'));
  populateLocationSelect(document.getElementById('edit-location'));

  const { data: { session } } = await dlaSupabase.auth.getSession();
  if (!session) {
    window.location.href = '/portal/login.html';
    return;
  }
  csCurrentUser = session.user;

  await loadSettings();
  await loadMyEntries();
  wireUpForm();
  wireUpEditModal();
  wireUpInfoIcon();
  wireUpLocationToggle('cs-location', 'cs-location-other-wrap');
  wireUpLocationToggle('edit-location', 'edit-location-other-wrap');
});

function populateLocationSelect(selectEl) {
  selectEl.innerHTML = '<option value="" disabled selected>Select a location…</option>' +
    CS_PRESET_LOCATIONS.map(loc => `<option value="${loc}">${loc}</option>`).join('');
}

function wireUpLocationToggle(selectId, otherWrapId) {
  const sel = document.getElementById(selectId);
  const wrap = document.getElementById(otherWrapId);
  sel.addEventListener('change', () => {
    wrap.style.display = sel.value === 'Other' ? 'block' : 'none';
    const otherInput = wrap.querySelector('input');
    if (otherInput) otherInput.required = sel.value === 'Other';
  });
}

function wireUpInfoIcon() {
  const btn = document.getElementById('partner-info-btn');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    btn.classList.toggle('open');
  });
  document.addEventListener('click', () => btn.classList.remove('open'));
}

async function loadSettings() {
  const { data, error } = await dlaSupabase
    .from('community_service_settings')
    .select('fraternity_year_start_month')
    .eq('id', 1)
    .single();
  if (!error && data) {
    csFraternityYearStartMonth = data.fraternity_year_start_month;
  }
  const label = document.getElementById('stat-fy-label');
  const range = getFraternityYearRange(csFraternityYearStartMonth);
  label.textContent = `Hours This Fraternity Year (${range.label})`;
  const fyTag = document.getElementById('fyTag');
  if (fyTag) fyTag.textContent = `FY ${range.startYear}\u2013${range.startYear + 1}`;
}

function getFraternityYearRange(startMonth, refDate = new Date()) {
  const y = refDate.getFullYear();
  const m = refDate.getMonth() + 1;
  const startYear = m >= startMonth ? y : y - 1;
  const start = new Date(startYear, startMonth - 1, 1);
  const end = new Date(startYear + 1, startMonth - 1, 1); // exclusive
  return { start, end, startYear, label: `${startYear}–${String(startYear + 1).slice(2)}` };
}

async function loadMyEntries() {
  const { data, error } = await dlaSupabase
    .from('community_service')
    .select('*')
    .eq('member_id', csCurrentUser.id)
    .order('service_date', { ascending: false });

  const tbody = document.getElementById('cs-log-body');
  if (error) {
    tbody.innerHTML = `<tr><td colspan="9">Could not load your service log.</td></tr>`;
    return;
  }
  csEntries = data || [];
  renderStats();
  renderTable();
}

function renderStats() {
  const totalHours = csEntries.reduce((sum, e) => sum + Number(e.hours), 0);
  const range = getFraternityYearRange(csFraternityYearStartMonth);
  const fyHours = csEntries
    .filter(e => {
      const d = new Date(e.service_date + 'T00:00:00');
      return d >= range.start && d < range.end;
    })
    .reduce((sum, e) => sum + Number(e.hours), 0);

  document.getElementById('stat-total-hours').textContent = totalHours.toFixed(2);
  document.getElementById('stat-fy-hours').textContent = fyHours.toFixed(2);
  document.getElementById('stat-total-entries').textContent = csEntries.length;
}

function isEditable(entry) {
  const created = new Date(entry.created_at).getTime();
  return (Date.now() - created) < EDIT_WINDOW_MS;
}

function renderTable() {
  const tbody = document.getElementById('cs-log-body');
  if (csEntries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9">No service logged yet — use the form above to add your first entry.</td></tr>`;
    return;
  }
  tbody.innerHTML = csEntries.map(e => {
    const editable = isEditable(e);
    return `
      <tr>
        <td>${formatDate(e.service_date)}</td>
        <td>${escapeHtml(e.event_name)}</td>
        <td><span class="pill ${e.service_type === 'Internal' ? 'pill-internal' : 'pill-external'}">${e.service_type}</span></td>
        <td><span class="pill ${e.is_partner_service ? 'pill-yes' : 'pill-no'}">${e.is_partner_service ? 'Yes' : 'No'}</span></td>
        <td><span class="pill ${e.is_recurring ? 'pill-yes' : 'pill-no'}">${e.is_recurring ? 'Yes' : 'No'}</span></td>
        <td>${escapeHtml(e.location)}</td>
        <td>${Number(e.hours).toFixed(2)}</td>
        <td>${escapeHtml(e.notes || '—')}</td>
        <td>
          ${editable
            ? `<button class="btn-edit-small" data-edit="${e.id}">Edit</button>
               <button class="btn-danger-small" data-delete="${e.id}">Delete</button>`
            : `<span class="locked-tag">Locked</span>`}
        </td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.edit));
  });
  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => deleteEntry(btn.dataset.delete));
  });
}

function wireUpForm() {
  const form = document.getElementById('cs-form');
  const msg = document.getElementById('cs-form-msg');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    msg.className = 'status-msg';

    const type = form.querySelector('input[name="cs-type"]:checked')?.value;
    const partner = form.querySelector('input[name="cs-partner"]:checked')?.value;
    const recurring = form.querySelector('input[name="cs-recurring"]:checked')?.value;
    const locSelect = document.getElementById('cs-location').value;
    const location = locSelect === 'Other'
      ? document.getElementById('cs-location-other').value.trim()
      : locSelect;
    const hours = parseFloat(document.getElementById('cs-hours').value);

    if (!location) {
      msg.textContent = 'Please provide a location.';
      msg.className = 'status-msg error';
      return;
    }
    if (!hours || hours <= 0 || hours > 24) {
      msg.textContent = 'Hours must be between 0.25 and 24.';
      msg.className = 'status-msg error';
      return;
    }

    const payload = {
      member_id: csCurrentUser.id,
      created_by: csCurrentUser.id,
      service_date: document.getElementById('cs-date').value,
      event_name: document.getElementById('cs-event').value.trim(),
      service_type: type,
      is_partner_service: partner === 'yes',
      is_recurring: recurring === 'yes',
      location,
      hours,
      notes: document.getElementById('cs-notes').value.trim() || null
    };

    const submitBtn = document.getElementById('cs-submit-btn');
    submitBtn.disabled = true;
    const { error } = await dlaSupabase.from('community_service').insert(payload);
    submitBtn.disabled = false;

    if (error) {
      msg.textContent = 'Error saving entry: ' + error.message;
      msg.className = 'status-msg error';
      return;
    }

    msg.textContent = 'Service logged successfully!';
    msg.className = 'status-msg success';
    form.reset();
    document.getElementById('cs-location-other-wrap').style.display = 'none';
    await loadMyEntries();
  });
}

function wireUpEditModal() {
  document.getElementById('edit-cancel-btn').addEventListener('click', closeEditModal);
  document.getElementById('edit-modal').addEventListener('click', (e) => {
    if (e.target.id === 'edit-modal') closeEditModal();
  });

  document.getElementById('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('edit-form-msg');
    const id = document.getElementById('edit-id').value;

    const type = document.querySelector('input[name="edit-type"]:checked')?.value;
    const partner = document.querySelector('input[name="edit-partner"]:checked')?.value;
    const recurring = document.querySelector('input[name="edit-recurring"]:checked')?.value;
    const locSelect = document.getElementById('edit-location').value;
    const location = locSelect === 'Other'
      ? document.getElementById('edit-location-other').value.trim()
      : locSelect;
    const hours = parseFloat(document.getElementById('edit-hours').value);

    const payload = {
      service_date: document.getElementById('edit-date').value,
      event_name: document.getElementById('edit-event').value.trim(),
      service_type: type,
      is_partner_service: partner === 'yes',
      is_recurring: recurring === 'yes',
      location,
      hours,
      notes: document.getElementById('edit-notes').value.trim() || null
    };

    const { error } = await dlaSupabase.from('community_service').update(payload).eq('id', id);
    if (error) {
      msg.textContent = 'Could not save changes: ' + error.message;
      msg.className = 'status-msg error';
      return;
    }
    closeEditModal();
    await loadMyEntries();
  });
}

function openEditModal(id) {
  const entry = csEntries.find(e => e.id === id);
  if (!entry) return;

  document.getElementById('edit-id').value = entry.id;
  document.getElementById('edit-date').value = entry.service_date;
  document.getElementById('edit-event').value = entry.event_name;
  document.querySelector(`input[name="edit-type"][value="${entry.service_type}"]`).checked = true;
  document.querySelector(`input[name="edit-partner"][value="${entry.is_partner_service ? 'yes' : 'no'}"]`).checked = true;
  document.querySelector(`input[name="edit-recurring"][value="${entry.is_recurring ? 'yes' : 'no'}"]`).checked = true;

  const locSelect = document.getElementById('edit-location');
  const isPreset = CS_PRESET_LOCATIONS.includes(entry.location);
  locSelect.value = isPreset ? entry.location : 'Other';
  document.getElementById('edit-location-other-wrap').style.display = isPreset ? 'none' : 'block';
  document.getElementById('edit-location-other').value = isPreset ? '' : entry.location;

  document.getElementById('edit-hours').value = entry.hours;
  document.getElementById('edit-notes').value = entry.notes || '';
  document.getElementById('edit-form-msg').textContent = '';

  document.getElementById('edit-modal').classList.add('open');
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.remove('open');
}

async function deleteEntry(id) {
  if (!confirm('Delete this service entry? This cannot be undone.')) return;
  const { error } = await dlaSupabase.from('community_service').delete().eq('id', id);
  if (error) {
    alert('Could not delete entry: ' + error.message);
    return;
  }
  await loadMyEntries();
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
