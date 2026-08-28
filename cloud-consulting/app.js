// Loaded with `defer`, so the DOM below is fully parsed before this runs.
// Two deliberate interactive moments — no framework, no CDN:
// 1) Scroll reveal on repeated list items (a single consistent effect,
//    not a different UI toy per section).
// 2) Hover-to-trace on the architecture diagram — hovering a lane
//    highlights just that lane's path through the system, which is a
//    real demonstration of the thing being sold (system design), not
//    decoration for its own sake.
(function () {
  // --- Scroll reveal ---
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    // No IntersectionObserver support: just show everything.
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  // --- Architecture diagram hover-to-trace ---
  var archFrame = document.querySelector('.arch-frame');
  if (archFrame) {
    var lanes = archFrame.querySelectorAll('.lane-group');
    lanes.forEach(function (lane) {
      lane.addEventListener('mouseenter', function () {
        archFrame.classList.add('hovering');
        lane.classList.add('active');
      });
      lane.addEventListener('mouseleave', function () {
        archFrame.classList.remove('hovering');
        lane.classList.remove('active');
      });
      // Touch/keyboard: tapping or focusing a lane toggles it, since
      // there's no hover state to rely on.
      lane.setAttribute('tabindex', '0');
      lane.addEventListener('focus', function () {
        archFrame.classList.add('hovering');
        lane.classList.add('active');
      });
      lane.addEventListener('blur', function () {
        archFrame.classList.remove('hovering');
        lane.classList.remove('active');
      });
    });
  }
})();
