// Sets the theme before first paint, not after — running this any later
// (e.g. at the bottom of <body>) would flash the wrong theme for a frame on
// every load. Defaults to the OS preference the first time a visitor
// arrives; an explicit toggle click overrides that and sticks via
// localStorage from then on. Shared verbatim by both irajeshsood.com and
// irajeshsood.com/portfolio/.
//
// External file, not inline: this site's CSP (see vercel.json) allowlists
// scripts by exact sha256 hash, which is fragile for anything that changes
// — script-src already trusts 'self', so a same-origin file needs no hash
// at all and can be edited freely.
(function () {
  var stored = localStorage.getItem('theme');
  var theme = stored || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();
