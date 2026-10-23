const WA_NUMBER = '8617745168691';
function whatsappUrl(message) {
  const text = (message || 'Hello CarbideAxis Tools, I would like to request a quotation.').trim();
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}
// Local integration hook only: no tracking provider, cookies or network request.
// Opening a draft is never proof of a received inquiry.
function recordInteraction(name, extra = {}) {
  window.dispatchEvent(new CustomEvent('carbideaxis:interaction', {
    detail: { name, page: window.location.pathname, ...extra }
  }));
}
function openWhatsApp(message) {
  window.open(whatsappUrl(message), '_blank', 'noopener,noreferrer');
}
function buildRfqMessage(data) {
  const purpose = String(data.get('intent') || '');
  const purposeNames = { distributor: 'Stock or private label supply', trial: 'A trial for a machining job', custom: 'A custom tool' };
  const common = [
    ['Name', 'name'], ['Company', 'company'], ['Contact for follow-up', 'contact'],
    ['Email', 'email'], ['Product', 'product'], ['Quantity', 'quantity'],
    ['Material / Application', 'material'], ['Requirements', 'message']
  ];
  const stock = [
    ['Destination country', 'country'], ['Packing preference', 'packing'],
    ['Repeat quantity / period', 'repeat_quantity'], ['Requested delivery timing', 'delivery']
  ];
  const trial = [
    ['Holder / cutter body', 'holder'], ['Current grade / chipbreaker', 'current_grade'],
    ['Material hardness', 'hardness'], ['Trial goal', 'trial_goal'], ['Cutting conditions', 'parameters']
  ];
  const fields = [...common];
  if (!purpose || purpose === 'distributor' || purpose === 'custom') fields.push(...stock);
  if (!purpose || purpose === 'trial' || purpose === 'custom') fields.push(...trial);
  const lines = fields.map(([label, key]) => {
    const value = String(data.get(key) || '').trim();
    return value ? `${label}: ${value}` : '';
  }).filter(Boolean);
  if (purposeNames[purpose]) lines.unshift(`Sourcing purpose: ${purposeNames[purpose]}`);
  return ['Hello CarbideAxis Tools, I would like to request a quotation.', ...lines].join('\n');
}
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.mobile-toggle');
  const menu = document.querySelector('.menu');
  if (toggle && menu) {
    menu.id = 'site-menu';
    toggle.setAttribute('aria-controls', menu.id);
    toggle.setAttribute('aria-expanded', 'false');
    const closeMenu = () => {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation menu');
    };
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    });
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.classList.contains('is-open')) {
        closeMenu(); toggle.focus();
      }
    });
  }
  document.querySelectorAll('.product-card [data-product-inquiry]').forEach(link => {
    const product = link.closest('.product-card')?.querySelector('h3')?.textContent?.trim();
    if (!product) return;
    const message = `Hello CarbideAxis Tools, I just viewed your ${product} and would like to discuss a project. Can we chat?`;
    link.href = whatsappUrl(message);
    link.setAttribute('aria-label', `Ask about ${product} on WhatsApp`);
  });
  document.querySelectorAll(`a[href*="wa.me/${WA_NUMBER}"]`).forEach(link => {
    link.addEventListener('click', () => {
      recordInteraction('whatsapp_click');
    });
  });
  document.querySelectorAll('[data-wa]').forEach(button => button.addEventListener('click', () => {
    recordInteraction('whatsapp_click'); openWhatsApp(button.dataset.wa);
  }));
  const params = new URLSearchParams(window.location.search);
  document.querySelectorAll('form[data-rfq]').forEach(form => {
    const intent = form.querySelector('[name="intent"]');
    if (intent && ['distributor', 'trial', 'custom'].includes(params.get('intent'))) intent.value = params.get('intent');
    const updatePurposeDetails = () => {
      form.querySelectorAll('[data-rfq-purpose]').forEach(group => {
        const applicable = !intent?.value || group.dataset.rfqPurpose.split(' ').includes(intent.value);
        group.hidden = !applicable;
        group.querySelectorAll('input, select, textarea').forEach(field => { field.disabled = !applicable; });
      });
    };
    if (intent) intent.addEventListener('change', updatePurposeDetails);
    updatePurposeDetails();
    const product = form.querySelector('[name="product"]');
    const productSlug = params.get('product');
    if (product && productSlug && /^[a-z-]{1,60}$/.test(productSlug)) product.value = productSlug.replace(/-/g, ' ');
    let started = false;
    form.addEventListener('input', () => {
      if (!started) { recordInteraction('rfq_start'); started = true; }
    });
    const copyButton = form.querySelector('[data-rfq-copy]');
    const showCopyFallback = channel => {
      if (!copyButton) return;
      copyButton.hidden = false;
      copyButton.textContent = `${channel} not opening? Copy your message`;
    };
    if (copyButton) copyButton.addEventListener('click', async () => {
      if (!form.reportValidity()) return;
      const message = buildRfqMessage(new FormData(form));
      let status = form.querySelector('[data-rfq-copy-status]');
      if (!status) {
        status = document.createElement('p'); status.dataset.rfqCopyStatus = '';
        status.className = 'rfq-help'; status.setAttribute('role', 'status'); form.appendChild(status);
      }
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(message);
        const oldFallback = form.querySelector('[data-rfq-copy-text]');
        if (oldFallback) { oldFallback.value = message; oldFallback.hidden = true; }
        status.textContent = 'Request copied. Paste it into your email or chat and send it there.';
        recordInteraction('rfq_copy');
      } catch (_) {
        status.textContent = 'Automatic copying is unavailable. Select and copy the request below, then send it using your preferred contact method.';
        let fallback = form.querySelector('[data-rfq-copy-text]');
        if (!fallback) {
          fallback = document.createElement('textarea'); fallback.dataset.rfqCopyText = '';
          fallback.className = 'field field-wide'; fallback.readOnly = true;
          fallback.setAttribute('aria-label', 'Request text to copy'); form.appendChild(fallback);
        }
        fallback.value = message; fallback.hidden = false; fallback.focus(); fallback.select();
      }
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const message = buildRfqMessage(new FormData(form));
      const channel = event.submitter?.dataset.rfqChannel || 'whatsapp';
      if (channel === 'email') {
        const productName = String(new FormData(form).get('product') || '').trim();
        const subject = productName ? `CarbideAxis inquiry: ${productName}` : 'CarbideAxis inquiry';
        const emailUrl = `mailto:lunazhao520@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        const help = form.querySelector('.rfq-help');
        if (help) {
          help.replaceChildren(document.createTextNode('Email draft prepared. Review it and press Send in your email app. If it did not open, use this link: '));
          const retry = document.createElement('a');
          retry.href = emailUrl;
          retry.textContent = 'Open email draft';
          help.appendChild(retry);
        }
        recordInteraction('rfq_email_draft', { intent: intent?.value || 'unspecified' });
        showCopyFallback('Email');
        window.location.href = emailUrl;
        return;
      }
      const url = whatsappUrl(message);
      const help = form.querySelector('.rfq-help');
      if (help) {
        help.replaceChildren(document.createTextNode('Draft prepared. Review it and press Send in WhatsApp to complete your inquiry. '));
        const retry = document.createElement('a');
        retry.href = url; retry.target = '_blank'; retry.rel = 'noopener noreferrer';
        retry.textContent = 'Open the WhatsApp draft';
        retry.addEventListener('click', () => recordInteraction('whatsapp_click'));
        help.appendChild(retry);
      }
      recordInteraction('rfq_whatsapp_draft', { intent: intent?.value || 'unspecified' });
      showCopyFallback('WhatsApp');
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  });
});
