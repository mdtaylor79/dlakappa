# dlakappa.org — Denton-Lewisville Alumni Chapter site

Static HTML site (GitHub Pages) + Supabase (member database/auth).
No WordPress, no server to maintain, no payment processing.

## What's built

- `index.html`, `about.html`, `membership.html`, `events.html` — public site
- `portal/login.html`, `portal/signup.html`, `portal/dashboard.html` — member portal (Supabase Auth)
- `portal/admin.html` — admin panel: add/edit/delete events, see RSVP counts, view the member roster.
  Only visible to accounts with `is_admin = true`; a matching "Admin" link appears on the dashboard
  automatically for those accounts.
- `supabase/schema.sql` — database tables + security rules (fresh installs)
- `supabase/migration_remove_dues.sql` — run this once if your Supabase project was already set up
  before dues tracking was removed (see step 3 below)
- `assets/` — shared CSS/JS
- Membership tiers: **Subscribing Member** and **New Member** — no dues, no payment collection.

## 1. Put it on GitHub

```
cd dlakappa
git init
git add .
git commit -m "Initial site"
gh repo create dlakappa-site --public --source=. --push
```
(Or create the repo on github.com first, then `git remote add origin <url>` and `git push -u origin main`.)

In the repo: **Settings → Pages → Source → Deploy from branch → main / root**.

## 2. Point dlakappa.org at it

In **Settings → Pages → Custom domain**, enter `dlakappa.org` (the `CNAME` file in this repo already
has it, but GitHub also needs it set here). Then at your domain registrar, add these DNS records:

**A records** (all four, name `@`):
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**CNAME record** for `www` → `<your-github-username>.github.io`

DNS can take up to 24 hours to propagate. Once it resolves, check **Enforce HTTPS** in the Pages settings.

## 3. Set up Supabase (free tier)

**Brand new project:**
1. Create a project at supabase.com.
2. **SQL Editor → New query** → paste the contents of `supabase/schema.sql` → Run.
3. **Project Settings → API Keys** → copy the **Project URL** and the **Publishable key** (`sb_publishable_...`).
4. Paste both into `assets/js/config.js` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`), commit, and push.
5. Sign up for a portal account yourself at `/portal/signup.html`, then in Supabase's
   **Table Editor → members**, set your own row's `is_admin` to `true`. That makes you the first admin.

**Already had the project running before dues tracking was removed:**
- Run `supabase/migration_remove_dues.sql` in the SQL Editor instead of `schema.sql`. It updates any
  existing rows and drops the columns that are no longer used. Steps 3–5 above still apply.

**Auth redirect setting (needed either way):** in **Authentication → URL Configuration**, set
**Site URL** to your live domain (`https://dlakappa.org`, or the `https://<username>.github.io/dlakappa/`
address until DNS is live) and add it under **Redirect URLs** too — otherwise confirmation emails send
people to `localhost`.

## 4. Add events

Sign in at `/portal/login.html` with an admin account, then go to `/portal/admin.html` → **Events**
tab. Add, edit, or delete events there — they appear on the public events page immediately. RSVP
counts show next to each event.

## Granting additional admins

There's no UI for this on purpose (it's a sensitive permission). To make another officer an admin,
in Supabase **Table Editor → members**, find their row and set `is_admin` to `true`.

## Local preview

Just open `index.html` in a browser, or run `python3 -m http.server` from the folder and visit
`http://localhost:8000`.
