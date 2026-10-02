const WA_NUMBER = '8617745168691';
const INQUIRY_EMAIL = 'lunazhao520@gmail.com';
const ATTRIBUTION_KEY = 'carbideaxis-visit-source';
const CAMPAIGN_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

function readAttribution() {
  const params = new URLSearchParams(window.location.search);
  const current = { landing: window.location.pathname || '/', campaign: {} };
  CAMPAIGN_KEYS.forEach(key => {
    if (params.get(key)) current.campaign[key] = params.get(key).slice(0, 160);
  });
  try {
    const stored = JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY) || 'null');
    const hasNewCampaign = Object.keys(current.campaign).length > 0;
    if (!hasNewCampaign && stored && typeof stored.landing === 'string' && stored.campaign && typeof stored.campaign === 'object') return stored;
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(current));
  } catch (_) { /* Contact still works when storage is unavailable. */ }
  return current;
}
const visitSource = readAttribution();
function getInquirySource() {
  const campaign = CAMPAIGN_KEYS.filter(key => typeof visitSource.campaign[key] === 'string')
    .map(key => `${key}: ${visitSource.campaign[key]}`);
  return [`Source page: ${window.location.pathname || '/'}`, `Landing page: ${visitSource.landing}`, ...campaign].join('\n');
}
function withInquirySource(message) {
  const text = (message || 'Hello CarbideAxis Tools, I would like to request a quotation.').trim();
  return text.includes('Source page:') ? text : `${text}\n\n${getInquirySource()}`;
}
function whatsappUrl(message) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(withInquirySource(message))}`;
}
function inquirySubject(data) {
  const product = String(data.get('product') || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 100);
  return product ? `CarbideAxis RFQ - ${product}` : 'CarbideAxis tool inquiry';
}
function emailUrl(message, subject = 'CarbideAxis tool inquiry') {
  return `mailto:${INQUIRY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(withInquirySource(message))}`;
}
function gmailUrl(message, subject = 'CarbideAxis tool inquiry') {
  const params = new URLSearchParams({ view: 'cm', fs: '1', to: INQUIRY_EMAIL, su: subject, body: withInquirySource(message) });
  return `https://mail.google.com/mail/?${params.toString()}`;
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
  return withInquirySource(['Hello CarbideAxis Tools, I would like to request a quotation.', ...lines].join('\n'));
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
  document.querySelectorAll(`a[href*="wa.me/${WA_NUMBER}"]`).forEach(link => {
    link.addEventListener('click', () => {
      const url = new URL(link.href);
      url.searchParams.set('text', withInquirySource(url.searchParams.get('text') || ''));
      link.href = url.toString();
      recordInteraction('whatsapp_click');
    });
  });
  document.querySelectorAll('[data-wa]').forEach(button => button.addEventListener('click', () => {
    recordInteraction('whatsapp_click'); openWhatsApp(button.dataset.wa);
  }));
  document.querySelectorAll(`a[href^="mailto:${INQUIRY_EMAIL}"]`).forEach(link => {
    link.addEventListener('click', () => recordInteraction('email_click'));
  });
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
      const channel = event.submitter?.dataset.rfqChannel === 'whatsapp' ? 'whatsapp' : 'email';
      const subject = inquirySubject(new FormData(form));
      const url = channel === 'email' ? emailUrl(message, subject) : whatsappUrl(message);
      const help = form.querySelector('.rfq-help');
      if (help) {
        help.replaceChildren(document.createTextNode(channel === 'email'
          ? `Email draft prepared for ${INQUIRY_EMAIL}. Add any drawings or model lists, then press Send in your email app. `
          : 'WhatsApp draft prepared. Review it, add any files and press Send in WhatsApp. '));
        const retry = document.createElement('a');
        retry.href = url; retry.target = '_blank'; retry.rel = 'noopener noreferrer';
        retry.textContent = channel === 'email' ? 'Open email draft' : 'Open WhatsApp draft';
        retry.dataset.rfqDraft = channel;
        retry.addEventListener('click', () => recordInteraction(`${channel}_click`));
        help.appendChild(retry);
        if (channel === 'email') {
          help.appendChild(document.createTextNode(' · '));
          const gmail = document.createElement('a');
          gmail.href = gmailUrl(message, subject); gmail.target = '_blank'; gmail.rel = 'noopener noreferrer';
          gmail.textContent = 'Open in Gmail';
          gmail.addEventListener('click', () => recordInteraction('gmail_draft_open'));
          help.appendChild(gmail);
          help.appendChild(document.createTextNode(' You can also use Copy request details and paste into your email.'));
        }
      }
      try {
        let download = form.querySelector('[data-rfq-download]');
        if (!download) {
          download = document.createElement('a'); download.dataset.rfqDownload = '';
          download.className = 'mini-link'; download.textContent = 'Save a copy of your request';
          download.download = 'carbideaxis-rfq.txt'; form.appendChild(download);
        }
        if (download.dataset.objectUrl) URL.revokeObjectURL(download.dataset.objectUrl);
        const objectUrl = URL.createObjectURL(new Blob([message], { type: 'text/plain;charset=utf-8' }));
        download.href = objectUrl; download.dataset.objectUrl = objectUrl;
      } catch (_) {
        form.querySelector('[data-rfq-download]')?.remove();
      }
      recordInteraction(`rfq_${channel}_draft`, { intent: intent?.value || 'unspecified' });
      if (channel === 'email') window.location.href = url;
      else window.open(url, '_blank', 'noopener,noreferrer');
    });
  });
});
