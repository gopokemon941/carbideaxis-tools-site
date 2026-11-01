// R8: optional receivers. This file does not load a tracking provider or store form data.
(() => {
  'use strict';
  const events = new Set(['product_view', 'inquiry_start', 'whatsapp_click', 'email_click', 'form_submit_success', 'form_submit_fail']);
  const pending = new WeakSet();
  const attempts = new WeakMap();
  const revisions = new WeakMap();
  let productIds = new Set();
  const settings = () => window.CARBIDEAXIS_CONFIG || {};
  function endpoint(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      const url = new URL(value, window.location.origin);
      return url.protocol === 'https:' && !url.username && !url.password && !url.hash ? url.href : '';
    } catch (_) { return ''; }
  }
  function context() {
    // Use the authored canonical, never location.search, a referrer or buyer-entered text.
    const canonical = document.querySelector('link[rel="canonical"]')?.href || '';
    let page = '/unknown';
    try {
      const url = new URL(canonical);
      if (url.origin === 'https://www.carbideaxis.com' && /^\/[a-z0-9/-]*$/.test(url.pathname)) page = url.pathname;
    } catch (_) { /* Keep a controlled fallback identifier. */ }
    const query = new URLSearchParams(window.location.search).get('product') || '';
    const parts = page.split('/').filter(Boolean);
    const pathProduct = ['products', 'seo', 'landing', 'ads'].includes(parts[0]) ? parts[1] : '';
    const candidate = pathProduct || query;
    const product = productIds.has(candidate) ? candidate : '';
    return { page, product };
  }
  function record(name, productOverride) {
    if (!events.has(name)) return;
    const detail = { name, ...context() };
    if (productIds.has(productOverride)) detail.product = productOverride;
    window.dispatchEvent(new CustomEvent('carbideaxis:interaction', { detail: Object.freeze({ ...detail }) }));
    const url = endpoint(settings().analyticsEndpoint);
    if (url) {
      try {
        Promise.resolve(window.fetch(url, {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify(detail), credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true
        })).catch(() => {});
      } catch (_) { /* Measurement must never interrupt an inquiry. */ }
    }
    const tag = settings().analyticsTag;
    if (typeof tag === 'string' && /^[A-Za-z_$][\w$]*$/.test(tag) && typeof window[tag] === 'function') {
      try { window[tag](Object.freeze({ ...detail })); } catch (_) { /* Optional integration. */ }
    }
  }
  function status(form, text, fallback = false) {
    let node = form.querySelector('[data-web-status]');
    if (!node) {
      node = document.createElement('p'); node.dataset.webStatus = '';
      node.className = 'rfq-help'; node.setAttribute('role', 'status'); form.appendChild(node);
    }
    node.replaceChildren(document.createTextNode(text));
    if (fallback) {
      const data = new FormData(form), message = buildRfqMessage(data);
      for (const [channel, label, href] of [
        ['whatsapp', 'Continue in WhatsApp', whatsappUrl(message)],
        ['email', 'Prepare email inquiry', inquiryEmailUrl(data, message)]
      ]) {
        const link = document.createElement('a'); link.dataset.rfqRetry = channel;
        link.href = href; link.textContent = label;
        if (channel === 'whatsapp') { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
        node.append(document.createTextNode(' '), link);
      }
    }
  }
  async function submit(form) {
    if (pending.has(form)) return;
    const url = endpoint(settings().inquiryEndpoint);
    if (!url) { status(form, 'Please choose WhatsApp or email to send your request.', true); return; }
    const data = new FormData(form);
    if (String(data.get('website') || '').trim()) {
      status(form, 'Unable to submit this request. Please use WhatsApp or email.', true);
      record('form_submit_fail'); return;
    }
    const contact = String(data.get('contact') || data.get('email') || '').trim();
    if (!contact) {
      status(form, 'Add an email address or WhatsApp number so we can reply, or continue in WhatsApp.', true);
      form.querySelector('[name="contact"], [name="email"]')?.focus(); return;
    }
    const fields = {};
    const allowed = ['intent','name','company','contact','email','product','quantity','material','message','country','packing','repeat_quantity','delivery','holder','current_grade','hardness','trial_goal','parameters'];
    for (const key of allowed) {
      const value = String(data.get(key) || '').trim();
      if (value) fields[key] = value.slice(0, ['message','parameters'].includes(key) ? 2500 : 250);
    }
    const fingerprint = JSON.stringify(fields);
    let attempt = attempts.get(form);
    if (!attempt || attempt.fingerprint !== fingerprint) {
      const requestId = window.crypto?.randomUUID?.() || `ca-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      attempt = { fingerprint, requestId };
      attempts.set(form, attempt);
    }
    if (attempt.accepted) {
      status(form, 'This request was already accepted. Edit the details if you need to send an update.');
      return;
    }
    pending.add(form);
    const submittedRevision = revisions.get(form) || 0;
    const button = form.querySelector('[data-rfq-channel="web"]');
    if (button) button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status(form, 'Submitting your request…');
    const controller = new AbortController();
    let timer;
    try {
      const timeout = new Promise((_, reject) => {
        timer = window.setTimeout(() => { controller.abort(); reject(new Error('timeout')); }, 12000);
      });
      const result = await Promise.race([
        (async () => {
          const response = await window.fetch(url, {
            method: 'POST', headers: {'Content-Type':'application/json', 'Accept':'application/json'},
            body: JSON.stringify({ requestId: attempt.requestId, ...context(), fields, website: '' }),
            credentials: 'omit', referrerPolicy: 'no-referrer', signal: controller.signal
          });
          if (!response.ok) throw new Error('receiver rejected');
          return response.json();
        })(), timeout
      ]);
      if (result?.ok !== true) throw new Error('missing explicit acknowledgement');
      attempt.accepted = true;
      status(form, (revisions.get(form) || 0) === submittedRevision
        ? 'Your request was accepted by our inquiry service. We will reply using the contact details you provided.'
        : 'Your submitted request was accepted. You have edited the details since submitting; send again if you want to share those changes.');
      form.dataset.webAccepted = 'true';
      record('form_submit_success');
    } catch (_) {
      status(form, 'We could not confirm receipt. Your details are still here. Please continue in WhatsApp or email and send your message there.', true);
      record('form_submit_fail');
    } finally {
      window.clearTimeout(timer); pending.delete(form); form.removeAttribute('aria-busy');
      if (button) button.disabled = false;
    }
  }
  window.CarbideAxisInquiry = Object.freeze({ record, submit,
    initializeProducts: labels => { productIds = new Set(Object.keys(labels)); },
    enabled: () => Boolean(endpoint(settings().inquiryEndpoint)) });
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('form[data-rfq]').forEach(form => {
      const changed = () => {
        revisions.set(form, (revisions.get(form) || 0) + 1);
        if (form.dataset.webAccepted === 'true' && !pending.has(form)) {
          status(form, 'Details changed since your accepted request. Submit again to share these changes.');
          delete form.dataset.webAccepted;
        }
      };
      form.addEventListener('input', changed);
      form.addEventListener('change', changed);
      form.addEventListener('reset', changed);
    });
    document.querySelectorAll('[data-rfq-channel="web"]').forEach(button => { button.hidden = !window.CarbideAxisInquiry.enabled(); });
    if (/^\/(products|seo)\//.test(context().page)) record('product_view');
    // Delegation also covers retry links created after a failed handoff.
    document.addEventListener('click', event => {
      const link = event.target.closest?.('a[href]');
      if (!link) return;
      try {
        const url = new URL(link.href);
        const productPath = link.closest('.product-card')?.querySelector('a[href^="/products/"]')?.getAttribute('href') || '';
        const productOverride = productPath.replace(/\/$/, '').split('/').pop();
        if (url.protocol === 'https:' && url.hostname === 'wa.me' && url.pathname === '/8617745168691') record('whatsapp_click', productOverride);
        else if (url.protocol === 'mailto:' && url.pathname === 'lunazhao520@gmail.com') record('email_click');
      } catch (_) { /* Non-contact link. */ }
    });
  });
})();
