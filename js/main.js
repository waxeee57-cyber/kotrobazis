/* ═══════════════════════════════════════════
   KotróBázis – main.js
   Vanilla JS, zero dependencies
═══════════════════════════════════════════ */

/* ── Nav: scroll class + hamburger ──────── */
(function () {
  const nav    = document.querySelector('.nav');
  const burger = document.querySelector('.nav__burger');
  const drawer = document.querySelector('.nav__drawer');

  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  if (burger && drawer) {
    burger.addEventListener('click', () => {
      const open = burger.classList.toggle('open');
      drawer.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    drawer.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        burger.classList.remove('open');
        drawer.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      })
    );
  }
})();

/* ── Scroll reveal ──────────────────────── */
(function () {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  window.reObserveReveal = () =>
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => io.observe(el));
})();

/* ── References loader ───────────────────── */
(function () {
  const grid = document.getElementById('ref-grid');
  if (!grid) return;

  async function load() {
    const stored = localStorage.getItem('kb_references');
    if (stored) {
      try { return JSON.parse(stored); } catch (_) {}
    }
    const base = document.querySelector('meta[name="base-path"]')?.content ?? '';
    const res = await fetch(base + 'data/references.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  load().then(refs => render(refs.slice(0, 6)))
        .catch(() => render([]));

  /* aspect-ratio classes cycle: tall → sq → wide */
  const aspectCycle = ['ref-item--tall', 'ref-item--sq', 'ref-item--wide'];

  function render(refs) {
    if (!refs.length) {
      grid.innerHTML = `
        <div class="refs__empty">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="10" width="44" height="36" rx="2"/>
            <circle cx="20" cy="24" r="5"/>
            <path d="M6 38l11-9 7 6 9-11 12 14"/>
          </svg>
          <p>Rövidesen referenciák kerülnek ide.</p>
        </div>`;
      return;
    }

    grid.innerHTML = refs.map((r, i) => {
      const aspect = aspectCycle[i % aspectCycle.length];
      const imgHtml = r.photo
        ? `<img src="${esc(r.photo)}" alt="${esc(r.title)}" loading="lazy">`
        : `<div class="ref-item__ph">
             <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.2">
               <rect x="2" y="2" width="22" height="22" rx="1"/>
               <path d="M2 17 L8 11 L13 15 L18 9 L24 15"/>
               <circle cx="8" cy="8" r="2"/>
             </svg>
             <span>Fotó hamarosan</span>
           </div>`;
      return `
        <div class="ref-item ${aspect} reveal">
          ${imgHtml}
          <div class="ref-item__over">
            <div class="ref-item__txt">
              <span class="ref-item__cat">${esc(r.category)}</span>
              <p class="ref-item__name">${esc(r.title)}</p>
              <span class="ref-item__loc">${esc(r.location)} · ${r.year}</span>
            </div>
          </div>
        </div>`;
    }).join('');

    window.reObserveReveal?.();
  }
})();

/* ── Contact form ────────────────────────── */
(function () {
  const form   = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn  = form.querySelector('.btn-submit');
    const orig = btn.textContent;

    btn.textContent         = 'Köszönjük! Hamarosan hívjuk.';
    btn.style.background    = '#2D9B6F';
    btn.style.pointerEvents = 'none';

    if (status) {
      status.style.display = 'block';
      status.style.color   = '#2D9B6F';
      status.textContent   = 'Üzenetét megkaptuk – általában 1 munkanapon belül visszahívjuk.';
    }

    setTimeout(() => {
      btn.textContent         = orig;
      btn.style.background    = '';
      btn.style.pointerEvents = '';
      if (status) status.style.display = 'none';
      form.reset();
    }, 5000);
  });
})();

/* ── Utility ─────────────────────────────── */
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
