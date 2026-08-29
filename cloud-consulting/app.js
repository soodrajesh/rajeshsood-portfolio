// Loaded with `defer`, so the DOM below is fully parsed before this runs.
// Four deliberate interactive moments — no framework, no CDN:
// 1) Scroll reveal on repeated list items (a single consistent effect,
//    not a different UI toy per section).
// 2) Hover-to-trace on the architecture diagram — hovering a lane
//    highlights just that lane's path through the system, which is a
//    real demonstration of the thing being sold (system design), not
//    decoration for its own sake.
// 3) Theme toggle — dark/light choice persisted to localStorage; the
//    saved choice is applied before first paint by theme-init.js, this
//    only handles the click.
// 4) Contact form — posts to the shared gogenops.com/api/contact
//    backend (same endpoint niveshkaro.co.in's calculator pages use;
//    irajeshsood.com is already in that endpoint's origin allowlist
//    via /portfolio/'s existing form, so no backend change needed
//    here). No mailto/LinkedIn links on this page — this form is the
//    only way to reach out.
(function () {
  // --- Theme toggle ---
  var themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var root = document.documentElement;
      var isLight = root.getAttribute('data-theme') === 'light';
      if (isLight) {
        root.removeAttribute('data-theme');
        localStorage.setItem('rs-theme', 'dark');
        themeToggle.setAttribute('aria-label', 'Switch to light theme');
      } else {
        root.setAttribute('data-theme', 'light');
        localStorage.setItem('rs-theme', 'light');
        themeToggle.setAttribute('aria-label', 'Switch to dark theme');
      }
    });
  }

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

  // --- Contact form ---
  var CONTACT_ENDPOINT = 'https://gogenops.com/api/contact';
  var toggle = document.getElementById('contact-toggle');
  var form = document.getElementById('contact-form');
  if (toggle && form) {
    var status = document.getElementById('contact-status');
    var submitBtn = form.querySelector('.contact-submit');

    function openContactForm() {
      toggle.setAttribute('aria-expanded', 'true');
      form.hidden = false;
      toggle.textContent = 'Hide contact form';
      document.getElementById('contact-name').focus();
    }

    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        toggle.setAttribute('aria-expanded', 'false');
        form.hidden = true;
        toggle.textContent = 'Contact me';
      } else {
        openContactForm();
      }
    });

    // Hero and nav CTAs open the same form and scroll to it, rather
    // than duplicating a second form elsewhere on the page.
    document.querySelectorAll('.js-open-contact').forEach(function (cta) {
      cta.addEventListener('click', function (e) {
        e.preventDefault();
        openContactForm();
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';
      status.removeAttribute('data-state');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      var payload = {
        name: document.getElementById('contact-name').value,
        email: document.getElementById('contact-email').value,
        message: document.getElementById('contact-message').value,
        company: document.getElementById('contact-company').value,
      };

      fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok && data.ok, error: data.error };
          });
        })
        .then(function (result) {
          if (result.ok) {
            status.textContent = 'Message sent — thanks, I\'ll get back to you soon.';
            status.setAttribute('data-state', 'ok');
            form.reset();
          } else {
            status.textContent = result.error || 'Something went wrong — please try again.';
            status.setAttribute('data-state', 'error');
          }
        })
        .catch(function () {
          status.textContent = 'Could not reach the server — please try again later.';
          status.setAttribute('data-state', 'error');
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send';
        });
    });
  }
})();
