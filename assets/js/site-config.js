// Public configuration only. Never put passwords, API keys or mail credentials here.
// Blank endpoints keep web submission and remote measurement switched off.
window.CARBIDEAXIS_CONFIG = Object.freeze({
  inquiryEndpoint: 'https://api.web3forms.com/submit', // Web3Forms receiver (wired 2026-11-03). Adapter in inquiry-service.js maps its {"success":true} reply onto the {"ok":true} contract.
  analyticsEndpoint: '', // Optional HTTPS receiver for name/page/product ONLY.
  analyticsTag: '' // Optional global function name; receives the same three-field object.
});
