// admin-community-service.js
// Relies on `dlaSupabase` (supabase-client.js), Chart.js, and jsPDF+autotable
// all being loaded before this file (see script order in admin-community-service.html).

// Keep this list in sync with the same array in community-service.js
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

let csAdminUser = null;
let csAllEntries = [];
let csFilteredEntries = [];
let csMembers = [];       // { id, name }
let csMemberMap = {};     // id -> name
let csFySettings = { fraternity_year_start_month: 9, annual_goal_hours: null };
let chartMonthly = null, chartType = null, chartLocations = null;

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await dlaSupabase.auth.getSession();
  if (!session) { window.location.href = '/portal/login.html'; return; }
  csAdminUser = session.user;

  const { data: memberRow, error: memberErr } = await dlaSupabase
    .from('members').select('is_admin').eq('id', user.id).single();

  if (memberErr || !memberRow || !memberRow.is_admin) {
    document.getElementById('access-denied').style.display = 'block';
    return;
  }
  document.getElementById('admin-main').style.display = 'block';

  populateLocationSelect(document.getElementById('am-location'));
  await loadSettings();
  await loadMembers();
  await loadAllEntries();

  wireFilters();
  wireSettingsPanel();
  wireAddEntry();
  wireExports();
  wireLocationToggle();
});

// ---------- Data loading ----------

async function loadSettings() {
  const { data, error } = await dlaSupabase
    .from('community_service_settings')
    .select('fraternity_year_start_month, annual_goal_hours')
    .eq('id', 1).single();
  if (!error && data) csFySettings = data;

  document.getElementById('settings-fy-month').value = csFySettings.fraternity_year_start_month;
  document.getElementById('settings-goal').value = csFySettings.annual_goal_hours ?? '';
  const range = getFraternityYearRange(csFySettings.fraternity_year_start_month);
  document.getElementById('a-stat-fy-label').textContent = `Hours This Fraternity Year (${range.label})`;
  const fyTag = document.getElementById('fyTag');
  if (fyTag) fyTag.textContent = `FY ${range.startYear}\u2013${range.startYear + 1}`;
}

async function loadMembers() {
  const { data, error } = await dlaSupabase
    .from('members').select('id, first_name, last_name').order('last_name');
  if (error) return;
  csMembers = (data || []).map(m => ({ id: m.id, name: `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'Unknown' }));
  csMemberMap = Object.fromEntries(csMembers.map(m => [m.id, m.name]));

  const sel = document.getElementById('am-member');
  sel.innerHTML = '<option value="" disabled selected>Select member…</option>' +
    csMembers.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('');
}

async function loadAllEntries() {
  const { data, error } = await dlaSupabase
    .from('community_service').select('*').order('service_date', { ascending: false });
  const tbody = document.getElementById('admin-log-body');
  if (error) {
    tbody.innerHTML = `<tr><td colspan="10">Could not load service entries.</td></tr>`;
    return;
  }
  csAllEntries = data || [];
  renderGlobalStats();
  applyFilters();
}

// ---------- Fraternity year helper ----------

function getFraternityYearRange(startMonth, refDate = new Date()) {
  const y = refDate.getFullYear();
  const m = refDate.getMonth() + 1;
  const startYear = m >= startMonth ? y : y - 1;
  const start = new Date(startYear, startMonth - 1, 1);
  const end = new Date(startYear + 1, startMonth - 1, 1);
  return { start, end, startYear, label: `${startYear}–${String(startYear + 1).slice(2)}` };
}

// ---------- Global (unfiltered) stat cards ----------

function renderGlobalStats() {
  const totalHours = csAllEntries.reduce((s, e) => s + Number(e.hours), 0);
  const range = getFraternityYearRange(csFySettings.fraternity_year_start_month);
  const fyEntries = csAllEntries.filter(e => inRange(e.service_date, range.start, range.end));
  const fyHours = fyEntries.reduce((s, e) => s + Number(e.hours), 0);
  const participants = new Set(csAllEntries.map(e => e.member_id)).size;
  const events = new Set(csAllEntries.map(e => `${e.event_name}|${e.service_date}`)).size;

  document.getElementById('a-stat-total-hours').textContent = totalHours.toFixed(1);
  document.getElementById('a-stat-fy-hours').textContent = fyHours.toFixed(1);
  document.getElementById('a-stat-participants').textContent = participants;
  document.getElementById('a-stat-events').textContent = events;
}

function inRange(dateStr, start, end) {
  const d = new Date(dateStr + 'T00:00:00');
  return d >= start && d < end;
}

// ---------- Filters ----------

function wireFilters() {
  ['f-from', 'f-to', 'f-type', 'f-partner', 'f-recurring', 'f-member'].forEach(id => {
    document.getElementById(id).addEventListener('input', applyFilters);
    document.getElementById(id).addEventListener('change', applyFilters);
  });
}

function applyFilters() {
  const from = document.getElementById('f-from').value;
  const to = document.getElementById('f-to').value;
  const type = document.getElementById('f-type').value;
  const partner = document.getElementById('f-partner').value;
  const recurring = document.getElementById('f-recurring').value;
  const memberQuery = document.getElementById('f-member').value.trim().toLowerCase();

  csFilteredEntries = csAllEntries.filter(e => {
    if (from && e.service_date < from) return false;
    if (to && e.service_date > to) return false;
    if (type && e.service_type !== type) return false;
    if (partner && (e.is_partner_service ? 'yes' : 'no') !== partner) return false;
    if (recurring && (e.is_recurring ? 'yes' : 'no') !== recurring) return false;
    if (memberQuery) {
      const name = (csMemberMap[e.member_id] || '').toLowerCase();
      if (!name.includes(memberQuery)) return false;
    }
    return true;
  });

  renderCharts();
  renderLeaderboard();
  renderTable();
}

// ---------- Charts ----------

function renderCharts() {
  renderMonthlyChart();
  renderTypeChart();
  renderLocationsChart();
}

function renderMonthlyChart() {
  const range = getFraternityYearRange(csFySettings.fraternity_year_start_month);
  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(range.startYear, csFySettings.fraternity_year_start_month - 1 + i, 1);
    months.push(d);
  }
  const labels = months.map(d => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
  const totals = months.map(m => {
    const nextMonth = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    return csFilteredEntries
      .filter(e => inRange(e.service_date, m, nextMonth))
      .reduce((s, e) => s + Number(e.hours), 0);
  });

  const ctx = document.getElementById('chart-monthly').getContext('2d');
  if (chartMonthly) chartMonthly.destroy();
  chartMonthly = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Hours', data: totals, backgroundColor: '#5c1a2b' }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });
}

function renderTypeChart() {
  const internal = csFilteredEntries.filter(e => e.service_type === 'Internal').reduce((s, e) => s + Number(e.hours), 0);
  const external = csFilteredEntries.filter(e => e.service_type === 'External').reduce((s, e) => s + Number(e.hours), 0);

  const ctx = document.getElementById('chart-type').getContext('2d');
  if (chartType) chartType.destroy();
  chartType = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Internal', 'External'],
      datasets: [{ data: [internal, external], backgroundColor: ['#5c1a2b', '#c9a961'] }]
    },
    options: { responsive: true }
  });
}

function renderLocationsChart() {
  const totals = {};
  csFilteredEntries.forEach(e => { totals[e.location] = (totals[e.location] || 0) + Number(e.hours); });
  const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const ctx = document.getElementById('chart-locations').getContext('2d');
  if (chartLocations) chartLocations.destroy();
  chartLocations = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top.map(t => t[0]),
      datasets: [{ label: 'Hours', data: top.map(t => t[1]), backgroundColor: '#c9a961' }]
    },
    options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } } }
  });
}

function renderLeaderboard() {
  const totals = {};
  const counts = {};
  csFilteredEntries.forEach(e => {
    totals[e.member_id] = (totals[e.member_id] || 0) + Number(e.hours);
    counts[e.member_id] = (counts[e.member_id] || 0) + 1;
  });
  const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const tbody = document.querySelector('#leaderboard-table tbody');
  tbody.innerHTML = top.length === 0
    ? '<tr><td colspan="4">No data for current filters.</td></tr>'
    : top.map(([id, hours], i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(csMemberMap[id] || 'Unknown')}</td>
          <td>${hours.toFixed(2)}</td>
          <td>${counts[id]}</td>
        </tr>`).join('');
}

// ---------- Table ----------

function renderTable() {
  const tbody = document.getElementById('admin-log-body');
  if (csFilteredEntries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10">No entries match the current filters.</td></tr>`;
    return;
  }
  tbody.innerHTML = csFilteredEntries.map(e => `
    <tr>
      <td>${formatDate(e.service_date)}</td>
      <td>${escapeHtml(csMemberMap[e.member_id] || 'Unknown')}</td>
      <td>${escapeHtml(e.event_name)}</td>
      <td><span class="pill ${e.service_type === 'Internal' ? 'pill-internal' : 'pill-external'}">${e.service_type}</span></td>
      <td><span class="pill ${e.is_partner_service ? 'pill-yes' : 'pill-no'}">${e.is_partner_service ? 'Yes' : 'No'}</span></td>
      <td><span class="pill ${e.is_recurring ? 'pill-yes' : 'pill-no'}">${e.is_recurring ? 'Yes' : 'No'}</span></td>
      <td>${escapeHtml(e.location)}</td>
      <td>${Number(e.hours).toFixed(2)}</td>
      <td>${escapeHtml(e.notes || '—')}</td>
      <td>
        <button class="btn-edit-small" data-edit="${e.id}">Edit</button>
        <button class="btn-danger-small" data-delete="${e.id}">Delete</button>
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openModal(b.dataset.edit)));
  tbody.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => deleteEntry(b.dataset.delete)));
}

// ---------- Add / Edit modal ----------

function populateLocationSelect(sel) {
  sel.innerHTML = '<option value="" disabled selected>Select a location…</option>' +
    CS_PRESET_LOCATIONS.map(loc => `<option value="${loc}">${loc}</option>`).join('');
}

function wireLocationToggle() {
  const sel = document.getElementById('am-location');
  const wrap = document.getElementById('am-location-other-wrap');
  sel.addEventListener('change', () => {
    wrap.style.display = sel.value === 'Other' ? 'block' : 'none';
    document.getElementById('am-location-other').required = sel.value === 'Other';
  });
}

function wireAddEntry() {
  document.getElementById('add-entry-btn').addEventListener('click', () => openModal(null));
  document.getElementById('admin-modal-cancel').addEventListener('click', closeModal);
  document.getElementById('admin-modal').addEventListener('click', (e) => { if (e.target.id === 'admin-modal') closeModal(); });

  document.getElementById('admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('admin-form-msg');
    msg.textContent = '';

    const id = document.getElementById('am-id').value;
    const type = document.querySelector('input[name="am-type"]:checked')?.value;
    const partner = document.querySelector('input[name="am-partner"]:checked')?.value;
    const recurring = document.querySelector('input[name="am-recurring"]:checked')?.value;
    const locSelect = document.getElementById('am-location').value;
    const location = locSelect === 'Other'
      ? document.getElementById('am-location-other').value.trim()
      : locSelect;
    const hours = parseFloat(document.getElementById('am-hours').value);
    const memberId = document.getElementById('am-member').value;

    if (!memberId) { msg.textContent = 'Please select a member.'; msg.style.color = '#b3261e'; return; }
    if (!location) { msg.textContent = 'Please provide a location.'; msg.style.color = '#b3261e'; return; }
    if (!hours || hours <= 0 || hours > 24) { msg.textContent = 'Hours must be between 0.25 and 24.'; msg.style.color = '#b3261e'; return; }

    const payload = {
      member_id: memberId,
      service_date: document.getElementById('am-date').value,
      event_name: document.getElementById('am-event').value.trim(),
      service_type: type,
      is_partner_service: partner === 'yes',
      is_recurring: recurring === 'yes',
      location,
      hours,
      notes: document.getElementById('am-notes').value.trim() || null
    };

    let error;
    if (id) {
      ({ error } = await dlaSupabase.from('community_service').update(payload).eq('id', id));
    } else {
      payload.created_by = csAdminUser.id;
      ({ error } = await dlaSupabase.from('community_service').insert(payload));
    }

    if (error) { msg.textContent = 'Error: ' + error.message; msg.style.color = '#b3261e'; return; }
    closeModal();
    await loadAllEntries();
  });
}

function openModal(id) {
  const form = document.getElementById('admin-form');
  form.reset();
  document.getElementById('am-location-other-wrap').style.display = 'none';
  document.getElementById('admin-form-msg').textContent = '';

  if (id) {
    const entry = csAllEntries.find(e => e.id === id);
    if (!entry) return;
    document.getElementById('admin-modal-title').textContent = 'Edit Service Entry';
    document.getElementById('am-id').value = entry.id;
    document.getElementById('am-member').value = entry.member_id;
    document.getElementById('am-date').value = entry.service_date;
    document.getElementById('am-event').value = entry.event_name;
    document.querySelector(`input[name="am-type"][value="${entry.service_type}"]`).checked = true;
    document.querySelector(`input[name="am-partner"][value="${entry.is_partner_service ? 'yes' : 'no'}"]`).checked = true;
    document.querySelector(`input[name="am-recurring"][value="${entry.is_recurring ? 'yes' : 'no'}"]`).checked = true;

    const isPreset = CS_PRESET_LOCATIONS.includes(entry.location);
    document.getElementById('am-location').value = isPreset ? entry.location : 'Other';
    document.getElementById('am-location-other-wrap').style.display = isPreset ? 'none' : 'block';
    document.getElementById('am-location-other').value = isPreset ? '' : entry.location;

    document.getElementById('am-hours').value = entry.hours;
    document.getElementById('am-notes').value = entry.notes || '';
  } else {
    document.getElementById('admin-modal-title').textContent = 'Add Service Entry';
    document.getElementById('am-id').value = '';
  }
  document.getElementById('admin-modal').classList.add('open');
}

function closeModal() { document.getElementById('admin-modal').classList.remove('open'); }

async function deleteEntry(id) {
  if (!confirm('Delete this service entry? This cannot be undone.')) return;
  const { error } = await dlaSupabase.from('community_service').delete().eq('id', id);
  if (error) { alert('Could not delete: ' + error.message); return; }
  await loadAllEntries();
}

// ---------- Settings ----------

function wireSettingsPanel() {
  document.getElementById('settings-toggle-btn').addEventListener('click', () => {
    const panel = document.getElementById('settings-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('settings-save-btn').addEventListener('click', async () => {
    const msg = document.getElementById('settings-msg');
    const month = parseInt(document.getElementById('settings-fy-month').value, 10);
    const goalRaw = document.getElementById('settings-goal').value;
    const goal = goalRaw === '' ? null : parseFloat(goalRaw);

    const { error } = await dlaSupabase
      .from('community_service_settings')
      .update({ fraternity_year_start_month: month, annual_goal_hours: goal })
      .eq('id', 1);

    if (error) { msg.textContent = 'Error saving: ' + error.message; msg.style.color = '#b3261e'; return; }
    msg.textContent = 'Settings saved.';
    msg.style.color = '#2e7d32';
    csFySettings = { fraternity_year_start_month: month, annual_goal_hours: goal };
    renderGlobalStats();
    applyFilters();
    const range = getFraternityYearRange(month);
    document.getElementById('a-stat-fy-label').textContent = `Hours This Fraternity Year (${range.label})`;
    const fyTag = document.getElementById('fyTag');
    if (fyTag) fyTag.textContent = `FY ${range.startYear}\u2013${range.startYear + 1}`;
  });
}

// ---------- Exports ----------

function wireExports() {
  document.getElementById('export-csv-btn').addEventListener('click', exportCsv);
  document.getElementById('export-pdf-btn').addEventListener('click', exportPdf);
}

function exportRows() {
  return csFilteredEntries.map(e => ([
    e.service_date,
    csMemberMap[e.member_id] || 'Unknown',
    e.event_name,
    e.service_type,
    e.is_partner_service ? 'Yes' : 'No',
    e.is_recurring ? 'Yes' : 'No',
    e.location,
    Number(e.hours).toFixed(2),
    e.notes || ''
  ]));
}

const EXPORT_HEADERS = ['Date', 'Member', 'Event', 'Type', 'Partner', 'Recurring', 'Location', 'Hours', 'Notes'];

function exportCsv() {
  const rows = [EXPORT_HEADERS, ...exportRows()];
  const csv = rows.map(r => r.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `dla-community-service-${todayStamp()}.csv`);
}

function csvEscape(val) {
  const s = String(val ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportPdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(14);
  doc.text('DLA Kappas — Community Service Report', 14, 14);
  doc.setFontSize(9);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, 14, 20);

  doc.autoTable({
    startY: 26,
    head: [EXPORT_HEADERS],
    body: exportRows(),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [92, 26, 43] }
  });

  doc.save(`dla-community-service-${todayStamp()}.pdf`);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

// ---------- Utilities ----------

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
