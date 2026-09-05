/* ═══════════════════════════════════════════
   KotróBázis – main.js
   Vanilla JS, zero dependencies
═══════════════════════════════════════════ */

/* ── Nav: scroll class + hamburger + active highlight ── */
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

    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href') || '';
        const isAnchor = href.startsWith('#');
        if (isAnchor) e.preventDefault();

        burger.classList.remove('open');
        drawer.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';

        if (isAnchor) {
          const target = document.querySelector(href);
          if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 50);
        }
      });
    });

    /* Scroll-based active highlight – 30% section visibility */
    const drawerLinks = Array.from(drawer.querySelectorAll('a[href^="#"]'));
    const sectionMap  = new Map();
    drawerLinks.forEach(a => {
      const sec = document.querySelector(a.getAttribute('href'));
      if (sec) sectionMap.set(sec, a);
    });

    if (sectionMap.size) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const link = sectionMap.get(entry.target);
          if (link) link.classList.toggle('active', entry.isIntersecting);
        });
      }, { threshold: 0.3 });

      sectionMap.forEach((_, sec) => io.observe(sec));
    }
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

  const aspectCycle = ['ref-item--tall', 'ref-item--sq', 'ref-item--wide'];

  function render(refs) {
    /* Filter out pure placeholders where title/cim is empty or "Hamarosan" */
    const visible = refs.filter(r => {
      const name = r.cim || r.title || '';
      return name && name !== 'Hamarosan';
    });

    if (!visible.length) {
      grid.innerHTML = `
        <div class="refs__empty">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="10" width="44" height="36" rx="2"/>
            <circle cx="20" cy="24" r="5"/>
            <path d="M6 38l11-9 7 6 9-11 12 14"/>
          </svg>
          <p><strong>Az első referenciánk lehet.</strong></p>
          <p>Minden elkészült munkáról fotót és rövid leírást teszünk közzé – a megrendelő jóváhagyásával. Kérjen ajánlatot, és beszéljük meg a munkát.</p>
          <a href="#kapcsolat" class="btn btn--solid">Ajánlatot kérek</a>
        </div>`;
      return;
    }

    grid.innerHTML = visible.map((r, i) => {
      const aspect = aspectCycle[i % aspectCycle.length];
      /* Support both old field names (title/photo/category/location/year)
         and new Hungarian names (cim/kep/kategoria/helyszin/ev) */
      const img  = r.kep      || r.photo    || '';
      const name = r.cim      || r.title    || '';
      const cat  = r.kategoria|| r.category || '';
      const loc  = r.helyszin || r.location || '';
      const yr   = r.ev       || r.year     || '';

      const imgHtml = img
        ? `<img src="${esc(img)}" alt="${esc(name)}" loading="lazy">`
        : `<div class="ref-item__ph">
             <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#8A8075" stroke-width="1.5">
               <rect x="3" y="32" width="24" height="7" rx="1"/>
               <rect x="3" y="29" width="24" height="3"/>
               <path d="M8 29 L8 18 L18 18 L18 29"/>
               <path d="M18 22 L28 15 L34 21 L26 25"/>
               <path d="M26 25 L30 32"/>
               <circle cx="7" cy="39" r="3"/>
               <circle cx="19" cy="39" r="3"/>
             </svg>
             <span style="font-size:11px;color:#8A8075;letter-spacing:0.14em;text-transform:uppercase;">Fotó hamarosan</span>
           </div>`;
      return `
        <div class="ref-item ${aspect} reveal">
          ${imgHtml}
          <div class="ref-item__over">
            <div class="ref-item__txt">
              <span class="ref-item__cat">${esc(cat)}</span>
              <p class="ref-item__name">${esc(name)}</p>
              <span class="ref-item__loc">${esc(loc)}${yr ? ' · ' + yr : ''}</span>
            </div>
          </div>
        </div>`;
    }).join('');

    window.reObserveReveal?.();
  }
})();

/* ── Contact form – Formspree AJAX ──────── */
(function () {
  const form    = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  const status  = document.getElementById('form-status');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn  = form.querySelector('.btn-submit');
    const orig = btn.textContent;

    btn.disabled    = true;
    btn.textContent = 'Küldés...';
    if (status) status.style.display = 'none';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        form.style.display = 'none';
        if (success) success.style.display = 'block';
      } else {
        throw new Error('server');
      }
    } catch {
      btn.disabled    = false;
      btn.textContent = orig;
      if (status) {
        status.style.display = 'block';
        status.style.color   = '#E05252';
        status.textContent   = 'Hiba történt. Kérem hívjon minket: +36 30 960 2965';
      }
    }
  });
})();

/* ── Footer évszám ───────────────────────── */
(function () {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
})();

/* ── Utility ─────────────────────────────── */
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
