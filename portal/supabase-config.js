// ── DLA PORTAL — SUPABASE CONFIG ─────────────────────────────────
// Replace BOTH values with your project's credentials.
// Supabase Dashboard → Project Settings → API
// ─────────────────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://eithccduveikejdhvnmq.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpdGhjY2R1dmVpa2VqZGh2bm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyODU4MDYsImV4cCI6MjA5OTg2MTgwNn0.fuqE-f5TjxvN1xuxfJqstnlvVF22VdKkwRLdsGMQcoQ';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
