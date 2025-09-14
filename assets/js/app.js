// assets/js/app.js (drop-in)
const BASE = new URL('.', window.location.href);

// Load a partial HTML file into a container (skip if already filled/locked)
async function loadSection(id, relPath) {
  const host = document.getElementById(id);
  if (!host) return;
  if (host.hasAttribute('data-lock') || host.children.length) return;
  try {
    const url = new URL(relPath, BASE);
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    host.innerHTML = await res.text();
  } catch (e) {
    host.innerHTML = `<div class="wrap muted">Failed to load ${relPath}: ${e.message}</div>`;
    console.warn('Partial load failed:', relPath, e);
  }
}

// Render marquee gallery (infinite loop) from data/projects.json
async function renderGallery(targetId, limit) {
  const host = document.getElementById(targetId);
  if (!host) return;
  try {
    const url = new URL('data/projects.json', BASE);
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    const items = await res.json();
    const slice = typeof limit === 'number' ? items.slice(0, limit) : items;

    const cards = slice.map(x => `
      <div class="card hthumb">
        <img loading="lazy" src="${x.image}" alt="${x.title}">
        <div class="tag">${x.title}</div>
      </div>
    `).join('');

    // Require .marquee on host; build track (duplicate for seamless 50% loop)
    host.classList.add('marquee');
    host.innerHTML = `<div class="track">${cards}${cards}</div>`;
    attachMarqueeControls(host);
  } catch (e) {
    host.innerHTML = '<div class="wrap muted">Could not load gallery.</div>';
    console.warn('Gallery load failed:', e);
  }
}

// Marquee controls: continuous on mobile/desktop, pause while interacting, flip dir on swipe/drag
function attachMarqueeControls(scroller) {
  // Default: LEFTWARD flow (remove 'rev'). For rightward by default, use add('rev')
  scroller.classList.remove('rev');

  let dragging = false, startX = 0, lastX = 0;

  // Hover pause (desktop only)
  scroller.addEventListener('mouseenter', () => scroller.classList.add('paused'));
  scroller.addEventListener('mouseleave', () => scroller.classList.remove('paused'));

  // Pointer events work for mouse/touch/pen
  scroller.addEventListener('pointerdown', (e) => {
    dragging = true;
    startX = lastX = e.clientX;
    scroller.classList.add('paused');
    try { scroller.setPointerCapture(e.pointerId); } catch {}
  });

  scroller.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    lastX = e.clientX;
  });

  function endDrag(e) {
    if (!dragging) return;
    const movedLeft = lastX < startX;               // finger/mouse moved left
    // If swiped left, content should flow RIGHT afterward → add 'rev'
    scroller.classList.toggle('rev', movedLeft);
    dragging = false;
    scroller.classList.remove('paused');
    try { scroller.releasePointerCapture(e?.pointerId); } catch {}
  }
  scroller.addEventListener('pointerup', endDrag);
  scroller.addEventListener('pointercancel', endDrag);
}

// Reveal-on-scroll (for your .reveal sections)
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); } });
}, { threshold: .18 });

window.addEventListener('DOMContentLoaded', () => {
  // Load partials (hero stays inline)
  loadSection('do',   'partials/whatwedo.html');
  loadSection('flow', 'partials/flow.html');
  loadSection('cta',  'partials/cta.html');

  // Marquee galleries (home preview and full page if present)
  if (document.getElementById('gallery-preview')) renderGallery('gallery-preview', 12);
  if (document.getElementById('gallery'))         renderGallery('gallery');

  // Enable reveal effect
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
});
