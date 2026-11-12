const WA_NUMBER = '8617745168691';
const PRODUCT_QUERY_LABELS = Object.freeze({
  'turning-inserts': 'Turning Inserts',
  'milling-inserts': 'Milling Inserts',
  'threading-inserts': 'Threading Inserts',
  'grooving-inserts': 'Grooving Inserts',
  'carbide-end-mills': 'Carbide End Mills',
  'pcd-inserts': 'PCD Inserts',
  'cbn-inserts': 'CBN Inserts',
  'cermet-inserts': 'Cermet Inserts',
  'cnmg-turning-inserts': 'CNMG Turning Inserts',
  'wnmg-turning-inserts': 'WNMG Turning Inserts',
  'apkt-apmt-milling-inserts': 'APKT / APMT Milling Inserts',
  'pcd-inserts-for-aluminum': 'PCD Inserts for Aluminum',
  'cbn-inserts-for-hardened-steel': 'CBN Inserts for Hardened Steel',
  'turning-inserts-oem': 'Turning Inserts',
  'milling-inserts-cutters': 'Milling Inserts',
  'threading-grooving-inserts': 'Threading and Grooving Inserts',
  'pcd-cbn-inserts': 'PCD and CBN Inserts',
  'carbide-end-mills-small-moq': 'Carbide End Mills',
  'carbide-end-mills-rfq': 'Carbide End Mills',
  'cbn-hardened-steel-rfq': 'CBN Inserts for Hardened Steel',
  'cnmg-wnmg-turning-rfq': 'CNMG / WNMG Turning Inserts',
  'oem-carbide-inserts-rfq': 'OEM Carbide Inserts',
  'pcd-aluminum-rfq': 'PCD Inserts for Aluminum'
});
window.CarbideAxisInquiry?.initializeProducts(PRODUCT_QUERY_LABELS);
function whatsappUrl(message) {
  const text = (message || 'Hello CarbideAxis, I would like to request a quotation.').trim();
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}
function inquiryEmailUrl(data, message) {
  const product = String(data.get('product') || '').trim();
  const subject = product ? `CarbideAxis inquiry: ${product}` : 'CarbideAxis inquiry';
  return `mailto:lunazhao520@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}
// R8 events use only controlled page/product identifiers.
function recordInteraction(name) {
  window.CarbideAxisInquiry?.record(name);
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
  return ['Hello CarbideAxis, I would like to request a quotation.', ...lines].join('\n');
}
document.addEventListener('DOMContentLoaded', () => {
  // Native details supports touch and keyboard without JavaScript.
  document.querySelectorAll('.nav-products').forEach(group => {
    const trigger = group.querySelector('summary');
    const panel = group.querySelector('.product-menu');
    const productsLink = group.querySelector('.nav-products-link');
    if (productsLink) {
      // The Products label is a real link: a plain click/tap navigates to the
      // product overview instead of toggling the menu. Modified clicks keep
      // native behaviour; the rest of the summary (chevron) still toggles.
      productsLink.addEventListener('click', event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        window.location.assign(productsLink.href);
      });
    }
    const desktopHover = window.matchMedia('(min-width:961px) and (hover:hover) and (pointer:fine)');
    let closeTimer;
    const cancelClose = () => window.clearTimeout(closeTimer);
    const close = () => { cancelClose(); group.open = false; };
    const fitPanel = () => {
      if (!group.open) return;
      const available = window.innerHeight - panel.getBoundingClientRect().top - 12;
      panel.style.maxHeight = `${Math.max(80, Math.min(500, available))}px`;
    };
    group.addEventListener('toggle', () => {
      if (group.open) fitPanel(); else cancelClose();
    });
    group.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse' || !desktopHover.matches) return;
      cancelClose(); group.open = true; fitPanel();
    });
    group.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'mouse' || !desktopHover.matches) return;
      cancelClose();
      closeTimer = window.setTimeout(() => {
        if (!group.contains(document.activeElement)) group.open = false;
      }, 180);
    });
    group.addEventListener('focusout', event => {
      if (!group.contains(event.relatedTarget)) close();
    });
    group.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
    document.addEventListener('pointerdown', event => {
      if (!group.contains(event.target)) close();
    });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !group.open) return;
      const focusWasInside = group.contains(document.activeElement);
      event.preventDefault(); close();
      if (focusWasInside) trigger.focus();
    });
    window.addEventListener('resize', fitPanel, { passive:true });
    window.addEventListener('scroll', fitPanel, { passive:true });
  });
  document.querySelectorAll('.product-card [data-product-inquiry]').forEach(link => {
    const product = link.closest('.product-card')?.querySelector('h3')?.textContent?.trim();
    if (!product) return;
    const message = `Hello CarbideAxis, I just viewed your ${product} and would like to discuss a project. Can we chat?`;
    link.href = whatsappUrl(message);
    link.setAttribute('aria-label', `Ask about ${product} on WhatsApp`);
  });
  document.querySelectorAll('[data-wa]').forEach(button => button.addEventListener('click', () => {
    recordInteraction('whatsapp_click'); openWhatsApp(button.dataset.wa);
  }));
  const params = new URLSearchParams(window.location.search);
  const productName = Object.hasOwn(PRODUCT_QUERY_LABELS, params.get('product') || '') ? PRODUCT_QUERY_LABELS[params.get('product')] : '';
  const pageParts = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '').split('/').filter(Boolean);
  const pageProductName = ['products', 'seo', 'landing', 'ads'].includes(pageParts[0])
    ? PRODUCT_QUERY_LABELS[pageParts[1] || ''] || '' : '';
  const intentName = {
    distributor: 'a stock order or private label supply',
    trial: 'a trial for a machining job',
    custom: 'a custom tool project'
  }[params.get('intent') || ''] || '';
  document.querySelectorAll('[data-contact-whatsapp]').forEach(link => {
    const topic = productName || intentName;
    const message = topic
      ? `Hello CarbideAxis, I would like to ask about ${topic}. Can we chat?`
      : 'Hello CarbideAxis, I would like to discuss a carbide tooling project. Can we chat?';
    link.href = whatsappUrl(message);
    if (productName) link.setAttribute('aria-label', `Ask about ${productName} on WhatsApp`);
  });
  if (productName) {
    const message = `Hello CarbideAxis, I just viewed your ${productName} and would like to discuss a project. Can we chat?`;
    document.querySelectorAll('.topbar a[href*="wa.me/"], .site-header .actions a[href*="wa.me/"], .footer a[href*="wa.me/"], .floating-wa').forEach(link => {
      link.href = whatsappUrl(message);
    });
  }
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
    updatePurposeDetails();
    const product = form.querySelector('[name="product"]');
    if (product && (productName || pageProductName) && !product.value.trim()) product.value = productName || pageProductName;
    // Keep general contact shortcuts in sync; product-card links keep their own topics.
    // Drafts stay on this page until the buyer chooses a contact channel.
    const whatsappShortcuts = [...document.querySelectorAll(
      '.topbar a[href*="wa.me/"], .site-header .actions a[href*="wa.me/"], .footer a[href*="wa.me/"], .floating-wa, [data-contact-whatsapp]'
    )];
    const emailShortcuts = [...document.querySelectorAll('a[href^="mailto:lunazhao520@gmail.com"]')];
    const syncDraftLinks = (edited = false) => {
      updatePurposeDetails();
      const data = new FormData(form);
      const message = buildRfqMessage(data);
      const waUrl = whatsappUrl(message);
      const emailUrl = inquiryEmailUrl(data, message);
      whatsappShortcuts.forEach(link => {
        link.href = waUrl;
        if (link.hasAttribute('data-contact-whatsapp')) {
          const product = String(data.get('product') || '').trim();
          link.setAttribute('aria-label', product ? `Continue in WhatsApp about ${product}` : 'Continue in WhatsApp');
        }
      });
      emailShortcuts.forEach(link => {
        link.href = emailUrl;
      });
      form.querySelectorAll('[data-rfq-retry]').forEach(link => {
        link.href = link.dataset.rfqRetry === 'email' ? emailUrl : waUrl;
      });
      const copyText = form.querySelector('[data-rfq-copy-text]');
      if (copyText) copyText.value = message;
      const copyStatus = form.querySelector('[data-rfq-copy-status]');
      if (edited && copyStatus) copyStatus.textContent = 'Details updated. Copy your revised message before sending.';
    };
    let started = false;
    const onDetailsChanged = () => {
      if (!started) { recordInteraction('inquiry_start'); started = true; }
      syncDraftLinks(true);
    };
    form.addEventListener('input', onDetailsChanged);
    form.addEventListener('change', onDetailsChanged);
    form.addEventListener('reset', () => window.setTimeout(() => syncDraftLinks(true), 0));
    window.addEventListener('pageshow', () => syncDraftLinks());
    [...whatsappShortcuts, ...emailShortcuts].forEach(link => {
      link.addEventListener('click', () => syncDraftLinks());
    });
    syncDraftLinks();
    const copyButton = form.querySelector('[data-rfq-copy]');
    const showCopyFallback = channel => {
      if (!copyButton) return;
      copyButton.hidden = false;
      copyButton.textContent = `${channel} not opening? Copy your message`;
    };
    if (copyButton) copyButton.addEventListener('click', async () => {
      if (!form.reportValidity()) return;
      syncDraftLinks();
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
        // Copying is not a received inquiry.
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
      syncDraftLinks();
      const data = new FormData(form);
      const message = buildRfqMessage(data);
      const channel = event.submitter?.dataset.rfqChannel || 'whatsapp';
      if (channel === 'web') {
        window.CarbideAxisInquiry?.submit(form);
        return;
      }
      if (channel === 'email') {
        const emailUrl = inquiryEmailUrl(data, message);
        const help = form.querySelector('.rfq-help');
        if (help) {
          help.replaceChildren(document.createTextNode('Email draft prepared. Review it and press Send in your email app. If it did not open, use this link: '));
          const retry = document.createElement('a');
          retry.dataset.rfqRetry = 'email';
          retry.addEventListener('click', () => syncDraftLinks());
          retry.href = emailUrl;
          retry.textContent = 'Open email draft';
          help.appendChild(retry);
        }
        recordInteraction('email_click');
        showCopyFallback('Email');
        window.location.href = emailUrl;
        return;
      }
      const url = whatsappUrl(message);
      const help = form.querySelector('.rfq-help');
      if (help) {
        help.replaceChildren(document.createTextNode('Draft prepared. Review it and press Send in WhatsApp to complete your inquiry. '));
        const retry = document.createElement('a');
        retry.dataset.rfqRetry = 'whatsapp';
        retry.addEventListener('click', () => syncDraftLinks());
        retry.href = url; retry.target = '_blank'; retry.rel = 'noopener noreferrer';
        retry.textContent = 'Open the WhatsApp draft';
        help.appendChild(retry);
      }
      recordInteraction('whatsapp_click');
      showCopyFallback('WhatsApp');
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  });
});
