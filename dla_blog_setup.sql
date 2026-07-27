-- ============================================================
-- DLA Blog — Supabase Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title           text NOT NULL,
  slug            text NOT NULL UNIQUE,
  excerpt         text,
  content         text,
  cover_image     text,
  category        text CHECK (category IN ('news','event-recap','member-spotlight','guide-right')),
  author          text DEFAULT 'DLA Chapter',
  is_members_only boolean DEFAULT false,
  published       boolean DEFAULT false,
  published_at    timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 3. Public can read published, non-members-only posts
CREATE POLICY "Public can read public posts"
  ON public.posts FOR SELECT
  USING (published = true AND is_members_only = false);

-- 4. Authenticated members can read all published posts (including members-only)
CREATE POLICY "Members can read all published posts"
  ON public.posts FOR SELECT
  TO authenticated
  USING (published = true);

-- 5. Only authenticated users can insert/update/delete (admin via portal)
CREATE POLICY "Authenticated users can manage posts"
  ON public.posts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Auto-set published_at when post is published
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.published = true AND OLD.published = false THEN
    NEW.published_at = now();
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_published_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION set_published_at();

-- ============================================================
-- Optional: seed one sample post to test with
-- ============================================================
INSERT INTO public.posts (title, slug, excerpt, content, category, author, is_members_only, published, published_at)
VALUES (
  'Welcome to the DLA Member Portal',
  'welcome-to-the-dla-member-portal',
  'The Denton-Lewisville Alumni Chapter is excited to launch our new member portal and chapter blog.',
  '<p>Brothers,</p><p>We are excited to announce the launch of the DLA Member Portal — your central hub for chapter news, training, events, and resources.</p><p>Stay tuned for updates on upcoming events, Kappa League activities, and chapter announcements right here on this blog.</p><p>Yours in the Bond,<br><strong>DLA Chapter Administration</strong></p>',
  'news',
  'DLA Chapter Administration',
  false,
  true,
  now()
);
