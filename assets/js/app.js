// SAFE MODE: do not touch the hero or partials at all.
// This verifies the hero stays visible.

window.addEventListener('DOMContentLoaded', () => {
  console.log('SAFE MODE: JS running, but not loading partials.');
  // Optional: if your gallery preview must show on the homepage, comment this out for now.
  // We'll re-enable the real app.js after we confirm the hero is stable.
});
