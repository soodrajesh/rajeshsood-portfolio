// Loaded with `defer`, so the DOM below is fully parsed before this runs.
// Two independent, small interactive features — no framework, no CDN:
// 1) Accordion service cards (click to expand what each capability covers)
// 2) Category filter chips on the projects grid
(function () {
  // --- Service card accordion ---
  document.querySelectorAll('.service-head').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.service-card');
      var wasOpen = card.classList.contains('open');
      // Only one open at a time keeps the section scannable rather than
      // turning into a long scroll once several are expanded.
      document.querySelectorAll('.service-card.open').forEach(function (c) {
        c.classList.remove('open');
      });
      if (!wasOpen) card.classList.add('open');
    });
  });

  // --- Project filter chips ---
  var chips = document.querySelectorAll('.filter-chip');
  var cards = document.querySelectorAll('#projects-grid .project-card');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      var filter = chip.dataset.filter;
      cards.forEach(function (card) {
        var cats = (card.dataset.cat || '').split(' ');
        var show = filter === 'all' || cats.indexOf(filter) !== -1;
        card.style.display = show ? '' : 'none';
      });
    });
  });
})();
