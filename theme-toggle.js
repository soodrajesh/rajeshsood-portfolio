// Wires up #theme-toggle. External for the same CSP reason as
// theme-init.js — see that file's comment. Placed at the end of <body> on
// both pages, so the button already exists in the DOM by the time this runs.
(function () {
  var themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;
  themeToggle.addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
})();
