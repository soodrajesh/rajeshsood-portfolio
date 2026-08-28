// Applies the saved theme before first paint, so there's no flash of the
// wrong palette. Own tiny, synchronous, non-deferred file (same pattern
// used on gogenops.com's pages) so it runs before <body> renders.
//
// Dark is the default regardless of OS/browser preference — matches the
// approved design. Only an explicit toggle (saved to localStorage)
// switches to light, and that choice persists on repeat visits.
(function () {
  var saved = localStorage.getItem('rs-theme');
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
