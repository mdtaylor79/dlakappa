(function () {
  const NAV_HTML = `
<nav class="site-nav">
  <div class="nav-inner">
    <a class="nav-logo" href="/">
      <img src="/img/kappa-crest.png" alt="Kappa Alpha Psi crest" class="nav-logo-crest">
      <span class="nav-logo-text">
        <span class="nav-logo-chapter">Denton-Lewisville (TX) Alumni Chapter</span>
        <span class="nav-logo-frat">Kappa Alpha Psi Fraternity, Inc.</span>
      </span>
    </a>
    <button class="nav-toggle" id="hamburger"><span></span><span></span><span></span></button>
    <ul id="main-menu">
      <li><a href="/" data-page="home">Home</a></li>
      <li class="has-drop">
        <a href="/about/overview.html" data-page="about">About</a>
        <div class="drop">
          <a href="/about/overview.html">Overview</a>
          <a href="/about/our_founders.html">Our Founders</a>
          <a href="/about/fraternity.history.html">Fraternity History</a>
          <a href="/about/province.history.html">Province History</a>
          <a href="/about/chapter_history.html">Chapter History</a>
          <a href="/about/chapter_leadership.html">Leadership</a>
          <a href="/about/chapter_committees.html">Committees</a>
        </div>
      </li>
      <li><a href="/membership.html" data-page="membership">Membership</a></li>
      <li class="has-drop">
        <a href="/programs.html" data-page="programs">Programs</a>
        <div class="drop">
          <a href="/programs.html">All Programs</a>
          <a href="/volunteering.html">Volunteering &amp; Service</a>
          <a href="/dla_guide_right.html">Guide Right</a>
        </div>
      </li>
      <li class="has-drop">
        <a href="/events.html" data-page="events">Events</a>
        <div class="drop">
          <a href="/events.html">Events &amp; Calendar</a>
          <a href="/events/our_community.html">Our Community</a>
          <a href="/blog/">DLA News</a>
        </div>
      </li>
      <li><a href="/contact.html" data-page="contact">Contact</a></li>
      <li class="nav-members">
        <a href="/portal/login.html">Members Area</a>
      </li>
      <li class="nav-search-btn-wrap">
        <button id="nav-search-btn" aria-label="Search" title="Search">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      </li>
    </ul>
  </div>
</nav>

<!-- Search overlay (injected below nav) -->
<div id="nav-search-overlay" role="search" aria-hidden="true">
  <div id="nav-search-inner">
    <div id="nav-search-field-wrap">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c69a3f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input type="search" id="nav-search-input" placeholder="Search news, articles, programs…" autocomplete="off" spellcheck="false">
      <button id="nav-search-close" aria-label="Close search">&times;</button>
    </div>
    <div id="nav-search-results"></div>
  </div>
</div>`;

  const SEARCH_STYLES = `
<style id="nav-search-styles">
/* Search button */
.nav-search-btn-wrap { display:flex; align-items:center; padding-left:.25rem; }
#nav-search-btn {
  background:none; border:none; cursor:pointer;
  color:#f2ebd7; padding:.38rem .55rem;
  display:flex; align-items:center;
  transition:color .2s;
}
#nav-search-btn:hover { color:#c69a3f; }

/* Search overlay */
#nav-search-overlay {
  position:fixed; top:58px; left:0; right:0; z-index:9998;
  background:#1a0402;
  border-bottom:2px solid rgba(198,154,63,.3);
  box-shadow:0 8px 32px rgba(0,0,0,.5);
  transform:translateY(-8px); opacity:0;
  pointer-events:none;
  transition:opacity .2s ease, transform .2s ease;
}
#nav-search-overlay.open {
  opacity:1; transform:translateY(0); pointer-events:all;
}
#nav-search-inner {
  max-width:680px; margin:0 auto; padding:1.25rem 1.5rem 1rem;
}
#nav-search-field-wrap {
  display:flex; align-items:center; gap:.75rem;
  border:1.5px solid rgba(198,154,63,.4); border-radius:4px;
  padding:.65rem 1rem; background:rgba(255,255,255,.04);
  transition:border-color .2s;
}
#nav-search-field-wrap:focus-within { border-color:#c69a3f; }
#nav-search-input {
  flex:1; background:none; border:none; outline:none;
  font-family:'Archivo',sans-serif; font-size:.95rem;
  color:#f2ebd7; caret-color:#c69a3f;
}
#nav-search-input::placeholder { color:rgba(242,235,215,.4); }
#nav-search-close {
  background:none; border:none; color:rgba(242,235,215,.5);
  font-size:1.4rem; cursor:pointer; line-height:1;
  padding:0 .2rem; transition:color .2s;
}
#nav-search-close:hover { color:#f2ebd7; }

/* Results */
#nav-search-results { margin-top:.75rem; }
.nsr-item {
  display:flex; align-items:flex-start; gap:.85rem;
  padding:.75rem 0; border-bottom:1px solid rgba(242,235,215,.08);
  text-decoration:none; color:inherit;
  transition:background .15s;
  border-radius:3px;
}
.nsr-item:last-child { border-bottom:none; }
.nsr-item:hover .nsr-title { color:#c69a3f; }
.nsr-cat {
  font-family:'Cinzel',serif; font-size:.55rem; font-weight:700;
  letter-spacing:.14em; text-transform:uppercase;
  color:#c69a3f; margin-bottom:.2rem;
}
.nsr-title {
  font-family:'Cinzel',serif; font-size:.85rem; font-weight:600;
  color:#f2ebd7; line-height:1.3; transition:color .2s;
}
.nsr-excerpt {
  font-family:'Archivo',sans-serif; font-size:.75rem;
  color:rgba(242,235,215,.55); margin-top:.25rem;
  line-height:1.5;
  display:-webkit-box; -webkit-line-clamp:2;
  -webkit-box-orient:vertical; overflow:hidden;
}
.nsr-date {
  font-size:.68rem; color:rgba(198,154,63,.7);
  margin-top:.3rem;
}
.nsr-status {
  font-family:'Archivo',sans-serif; font-size:.82rem;
  color:rgba(242,235,215,.5); text-align:center;
  padding:.75rem 0 .25rem;
}
.nsr-viewall {
  display:block; text-align:center;
  font-family:'Cinzel',serif; font-size:.62rem; font-weight:700;
  letter-spacing:.14em; text-transform:uppercase;
  color:#c69a3f; padding:.75rem 0 .25rem;
  text-decoration:none; border-top:1px solid rgba(198,154,63,.2);
  margin-top:.5rem; transition:color .2s;
}
.nsr-viewall:hover { color:#f2ebd7; }

@media(max-width:900px){
  .nav-search-btn-wrap { display:flex !important; }
}
</style>`;

  const FOOTER_HTML = `
<footer>
  <div class="wrap">
    <div class="cols">
      <div class="links-col">
        <h4>Links</h4>
        <ul>
          <li><a href="https://www.kappaalphapsi1911.com/" target="_blank" rel="noopener">Kappa Alpha Psi International Headquarters</a></li>
          <li><a href="https://southwesternprovince1911.org/" target="_blank" rel="noopener">Southwestern Province</a></li>
        </ul>
        <h5>Local Chapters</h5>
        <ul>
          <li><a href="https://www.agpkappas.com/" target="_blank" rel="noopener">Arlington - Grand Prairie (TX) Alumni Chapter</a></li>
          <li><a href="https://cganupes.com/" target="_blank" rel="noopener">Commerce - Greenville (TX) Alumni Chapter</a></li>
          <li><a href="https://www.dallasalumni.org/" target="_blank" rel="noopener">Dallas (TX) Alumni Chapter</a></li>
          <li><a href="https://www.friscokappas.com/" target="_blank" rel="noopener">Frisco (TX) Alumni Chapter</a></li>
          <li><a href="https://www.fortworthkappas.com/" target="_blank" rel="noopener">Fort Worth (TX) Alumni Chapter</a></li>
          <li><a href="https://themacnupes.com/" target="_blank" rel="noopener">Mansfield - Cedar Hill (TX) Alumni Chapter</a></li>
          <li><a href="https://www.rpakappas.com/" target="_blank" rel="noopener">Richardson - Plano (TX) Alumni Chapter</a></li>
        </ul>
        <h5>Undergraduate Chapters</h5>
        <ul>
          <li><a href="https://www.instagram.com/kx_nupes/" target="_blank" rel="noopener">Alpha Chi Chapter</a></li>
          <li><a href="https://www.instagram.com/betabeta_nupes/" target="_blank" rel="noopener">Beta Beta Chapter</a></li>
          <li><a href="https://www.instagram.com/etaphi_nupes/" target="_blank" rel="noopener">Eta Phi Chapter</a></li>
          <li><a href="https://www.facebook.com/ianupes1977/" target="_blank" rel="noopener">Iota Alpha Chapter</a></li>
          <li><a href="http://www.kenupes.com/" target="_blank" rel="noopener">Kappa Epsilon Chapter</a></li>
          <li><a href="https://www.lambdalambdanupes.com/" target="_blank" rel="noopener">Lambda Lambda Chapter</a></li>
          <li>Nu Beta Chapter</li>
          <li><a href="https://untnupes.com/" target="_blank" rel="noopener">Zeta Upsilon Chapter</a></li>
        </ul>
      </div>
      <div class="brand-col">
        <img class="crest" src="/img/kappa-crest.png" alt="Denton-Lewisville (TX) Alumni Chapter crest">
        <div class="name">Denton-Lewisville Alumni Chapter</div>
        <div class="frat">Kappa Alpha Psi Fraternity, Inc.</div>
        <div class="addr">1501 S. Loop 288, Suite 104, PMB 190<br>Denton, TX 76205</div>
        <div class="social">
          <a href="https://www.facebook.com/dlanupes/" target="_blank" rel="noopener" aria-label="Facebook"><img src="/img/facebook_icon.png" alt="Facebook" style="width:28px;height:28px;object-fit:contain;display:block;"></a>
          <a href="https://www.instagram.com/dlanupes/" target="_blank" rel="noopener" aria-label="Instagram"><img src="/img/Instagram_icon.png" alt="Instagram" style="width:28px;height:28px;object-fit:contain;display:block;"></a>
          <a href="https://www.youtube.com/@DLAKappas" target="_blank" rel="noopener" aria-label="YouTube"><img src="/img/youtube_icon.png" alt="YouTube" style="width:28px;height:28px;object-fit:contain;display:block;"></a>
          <a href="https://x.com/DNupes" target="_blank" rel="noopener" aria-label="X (Twitter)"><img src="/img/x_icon.svg" alt="X" style="width:28px;height:28px;object-fit:contain;display:block;"></a>
        </div>
      </div>
      <div class="contact">
        <h4>Contact Us</h4>
        <div class="line"><b>Mailing Address</b>1501 S. Loop 288, Suite 104, PMB 190<br>Denton, TX 76205</div>
        <div class="line"><b>Email</b><a href="mailto:info@dlakappa.org">info@dlakappa.org</a></div>
        <div class="line"><b>Membership Access</b>This area is for Chapter members only.</div>
        <a class="portal-btn" href="/portal/login.html">Membership Access</a>
      </div>
    </div>
  </div>
  <div class="legal">
    <span>&copy; 2026 Denton-Lewisville (TX) Alumni Chapter of Kappa Alpha Psi Fraternity, Inc.</span>
    <span>All rights reserved.</span>
  </div>
</footer>`;

  // ── Inject styles ────────────────────────────────────────────────────────────
  document.head.insertAdjacentHTML('beforeend', SEARCH_STYLES);

  // ── Inject nav ───────────────────────────────────────────────────────────────
  const navHolder = document.getElementById('site-nav-placeholder');
  if (navHolder) navHolder.outerHTML = NAV_HTML;

  // ── Inject footer ────────────────────────────────────────────────────────────
  const footerHolder = document.getElementById('site-footer-placeholder');
  if (footerHolder) footerHolder.outerHTML = FOOTER_HTML;

  // ── Supabase constants ───────────────────────────────────────────────────────
  const SB_URL  = 'https://eithccduveikejdhvnmq.supabase.co';
  const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpdGhjY2R1dmVpa2VqZGh2bm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyODU4MDYsImV4cCI6MjA5OTg2MTgwNn0.fuqE-f5TjxvN1xuxfJqstnlvVF22VdKkwRLdsGMQcoQ';

  const CAT_LABELS = {
    'news': 'News', 'chapter-news': 'Chapter News',
    'event-recap': 'Event Recap', 'member-spotlight': 'Member Spotlight',
    'guide-right': 'Guide Right', 'chapter-series': 'Chapter Series',
    'organizational-development': 'Org. Development'
  };

  function fmtDate(s) {
    if (!s) return '';
    return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  async function searchPosts(q) {
    const encoded = encodeURIComponent(`%${q}%`);
    const url = `${SB_URL}/rest/v1/posts?select=title,slug,excerpt,category,published_at` +
      `&published=eq.true&is_members_only=eq.false` +
      `&or=(title.ilike.${encoded},excerpt.ilike.${encoded})` +
      `&order=published_at.desc&limit=6`;
    const res = await fetch(url, {
      headers: { 'apikey': SB_ANON, 'Authorization': `Bearer ${SB_ANON}` }
    });
    if (!res.ok) return [];
    return res.json();
  }

  // ── Wire up search ───────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    const path = window.location.pathname;

    // Active nav links
    document.querySelectorAll('.site-nav a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (href && href !== '/' && path.includes(href.replace(/^\//, ''))) {
        a.classList.add('nav-active');
      } else if (href === '/' && path === '/') {
        a.classList.add('nav-active');
      }
    });

    // Hamburger
    const burger = document.getElementById('hamburger');
    const menu   = document.getElementById('main-menu');
    if (burger && menu) {
      burger.addEventListener('click', () => menu.classList.toggle('open'));
    }

    // Mobile dropdowns
    document.querySelectorAll('.site-nav .has-drop > a').forEach(a => {
      a.addEventListener('click', function (e) {
        if (window.innerWidth <= 900) {
          e.preventDefault();
          this.parentElement.classList.toggle('mob-open');
        }
      });
    });

    // ── Search logic ─────────────────────────────────────────────────────────
    const overlay   = document.getElementById('nav-search-overlay');
    const input     = document.getElementById('nav-search-input');
    const results   = document.getElementById('nav-search-results');
    const openBtn   = document.getElementById('nav-search-btn');
    const closeBtn  = document.getElementById('nav-search-close');

    function openSearch() {
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      setTimeout(() => input.focus(), 60);
    }

    function closeSearch() {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      input.value = '';
      results.innerHTML = '';
    }

    openBtn  && openBtn.addEventListener('click',  openSearch);
    closeBtn && closeBtn.addEventListener('click',  closeSearch);

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeSearch();
    });

    // Close on click outside overlay
    document.addEventListener('click', e => {
      if (overlay.classList.contains('open') &&
          !overlay.contains(e.target) &&
          e.target !== openBtn && !openBtn.contains(e.target)) {
        closeSearch();
      }
    });

    // Debounced search
    let debounceTimer;
    input && input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      const q = this.value.trim();

      if (q.length < 2) { results.innerHTML = ''; return; }

      results.innerHTML = '<div class="nsr-status">Searching…</div>';

      debounceTimer = setTimeout(async () => {
        try {
          const posts = await searchPosts(q);
          if (!posts.length) {
            results.innerHTML = '<div class="nsr-status">No results found.</div>';
            return;
          }
          results.innerHTML = posts.map(p => `
            <a class="nsr-item" href="/blog/post.html?slug=${p.slug}">
              <div style="flex:1;min-width:0;">
                <div class="nsr-cat">${CAT_LABELS[p.category] || p.category || 'News'}</div>
                <div class="nsr-title">${p.title}</div>
                ${p.excerpt ? `<div class="nsr-excerpt">${p.excerpt}</div>` : ''}
                <div class="nsr-date">${fmtDate(p.published_at)}</div>
              </div>
            </a>`).join('') +
            `<a class="nsr-viewall" href="/blog/?q=${encodeURIComponent(q)}">View all results for "${q}" &rarr;</a>`;
        } catch {
          results.innerHTML = '<div class="nsr-status">Search unavailable.</div>';
        }
      }, 320);
    });

    // Submit on Enter → blog page with query
    input && input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const q = input.value.trim();
        if (q) window.location.href = `/blog/?q=${encodeURIComponent(q)}`;
      }
    });
  });

  // ── Tidio (disabled) ─────────────────────────────────────────────────────────
  // const tidio = document.createElement('script');
  // tidio.src = '//code.tidio.co/roka7o1avkjubn9zot6ve3xaq4mdbldr.js';
  // tidio.async = true;
  // document.body.appendChild(tidio);
})();
