/* Website Deals — shared/store.js
   ONE data layer for every page: admin/websites.html, admin/dashboard.html,
   package/index.html, presentation/index.html and the landing page.

   Source order:  1) admin's browser data (localStorage "websiteDealsWebsites")
                  2) published file  data/websites.json  (what visitors see)
                  3) built-in default                                          */
(() => {
  "use strict";
  const KEY = "websiteDealsWebsites";
  const WA = "8801705633700";
  const ROOT = (document.currentScript && document.currentScript.src)
    ? document.currentScript.src.replace(/shared\/store\.js.*$/, "") : "./";

  const DEFAULTS = [{
    id: "snk-it-institute", name: "SNK IT Institute", package: "business",
    packageLabel: "Business Package", url: "https://snkitinstitute.com",
    animation: "zoom", status: true, sort: 1
  }];

  const LABELS = { starter: "Starter Package", business: "Business Package", premium: "Premium Package" };
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
  const safeUrl = (v) => { try { const u = new URL(String(v)); return /^https?:$/.test(u.protocol) ? u.href : ""; } catch (e) { return ""; } };

  function normalize(s, i) {
    const pkg = String(s.package || "").toLowerCase();
    return {
      id: String(s.id || `site-${i}`),
      name: String(s.name || "Untitled Website"),
      package: pkg,
      packageLabel: s.packageLabel || LABELS[pkg] || "Website Package",
      url: String(s.url || ""),
      animation: ["zoom", "slide", "float"].includes(s.animation) ? s.animation : "zoom",
      status: !(s.status === false || s.status === "false"),
      sort: Number(s.sort) || 0
    };
  }

  function readLocal() {
    try {
      const raw = localStorage.getItem(KEY);
      const p = raw && JSON.parse(raw);
      return Array.isArray(p) ? p.map(normalize) : null;
    } catch (e) { return null; }
  }

  async function readPublished() {
    try {
      const r = await fetch(ROOT + "data/websites.json?v=" + Date.now(), { cache: "no-store" });
      const j = await r.json();
      return Array.isArray(j) ? j.map(normalize) : null;
    } catch (e) { return null; }
  }

  /** -> { sites, source: "admin" | "published" | "default" } */
  async function load() {
    const local = readLocal();
    if (local) return { sites: local, source: "admin" };
    const pub = await readPublished();
    if (pub) return { sites: pub, source: "published" };
    return { sites: DEFAULTS.map(normalize), source: "default" };
  }

  const active = (list) => list.filter((s) => s.status && safeUrl(s.url))
    .sort((a, b) => a.sort - b.sort);

  function save(list) {
    localStorage.setItem(KEY, JSON.stringify(list.map(normalize)));
    window.dispatchEvent(new CustomEvent("wd:sites-changed"));   // same tab
  }
  function clearLocal() {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent("wd:sites-changed"));
  }
  function onChange(cb) {                                          // other tabs + same tab
    window.addEventListener("storage", (e) => { if (e.key === KEY || e.key === null) cb(); });
    window.addEventListener("wd:sites-changed", cb);
  }
  function download(list, filename = "websites.json") {
    const blob = new Blob([JSON.stringify(list.map(normalize), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const wa = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;

  window.WDStore = { KEY, ROOT, LABELS, normalize, load, readLocal, readPublished, active, save, clearLocal, onChange, download, wa, esc, safeUrl };
})();
