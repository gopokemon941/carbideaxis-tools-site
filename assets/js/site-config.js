// Public configuration only. Never put passwords, API keys or mail credentials here.
// Blank endpoints keep web submission and remote measurement switched off.
window.CARBIDEAXIS_CONFIG = Object.freeze({
  inquiryEndpoint: '', // HTTPS receiver: POST JSON; success requires HTTP 2xx AND {"ok":true}.
  analyticsEndpoint: '', // Optional HTTPS receiver for name/page/product ONLY.
  analyticsTag: '' // Optional global function name; receives the same three-field object.
});
