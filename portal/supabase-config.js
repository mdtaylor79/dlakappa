// ── DLA PORTAL — SUPABASE CONFIG ─────────────────────────────────
// Replace BOTH values with your project's credentials.
// Supabase Dashboard → Project Settings → API
// ─────────────────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://eithccduveikejdhvnmq.supabase.co';
const SUPABASE_ANON = 'sb_publishable_MP2MyuJCu5MDmRs-ELngKA_SGdTN1M8';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
