
const WA_NUMBER='8617745168691';
function openWhatsApp(message){
  const text=encodeURIComponent(message||'Hello CarbideAxis Tools, I would like to request a quotation.');
  window.open(`https://wa.me/${WA_NUMBER}?text=${text}`,'_blank');
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
      ];
      openWhatsApp(lines.join('\n'));
    });
  });
});
