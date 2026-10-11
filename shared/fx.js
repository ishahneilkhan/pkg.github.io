/* Website Deals - fx.js : motion engine. Load AFTER cms.js (needs html.fx-no-* flags).
   Markup hooks (all optional):
     data-reveal="up|left|right|zoom|blur"  data-delay="0.1"   scroll reveal
     data-split                              headline word-by-word reveal
     data-count="120" data-suffix="+"        animated number
     data-parallax="0.15"                    parallax speed
     .wd-marquee > .wd-marquee-track         infinite text scroll (built by WDFx.marquee)
     .wd-spot                                pointer spotlight card
     .wd-mag                                 magnetic button
   Pages without hooks still get a gentle auto-reveal (below the fold only). */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var editing = !!window.WD_EDIT;
  var io = null, seen = new WeakSet();
  function cfg() { try { return (window.WDCms && WDCms.cfg().fx) || {}; } catch (e) { return {}; } }
  function off(k) { return root.classList.contains("fx-no-" + k); }
  function speed() { var s = parseFloat((cfg() || {}).speed); return s > 0 ? s : 1; }

  /* ---------- reveal ---------- */
  var AUTO = "main > section h2, main > section .sub, section.s h2, section.s .sub, .card, .pk, .panel, .feature, .stat, .faq-item, details, " +
    "[class*='card']:not(body):not(html), [class*='grid'] > *, [class*='list'] > li, .section-head, .hero-copy, footer .container";
  function arm(el, i) {
    if (seen.has(el) || el.closest("[data-no-fx]")) return;
    seen.add(el);
    var r = el.getBoundingClientRect();
    if (r.top < innerHeight * 0.95 && r.bottom > 0) { el.classList.add("wd-in"); return; } /* already visible: leave alone */
    el.classList.add("wd-pre");
    var d = el.getAttribute("data-delay");
    if (d != null) el.style.setProperty("--d", d + "s");
    else if (el.parentElement) {
      var idx = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.setProperty("--d", Math.min(idx, 6) * 0.07 + "s");
    }
    io && io.observe(el);
  }
  function scan() {
    if (reduce || editing) return;
    var list = document.querySelectorAll("[data-reveal],[data-split]");
    for (var i = 0; i < list.length; i++) arm(list[i], i);
    var auto = document.querySelectorAll(AUTO);
    for (var j = 0; j < auto.length; j++) {
      var el = auto[j];
      if (el.hasAttribute("data-reveal") || el.closest(".wd-pre,.wd-marquee,header,nav,.nav,.topbar,.salah,iframe")) continue;
      if (el.offsetHeight < 28 || el.offsetHeight > innerHeight * 1.4) continue;
      arm(el, j);
    }
  }
  function initReveal() {
    if (!("IntersectionObserver" in window)) return;
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("wd-in"); io.unobserve(e.target); if (e.target.hasAttribute("data-count")) count(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    scan();
  }

  /* ---------- split headline ---------- */
  function splitNode(node, ctr) {
    [].slice.call(node.childNodes).forEach(function (k) {
      if (k.nodeType === 3) {
        var frag = document.createDocumentFragment();
        k.nodeValue.split(/(\s+)/).forEach(function (w) {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(" ")); return; }
          var s = document.createElement("span"); s.className = "w"; s.setAttribute("aria-hidden", "true");
          var n = document.createElement("i"); n.style.setProperty("--i", String(ctr.i++)); n.textContent = w; s.appendChild(n); frag.appendChild(s);
        });
        node.replaceChild(frag, k);
      } else if (k.nodeType === 1 && k.nodeName !== "BR") splitNode(k, ctr);
    });
  }
  function split(el) {
    if (el.dataset.wdSplit) return;
    el.dataset.wdSplit = "1"; el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    el.classList.add("wd-split"); splitNode(el, { i: 0 });
  }
  function splits() {
    if (reduce || editing || off("reveal")) { root.classList.add("wd-fx-ready"); return; }
    if (!window.__wdReady) { window.addEventListener("wd:ready", splits, { once: true }); return; }
    var els = document.querySelectorAll("[data-split]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i]; split(el);
      if (!el.classList.contains("wd-in")) {
        var r = el.getBoundingClientRect();
        if (r.top < innerHeight) requestAnimationFrame(function (e) { return function () { e.classList.add("wd-in"); }; }(el));
        else io && io.observe(el);
      }
    }
    root.classList.add("wd-fx-ready");
  }

  /* ---------- counters ---------- */
  function count(el) {
    if (el.dataset.wdCounted) return; el.dataset.wdCounted = "1";
    var node = el.firstChild; if (!node || node.nodeType !== 3) return;
    var txt = node.nodeValue, m = /^(\D*?)(\d[\d,]*(?:\.\d+)?)([\s\S]*)$/.exec(txt.trim());
    if (!m || off("counters") || reduce || editing) return;
    var pre = m[1], to = parseFloat(m[2].replace(/,/g, "")), suf = m[3];
    var t0 = performance.now(), dur = 1800 / speed();
    (function tick(t) {
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      node.nodeValue = p < 1 ? pre + Math.round(to * e).toLocaleString("en-US") + suf : txt;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  function counters() {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length) return;
    var o = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { count(e.target); o.unobserve(e.target); } }); }, { threshold: 0.4 });
    for (var i = 0; i < els.length; i++) { if (!els[i].dataset.wdCounted) o.observe(els[i]); }
  }

  /* ---------- marquee ---------- */
  function marquee(el, items, opts) {
    opts = opts || {};
    var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
    var unit = items.map(function (t) { return '<span class="mq-item">' + esc(t) + '</span><span class="mq-sep" aria-hidden="true">' + (opts.sep || "✦") + "</span>"; }).join("");
    var rep = unit; while (rep.length < 900 && items.length) rep += unit;   /* enough width for one half */
    el.classList.add("wd-marquee"); if (opts.reverse) el.classList.add("rev");
    el.style.setProperty("--mq", (opts.duration || 40) + "s");
    el.innerHTML = '<div class="wd-marquee-track"><div class="mq-half">' + rep + '</div><div class="mq-half" aria-hidden="true">' + rep + "</div></div>";
    var halves = el.querySelectorAll(".mq-half");
    for (var i = 0; i < halves.length; i++) halves[i].style.cssText = "display:inline-flex;align-items:center;flex:none";
  }

  /* ---------- parallax + progress ---------- */
  var par = [], ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY || 0, h = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      var bar = document.getElementById("wd-progress"); if (bar) bar.style.transform = "scaleX(" + Math.min(1, y / h) + ")";
      if (!off("parallax") && !reduce)
        for (var i = 0; i < par.length; i++) {
          var el = par[i], sp = parseFloat(el.getAttribute("data-parallax")) || 0.12, r = el.parentElement.getBoundingClientRect();
          var off2 = Math.max(-90, Math.min(90, (r.top + r.height / 2 - innerHeight / 2) * -sp));
          el.style.transform = "translate3d(0," + off2.toFixed(1) + "px,0)";
        }
    });
  }
  function parallax() { par = [].slice.call(document.querySelectorAll("[data-parallax]")); onScroll(); }

  /* ---------- pointer effects ---------- */
  function pointer() {
    document.addEventListener("pointermove", function (e) {
      var s = e.target.closest && e.target.closest(".wd-spot");
      if (s && !off("spotlight")) { var r = s.getBoundingClientRect(); s.style.setProperty("--mx", e.clientX - r.left + "px"); s.style.setProperty("--my", e.clientY - r.top + "px"); }
      var cur = document.getElementById("wd-cursor");
      if (cur && root.classList.contains("fx-on-cursor")) { cur.classList.add("on"); cur.style.transform = "translate3d(" + e.clientX + "px," + e.clientY + "px,0)"; }
    }, { passive: true });
    document.addEventListener("pointermove", function (e) {
      if (reduce) return;
      var m = e.target.closest && e.target.closest(".wd-mag");
      if (!m) return;
      var r = m.getBoundingClientRect(), x = (e.clientX - (r.left + r.width / 2)) * 0.18, y = (e.clientY - (r.top + r.height / 2)) * 0.28;
      m.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
      m._mag = 1;
    }, { passive: true });
    document.addEventListener("pointerout", function (e) {
      var m = e.target.closest && e.target.closest(".wd-mag"); if (m && m._mag) { m.style.transform = ""; m._mag = 0; }
    });
  }

  /* ---------- chrome (progress bar, grain, cursor) ---------- */
  function chrome() {
    if (editing) return;
    [["wd-progress", "wd-progress"], ["wd-grain", "wd-grain"], ["wd-cursor", "wd-cursor"]].forEach(function (p) {
      if (document.getElementById(p[0])) return;
      var d = document.createElement("div"); d.id = p[0]; d.className = p[1]; d.setAttribute("aria-hidden", "true"); document.body.appendChild(d);
    });
  }

  function applySpeed() { root.style.setProperty("--wd-speed", String(speed())); }
  function init() {
    root.classList.add("wd-fx"); applySpeed(); chrome(); initReveal(); splits(); counters(); parallax(); pointer();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    var t = null;
    window.addEventListener("wd:applied", function () { applySpeed(); clearTimeout(t); t = setTimeout(function () { scan(); splits(); counters(); parallax(); }, 80); });
    var mo = null;
    try { mo = new MutationObserver(function () { clearTimeout(t); t = setTimeout(function () { scan(); splits(); counters(); parallax(); }, 160); }); mo.observe(document.body, { childList: true, subtree: true }); } catch (e) { }
  }
  window.WDFx = { marquee: marquee, scan: scan, count: count };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
