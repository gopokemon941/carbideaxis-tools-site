const WA_NUMBER='8617745168691';

function getInquirySource(){
  const params=new URLSearchParams(window.location.search);
  const utm=['utm_source','utm_medium','utm_campaign','utm_term','utm_content']
    .map(key=>params.get(key)?`${key}: ${params.get(key)}`:'')
    .filter(Boolean);
  const source=`Source page: ${window.location.pathname||'/'}`;
  return utm.length?`${source}\n${utm.join(' | ')}`:source;
}

function withInquirySource(message){
  const text=(message||'Hello CarbideAxis Tools, I would like to request a quotation.').trim();
  return text.includes('Source page:')?text:`${text}\n\n${getInquirySource()}`;
}

function openWhatsApp(message){
  const text=encodeURIComponent(withInquirySource(message));
  window.open(`https://wa.me/${WA_NUMBER}?text=${text}`,'_blank','noopener');
}

document.addEventListener('DOMContentLoaded',()=>{
  const mobileToggle=document.querySelector('.mobile-toggle');
  const siteMenu=document.querySelector('.menu');
  if(mobileToggle&&siteMenu){
    mobileToggle.setAttribute('aria-expanded','false');
    mobileToggle.addEventListener('click',()=>{
      const isOpen=siteMenu.classList.toggle('is-open');
      mobileToggle.setAttribute('aria-expanded',String(isOpen));
    });
    siteMenu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{
      siteMenu.classList.remove('is-open');
      mobileToggle.setAttribute('aria-expanded','false');
    }));
  }

  document.querySelectorAll('a[href*="wa.me/8617745168691"]').forEach(link=>{
    link.addEventListener('click',()=>{
      const url=new URL(link.href);
      const message=url.searchParams.get('text')||'';
      url.searchParams.set('text',withInquirySource(message));
      link.href=url.toString();
    });
  });

  document.querySelectorAll('[data-wa]').forEach(btn=>btn.addEventListener('click',()=>openWhatsApp(btn.dataset.wa)));
  document.querySelectorAll('form[data-rfq]').forEach(form=>{
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const data=new FormData(form);
      const lines=[
        'Hello CarbideAxis Tools, I would like to request a quotation.',
        `Name: ${data.get('name')||''}`,
        `Company: ${data.get('company')||''}`,
        `Email / WhatsApp: ${data.get('contact')||data.get('email')||''}`,
        `Product: ${data.get('product')||''}`,
        `Quantity: ${data.get('quantity')||''}`,
        `Material / Application: ${data.get('material')||''}`,
        `Message: ${data.get('message')||''}`
      ].filter(line=>!line.endsWith(': '));
      openWhatsApp(lines.join('\n'));
    });
  });
});
