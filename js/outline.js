// Highlights the entry in the "On this page" outline whose section is currently near the top of the screen.
// Returns a function that stops watching (call it before the next page is drawn).

export function initOutline(app) {
  const nav = app.querySelector('.outline');
  if (!nav || !('IntersectionObserver' in window)) return () => {};

  const buttons = new Map([...nav.querySelectorAll('[data-scroll]')].map((b) => [b.dataset.scroll, b]));
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        for (const b of buttons.values()) b.removeAttribute('aria-current');
        buttons.get(en.target.id)?.setAttribute('aria-current', 'true');
      }
    },
    { rootMargin: '-15% 0px -70% 0px' }, // a section counts once it reaches the upper part of the screen
  );
  for (const id of buttons.keys()) {
    const section = app.querySelector(`#${id}`);
    if (section) io.observe(section);
  }
  return () => io.disconnect();
}
