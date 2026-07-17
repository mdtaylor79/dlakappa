/* ============================================================
   Supabase project configuration
   Fill these in from: Supabase Dashboard > Project Settings > API
   The anon/public key is safe to expose in client-side code —
   Row Level Security policies (see supabase/schema.sql) control
   what it's allowed to read or write.
   ============================================================ */
const SUPABASE_URL = "https://eithccduveikejdhvnmq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MP2MyuJCu5MDmRs-ELngKA_SGdTN1M8";

/* Stripe Payment Links — create these in Stripe Dashboard > Payment Links
   (one for each dues tier), then paste the URLs here. */
const STRIPE_LINK_GENERAL = "https://buy.stripe.com/REPLACE_GENERAL_360";
const STRIPE_LINK_SENIOR = "https://buy.stripe.com/REPLACE_SENIOR_300";
