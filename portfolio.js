    // Tab switching with full ARIA + arrow-key navigation
    const tabs = Array.from(document.querySelectorAll('.tab-btn'));
    const panels = document.querySelectorAll('.tab-panel');

    function activateTab(btn) {
      const target = btn.dataset.tab;

      tabs.forEach(t => {
        t.setAttribute('aria-selected', 'false');
        t.tabIndex = -1;
      });
      panels.forEach(p => p.classList.remove('active'));

      btn.setAttribute('aria-selected', 'true');
      btn.tabIndex = 0;
      document.getElementById('tab-' + target).classList.add('active');

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    tabs.forEach((btn, idx) => {
      btn.addEventListener('click', () => activateTab(btn));
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          const next = tabs[(idx + dir + tabs.length) % tabs.length];
          next.focus();
          activateTab(next);
        }
      });
    });

    // Architecture preview modal — click a project card with a data-arch
    // image to preview its diagram instead of leaving the page immediately.
    const archDrawer = document.getElementById('arch-drawer');
    const archBackdrop = document.getElementById('arch-backdrop');
    const archImg = document.getElementById('arch-drawer-img');
    const archImgWrap = document.querySelector('.arch-drawer-img-wrap');
    const archTitle = document.getElementById('arch-drawer-title');
    const archRepoLink = document.getElementById('arch-drawer-repo');
    const archBlogLink = document.getElementById('arch-drawer-blog');
    const archFullsizeLink = document.getElementById('arch-drawer-fullsize');
    const archCloseBtn = document.getElementById('arch-drawer-close');
    let archTriggerEl = null;

    // The diagrams are near-square, but the drawer's own width/height ratio
    // is not — sizing the drawer to a fixed width lets the image (scaled by
    // object-fit:contain) leave big blank margins either side. Instead, size
    // the drawer's WIDTH to match the loaded image's aspect ratio against
    // the height the layout already gives it, so there's no letterboxing.
    function fitArchDrawerToImage() {
      if (!archDrawer.classList.contains('open')) return;
      const naturalW = archImg.naturalWidth;
      const naturalH = archImg.naturalHeight;
      if (!naturalW || !naturalH) return;
      const availH = archImgWrap.clientHeight;
      if (!availH) return;
      const chrome = archDrawer.offsetWidth - archImgWrap.clientWidth; // header/body horizontal padding, ~width-independent
      const idealWidth = availH * (naturalW / naturalH) + chrome;
      const maxWidth = window.innerWidth * 0.96;
      archDrawer.style.width = Math.max(480, Math.min(idealWidth, maxWidth)) + 'px';
    }
    archImg.addEventListener('load', fitArchDrawerToImage);
    window.addEventListener('resize', fitArchDrawerToImage);

    function openArchDrawer(card) {
      archTriggerEl = card;
      archDrawer.style.width = ''; // reset to default while the new image loads
      archImg.src = card.dataset.arch;
      archImg.alt = card.dataset.title + ' architecture diagram';
      archTitle.textContent = card.dataset.title;
      archRepoLink.href = card.dataset.repo;
      archFullsizeLink.href = card.dataset.arch;
      if (card.dataset.blog) {
        archBlogLink.href = card.dataset.blog;
        archBlogLink.hidden = false;
      } else {
        archBlogLink.hidden = true;
      }
      archDrawer.classList.add('open');
      archBackdrop.classList.add('open');
      archDrawer.setAttribute('aria-hidden', 'false');
      archCloseBtn.focus();
      document.body.style.overflow = 'hidden';
      fitArchDrawerToImage(); // image may already be cached/decoded, no second 'load' event
      if (window.gtag) window.gtag('event', 'project_arch_preview', { project: card.dataset.title });
    }

    function closeArchDrawer() {
      archDrawer.classList.remove('open');
      archBackdrop.classList.remove('open');
      archDrawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (archTriggerEl) { archTriggerEl.focus(); archTriggerEl = null; }
    }

    document.querySelectorAll('.project-card[data-arch]').forEach(card => {
      card.addEventListener('click', () => openArchDrawer(card));
    });
    archCloseBtn.addEventListener('click', closeArchDrawer);
    archBackdrop.addEventListener('click', closeArchDrawer);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && archDrawer.classList.contains('open')) closeArchDrawer();
    });

    // Scroll-based animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.animation = 'slideInUp 0.5s ease-out forwards';
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.project-card, .skill-pill').forEach((el, idx) => {
      if (idx > 0) {
        el.style.opacity = '0';
        observer.observe(el);
      }
    });

    // Contact form — posts to gogenops.com/api/contact, the shared
    // contact-form backend for the user's sites (see gogenops's
    // api/_lib/allowedOrigins.ts for the origin allowlist authorizing this).
    const contactToggle = document.getElementById('contact-form-toggle');
    const contactForm = document.getElementById('contact-form');
    if (contactToggle && contactForm) {
      contactToggle.addEventListener('click', () => {
        const expanded = contactToggle.getAttribute('aria-expanded') === 'true';
        contactToggle.setAttribute('aria-expanded', String(!expanded));
        contactToggle.textContent = expanded ? 'contact me →' : 'hide contact form';
        contactForm.hidden = expanded;
      });

      contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('contact-form-submit');
        const status = document.getElementById('contact-form-status');
        const payload = {
          name: document.getElementById('contact-name').value,
          email: document.getElementById('contact-email').value,
          message: document.getElementById('contact-message').value,
          company: document.getElementById('contact-company').value,
          pageUrl: window.location.href,
        };
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
        status.textContent = '';
        status.className = 'contact-form-status';
        try {
          const res = await fetch('https://gogenops.com/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const result = await res.json();
          if (res.ok && result.ok) {
            status.textContent = "Message sent — thanks, I'll get back to you soon.";
            status.className = 'contact-form-status ok';
            contactForm.reset();
            if (window.gtag) window.gtag('event', 'contact_submit', { source: 'portfolio' });
          } else {
            status.textContent = result.error || 'Something went wrong — please try again.';
            status.className = 'contact-form-status error';
          }
        } catch {
          status.textContent = 'Could not reach the server — please try again later.';
          status.className = 'contact-form-status error';
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send';
        }
      });
    }

  