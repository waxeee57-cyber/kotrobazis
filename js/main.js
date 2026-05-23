/* ═══════════════════════════════════════════
   KotróBázis – main.js
   Vanilla JS, zero dependencies
═══════════════════════════════════════════ */

/* ── Nav: scroll class + hamburger ──────── */
(function () {
  const nav = document.querySelector('.nav');
  const burger = document.querySelector('.nav__burger');
  const drawer = document.querySelector('.nav__mobile');

  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 24);
      updateActiveNav();
    }, { passive: true });
  }

  if (burger && drawer) {
    burger.addEventListener('click', () => {
      const open = burger.classList.toggle('open');
      drawer.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    drawer.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        burger.classList.remove('open');
        drawer.classList.remove('open');
        document.body.style.overflow = '';
      })
    );
  }

  function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const links = document.querySelectorAll('.nav__links a[href^="#"]');
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 130) current = s.id;
    });
    links.forEach(a =>
      a.classList.toggle('active', a.getAttribute('href') === '#' + current)
    );
  }
  updateActiveNav();
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
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Re-observe after dynamic content loads
  window.reObserveReveal = () =>
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => io.observe(el));
})();

/* ── 3D tilt on machine cards ─────────────── */
(function () {
  document.querySelectorAll('.machine-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width  - 0.5) * 2;
      const y = ((e.clientY - r.top)  / r.height - 0.5) * 2;
      card.style.transform =
        `perspective(900px) rotateY(${x * 9}deg) rotateX(${-y * 7}deg) scale3d(1.025,1.025,1.025)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ── References loader ───────────────────── */
(function () {
  const grid = document.getElementById('ref-grid');
  if (!grid) return;

  async function load() {
    // Admin edits live in localStorage
    const stored = localStorage.getItem('kb_references');
    if (stored) {
      try { return JSON.parse(stored); } catch (_) {}
    }
    // Fallback to static JSON (works from root; gepek.html is also root-level)
    const base = document.querySelector('meta[name="base-path"]')?.content ?? '';
    const res = await fetch(base + 'data/references.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  load().then(refs => render(refs.slice(0, 6)))
        .catch(() => render([]));

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

    grid.innerHTML = refs.map((r, i) => `
      <article class="ref-card reveal delay-${(i % 3) + 1}">
        <div class="ref-card__img">
          ${r.photo
            ? `<img src="${r.photo}" alt="${esc(r.title)}" loading="lazy">`
            : refPlaceholderSVG()}
        </div>
        <div class="ref-card__body">
          <div class="ref-card__cat">${esc(r.category)}</div>
          <h3 class="ref-card__title">${esc(r.title)}</h3>
          <div class="ref-card__loc">
            <svg width="10" height="13" viewBox="0 0 10 13" fill="currentColor" opacity=".5">
              <path d="M5 0C2.24 0 0 2.24 0 5c0 3.75 5 8 5 8s5-4.25 5-8c0-2.76-2.24-5-5-5zm0 6.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>
            </svg>
            ${esc(r.location)}
          </div>
          <p class="ref-card__desc">${esc(r.description)}</p>
          <div class="ref-card__year">${r.year}</div>
        </div>
      </article>`).join('');

    window.reObserveReveal?.();
  }
})();

/* ── Price estimator ─────────────────────── */
(function () {
  const typeEl  = document.getElementById('est-type');
  const areaEl  = document.getElementById('est-area');
  const areaVal = document.getElementById('est-area-val');
  const depthEl = document.getElementById('est-depth');
  const resEl   = document.getElementById('est-result');
  const noteEl  = document.getElementById('est-note');
  if (!typeEl) return;

  // hours per m² base
  const baseRate = {
    'Tereprendezés':    0.012,
    'Alapásás':         0.016,
    'Medenceásás':      0.019,
    'Sáncolás/árkolás': 0.014,
    'Dömper fuvar':     0.008,
    'Bontás/feltöltés': 0.017,
    'Kertépítési munkák': 0.013,
    'Szűk helyi munkák': 0.022,
    'Egyéb földmunkák':  0.015,
  };
  const depthMult = { '0.5': 0.65, '1': 1, '1.5': 1.35, '2': 1.7, '2.5': 2.05, '3': 2.5 };

  function calc() {
    const type  = typeEl.value;
    const area  = parseInt(areaEl.value);
    const depth = depthEl.value;
    const h     = Math.max(1, Math.round(area * (baseRate[type] ?? 0.015) * (depthMult[depth] ?? 1)));
    resEl.textContent  = `${h}–${h + 2} óra`;
    noteEl.textContent = `Becsült munkaidő ${area} m² ${type.toLowerCase()} munkához, ${depth} m mélységben. Ez tájékoztató jellegű – a tényleges idő a helyszíntől és körülményektől függ.`;
  }

  areaEl.addEventListener('input', () => {
    areaVal.textContent = areaEl.value + ' m²';
    calc();
  });
  typeEl.addEventListener('change', calc);
  depthEl.addEventListener('change', calc);
  calc();
})();

/* ── Contact form ────────────────────────── */
(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn  = form.querySelector('.btn-submit');
    const orig = btn.textContent;
    btn.textContent         = 'Köszönjük! Hamarosan hívjuk.';
    btn.style.background    = '#2D9B6F';
    btn.style.pointerEvents = 'none';
    setTimeout(() => {
      btn.textContent         = orig;
      btn.style.background    = '';
      btn.style.pointerEvents = '';
      form.reset();
    }, 4000);
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

function refPlaceholderSVG() {
  return `<div class="ref-placeholder">
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity=".4">
      <rect x="2" y="6" width="36" height="28" rx="2"/>
      <circle cx="13" cy="17" r="4"/>
      <path d="M2 28l9-8 6 5 7-8 10 11"/>
    </svg>
    <span>Fotó hamarosan</span>
  </div>`;
}
