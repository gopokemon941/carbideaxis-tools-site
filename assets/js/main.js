
const WA_NUMBER='8618632930296';
function openWhatsApp(message){
  const text=encodeURIComponent(message||'Hello CarbideAxis Tools, I would like to request a quotation.');
  window.open(`https://wa.me/${WA_NUMBER}?text=${text}`,'_blank');
}
document.addEventListener('DOMContentLoaded',()=>{
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
