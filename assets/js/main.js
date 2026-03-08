'use strict';

/* ================================
   LANG MODULE
   Handles DE/EN toggle + localStorage
   ================================ */
const LangModule = (() => {
  const STORAGE_KEY = 'preferred-lang';
  const DEFAULT_LANG = 'de';

  function setLang(lang) {
    document.documentElement.setAttribute('data-lang', lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }

  function init() {
    // Apply saved preference immediately (before render, but after DOMContentLoaded)
    const saved = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
    setLang(saved);

    const btn = document.getElementById('lang-toggle');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-lang');
      setLang(current === 'de' ? 'en' : 'de');
    });
  }

  return { init };
})();

/* ================================
   BURGER MODULE
   Handles nav drawer open/close
   ================================ */
const BurgerModule = (() => {
  let isOpen = false;

  function getEls() {
    return {
      drawer:  document.getElementById('nav-drawer'),
      overlay: document.getElementById('nav-overlay'),
      btn:     document.getElementById('burger-btn'),
    };
  }

  function open() {
    const { drawer, overlay, btn } = getEls();
    if (!drawer) return;
    isOpen = true;
    drawer.classList.add('is-open');
    overlay.classList.add('is-visible');
    btn.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    const { drawer, overlay, btn } = getEls();
    if (!drawer) return;
    isOpen = false;
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function init() {
    const { btn, overlay } = getEls();
    if (!btn) return;

    btn.addEventListener('click', () => (isOpen ? close() : open()));
    overlay.addEventListener('click', close);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) close();
    });

    // Close drawer on nav link click
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', close);
    });

    // Highlight active nav link based on current path
    const path = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;
      // Match exactly or end of path
      const isHome = (href.endsWith('/') || href.endsWith('/index.html')) && (path.endsWith('/') || path.endsWith('/homepage/') || path.endsWith('/homepage'));
      const isPage = !isHome && href !== '/' && path.includes(href.split('/').pop());
      if (isHome || isPage) link.classList.add('active');
    });
  }

  return { init };
})();

/* ================================
   PUB MODULE
   Publication filter by role + year
   ================================ */
const PubModule = (() => {
  function applyFilters() {
    const activeRole = document.querySelector('[data-filter-type="role"].is-active');
    const activeYear = document.querySelector('[data-filter-type="year"].is-active');
    const roleVal = activeRole ? activeRole.dataset.filter : 'all';
    const yearVal = activeYear ? activeYear.dataset.filter : 'all';

    let visibleCount = 0;
    document.querySelectorAll('.pub-item').forEach((item) => {
      const roleMatch = roleVal === 'all' || item.dataset.role === roleVal;
      const yearMatch = yearVal === 'all' || item.dataset.year === yearVal;
      item.hidden = !(roleMatch && yearMatch);
      if (!item.hidden) visibleCount++;
    });

    // Show/hide "no results" message
    const noResults = document.getElementById('pub-no-results');
    if (noResults) noResults.hidden = visibleCount > 0;
  }

  function init() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (!filterBtns.length) return;

    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.filterType;
        document.querySelectorAll(`.filter-btn[data-filter-type="${type}"]`)
          .forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        applyFilters();
      });
    });
  }

  return { init };
})();

/* ================================
   SKILL MODULE
   Animate skill bars on scroll into view
   ================================ */
const SkillModule = (() => {
  function init() {
    const grid = document.querySelector('.skills-grid');
    if (!grid) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.skill-fill').forEach((fill) => {
              fill.classList.add('is-animated');
            });
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(grid);
  }

  return { init };
})();

/* ================================
   ANIM MODULE
   Scroll-reveal for .fade-in / .slide-up / .stagger-children
   ================================ */
const AnimModule = (() => {
  function init() {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.fade-in, .slide-up, .stagger-children').forEach((el) => {
      observer.observe(el);
    });
  }

  return { init };
})();

/* ================================
   FORM MODULE
   AJAX contact form submission via Formspree
   ================================ */
const FormModule = (() => {
  function getCurrentLang() {
    return document.documentElement.getAttribute('data-lang') || 'de';
  }

  function init() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('[type="submit"]');
      const errEl = document.getElementById('form-error');

      submitBtn.disabled = true;
      if (errEl) errEl.hidden = true;

      const lang = getCurrentLang();
      submitBtn.textContent = lang === 'de' ? 'Wird gesendet…' : 'Sending…';

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });

        if (response.ok) {
          form.innerHTML = `
            <div class="form-success">
              <svg width="52" height="52" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                   style="color: var(--success);" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="lang-de">Vielen Dank! Ich melde mich bald bei Ihnen.</p>
              <p class="lang-en">Thank you! I'll get back to you soon.</p>
            </div>`;
          // Re-apply language since new DOM nodes were inserted
          LangModule.init();
        } else {
          throw new Error('Server error');
        }
      } catch {
        submitBtn.disabled = false;
        submitBtn.innerHTML =
          '<span class="lang-de">Nachricht senden</span><span class="lang-en">Send Message</span>';
        if (errEl) errEl.hidden = false;
      }
    });
  }

  return { init };
})();

/* ================================
   INIT
   ================================ */
document.addEventListener('DOMContentLoaded', () => {
  LangModule.init();
  BurgerModule.init();
  PubModule.init();
  SkillModule.init();
  AnimModule.init();
  FormModule.init();
});
