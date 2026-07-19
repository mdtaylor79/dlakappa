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
      <li><a href="/programs.html" data-page="programs">Programs</a></li>
      <li><a href="/dla_guide_right.html" data-page="guideright">DLA Guide Right</a></li>
      <li class="has-drop">
        <a href="/events.html" data-page="events">Events</a>
        <div class="drop">
          <a href="/events.html">Events &amp; Calendar</a>
          <a href="/events/our_community.html">Our Community</a>
        </div>
      </li>
      <li><a href="/contact.html" data-page="contact">Contact</a></li>
      <li class="nav-members">
        <a href="/portal/login.html">Members Area</a>
      </li>
    </ul>
  </div>
</nav>`;

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
      </div>
      <div class="brand-col">
        <img class="crest" src="/img/kappa-crest.png" alt="Denton-Lewisville (TX) Alumni Chapter crest">
        <div class="name">Denton-Lewisville Alumni Chapter</div>
        <div class="frat">Kappa Alpha Psi Fraternity, Inc.</div>
        <div class="addr">1501 S. Loop 288, Suite 104, PMB 190<br>Denton, TX 76205</div>
        <div class="social">
          <a href="#" aria-label="Facebook">FB</a>
          <a href="#" aria-label="Instagram">IG</a>
          <a href="#" aria-label="YouTube">YT</a>
        </div>
      </div>
      <div class="contact">
        <h4>Contact Us</h4>
        <div class="line"><b>Mailing Address</b>1501 S. Loop 288, Suite 104, PMB 190<br>Denton, TX 76205</div>
        <div class="line"><b>Email</b><a href="mailto:info@dlakappa.org">info@dlakappa.org</a></div>
        <div class="line"><b>Membership &amp; Partnerships</b>We welcome members, partners, and supporters.</div>
        <a class="portal-btn" href="/portal/login.html">Member Portal</a>
      </div>
    </div>
  </div>
  <div class="legal">
    <span>&copy; 2026 Denton-Lewisville (TX) Alumni Chapter of Kappa Alpha Psi Fraternity, Inc.</span>
    <span>All rights reserved.</span>
  </div>
</footer>`;

  // Inject nav
  const navHolder = document.getElementById('site-nav-placeholder');
  if (navHolder) navHolder.outerHTML = NAV_HTML;

  // Inject footer
  const footerHolder = document.getElementById('site-footer-placeholder');
  if (footerHolder) footerHolder.outerHTML = FOOTER_HTML;

  // Set active nav link based on current URL
  document.addEventListener('DOMContentLoaded', function () {
    const path = window.location.pathname;
    document.querySelectorAll('.site-nav a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (href && href !== '/' && path.includes(href.replace(/^\//, ''))) {
        a.classList.add('nav-active');
      } else if (href === '/' && path === '/') {
        a.classList.add('nav-active');
      }
    });

    // Hamburger toggle
    const burger = document.getElementById('hamburger');
    const menu = document.getElementById('main-menu');
    if (burger && menu) {
      burger.addEventListener('click', () => menu.classList.toggle('open'));
    }

    // Mobile dropdown toggles
    document.querySelectorAll('.site-nav .has-drop > a').forEach(a => {
      a.addEventListener('click', function (e) {
        if (window.innerWidth <= 900) {
          e.preventDefault();
          this.parentElement.classList.toggle('mob-open');
        }
      });
    });
  });
})();
