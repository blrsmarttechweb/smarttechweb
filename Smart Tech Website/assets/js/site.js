(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Mobile menu
  var toggle = $('.menu-toggle'), nav = $('#main-nav');
  if (toggle && nav) toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  $$('.mega-toggle').forEach(function (b) {
    b.addEventListener('click', function () {
      var m = b.parentNode.querySelector('.mega');
      var open = m.classList.toggle('open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  // Banner slider
  var slider = $('[data-slider]');
  if (slider) {
    var slides = $$('[data-slide]', slider), dots = $$('[data-dot]', slider), i = 0, timer = null;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var pauseBtn = $('[data-pause]', slider), paused = reduce;
    var show = function (n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-on', k === i); s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      dots.forEach(function (d, k) { if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
    };
    var play = function () { clearInterval(timer); if (!paused && slides.length > 1) timer = setInterval(function () { show(i + 1); }, 6000); };
    dots.forEach(function (d) { d.addEventListener('click', function () { show(+d.getAttribute('data-dot')); play(); }); });
    var prev = $('[data-prev]', slider), next = $('[data-next]', slider);
    if (prev) prev.addEventListener('click', function () { show(i - 1); play(); });
    if (next) next.addEventListener('click', function () { show(i + 1); play(); });
    if (pauseBtn) {
      if (paused) { pauseBtn.textContent = '▶'; pauseBtn.setAttribute('aria-label', 'Play slideshow'); }
      pauseBtn.addEventListener('click', function () {
        paused = !paused;
        pauseBtn.textContent = paused ? '▶' : '❚❚';
        pauseBtn.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
        play();
      });
    }
    slider.addEventListener('mouseenter', function () { clearInterval(timer); });
    slider.addEventListener('mouseleave', play);
    slider.addEventListener('focusin', function () { clearInterval(timer); });
    show(0); play();
  }

  // Product gallery
  var gal = $('[data-gallery]');
  if (gal) {
    var main = $('[data-main]', gal);
    $$('.thumbs button', gal).forEach(function (b) {
      b.addEventListener('click', function () {
        if (!main) return;
        main.src = b.getAttribute('data-src');
        main.alt = b.getAttribute('data-alt');
        $$('.thumbs button', gal).forEach(function (x) { x.removeAttribute('aria-current'); });
        b.setAttribute('aria-current', 'true');
      });
    });
  }

  // Cookie consent + Google Analytics 4 (loaded only after consent)
  var KEY = 'st_consent';
  var body = document.body, gaId = body.getAttribute('data-ga'), banner = $('#cookie-banner');
  var getConsent = function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  var setConsent = function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} };
  var loadGA = function () {
    if (!gaId || window.__gaLoaded) return;
    window.__gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('js', new Date());
    window.gtag('config', gaId, { anonymize_ip: true });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
    document.head.appendChild(s);
  };
  var c = getConsent();
  if (c === 'accept') loadGA();
  else if (!c && banner && gaId && body.getAttribute('data-cookie-banner') === '1') banner.hidden = false;
  else if (!c && gaId && body.getAttribute('data-cookie-banner') !== '1') loadGA();
  $$('[data-consent]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-consent');
      setConsent(v);
      banner.hidden = true;
      if (v === 'accept') loadGA();
      else if (window.__gaLoaded) location.reload();
    });
  });
  $$('[data-cookie-reset]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!banner) return;
      e.preventDefault();
      try { localStorage.removeItem(KEY); } catch (err) {}
      banner.hidden = false;
      var first = banner.querySelector('button'); if (first) first.focus();
    });
  });

  // Client-side check on file size before upload
  $$('input[type=file][name=attachment]').forEach(function (inp) {
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0];
      var max = parseInt(inp.getAttribute('data-max-mb'), 10) || 5;
      if (f && f.size > max * 1024 * 1024) { alert('This file is larger than ' + max + ' MB. Please attach a smaller file.'); inp.value = ''; }
    });
  });
})();
