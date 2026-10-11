/* Website Deals - content engine (cms.js)
   Applies everything edited in Admin -> Site Editor to every public page:
   theme colours + fonts, logo + brand name, text / image / link overrides, hidden blocks.
   Data key: websiteDealsSite (see shared/data.js).  Load AFTER shared/data.js.

   websiteDealsSite = {
     brand:{name, tagline, logo, favicon},
     theme:{accent, bg, text, fontHeading, fontBody},
     fx:{reveal, marquee, counters, spotlight, parallax, progress, grain, cursor},
     marquee:{items:[], speed},
     pages:{ "<pageKey>":{ text:{orig:new}, src:{orig:new}, href:{orig:new}, hide:[selector] } }
   } */
(function () {
  "use strict";
  var D = window.WDData;
  if (!D) return;
  var DEF_BRAND = "Website Deals";
  var CACHE = "wdSiteCache";
  var editing = /[?&]wdedit=1/.test(location.search) && window.parent !== window;
  window.WD_EDIT = editing;

  function readCache() { try { return JSON.parse(localStorage.getItem(CACHE) || "null"); } catch (e) { return null; } }
  function cfg() {
    var c = D.get("websiteDealsSite", null);
    if (c && typeof c === "object") return c;
    return readCache() || {};
  }
  function norm(t) { return String(t == null ? "" : t).replace(/\s+/g, " ").trim(); }
  function hex(c) { c = String(c || "").trim(); return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c) ? c : ""; }
  function rgb(h) {
    h = h.replace("#", ""); if (h.length === 3) h = h.replace(/(.)/g, "$1$1");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function toHex(a) { return "#" + a.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? "0" : "") + v.toString(16); }).join(""); }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function lum(a) { return (0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]) / 255; }

  /* ---------- THEME ---------- */
  var FONTS = {
    "Inter": "Inter:wght@400;500;600;700;800", "Playfair Display": "Playfair+Display:wght@500;600;700;800",
    "Cormorant Garamond": "Cormorant+Garamond:wght@500;600;700", "Poppins": "Poppins:wght@400;500;600;700;800",
    "Space Grotesk": "Space+Grotesk:wght@400;500;600;700", "Manrope": "Manrope:wght@400;500;600;700;800",
    "Plus Jakarta Sans": "Plus+Jakarta+Sans:wght@400;500;600;700;800", "Syne": "Syne:wght@500;600;700;800",
    "DM Serif Display": "DM+Serif+Display", "Hind Siliguri": "Hind+Siliguri:wght@400;600;700"
  };
  function applyTheme(c) {
    var t = c.theme || {}, root = document.documentElement, css = "";
    var acc = hex(t.accent);
    if (acc) {
      var a = rgb(acc), dk = toHex(mix(a, [0, 0, 0], 0.2)), on = lum(a) > 0.55 ? "#0b0d0c" : "#ffffff";
      css += "--lime:" + acc + ";--accent:" + acc + ";--lime-dark:" + dk + ";--on-accent:" + on +
        ";--lime-soft:rgba(" + a.join(",") + ",.10);--lime-border:rgba(" + a.join(",") + ",.28);--accent-rgb:" + a.join(",") + ";";
    }
    var bg = hex(t.bg);
    if (bg) {
      var b = rgb(bg), up = lum(b) < 0.5 ? [255, 255, 255] : [0, 0, 0];
      var s1 = toHex(mix(b, up, 0.04)), s2 = toHex(mix(b, up, 0.08)), s3 = toHex(mix(b, up, 0.12));
      ["--bg", "--ink"].forEach(function (v) { css += v + ":" + bg + ";"; });
      ["--bg2", "--bg-soft", "--ink-soft", "--ink-2"].forEach(function (v) { css += v + ":" + s1 + ";"; });
      ["--panel", "--surface", "--card", "--ink-3"].forEach(function (v) { css += v + ":" + s2 + ";"; });
      ["--panel2", "--panel-2", "--surface-2", "--card-2"].forEach(function (v) { css += v + ":" + s3 + ";"; });
    }
    var tx = hex(t.text);
    if (tx) css += "--text:" + tx + ";";
    var st = document.getElementById("wd-theme");
    if (!st) { st = document.createElement("style"); st.id = "wd-theme"; document.head.appendChild(st); }
    var fh = FONTS[t.fontHeading] ? t.fontHeading : "", fb = FONTS[t.fontBody] ? t.fontBody : "";
    var out = css ? ":root{" + css + "}" : "";
    if (fb) out += "body,button,input,textarea,select{font-family:'" + fb + "','Hind Siliguri',Arial,sans-serif!important}";
    if (fh) out += "h1,h2,h3,h4,.display,.brand b,.brand-name{font-family:'" + fh + "','Hind Siliguri',Arial,sans-serif!important}";
    st.textContent = out;
    [fh, fb].forEach(function (f) {
      if (!f) return; var id = "wd-font-" + f.replace(/\W/g, "");
      if (document.getElementById(id)) return;
      var l = document.createElement("link"); l.id = id; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=" + FONTS[f] + "&display=swap"; document.head.appendChild(l);
    });
    var fx = c.fx || {};
    ["reveal", "marquee", "counters", "spotlight", "parallax", "progress", "grain", "cursor"].forEach(function (k) {
      root.classList.toggle("fx-no-" + k, fx[k] === false);
    });
    if (fx.cursor === true) root.classList.add("fx-on-cursor");
  }

  /* ---------- BRAND ---------- */
  var LOGO_SEL = ".logo,.brand-mark,.mark,.brand-logo,[data-brand-logo]";
  function safeImg(u) { u = String(u || ""); return /^(data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,|https?:\/\/|\.\.?\/|wdm:[a-z0-9]+$)/i.test(u) ? u : ""; }
  /* "wdm:<id>" = image stored in Firestore media/<id>; resolved to a data URL (draft -> cache -> Firestore) */
  var pending = {};
  function res(u) {
    u = safeImg(u); if (!u) return "";
    if (u.indexOf("wdm:") !== 0) return u;
    var id = u.slice(4), v = "";
    try { var dr = D.mediaDraft ? D.mediaDraft() : {}; v = dr[id] || localStorage.getItem("wdMedia:" + id) || ""; } catch (e) { }
    if (v) return v;
    if (!pending[id]) {
      pending[id] = 1;
      D.loadFirebase().then(function (f) { return f && f.enabled ? f.readMedia(id) : null; }).then(function (d) {
        if (d) { try { localStorage.setItem("wdMedia:" + id, d); } catch (e) { } run(); }
      }).catch(function () { });
    }
    return "";
  }
  function applyBrand(c) {
    var b = c.brand || {}, logo = safeImg(b.logo);
    var els = document.querySelectorAll(LOGO_SEL);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el.dataset.wdLogoOrig) el.dataset.wdLogoOrig = el.innerHTML;
      if (logo) {
        if (el.dataset.wdLogoSet !== logo) {
          el.dataset.wdLogoSet = logo;
          el.innerHTML = "";
          var im = document.createElement("img"); im.src = logo; im.alt = b.name || DEF_BRAND;
          im.style.cssText = "width:100%;height:100%;object-fit:contain;display:block;border-radius:inherit";
          el.appendChild(im); el.style.background = "transparent"; el.style.padding = "0"; el.style.overflow = "hidden";
        }
      } else if (el.dataset.wdLogoSet) {
        el.innerHTML = el.dataset.wdLogoOrig; delete el.dataset.wdLogoSet;
      }
    }
    var fav = res(b.favicon || b.logo);
    if (fav) {
      var l = document.querySelector("link[rel~='icon']");
      if (!l) { l = document.createElement("link"); l.rel = "icon"; document.head.appendChild(l); }
      if (l.href !== fav) l.href = fav;
    }
    replaceSubstr(norm(b.name));
    if (b.tagline) {
      var tg = document.querySelectorAll("[data-brand-tagline],.brand small,.brand-sub");
      for (var j = 0; j < tg.length; j++) if (tg[j].children.length === 0) tg[j].textContent = b.tagline;
    }
  }
  function textNodes(root) {
    var out = [], w = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode && n.parentNode.nodeName;
        return (p === "SCRIPT" || p === "STYLE" || p === "NOSCRIPT" || p === "TEXTAREA") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    while (w.nextNode()) out.push(w.currentNode);
    return out;
  }
  function replaceSubstr(target) {
    var tdefault = !target || target === DEF_BRAND;
    textNodes().forEach(function (n) {
      if (n._wdOrig != null) return; /* text overrides win over the brand name */
      var base = n._wdBrandOrig != null ? n._wdBrandOrig : n.nodeValue;
      if (base.indexOf(DEF_BRAND) < 0) return;
      var nv = tdefault ? base : base.split(DEF_BRAND).join(target);
      if (n.nodeValue !== nv) n.nodeValue = nv;
      n._wdBrandOrig = tdefault ? null : base;
    });
    /* brand split over child elements, e.g. <b>Website<span>Deals</span></b> */
    var compact = function (t) { return String(t).replace(/\s+/g, ""); }, want = compact(DEF_BRAND);
    var cand = document.querySelectorAll(".brand *, .brand-text *, .brand-name, [class*='brand'] b, [class*='brand'] strong, [class*='logo-text']");
    for (var i = 0; i < cand.length; i++) {
      var el = cand[i];
      if (el.children.length < 1 || el.children.length > 2 || el.querySelector("*:not(span):not(b):not(i):not(em):not(strong)")) continue;
      var tn = textNodes(el);
      if (el.dataset.wdSplit) {
        if (tdefault) { var o = JSON.parse(el.dataset.wdSplit); tn.forEach(function (n, k) { if (o[k] != null) n.nodeValue = o[k]; }); delete el.dataset.wdSplit; }
        else if (tn[0] && tn[0].nodeValue !== target) { tn[0].nodeValue = target; }
        continue;
      }
      if (tdefault || compact(el.textContent) !== want || !tn.length) continue;
      el.dataset.wdSplit = JSON.stringify(tn.map(function (n) { return n.nodeValue; }));
      tn.forEach(function (n, k) { n.nodeValue = k === 0 ? target : ""; });
    }
    if (!document._wdTitle) document._wdTitle = document.title;
    var nt = tdefault ? document._wdTitle : document._wdTitle.split(DEF_BRAND).join(target);
    if (document.title !== nt) document.title = nt;
  }

  /* ---------- OVERRIDES (text / src / href / hide) ---------- */
  function pageCfg(c) { var p = (c.pages || {})[D.pageKey()]; return p && typeof p === "object" ? p : {}; }
  function applyOverrides(c) {
    var pc = pageCfg(c), T = pc.text || {}, S = pc.src || {}, H = pc.href || {};
    var tk = Object.keys(T);
    if (tk.length) {
      textNodes().forEach(function (n) {
        var orig = n._wdOrig != null ? n._wdOrig : norm(n.nodeValue);
        if (!orig) return;
        var key = n._wdBrandOrig != null ? norm(n._wdBrandOrig) : orig;
        var hit = Object.prototype.hasOwnProperty.call(T, key) ? key : (Object.prototype.hasOwnProperty.call(T, orig) ? orig : null);
        if (hit == null) return;
        var nv = T[hit];
        if (norm(n.nodeValue) !== norm(nv)) {
          var lead = /^\s*/.exec(n.nodeValue)[0], trail = /\s*$/.exec(n.nodeValue)[0];
          n._wdOrig = hit; n.nodeValue = lead + nv + trail;
        } else n._wdOrig = hit;
      });
    }
    var sk = Object.keys(S);
    if (sk.length) {
      var imgs = document.querySelectorAll("img[src],source[srcset],[style*='background-image']");
      for (var i = 0; i < imgs.length; i++) {
        var el = imgs[i];
        if (el.tagName === "IMG") {
          var o = el.getAttribute("data-wd-src") || el.getAttribute("src");
          if (Object.prototype.hasOwnProperty.call(S, o)) { var rv = res(S[o]); if (rv) { el.setAttribute("data-wd-src", o); if (el.getAttribute("src") !== rv) el.setAttribute("src", rv); } }
        } else {
          var m = /url\((['"]?)(.*?)\1\)/.exec(el.getAttribute("style") || "");
          var bgo = el.getAttribute("data-wd-bg") || (m && m[2]);
          if (bgo && Object.prototype.hasOwnProperty.call(S, bgo)) { var bv = res(S[bgo]); if (bv) { el.setAttribute("data-wd-bg", bgo); el.style.backgroundImage = "url('" + bv + "')"; } }
        }
      }
    }
    var hk = Object.keys(H);
    if (hk.length) {
      var as = document.querySelectorAll("a[href]");
      for (var j = 0; j < as.length; j++) {
        var a = as[j], oh = a.getAttribute("data-wd-href") || a.getAttribute("href");
        if (Object.prototype.hasOwnProperty.call(H, oh) && /^(https?:|mailto:|tel:|\.{0,2}\/|#)/i.test(H[oh])) { a.setAttribute("data-wd-href", oh); if (a.getAttribute("href") !== H[oh]) a.setAttribute("href", H[oh]); }
      }
    }
    var hide = pc.hide || [];
    for (var h = 0; h < hide.length; h++) {
      var els; try { els = document.querySelectorAll(hide[h]); } catch (e) { continue; }
      for (var q = 0; q < els.length; q++) {
        if (editing) els[q].style.opacity = ".25"; else els[q].style.display = "none";
        els[q].setAttribute("data-wd-hidden", "1");
      }
    }
  }

  /* ---------- MAIN ---------- */
  var busy = false, timer = null;
  function run() {
    if (busy) return;
    /* never touch the page while someone is typing in the Site Editor */
    if (editing && document.querySelector("[contenteditable=true]")) return;
    busy = true;
    try {
      var c = cfg();
      applyTheme(c); applyBrand(c); applyOverrides(c);
      window.dispatchEvent(new CustomEvent("wd:applied", { detail: c }));
    } catch (e) { if (window.console) console.warn("cms:", e); }
    busy = false;
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(run, 120); }
  function saveCache() {
    try { var r = D.get("websiteDealsSite", null); if (r && !editing) localStorage.setItem(CACHE, JSON.stringify(r)); } catch (e) { }
  }
  var rdy = false;
  function ready() { if (rdy) return; rdy = true; window.__wdReady = true; try { window.dispatchEvent(new Event("wd:ready")); } catch (e) { } }
  if (readCache() || editing) ready();
  window.addEventListener("wd:data-ready", ready);
  setTimeout(ready, 1200);
  window.WDCms = { res: res, run: run, cfg: cfg, norm: norm, FONTS: FONTS, textNodes: textNodes, safeImg: safeImg };
  function boot() {
    run();
    try { new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true }); } catch (e) { }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  window.addEventListener("wd:data-ready", function () { saveCache(); run(); });
  window.addEventListener("wd:site-edited", run);
  window.addEventListener("storage", function (e) { if (!e.key || e.key === "websiteDealsSite" || e.key === "wdMediaDraft") run(); });
  if (editing) { var es = document.createElement("script"); es.src = D.root + "shared/editor-frame.js"; document.head.appendChild(es); }
  /* theme before first paint (from cache) */
  try { applyTheme(cfg()); } catch (e) { }
})();
