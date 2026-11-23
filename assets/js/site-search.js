(function () {
  var input = document.getElementById('site-search-input');
  var box = document.getElementById('site-search-results');
  if (!input || !box) return;
  var index = null, loading = false;
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function load() {
    if (index || loading) return; loading = true;
    fetch('/assets/search-index.json?v=20261123-3').then(function (r) { return r.json(); }).then(function (d) { index = d; render(); }).catch(function () { loading = false; });
  }
  function score(e, q, rawUpper) {
    var s = 0, i;
    for (i = 0; i < e.c.length; i++) {
      if (e.c[i] === q) { s += 100; if (e.u.indexOf('/products/') === 0) s += 20; }
      else if (e.c[i].indexOf(q) === 0) s += 60;
      else if (e.c[i].indexOf(q) > -1) s += 30;
    }
    var fam = q.slice(0, 4);
  if (/^[A-Z]{4}[0-9]/.test(q) && e.t.toUpperCase().indexOf(fam) === 0) s += 50;
  if (e.t.toUpperCase().indexOf(q) > -1) s += 25;
    if (e.h.toUpperCase().indexOf(q) > -1) s += 12;
    if (e.d.toUpperCase().indexOf(q) > -1) s += 6;
    if (s === 0 && rawUpper.length > 2) {
      var all = (e.t + ' ' + e.h + ' ' + e.d + ' ' + e.c.join(' ')).toUpperCase();
      var words = rawUpper.split(/\s+/), ok = true;
      for (i = 0; i < words.length; i++) { if (all.indexOf(words[i]) === -1) { ok = false; break; } }
      if (ok) s = 5;
    }
    return s;
  }
  function render() {
    var raw = input.value.trim();
    if (!index || raw.length < 2) { box.innerHTML = ''; return; }
    var q = raw.toUpperCase().replace(/[\s-]/g, '');
    var hits = index.map(function (e) { return { e: e, s: score(e, q, raw.toUpperCase()) }; })
      .filter(function (x) { return x.s > 0; })
      .sort(function (a, b) { return b.s - a.s; }).slice(0, 8);
    if (!hits.length) {
      box.innerHTML = '<div class="ss-none">No match on the site — send us the code or a photo and we will match it for you.</div>';
      return;
    }
    box.innerHTML = hits.map(function (x) {
      return '<a href="' + x.e.u + '"><span class="ss-t">' + esc(x.e.t) + '</span><span class="ss-d">' + esc(x.e.d.slice(0, 140)) + '</span></a>';
    }).join('');
  }
  input.addEventListener('focus', load);
  input.addEventListener('input', function () { load(); render(); });
})();
