# DLA Website & Technology Continuity Plan
**Denton-Lewisville (TX) Alumni Chapter — Kappa Alpha Psi Fraternity, Inc.**  
**dlakappa.org** | Last Updated: July 2026  
*This document is confidential — internal chapter use only.*

---

## 1. Purpose & Scope

This document serves as the authoritative reference for all technology services powering dlakappa.org. It is maintained by the Webmaster and Technology Committee to ensure operational continuity during leadership transitions, vendor changes, or service disruptions.

**This plan covers:**
- All third-party platforms and services powering dlakappa.org
- Account ownership, access levels, and transition procedures
- Risk assessment and contingency actions for each service
- A webmaster transition checklist and renewal calendar

This document should be reviewed at the start of each chapter year, after any webmaster transition, and whenever a new service is added or removed.

---

## 2. Key Contacts

| Role | Name | Email | Access Level |
|---|---|---|---|
| Webmaster / Tech Chair | MD Taylor | webmaster@dlakappa.org | Full Admin — All Systems |
| Polemarch | [Current Polemarch] | info@dlakappa.org | Domain Backup / Billing |
| Vice Polemarch | Kirk Nobles | vicepolemarch@dlakappa.org | Portal Access |
| Marketing Chair | Colen Skinner | marketing@dlakappa.org | Brevo / Social Media |
| Keeper of Exchequer | Erick Mitchell | Budgeting_finance@dlakappa.org | Billing Oversight |

---

## 3. Service Inventory — Overview

| Service | Role | Cost | Risk Level | URL |
|---|---|---|---|---|
| GitHub | Source Code / Version Control | Free–$4/mo | HIGH | github.com |
| Wix | Domain Registrar (dlakappa.org) | ~$20/yr | **CRITICAL** | wix.com |
| Supabase | Database, Auth & File Storage | Free–$25/mo | HIGH | supabase.com |
| Formspree | Contact Form Handler | Free–$10/mo | MEDIUM | formspree.io |
| Brevo | Email Marketing / Newsletters | Free–$25/mo | MEDIUM | brevo.com |
| Tidio | Live Chat Widget | Free–$29/mo | LOW | tidio.com |
| JotForm | Custom Forms & Applications | Free–$34/mo | MEDIUM | jotform.com |

---

## 4. Service Details

---

### 4.1 GitHub
**Role:** Source Code / Version Control  
**URL:** github.com  
**Cost:** Free (Public Repo) / $4/mo Pro  
**Renewal:** Monthly or Annual  
**Risk Level:** HIGH

**Description:**  
Hosts the entire dlakappa.org website codebase. All HTML, CSS, JavaScript, and image files are stored here. Every change to the site should be committed to GitHub before going live. Also used for deploying the site via GitHub Pages if applicable.

**Who Has Access:**
- Webmaster / Tech Chair (Owner)
- Tech Committee members (Contributor access)

**Transition Actions:**
- Download full repository as a ZIP backup before leaving
- Add successor as repository Owner (not just Collaborator)
- Transfer repository ownership during transition meeting
- Revoke access of outgoing webmaster after transition is confirmed

**Notes:**  
If the site is hosted via GitHub Pages, DNS records in Wix must also be updated to point to the new deployment. Screenshot all DNS settings before any changes.

---

### 4.2 Wix (Domain Registrar)
**Role:** Domain Registrar — dlakappa.org  
**URL:** wix.com  
**Cost:** ~$15–20/year  
**Renewal:** Annual — **AUTO-RENEW MUST BE ENABLED**  
**Risk Level:** CRITICAL

**Description:**  
Owns and manages the dlakappa.org domain name. DNS records in Wix point the domain to the web host. **If this account lapses or is lost, the website, member portal, and all @dlakappa.org email addresses stop functioning immediately.**

**Who Has Access:**
- Chapter Webmaster (account owner)
- Polemarch or designee as billing backup

**Transition Actions:**
- Confirm auto-renew is enabled and chapter credit card is on file
- Export and document all DNS records (A, CNAME, MX, TXT records)
- Transfer domain to successor's Wix account OR to another registrar (Namecheap recommended)
- If transferring registrar, allow 7–14 days for DNS propagation

**DNS Records — dlakappa.org (Wix DNS Panel)**  
*Screenshot or re-verify these records any time a service is added or changed.*

**A Records (Host) — Points domain to GitHub Pages hosting**

| Host Name | Value | TTL |
|---|---|---|
| dlakappa.org | 185.199.111.153 | 1 Hour |
| dlakappa.org | 185.199.110.153 | 1 Hour |
| dlakappa.org | 185.199.109.153 | 1 Hour |
| dlakappa.org | 185.199.108.153 | 1 Hour |

**CNAME Records (Aliases)**

| Host Name | Value | TTL | Purpose |
|---|---|---|---|
| www.dlakappa.org | mdtaylor79.github.io | 1 Hour | www → GitHub Pages |
| _dmarc.dlakappa.org | _dmarc.wixemails.com | 1 Hour | DMARC email policy |
| s1._domainkey.dlakappa.org | s1._domainkey.dlakappa.org.s007.ascendbywix.com | 1 Hour | Wix DKIM signing key 1 |
| s2._domainkey.dlakappa.org | s2._domainkey.dlakappa.org.s007.ascendbywix.com | 1 Hour | Wix DKIM signing key 2 |
| sel1._domainkey.dlakappa.org | sel1._domainkey.dlakappa.org.s004.ascendbywix.com | 1 Hour | Wix DKIM signing key 3 |
| sel2._domainkey.dlakappa.org | sel2._domainkey.dlakappa.org.s004.ascendbywix.com | 1 Hour | Wix DKIM signing key 4 |
| sg.dlakappa.org | sg.dlakappa.org.s007.ascendbywix.com | 1 Hour | Wix SendGrid email relay |
| en.dlakappa.org | cdn1.wixdns.net | 1 Hour | Wix legacy subdomain |
| es.dlakappa.org | cdn1.wixdns.net | 1 Hour | Wix legacy subdomain |
| kappaleague.dlakappa.org | cdn1.wixdns.net | 1 Hour | Kappa League subdomain |
| www.kappaleague.dlakappa.org | cdn1.wixdns.net | 1 Hour | Kappa League www |
| mg-tidio._domainkey.dlakappa.org | *(see TXT records)* | 600 | Tidio email DKIM |

**TXT Records**

| Host Name | Value | TTL | Purpose |
|---|---|---|---|
| dlakappa.org | google-site-verification=X-bLPemXrfKD5fVXkwb9afD6oXwatna9OY2UJZ5G0FI | 600 | Google Search Console verification |
| dlakappa.org | v=spf1 include:_spf.google.com include:mailgun.org ~all | 600 | SPF — authorizes Google & Mailgun to send email |
| mg-tidio._domainkey.dlakappa.org | k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCSaGer… | 600 | Tidio transactional email DKIM key |

**MX Records (Mail Exchange) — Google Workspace**

| Host Name | Points To | Priority | TTL |
|---|---|---|---|
| dlakappa.org | aspmx.l.google.com | 10 | 1 Hour |
| dlakappa.org | alt1.aspmx.l.google.com | 20 | 1 Hour |
| dlakappa.org | alt2.aspmx.l.google.com | 30 | 1 Hour |
| dlakappa.org | alt3.aspmx.l.google.com | 40 | 1 Hour |
| dlakappa.org | alt4.aspmx.l.google.com | 50 | 1 Hour |

**NS Records (Name Servers) — Not editable**

| Host Name | Value | TTL |
|---|---|---|
| dlakappa.org | ns12.wixdns.net | 1 Day |
| dlakappa.org | ns13.wixdns.net | 1 Day |

> ⚠️ **Important:** All @dlakappa.org email runs through **Google Workspace** (MX records). The SPF record also authorizes **Mailgun** — verify this is still in use. The A records point to **GitHub Pages** (185.199.x.x). If hosting moves, these four A records must be updated immediately.

---

### 4.3 Supabase
**Role:** Database, Authentication & File Storage  
**URL:** supabase.com  
**Project URL:** eithccduveikejdhvnmq.supabase.co  
**Cost:** Free tier / $25/mo Pro  
**Renewal:** Monthly  
**Risk Level:** HIGH

**Description:**  
Powers the Member Portal, blog post database, and blog image storage. All blog articles, member accounts, and uploaded images are stored here. Handles secure login for the /portal/ section of the site.

**Key Technical Details:**
- **Database table:** `posts` (stores all blog articles)
- **Storage bucket:** `blog-images` (stores uploaded cover images)
- **ANON Key:** stored in all public-facing pages (safe to be public)
- **Service Role Key:** admin-level key — store securely, never commit to GitHub
- **RLS (Row Level Security):** enabled — new DB columns require policy updates
- **Admin emails:** webmaster@dlakappa.org, marcus.d.taylor.kapsi@gmail.com

**Who Has Access:**
- Webmaster (project owner)
- Tech Committee (read-only access recommended)

**Transition Actions:**
- Export all blog posts as CSV from Supabase Table Editor (monthly)
- Store ANON key and service_role key in chapter password manager
- Add successor as project owner before transition
- Remove outgoing webmaster from project members after transition
- Update ADMINS array in `/portal/blog-admin.html` with new webmaster email

**Notes:**  
Free tier includes 500MB database storage and 1GB file storage. Monitor usage in the Supabase dashboard. If the project is inactive for 7+ days on the free tier, it may be paused — upgrade to Pro if site traffic is consistent.

---

### 4.4 Formspree
**Role:** Contact Form Submission Handler  
**URL:** formspree.io  
**Form Endpoint:** formspree.io/f/mdaqlbjz  
**Cost:** Free (50 submissions/mo) / $10/mo Starter  
**Renewal:** Monthly  
**Risk Level:** MEDIUM

**Description:**  
Receives contact form submissions from dlakappa.org/contact and forwards them to info@dlakappa.org. The form endpoint is hardcoded into the contact page JavaScript.

**Who Has Access:**
- Webmaster (account owner)
- Secretary / Tech Chair (email notification recipients)

**Transition Actions:**
- Update notification email to the active chapter email address
- Upgrade plan if monthly submission volume exceeds 50
- Alternative: migrate contact form to store submissions in Supabase for full data ownership

**Fallback:**  
If Formspree goes down, temporarily update the form submit button to a `mailto:info@dlakappa.org` link until service is restored.

---

### 4.5 Brevo (formerly Sendinblue)
**Role:** Email Marketing & Newsletter Platform  
**URL:** brevo.com  
**Cost:** Free (300 emails/day) / Paid tiers available  
**Renewal:** Monthly  
**Risk Level:** MEDIUM

**Description:**  
Used to send chapter newsletters, announcements, and email campaigns to members and community subscribers. Manages email contact lists, templates, and campaign scheduling.

**Who Has Access:**
- Webmaster
- Marketing & Advertising Chair (Colen Skinner)
- Social Media Chair (Trezsley Tucker)

**Transition Actions:**
- Export full contact list as CSV backup quarterly
- Document all active email lists, segments, and automation flows
- Add new webmaster/marketing chair as co-owner before transition
- Verify DKIM/SPF records in Wix DNS are present (required for email deliverability)

**Notes:**  
DKIM and SPF DNS records must be configured in Wix for chapter emails to pass spam filters. Verify these records exist: look for a TXT record containing `brevo` or `sendinblue` in the Wix DNS panel.

---

### 4.6 Tidio
**Role:** Live Chat Widget  
**URL:** tidio.com  
**Widget ID:** roka7o1avkjubn9zot6ve3xaq4mdbldr  
**Cost:** Free / $29/mo Starter  
**Renewal:** Monthly  
**Risk Level:** LOW

**Description:**  
Provides the live chat bubble visible in the bottom-right corner of every page on dlakappa.org. Allows visitors to send the chapter a message in real time. The widget is loaded via a script tag in `/js/nav.js`.

**Who Has Access:**
- Webmaster (account owner)
- Assigned Tidio operators (respond to chats)

**Transition Actions:**
- Assign the chapter email (info@dlakappa.org) as the primary operator
- Set up automatic/chatbot replies for after-hours messages
- Download chat history archive before any account transition
- If account lapses: remove the Tidio script from nav.js to prevent broken widget

**Notes:**  
The Tidio script is loaded from `nav.js` on every page. Changing or removing the Widget ID in that file disables the chat widget sitewide immediately.

---

### 4.7 JotForm
**Role:** Custom Forms — Event Registrations, Applications  
**URL:** jotform.com  
**Cost:** Free (5 forms, 100 submissions/mo) / $34/mo Bronze  
**Renewal:** Monthly / Annual  
**Risk Level:** MEDIUM

**Description:**  
Used for event registrations, membership applications, and any form requiring advanced features such as file uploads, conditional logic, payment collection, or e-signatures — beyond what the standard contact form supports.

**Who Has Access:**
- Webmaster (account owner)
- Committee chairs for their respective forms

**Transition Actions:**
- Maintain an inventory of all active forms, their URLs, and which pages embed them
- Export all form submissions quarterly (Excel/CSV)
- Transfer form ownership to the chapter email account (not a personal email)
- After transfer, update any embed codes in site pages if form IDs change

**Active Forms Inventory:**

| Form Name | Form ID / URL | Used On | Owner |
|---|---|---|---|
| [Form Name] | [URL] | [Page] | [Chair] |
| [Form Name] | [URL] | [Page] | [Chair] |

---

## 5. Risk Assessment

| Risk Scenario | Level | Impact | Mitigation |
|---|---|---|---|
| Domain expires (Wix) | CRITICAL | Website + all email goes offline | Enable auto-renew; keep chapter card on file; calendar alert 60 days before expiry |
| Supabase project deleted/suspended | HIGH | Member portal + blog offline | Monthly DB export; credentials in password manager; upgrade to Pro if needed |
| GitHub repo deleted | HIGH | No source code backup | Enable branch protection; download ZIP backup monthly; add co-owner |
| Webmaster leaves without transition | HIGH | No one has access to any service | Maintain this document; use chapter emails for all accounts; mandatory transition meeting |
| Formspree submission limit exceeded | MEDIUM | Contact form submissions lost silently | Monitor monthly; upgrade plan or migrate to Supabase submissions |
| Brevo account suspended | MEDIUM | Newsletter/email campaigns stop | Export list; have backup plain-email process ready |
| JotForm account suspended | MEDIUM | Event registration forms go down | Export submissions; replace with Supabase form or Google Forms temporarily |
| Tidio account lapsed | LOW | Chat widget disappears from site | Remove script from nav.js; add mailto chat link as fallback |

---

## 6. Webmaster Transition Checklist

Complete ALL steps when transitioning the Webmaster role. Completion target: 30 days before outgoing Webmaster's last day.

- [ ] 1. Schedule a formal transition meeting with incoming and outgoing Webmaster
- [ ] 2. Transfer GitHub repository ownership to successor
- [ ] 3. Transfer Supabase project ownership; remove outgoing Webmaster
- [ ] 4. Update Formspree account login email to chapter email
- [ ] 5. Transfer Wix domain account billing and ownership
- [ ] 6. Add successor as Brevo co-owner; transfer account
- [ ] 7. Transfer Tidio account; reassign chat operators
- [ ] 8. Transfer JotForm account ownership
- [ ] 9. Export and hand off: blog post CSV, Brevo contact list CSV, JotForm submissions
- [ ] 10. Provide all credentials via chapter password manager — NOT via email or text
- [ ] 11. Update `ADMINS` array in `/portal/blog-admin.html` with new webmaster email
- [ ] 12. Update info@dlakappa.org email forwarding to new responsible party
- [ ] 13. Walk through all site admin functions: blog admin, member portal, Supabase dashboard
- [ ] 14. Update Section 2 (Key Contacts) in this document with new Webmaster info
- [ ] 15. Verify site is fully operational post-transition (forms, blog, portal, chat)
- [ ] 16. Outgoing Webmaster revokes personal access from all services

---

## 7. Annual Renewal Calendar

Set calendar reminders **60 days before each expiry date.**

| Service | Renewal Cycle | Approx. Cost | Payment | Next Renewal Date |
|---|---|---|---|---|
| Wix (dlakappa.org domain) | Annual | ~$20/yr | Chapter card | ________________ |
| Supabase | Monthly | $0–$25/mo | Chapter card | Monthly auto |
| Formspree | Monthly | $0–$10/mo | Chapter card | Monthly auto |
| Brevo | Monthly | $0–$25/mo | Chapter card | Monthly auto |
| Tidio | Monthly | $0–$29/mo | Chapter card | Monthly auto |
| JotForm | Monthly / Annual | $0–$34/mo | Chapter card | ________________ |
| GitHub | Monthly / Annual | $0–$4/mo | Webmaster or chapter | Monthly auto |

**Total estimated monthly cost (paid tiers):** ~$90–$130/mo  
**Total estimated annual cost (minimum/free tiers):** ~$20/yr (domain only)

---

## 8. Password & Credentials Management

All account credentials must be stored in the chapter's designated password manager. **Never share credentials via email, text, or chat.**

**Guidelines:**
- Use a shared password manager (1Password Teams or Bitwarden Business) with a dedicated "DLA Tech" vault
- All service accounts should use `info@dlakappa.org` or `webmaster@dlakappa.org` — NOT a personal email
- Enable two-factor authentication (2FA) on all accounts; store backup codes in the password manager
- The Polemarch or VP should have emergency read access to the tech credentials vault
- Rotate all passwords immediately after any webmaster transition

---

## 9. Backup Procedures

| Data / Asset | Frequency | Method | Storage Location |
|---|---|---|---|
| Website source code (GitHub) | Monthly | Download ZIP from GitHub | Chapter Google Drive / OneDrive |
| Blog posts (Supabase DB) | Monthly | Export CSV from Supabase Table Editor | Chapter Google Drive |
| Blog images (Supabase Storage) | Quarterly | Download from Supabase Storage bucket | Chapter Google Drive |
| Member email list (Brevo) | Quarterly | Export contacts CSV from Brevo | Chapter Google Drive |
| JotForm submissions | Quarterly | Export Excel/CSV from JotForm | Chapter Google Drive |
| This continuity document | After any change | Update and redistribute to Tech Committee | Google Drive + printed copy in chapter binder |

---

## 10. Tech Stack Architecture Summary

```
dlakappa.org (domain via Wix)
    │
    ├── Static Website Files → GitHub (source) → Hosting
    │
    ├── /blog/ → Supabase (posts table, blog-images bucket)
    │
    ├── /portal/ → Supabase (auth, member data)
    │
    ├── /contact → Formspree (form submissions → info@dlakappa.org)
    │
    ├── Live Chat → Tidio (widget in nav.js)
    │
    ├── Email Campaigns → Brevo
    │
    └── Event/Special Forms → JotForm (embedded in pages)
```

---

*Denton-Lewisville (TX) Alumni Chapter of Kappa Alpha Psi Fraternity, Inc.*  
*dlakappa.org | webmaster@dlakappa.org*  
*This document is confidential — for internal chapter and Tech Committee use only.*
