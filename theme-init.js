// Sets the theme before first paint, not after — running this any later
// (e.g. at the bottom of <body>) would flash the wrong theme for a frame on
// every load. Defaults to light for every first-time visitor regardless of
// their OS setting (a deliberate choice: light reads as more professional
// for a portfolio opened on unknown screens); an explicit toggle click
// overrides that and sticks via localStorage from then on. Shared verbatim
// by irajeshsood.com, /portfolio/ and the /blog/ pages.
//
// External file, not inline: this site's CSP (see vercel.json) allowlists
// scripts by exact sha256 hash, which is fragile for anything that changes
// — script-src already trusts 'self', so a same-origin file needs no hash
// at all and can be edited freely.
(function () {
  var stored = localStorage.getItem('theme');
  var theme = stored === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
})();
