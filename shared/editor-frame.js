/* Website Deals - editor-frame.js
   Loaded by cms.js ONLY when a page is opened inside Admin -> Site Editor (?wdedit=1 in an iframe).
   Click any element to edit text, replace an image, change a link, hide/show it, or reset it.
   Changes are written to localStorage "websiteDealsSite" (same origin as the admin) -> use Publish to go live. */
(function () {
  "use strict";
  if (!window.WD_EDIT || !window.WDData || !window.WDCms) return;
  var D = window.WDData, C = window.WDCms, KEY = "websiteDealsSite", norm = C.norm;
  var sel = null, editing = null, tb = null, fileIn = null;

  /* ---------- data ---------- */
  function cfg() { try { return JSON.parse(JSON.stringify(C.cfg() || {})); } catch (e) { return {}; } }
  function pageOf(c) { c.pages = c.pages || {}; var k = D.pageKey(); c.pages[k] = c.pages[k] || {}; var p = c.pages[k]; p.text = p.text || {}; p.src = p.src || {}; p.href = p.href || {}; p.hide = p.hide || []; return p; }
  function commit(c) {
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { alert("Could not save: browser storage is full. Remove some images and try again."); return; }
    try { parent.postMessage({ wd: "dirty" }, "*"); } catch (e) { }
    window.dispatchEvent(new Event("wd:site-edited"));
  }

  /* ---------- helpers ---------- */
  function keyOf(n) { return n._wdOrig != null ? n._wdOrig : norm(n._wdBrandOrig != null ? n._wdBrandOrig : n.nodeValue); }
  function ownTexts(el) { var o = []; for (var i = 0; i < el.childNodes.length; i++) { var n = el.childNodes[i]; if (n.nodeType === 3 && norm(n.nodeValue)) o.push(n); } return o; }
  function pathOf(el) {
    var parts = [];
    while (el && el.nodeType === 1 && el !== document.body) {
      if (el.id && /^[A-Za-z][\w-]*$/.test(el.id)) { parts.unshift("#" + el.id); break; }
      var tag = el.tagName.toLowerCase(), i = 1, s = el;
      while ((s = s.previousElementSibling)) if (s.tagName === el.tagName) i++;
      parts.unshift(tag + ":nth-of-type(" + i + ")");
      el = el.parentElement;
    }
    return parts.join(" > ");
  }
  function bgOf(el) { var m = /url\((['"]?)(.*?)\1\)/.exec(el.getAttribute("style") || ""); return m ? (el.getAttribute("data-wd-bg") || m[2]) : ""; }
  function imgTarget(el) {
    if (el.tagName === "IMG") return { el: el, key: el.getAttribute("data-wd-src") || el.getAttribute("src"), kind: "img" };
    var bg = bgOf(el); if (bg) return { el: el, key: bg, kind: "bg" };
    var im = el.querySelector && el.querySelector("img"); if (im) return { el: im, key: im.getAttribute("data-wd-src") || im.getAttribute("src"), kind: "img" };
    return null;
  }
  function inEditor(t) { return t && t.closest && t.closest("#wd-tb,#wd-ed-style"); }

  /* ---------- UI ---------- */
  var st = document.createElement("style"); st.id = "wd-ed-style";
  st.textContent =
    "[data-wd-hover]{outline:1px dashed rgba(183,255,0,.8)!important;outline-offset:2px;cursor:pointer!important}" +
    "[data-wd-sel]{outline:2px solid #b7ff00!important;outline-offset:3px;box-shadow:0 0 0 6px rgba(183,255,0,.16)!important}" +
    "[contenteditable=true]{outline:2px solid #fff!important;outline-offset:3px;cursor:text!important;user-select:text!important}" +
    "#wd-tb{position:absolute;z-index:2147483647;display:flex;gap:4px;align-items:center;padding:6px;border-radius:14px;background:#0c0f0e;border:1px solid rgba(183,255,0,.45);box-shadow:0 18px 50px rgba(0,0,0,.6);font:700 12px/1 Inter,Arial,sans-serif;color:#fff;white-space:nowrap}" +
    "#wd-tb button{all:unset;cursor:pointer;padding:8px 10px;border-radius:9px;background:rgba(255,255,255,.07);color:#fff;font:700 12px/1 Inter,Arial,sans-serif}" +
    "#wd-tb button:hover{background:#b7ff00;color:#0b0d0c}#wd-tb button[disabled]{opacity:.3;pointer-events:none}" +
    "#wd-tb .t{color:#b7ff00;font-size:10px;letter-spacing:.1em;text-transform:uppercase;padding:0 8px 0 6px}" +
    "[data-wd-hidden]{outline:1px dashed #ff6b6b!important}" +
    ".wd-pre{opacity:1!important;transform:none!important;filter:none!important}";
  document.head.appendChild(st);

  tb = document.createElement("div"); tb.id = "wd-tb"; tb.style.display = "none";
  tb.innerHTML = '<span class="t" id="wd-tb-t">element</span><button data-a="text">✎ Text</button><button data-a="img">🖼 Image</button><button data-a="link">🔗 Link</button><button data-a="hide">👁 Hide</button><button data-a="up">⬆ Parent</button><button data-a="reset">↺ Reset</button>';
  document.body.appendChild(tb);
  fileIn = document.createElement("input"); fileIn.type = "file"; fileIn.accept = "image/*"; fileIn.style.display = "none"; document.body.appendChild(fileIn);

  function place() {
    if (!sel) { tb.style.display = "none"; return; }
    var r = sel.getBoundingClientRect(), y = r.top + scrollY - 52, x = Math.max(8, Math.min(r.left + scrollX, scrollX + innerWidth - 460));
    if (y < scrollY + 6) y = r.bottom + scrollY + 10;
    tb.style.display = "flex"; tb.style.left = x + "px"; tb.style.top = y + "px";
    var q = function (a) { return tb.querySelector('[data-a="' + a + '"]'); };
    q("text").disabled = !ownTexts(sel).length;
    q("img").disabled = !imgTarget(sel);
    q("link").disabled = !sel.closest("a[href]");
    q("hide").textContent = sel.hasAttribute("data-wd-hidden") ? "👁 Show" : "👁 Hide";
    q("up").disabled = !sel.parentElement || sel.parentElement === document.body;
    document.getElementById("wd-tb-t").textContent = sel.tagName.toLowerCase() + (sel.className && typeof sel.className === "string" ? "." + sel.className.split(/\s+/)[0] : "");
  }
  function select(el) {
    if (sel) sel.removeAttribute("data-wd-sel");
    sel = el; if (sel) sel.setAttribute("data-wd-sel", "1");
    place();
  }

  /* ---------- actions ---------- */
  function startText(el) {
    var nodes = ownTexts(el); if (!nodes.length) return;
    finishText();
    editing = { el: el, snap: nodes.map(function (n) { return { n: n, key: keyOf(n), before: norm(n.nodeValue) }; }) };
    el.setAttribute("contenteditable", "true"); el.focus();
    var rg = document.createRange(); rg.selectNodeContents(el); var sl = getSelection(); sl.removeAllRanges(); sl.addRange(rg);
  }
  function finishText() {
    if (!editing) return;
    var e = editing; editing = null;
    e.el.removeAttribute("contenteditable");
    var c = cfg(), p = pageOf(c), changed = false;
    e.snap.forEach(function (s) {
      if (s.n.parentNode !== e.el) return;
      var now = norm(s.n.nodeValue);
      if (now === s.before) return;
      s.n._wdOrig = s.key; changed = true;
      if (now === s.key) delete p.text[s.key]; else p.text[s.key] = now;
    });
    if (changed) commit(c);
    place();
  }
  function resizeImage(file, max, cb) {
    var fr = new FileReader();
    fr.onload = function () {
      var im = new Image();
      im.onload = function () {
        var keepAlpha = /png|svg|webp|gif/.test(file.type), w = im.width, h = im.height, sc = Math.min(1, max / Math.max(w, h));
        w = Math.round(w * sc); h = Math.round(h * sc);
        var cv = document.createElement("canvas"); cv.width = w; cv.height = h; cv.getContext("2d").drawImage(im, 0, 0, w, h);
        var out, q = 0.86;
        do { out = cv.toDataURL(keepAlpha ? "image/webp" : "image/jpeg", q); if (out.indexOf("data:image/webp") !== 0 && keepAlpha) out = cv.toDataURL("image/png"); q -= 0.12; } while (out.length > 700000 && q > 0.3);
        cb(out);
      };
      im.onerror = function () { alert("That file is not a supported image."); };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  }
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i += 7) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return "m" + (h >>> 0).toString(36) + s.length.toString(36); }
  function replaceImage() {
    var t = imgTarget(sel); if (!t) return;
    fileIn.value = ""; fileIn.onchange = function () {
      var f = fileIn.files && fileIn.files[0]; if (!f) return;
      resizeImage(f, 1400, function (data) {
        var id = hash(data), dr = D.mediaDraft(); dr[id] = data;
        try { localStorage.setItem("wdMediaDraft", JSON.stringify(dr)); } catch (e) { alert("Browser storage is full. Remove other images first."); return; }
        var c = cfg(), p = pageOf(c); p.src[t.key] = "wdm:" + id; commit(c);
      });
    };
    fileIn.click();
  }
  function editLink() {
    var a = sel.closest("a[href]"); if (!a) return;
    var orig = a.getAttribute("data-wd-href") || a.getAttribute("href"), v = prompt("Link address (https://…, tel:, mailto:, #section or ./page.html):", a.getAttribute("href"));
    if (v == null) return; v = v.trim(); if (!v) return;
    if (!/^(https?:|mailto:|tel:|\.{0,2}\/|#)/i.test(v)) { alert("Use a full link like https://example.com, tel:+880…, or a page like ./packages.html"); return; }
    var c = cfg(), p = pageOf(c); if (v === orig) delete p.href[orig]; else p.href[orig] = v; commit(c);
  }
  function toggleHide() {
    var path = pathOf(sel), c = cfg(), p = pageOf(c), i = p.hide.indexOf(path);
    if (i > -1) { p.hide.splice(i, 1); commit(c); sel.style.opacity = ""; sel.removeAttribute("data-wd-hidden"); }
    else { p.hide.push(path); commit(c); }
    place();
  }
  function reset() {
    var c = cfg(), p = pageOf(c), el = sel;
    ownTexts(el).forEach(function (n) { delete p.text[keyOf(n)]; });
    var t = imgTarget(el); if (t) delete p.src[t.key];
    var a = el.closest("a[href]"); if (a) delete p.href[a.getAttribute("data-wd-href") || a.getAttribute("href")];
    var i = p.hide.indexOf(pathOf(el)); if (i > -1) p.hide.splice(i, 1);
    commit(c); location.reload();
  }

  /* ---------- events ---------- */
  document.addEventListener("mouseover", function (e) {
    if (inEditor(e.target) || editing) return;
    var old = document.querySelector("[data-wd-hover]"); if (old) old.removeAttribute("data-wd-hover");
    if (e.target !== document.body && e.target !== document.documentElement) e.target.setAttribute("data-wd-hover", "1");
  }, true);
  document.addEventListener("mouseout", function (e) { if (e.target.removeAttribute) e.target.removeAttribute("data-wd-hover"); }, true);
  document.addEventListener("click", function (e) {
    if (inEditor(e.target)) return;
    if (editing && editing.el.contains(e.target)) return; /* caret placement while typing */
    e.preventDefault(); e.stopPropagation();
    finishText();
    var t = e.target; if (t.closest("svg") && t.closest("svg").parentElement) t = t.closest("svg").parentElement;
    if (t === document.documentElement || t === document.body) { select(null); return; }
    select(t);
  }, true);
  document.addEventListener("dblclick", function (e) { if (inEditor(e.target)) return; e.preventDefault(); var t = e.target; select(t); if (ownTexts(t).length) startText(t); }, true);
  document.addEventListener("submit", function (e) { e.preventDefault(); }, true);
  document.addEventListener("keydown", function (e) {
    if (!editing) { if (e.key === "Escape") select(null); return; }
    if (e.key === "Enter") { e.preventDefault(); finishText(); }
    if (e.key === "Escape") { editing.snap.forEach(function (s) { s.n.nodeValue = s.n.nodeValue; }); finishText(); }
  }, true);
  document.addEventListener("focusout", function (e) { if (editing && e.target === editing.el) setTimeout(finishText, 0); }, true);
  tb.addEventListener("mousedown", function (e) { e.preventDefault(); });
  tb.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b || b.disabled || !sel) return;
    var a = b.getAttribute("data-a");
    if (a === "text") startText(sel); else if (a === "img") replaceImage(); else if (a === "link") editLink();
    else if (a === "hide") toggleHide(); else if (a === "up") select(sel.parentElement); else if (a === "reset") reset();
  });
  addEventListener("scroll", place, { passive: true }); addEventListener("resize", place);
  window.addEventListener("wd:applied", function () { place(); });
  try { parent.postMessage({ wd: "ready", page: D.pageKey() }, "*"); } catch (e) { }
})();
