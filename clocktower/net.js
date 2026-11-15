/* ساعة الغدر — messaging over ntfy.sh + end-to-end encryption helpers. */
(function (root) {
'use strict';
var NTFY = root.CT_NTFY || 'https://ntfy.sh/';
function topic(room) { return 'saatghadr_' + room; }
function b64(buf) { var u = new Uint8Array(buf), s = ''; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }
function ub64(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
var status = null, listeners = [];
function setNet(ok) { if (status !== ok) { status = ok; listeners.forEach(function (f) { f(ok); }); } }

/* Subscribe: live stream (SSE); falls back to slow polling only when the stream is down. */
function connect(room, onMsg) {
  var seen = {}, t = topic(room), live = false, lastLive = 0;
  function handle(o) { if (!o || o.event !== 'message' || seen[o.id]) return; seen[o.id] = 1; var m; try { m = JSON.parse(o.message); } catch (e) { return; } try { onMsg(m); } catch (e) { console.error(e); } }
  try {
    var es = new EventSource(NTFY + t + '/sse?since=all');
    es.onopen = function () { live = true; lastLive = Date.now(); setNet(true); };
    es.onmessage = function (e) { live = true; lastLive = Date.now(); setNet(true); try { handle(JSON.parse(e.data)); } catch (_) {} };
    es.addEventListener('keepalive', function () { live = true; lastLive = Date.now(); });
    es.onerror = function () { live = false; };
  } catch (e) {}
  function poll() {
    return fetch(NTFY + t + '/json?poll=1&since=all').then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (txt) {
      setNet(true); txt.split('\n').forEach(function (l) { if (l.trim()) { try { handle(JSON.parse(l)); } catch (_) {} } });
    }).catch(function () { setNet(false); });
  }
  setTimeout(function () { if (!live) poll(); }, 5000);
  setInterval(function () { if (!live || Date.now() - lastLive > 90000) poll(); }, 8000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) poll(); });
}
function publish(room, obj, tries) {
  tries = tries || 0;
  return fetch(NTFY + topic(room), { method: 'POST', body: JSON.stringify(obj) }).then(function (r) { if (!r.ok) throw new Error(r.status); setNet(true); })
    .catch(function (e) { setNet(false); if (tries < 5) return new Promise(function (res) { setTimeout(res, 1500 * (tries + 1)); }).then(function () { return publish(room, obj, tries + 1); }); throw e; });
}

var RSA = { name: 'RSA-OAEP', hash: 'SHA-256' };
function genKeys() {
  return crypto.subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['encrypt', 'decrypt'])
    .then(function (kp) { return Promise.all([crypto.subtle.exportKey('jwk', kp.privateKey), crypto.subtle.exportKey('spki', kp.publicKey)]); })
    .then(function (r) { return { priv: r[0], pub: b64(r[1]) }; });
}
var pkCache = {};
function encryptFor(pub, obj) {
  var iv = crypto.getRandomValues(new Uint8Array(12)), pk, ak, ct;
  return (pkCache[pub] ? Promise.resolve(pkCache[pub]) : crypto.subtle.importKey('spki', ub64(pub), RSA, false, ['encrypt']).then(function (k) { return (pkCache[pub] = k); }))
    .then(function (k) { pk = k; return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']); })
    .then(function (k) { ak = k; return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, ak, new TextEncoder().encode(JSON.stringify(obj))); })
    .then(function (c) { ct = c; return crypto.subtle.exportKey('raw', ak); })
    .then(function (raw) { return crypto.subtle.encrypt({ name: 'RSA-OAEP' }, pk, raw); })
    .then(function (k) { return { k: b64(k), iv: b64(iv), c: b64(ct) }; });
}
var skCache = new WeakMap();
function decryptWith(priv, m) {
  var sk = skCache.get(priv);
  return (sk ? Promise.resolve(sk) : crypto.subtle.importKey('jwk', priv, RSA, false, ['decrypt']).then(function (k) { skCache.set(priv, k); return k; }))
    .then(function (sk) { return crypto.subtle.decrypt({ name: 'RSA-OAEP' }, sk, ub64(m.k)); })
    .then(function (raw) { return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']); })
    .then(function (ak) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: ub64(m.iv) }, ak, ub64(m.c)); })
    .then(function (pt) { return JSON.parse(new TextDecoder().decode(pt)); });
}
function rid(n) { var a = 'abcdefghijkmnpqrstuvwxyz23456789', b = crypto.getRandomValues(new Uint8Array(n)), s = ''; for (var i = 0; i < n; i++) s += a[b[i] % a.length]; return s; }
function qrSVG(text) {
  try {
    var q = new QRCode(-1, QRErrorCorrectLevel.M); q.addData(text); q.make();
    var n = q.getModuleCount(), m = 4, s = n + m * 2, d = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + m) + ' ' + (r + m) + 'h1v1h-1z';
    return '<svg viewBox="0 0 ' + s + ' ' + s + '" shape-rendering="crispEdges" role="img" aria-label="رمز QR للانضمام"><rect width="' + s + '" height="' + s + '" fill="#fff"/><path d="' + d + '" fill="#0E1220"/></svg>';
  } catch (e) { return '<p style="color:#0E1220;text-align:center">تعذّر إنشاء الرمز، شارك الرابط بدلاً منه.</p>'; }
}
root.CTNet = { connect: connect, publish: publish, genKeys: genKeys, encryptFor: encryptFor, decryptWith: decryptWith, rid: rid, qrSVG: qrSVG,
  onStatus: function (f) { listeners.push(f); }, status: function () { return status; } };
})(typeof window !== 'undefined' ? window : globalThis);
