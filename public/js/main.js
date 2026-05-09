/* ════════════════════════════════════════════════════
   THE CLEAN UP CREW — MAIN JS
   ════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Nav: shadow on scroll + active link highlighting ──
  const nav = document.getElementById('nav');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 24);

    // Highlight active nav link based on scroll position
    const sections = ['hero', 'features', 'about', 'process', 'faq', 'contact'];
    const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'), 10) || 80;
    let current = 'hero';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && window.scrollY >= el.offsetTop - navHeight - 40) current = id;
    });
    document.querySelectorAll('.nav__link').forEach(a => {
      const href = a.getAttribute('href')?.replace('#', '');
      a.classList.toggle('nav__link--active', href === current || (current === 'hero' && href === 'hero'));
    });
  }, { passive: true });

  // ── Mobile nav ───────────────────────────────────────
  const navToggle = document.getElementById('navToggle');
  let mobileNav = null;

  function buildMobileNav() {
    const el = document.createElement('nav');
    el.className = 'nav__mobile';
    el.setAttribute('aria-label', 'Mobile navigation');
    el.innerHTML = `
      <ul>
        <li><a href="#services">Services</a></li>
        <li><a href="#work">Work</a></li>
        <li><a href="#process">Process</a></li>
        <li><a href="#about">About</a></li>
      </ul>
      <a href="#contact" class="btn btn--primary btn--full">Start a Project</a>
    `;
    document.body.appendChild(el);
    el.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileNav));
    return el;
  }

  function closeMobileNav() {
    if (!mobileNav) return;
    mobileNav.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-label', 'Open menu');
  }

  navToggle.addEventListener('click', () => {
    if (!mobileNav) mobileNav = buildMobileNav();
    const isOpen = mobileNav.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });

  // Close mobile nav when clicking outside
  document.addEventListener('click', (e) => {
    if (mobileNav && mobileNav.classList.contains('open') &&
        !mobileNav.contains(e.target) && !navToggle.contains(e.target)) {
      closeMobileNav();
    }
  });

  // ── Scroll-reveal (Intersection Observer) ────────────
  const revealEls = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      // Stagger siblings that share the same direct parent
      const siblings = Array.from(
        entry.target.parentElement.querySelectorAll('.reveal:not(.visible)')
      );
      const idx = siblings.indexOf(entry.target);
      const delay = Math.max(0, idx) * 90;

      setTimeout(() => entry.target.classList.add('visible'), delay);
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => revealObserver.observe(el));

  // ── Smooth scroll for anchor links ───────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-height'), 10) || 76;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ── Contact form ──────────────────────────────────────
  const form     = document.getElementById('contactForm');
  const statusEl = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearStatus();

      const data = {
        name:    form.name.value.trim(),
        email:   form.email.value.trim(),
        service: form.service.value,
        message: form.message.value.trim(),
      };

      if (!data.name || !data.email || !data.message) {
        showStatus('error', 'Please fill in all required fields.');
        return;
      }

      setLoading(true);

      try {
        const res = await fetch('/api/contact', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(data),
        });

        const result = await res.json();

        if (result.success) {
          showStatus('success', result.message);
          form.reset();
        } else {
          showStatus('error', result.error || 'Something went wrong. Please try again.');
        }
      } catch {
        showStatus('error', 'Could not send your message. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    });
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? 'Sending…' : 'Send Message';
  }

  function showStatus(type, message) {
    statusEl.className = `form-status ${type}`;
    statusEl.textContent = message;
    statusEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearStatus() {
    statusEl.className = 'form-status';
    statusEl.textContent = '';
  }

})();
