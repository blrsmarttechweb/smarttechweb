/* Smart Tech – HTML website runtime.
   The pages are plain HTML; this adds the quote list, product search and filters,
   form checks and enquiry sending (to the mail script on web hosting, otherwise
   through WhatsApp or email). Menus, banner slider and gallery come from site.js. */
(function () {
  'use strict';
  var ROOT = document.documentElement.getAttribute('data-root') || '';
  var PRODUCTS = window.ST_PRODUCTS || {};
  var SITE = window.ST_SITE || {};
  var main = document.getElementById('main');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var params = new URLSearchParams(location.search);
  var page = location.pathname.split('/').pop().replace(/\.html$/, '') || 'index';
  var startedAt = Date.now();

  /* ---------- storage that never breaks the page ---------- */
  var mem = {};
  function load(store, key, def) { try { var v = window[store].getItem(key); return v ? JSON.parse(v) : def; } catch (e) { return mem[key] || def; } }
  function save(store, key, val) { mem[key] = val; try { window[store].setItem(key, JSON.stringify(val)); } catch (e) {} }
  var quote = {
    get: function () { var q = load('localStorage', 'st_quote', {}); return q && typeof q === 'object' ? q : {}; },
    set: function (q) { save('localStorage', 'st_quote', q); }
  };
  function quoteCount() { return Object.keys(quote.get()).filter(function (id) { return PRODUCTS[id]; }).length; }
  function updateCount() {
    $$('.quote-btn').forEach(function (b) { b.innerHTML = 'Quote list' + (quoteCount() ? ' <span class="count">' + quoteCount() + '</span>' : ''); });
  }
  function flash(type, msg) {
    var old = $('.flashes', main); if (old) old.remove();
    var d = document.createElement('div');
    d.className = 'wrap flashes';
    d.innerHTML = '<div class="flash flash-' + type + '" role="' + (type === 'error' ? 'alert' : 'status') + '">' + msg + '</div>';
    main.insertBefore(d, main.firstChild);
  }

  /* ---------- add to quote list ---------- */
  function markInList() {
    var q = quote.get();
    $$('form').forEach(function (f) {
      var id = f.elements.product_id && f.elements.product_id.value;
      if (!id || !q[id] || f.classList.contains('enquiry')) return;
      var b = $('button[type=submit], button:not([type])', f);
      if (!b) return;
      b.textContent = f.classList.contains('card-actions') ? '✓ In list' : 'In your quote list ✓';
      b.disabled = true;
      var box = f.closest('.price-box');
      if (box && !$('.in-list-link', box)) {
        var p = document.createElement('p'); p.className = 'small in-list-link';
        p.innerHTML = '<a href="' + ROOT + 'request-a-quote.html">View quote list (' + quoteCount() + ') →</a>';
        box.appendChild(p);
      }
    });
  }

  /* ---------- search, filters and sorting on product listing pages ---------- */
  function initListing() {
    var form = $('form.toolbar', main);
    if (!form) return;
    var grid = $('.grid', main);
    var cards = grid ? $$('.card', grid) : [];
    cards.forEach(function (c, k) { c.setAttribute('data-orig', k); });
    var h1 = $('.listing-head h1', main), baseTitle = h1 ? h1.textContent : '';
    var note = $('.count-note', main);
    var empty = $('.empty', main);
    if (!empty) {
      empty = document.createElement('div');
      empty.className = 'empty'; empty.hidden = true;
      empty.innerHTML = '<h2>No products found</h2><p>We supply many more products than we list online. Send us your requirement and our team will reply with options and a quotation.</p><p><a class="btn btn-accent" href="' + ROOT + 'request-a-quote.html">Send a requirement</a> <a class="btn btn-ghost" href="' + ROOT + 'products.html">View all products</a></p>';
      if (grid) grid.parentNode.insertBefore(empty, grid.nextSibling);
    }
    params.forEach(function (v, k) { var f = form.elements[k]; if (f && f.tagName) f.value = v; });
    if (!$('.clear', form)) {
      var c = document.createElement('a'); c.className = 'clear'; c.href = '#'; c.textContent = 'Clear filters';
      form.appendChild(c);
    }

    var PAGE = 24, limit = PAGE;
    var more = document.createElement('p');
    more.className = 'more-row';
    more.style.cssText = 'text-align:center;margin:24px 0';
    more.hidden = true;
    var moreBtn = document.createElement('button');
    moreBtn.type = 'button'; moreBtn.className = 'btn btn-ghost';
    more.appendChild(moreBtn);
    Object.defineProperty(more, 'textContent', { set: function (t) { moreBtn.textContent = t; } });
    moreBtn.addEventListener('click', function () { limit += PAGE * 2; apply(true); });
    if (grid) grid.parentNode.insertBefore(more, empty.nextSibling);
    var pager = $('.pager', main); if (pager) pager.remove();

    function apply(keep) {
      if (!grid) return;
      if (keep !== true) limit = PAGE;
      var q = (form.elements.q ? form.elements.q.value : '').trim().toLowerCase();
      var brand = form.elements.brand ? form.elements.brand.value : '';
      var cat = form.elements.category ? form.elements.category.value : '';
      var sort = form.elements.sort ? form.elements.sort.value : '';
      var terms = q ? q.split(/\s+/) : [];
      var shown = 0, matched = [];
      cards.forEach(function (c) {
        var ok = terms.every(function (t) { return (c.getAttribute('data-name') || '').indexOf(t) !== -1; })
          && (!brand || c.getAttribute('data-brand') === brand) && (!cat || c.getAttribute('data-cat') === cat);
        c.hidden = true; if (ok) { shown++; matched.push(c); }
      });
      matched.sort(function (a, b) {
        if (sort === 'name') return a.querySelector('.card-title').textContent.localeCompare(b.querySelector('.card-title').textContent);
        if (sort === 'newest') return (b.getAttribute('data-created') || '').localeCompare(a.getAttribute('data-created') || '') || (+b.getAttribute('data-id') - +a.getAttribute('data-id'));
        if (sort === 'popular') return +b.getAttribute('data-views') - +a.getAttribute('data-views');
        return +a.getAttribute('data-orig') - +b.getAttribute('data-orig');
      }).forEach(function (c, k) { grid.appendChild(c); c.hidden = k >= limit; });
      more.hidden = matched.length <= limit;
      more.textContent = 'Show more products (' + (matched.length - Math.min(limit, matched.length)) + ' more)';
      grid.hidden = shown === 0; empty.hidden = shown !== 0;
      if (note) note.textContent = shown + ' product' + (shown === 1 ? '' : 's') + ' · ' + (SITE.price_label || 'Price on Request');
      if (h1) h1.textContent = q ? 'Search results for "' + form.elements.q.value.trim() + '"' : baseTitle;
      var clear = $('.clear', form); if (clear) clear.hidden = !(q || brand || cat || sort);
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); apply(); });
    $$('select', form).forEach(function (s) { s.addEventListener('change', apply); });
    var clear = $('.clear', form);
    if (clear) clear.addEventListener('click', function (e) { e.preventDefault(); $$('input:not([type=hidden]),select', form).forEach(function (f) { f.value = ''; }); apply(); });
    apply();
  }

  /* ---------- quote list on the Request a Quote page ---------- */
  function quoteRows() {
    var q = quote.get();
    return Object.keys(q).filter(function (id) { return PRODUCTS[id]; }).map(function (id) { return { id: id, p: PRODUCTS[id], qty: Math.max(1, +q[id] || 1) }; });
  }
  function initQuotePage() {
    var form = $('form.enquiry', main);
    if (!form || !form.elements.type || form.elements.type.value !== 'quote') return;
    var holder = $('.qlist', main);
    if (!holder) {
      var notice = $('.enquiry .notice', main) || $('.notice', main);
      if (!notice) return;
      holder = document.createElement('div'); holder.className = 'qlist';
      holder.setAttribute('data-empty', notice.outerHTML);
      notice.parentNode.replaceChild(holder, notice);
    }
    var rows = quoteRows();
    if (!rows.length) { holder.innerHTML = holder.getAttribute('data-empty'); return; }
    holder.innerHTML = '<div class="table-wrap"><table class="qtable"><thead><tr><th>Product</th><th>Model</th><th>Quantity</th><th><span class="sr">Remove</span></th></tr></thead><tbody>'
      + rows.map(function (r) {
        return '<tr><td><a href="' + ROOT + 'product/' + esc(r.p.slug) + '.html">' + esc(r.p.name) + '</a><br><span class="small muted">' + esc(r.p.brand) + '</span></td>'
          + '<td class="model">' + esc(r.p.model) + '</td>'
          + '<td><input type="number" min="1" max="100000" value="' + r.qty + '" aria-label="Quantity for ' + esc(r.p.name) + '" data-qty="' + r.id + '"></td>'
          + '<td><button class="link-btn" type="button" data-rm="' + r.id + '">Remove</button></td></tr>';
      }).join('') + '</tbody></table></div><p class="small"><a href="' + ROOT + 'products.html">+ Add more products</a></p>';
    $$('[data-qty]', holder).forEach(function (inp) {
      inp.addEventListener('change', function () { var s = quote.get(); s[inp.getAttribute('data-qty')] = Math.max(1, Math.min(100000, parseInt(inp.value, 10) || 1)); inp.value = s[inp.getAttribute('data-qty')]; quote.set(s); });
    });
    $$('[data-rm]', holder).forEach(function (b) {
      b.addEventListener('click', function () { var s = quote.get(); delete s[b.getAttribute('data-rm')]; quote.set(s); initQuotePage(); updateCount(); flash('info', 'The product was removed from your quote list.'); });
    });
  }

  /* ---------- anti-spam question: new numbers on every visit ---------- */
  function freshCaptcha() {
    $$('label.captcha').forEach(function (l) {
      var a = 2 + Math.floor(Math.random() * 8), b = 1 + Math.floor(Math.random() * 9);
      l.setAttribute('data-sum', a + b);
      l.firstChild.nodeValue = 'Anti-spam check: what is ' + a + ' + ' + b + '? *';
    });
  }

  /* ---------- enquiry forms ---------- */
  var TYPE_TITLES = { quote: 'Quotation request', product: 'Product enquiry', contact: 'Contact enquiry', partner: 'Partner / supplier enquiry' };
  function validate(f) {
    var type = f.elements.type ? f.elements.type.value : 'contact';
    var v = function (n) { return f.elements[n] && f.elements[n].value != null ? String(f.elements[n].value).trim() : ''; };
    var errors = {};
    if (v('name').length < 2) errors.name = 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email'))) errors.email = 'Enter a valid email address, for example name@company.com.';
    var digits = v('phone').replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) errors.phone = 'Enter a valid mobile number using digits only.';
    else if ((v('country_code') || '+91') === '+91' && !/^[6-9]\d{9}$/.test(digits.replace(/^0+/, '').replace(/^91(?=\d{10}$)/, ''))) errors.phone = 'Enter a 10-digit Indian mobile number.';
    if (f.elements.organization && type !== 'contact' && v('organization').length < 2) errors.organization = 'Enter your company or organisation name.';
    if (type === 'quote' || type === 'product') {
      if (f.elements.city && !v('city')) errors.city = 'Enter the delivery city.';
      if (f.elements.state && !v('state')) errors.state = 'Select the delivery state.';
    }
    if (type === 'product' && f.elements.quantity && !(parseInt(v('quantity'), 10) >= 1)) errors.quantity = 'Enter the quantity you need.';
    if ((type === 'contact' || type === 'partner') && v('message').length < 5) errors.message = 'Tell us briefly how we can help.';
    if (type === 'quote' && !quoteRows().length && v('message').length < 5) errors.message = 'Add products to your quote list, or describe your requirement here.';
    var file = f.elements.attachment && f.elements.attachment.files && f.elements.attachment.files[0];
    if (file) {
      var max = parseInt(f.elements.attachment.getAttribute('data-max-mb'), 10) || 5;
      if (!/\.(pdf|docx?|xlsx?|jpe?g|png)$/i.test(file.name)) errors.attachment = 'Attach a PDF, Word, Excel, JPG or PNG file.';
      else if (file.size > max * 1048576) errors.attachment = 'The attached file is larger than ' + max + ' MB. Attach a smaller file or email it to us.';
    }
    var cap = $('label.captcha', f);
    if (cap && f.elements.captcha && v('captcha') !== cap.getAttribute('data-sum')) errors.captcha = 'The answer to the anti-spam question was wrong. Please try again.';
    if (f.elements.consent && !f.elements.consent.checked) errors.consent = 'Please agree so that we can use your details to reply.';
    return errors;
  }
  function showErrors(f, errors) {
    $$('.field-error', f).forEach(function (x) { x.remove(); });
    $$('[aria-invalid]', f).forEach(function (x) { x.removeAttribute('aria-invalid'); });
    var top = $('.form-error', f);
    var keys = Object.keys(errors);
    if (!keys.length) { if (top) top.remove(); return; }
    keys.forEach(function (k) {
      var el = f.elements[k];
      if (!el || !el.setAttribute) return;
      var sp = document.createElement('span'); sp.className = 'field-error'; sp.textContent = errors[k];
      el.setAttribute('aria-invalid', 'true');
      var at = el.closest('.phone') || el.closest('.consent') || el;
      at.parentNode.insertBefore(sp, at.nextSibling);
    });
    if (!top) { top = document.createElement('p'); top.className = 'flash flash-error form-error'; top.setAttribute('role', 'alert'); f.insertBefore(top, f.firstChild); }
    top.textContent = 'Please correct the highlighted fields and submit again.';
    var first = f.elements[keys[0]]; if (first && first.focus) first.focus();
  }
  function fieldLabel(f, name) {
    var el = f.elements[name];
    var lab = el && el.closest && el.closest('label');
    var t = lab ? (lab.firstChild && lab.firstChild.nodeValue || lab.textContent) : name;
    return String(t).replace(/\*/g, '').replace(/\s+/g, ' ').trim();
  }
  function summary(f) {
    var v = function (n) { return f.elements[n] ? String(f.elements[n].value || '').trim() : ''; };
    var type = v('type') || 'contact';
    var lines = ['*' + (TYPE_TITLES[type] || 'Website enquiry') + '* – ' + (SITE.name || 'Smart Tech') + ' website', ''];
    var add = function (label, val) { if (val) lines.push(label + ': ' + val); };
    add('Name', v('name'));
    add('Organisation', v('organization'));
    add('Designation', v('designation'));
    add('Email', v('email'));
    add('Mobile', (v('country_code') || '') + ' ' + v('phone'));
    add('City', v('city'));
    add('State', v('state'));
    var pid = v('product_id');
    if (type === 'product' && PRODUCTS[pid]) {
      lines.push('', 'Product: ' + PRODUCTS[pid].name + (PRODUCTS[pid].model ? ' (Model ' + PRODUCTS[pid].model + ')' : ''));
      add('Quantity', v('quantity'));
    }
    if (type === 'quote') {
      var rows = quoteRows();
      if (rows.length) {
        lines.push('', 'Products:');
        rows.forEach(function (r, i) { lines.push((i + 1) + '. ' + r.p.name + (r.p.model ? ' (Model ' + r.p.model + ')' : '') + ' – Qty ' + r.qty); });
      }
    }
    // any other visible fields this form has
    $$('input, select, textarea', f).forEach(function (el) {
      var n = el.name;
      if (!n || /^(type|name|organization|designation|email|country_code|phone|city|state|quantity|product_id|message|captcha|consent|website|attachment)$/.test(n) || el.type === 'hidden' || el.type === 'checkbox' && !el.checked) return;
      add(fieldLabel(f, n), String(el.value || '').trim());
    });
    if (v('message')) lines.push('', 'Requirement / message:', v('message'));
    var file = f.elements.attachment && f.elements.attachment.files && f.elements.attachment.files[0];
    if (file) lines.push('', 'File to attach: ' + file.name);
    return { text: lines.join('\n'), subject: (TYPE_TITLES[type] || 'Website enquiry') + ' from ' + v('name') + (v('organization') ? ', ' + v('organization') : ''), file: !!file };
  }

  function submitEnquiry(f) {
    var errors = validate(f);
    showErrors(f, errors);
    if (Object.keys(errors).length) return;
    if (f.elements.website && f.elements.website.value) return; // spam robot
    var btn = $('button[type=submit], button:not([type])', f);
    var s = summary(f);
    var name = f.elements.name.value.trim();
    var done = function (result) {
      save('sessionStorage', 'st_thanks', { name: name, sent: !!result, ref: result || '', text: s.text, subject: s.subject, file: s.file });
      if (f.elements.type && f.elements.type.value === 'quote') { quote.set({}); }
      location.href = ROOT + 'thank-you.html';
    };
    if (!/^https?:$/.test(location.protocol)) { done(''); return; }
    // on web hosting: send straight to the sales inbox
    var data = new FormData(f);
    data.set('summary', s.text);
    data.set('subject', s.subject);
    data.set('elapsed', String(Math.round((Date.now() - startedAt) / 1000)));
    if (btn) { btn.disabled = true; btn.setAttribute('data-label', btn.textContent); btn.textContent = 'Sending…'; }
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
    fetch(ROOT + 'send-enquiry.php', { method: 'POST', body: data, signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        clearTimeout(timer);
        if (j && j.ok) { done(j.ref || 'sent'); return; }
        if (j && j.error) { if (btn) { btn.disabled = false; btn.textContent = btn.getAttribute('data-label'); } showErrors(f, {}); var top = document.createElement('p'); top.className = 'flash flash-error form-error'; top.setAttribute('role', 'alert'); top.textContent = j.error; f.insertBefore(top, f.firstChild); return; }
        done('');
      })
      .catch(function () { clearTimeout(timer); done(''); });
  }

  /* ---------- thank-you page ---------- */
  function initThanks() {
    var box = $('[data-thanks]', main);
    if (!box) return;
    var t = load('sessionStorage', 'st_thanks', null);
    if (!t) { location.replace(ROOT + 'index.html'); return; }
    $('[data-thanks-name]', box).textContent = t.name ? ', ' + t.name : '';
    if (t.sent) {
      $('[data-thanks-sent]', box).hidden = false;
      $('[data-thanks-ref]', box).textContent = t.ref && t.ref !== 'sent' ? t.ref : 'sent';
      if (!t.ref || t.ref === 'sent') $('[data-thanks-ref]', box).parentNode.hidden = true;
      return;
    }
    $('[data-thanks-send]', box).hidden = false;
    var wa = String(SITE.whatsapp || SITE.phone || '').replace(/\D/g, '');
    if (wa.length === 10) wa = '91' + wa;
    $('[data-send-wa]', box).href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(t.text);
    $('[data-send-mail]', box).href = 'mailto:' + (SITE.email || '') + '?subject=' + encodeURIComponent(t.subject) + '&body=' + encodeURIComponent(t.text.replace(/\*/g, ''));
    if (t.file) $('[data-thanks-file]', box).hidden = false;
  }

  /* ---------- one handler for every form on the site ---------- */
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.classList.contains('search') || f.classList.contains('toolbar')) return; // normal page links / handled above
    if (f.classList.contains('enquiry')) { e.preventDefault(); submitEnquiry(f); return; }
    if (f.elements.product_id) {
      e.preventDefault();
      var id = f.elements.product_id.value, s = quote.get();
      if (!s[id]) s[id] = 1;
      quote.set(s); updateCount(); markInList();
      var n = PRODUCTS[id] ? PRODUCTS[id].name : 'The product';
      flash('success', esc(n) + ' was added to your quote list. <a href="' + ROOT + 'request-a-quote.html">View quote list</a>');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    e.preventDefault();
  });

  freshCaptcha(); initListing(); initQuotePage(); markInList(); updateCount(); initThanks();
  window.addEventListener('pageshow', function (e) { if (e.persisted) { updateCount(); markInList(); initQuotePage(); } });
})();
