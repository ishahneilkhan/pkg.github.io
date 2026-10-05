/* Website Deals — showcase.js
   Replaces the inline <script> in index.html. Load with:
   <script src="./showcase.js"></script>  (just before </body>) */
(() => {
  "use strict";

  const STORAGE_KEY = "websiteDealsWebsites";
  const THEME_KEY = "websiteDealsTheme";
  const SALAH_KEY = "websiteDealsSalah";
  const FRAME_H = 1800;
  const LOAD_TIMEOUT = 12000;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const DEFAULTS = [{
    id: "snk-it-institute", name: "SNK IT Institute", package: "business",
    packageLabel: "Business Package", url: "https://snkitinstitute.com",
    animation: "zoom", status: true, sort: 1
  }];

  // Per-effect behaviour (matches admin: zoom / slide / float)
  const PROFILES = {
    zoom:  { chunks: [160, 230, 310, 360], dur: [1250, 1650, 1900], pause: .22, scale: 1.035 },
    slide: { chunks: [300, 380, 460],      dur: [900, 1100],        pause: .10, scale: 1 },
    float: { chunks: [100, 140, 180],      dur: [1900, 2400, 2900], pause: .30, scale: 1.012 }
  };

  let websites = [];
  let currentUrl = "";
  const browsers = new Map();   // index -> state
  let io = null;

  const $ = (s, r = document) => r.querySelector(s);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
  const cap = (v) => (v ? v[0].toUpperCase() + v.slice(1) : "");

  function safeUrl(v) {
    try {
      const u = new URL(String(v));
      if (u.protocol === "https:" || u.protocol === "http:") return u.href;
    } catch (e) {}
    return "about:blank";
  }

  /* ---------- DATA ---------- */
  function loadWebsites() {
    let list = DEFAULTS;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved) && saved.length) list = saved;
    } catch (e) {}
    websites = list
      .filter((s) => s && s.status !== false && s.status !== "false" && safeUrl(s.url) !== "about:blank")
      .sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));
    render();
  }

  /* ---------- RENDER ---------- */
  function render() {
    stopAll();
    const grid = $("#websiteGrid");
    if (!grid) return;

    if (!websites.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;padding:50px;border:1px solid var(--line);border-radius:20px;text-align:center;color:var(--muted)">No live websites available yet.</div>`;
      return;
    }

    grid.innerHTML = websites.map((s, i) => `
      <article class="website-card">
        <div class="website-top">
          <div class="website-info">
            <div class="website-name">${esc(s.name || "Untitled Website")}</div>
            <div class="website-package">${esc(s.packageLabel || cap(s.package || "Website") + " Package")}</div>
          </div>
          <div class="live-badge"><span class="live-dot"></span>LIVE</div>
        </div>
        <div class="preview-viewport" data-index="${i}">
          <div class="loader"><div class="loader-ring"></div></div>
          <div class="preview-camera" id="camera-${i}">
            <iframe class="preview-frame" src="${esc(safeUrl(s.url))}" title="${esc(s.name || "Live Website")}"
              loading="${i === 0 ? "eager" : "lazy"}" referrerpolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-forms" data-index="${i}"></iframe>
          </div>
          <div class="human-cursor" id="cursor-${i}"></div>
          <div class="scroll-hint">LIVE BROWSING</div>
        </div>
        <div class="website-bottom">
          <div class="status-text" id="status-${i}">● Auto browsing</div>
          <div class="website-actions">
            <button class="mini-btn" data-action="live" data-index="${i}">Live ↗</button>
            <button class="mini-btn primary" data-action="explore" data-index="${i}">Explore</button>
          </div>
        </div>
      </article>`).join("");

    grid.querySelectorAll("iframe").forEach((f) => {
      const i = Number(f.dataset.index);
      const t = setTimeout(() => frameSlow(i), LOAD_TIMEOUT);
      f.addEventListener("load", () => { clearTimeout(t); frameLoaded(i); }, { once: true });
    });

    // Only animate cards that are on screen
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const st = browsers.get(Number(e.target.dataset.index));
        if (st) st.visible = e.isIntersecting;
      });
    }, { threshold: .1 });

    grid.querySelectorAll(".preview-viewport").forEach((vp) => {
      const i = Number(vp.dataset.index);
      browsers.set(i, { gen: 0, pos: 0, dir: 1, hover: false, visible: true, timer: 0 });
      io.observe(vp);
      if (!reduceMotion) schedule(i, 1200 + Math.random() * 3500);
    });
  }

  function frameLoaded(i) {
    const l = $(`.preview-viewport[data-index="${i}"] .loader`);
    if (l) l.style.display = "none";
  }

  function frameSlow(i) {
    const l = $(`.preview-viewport[data-index="${i}"] .loader`);
    if (!l || l.style.display === "none") return;
    const s = websites[i];
    l.innerHTML = `<div style="text-align:center;padding:20px;color:#555;font:12px Inter,sans-serif">
      <strong style="display:block;margin-bottom:7px">Preview unavailable</strong>
      This site is slow or doesn't allow previews.<br>
      <a href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener" style="color:#111;font-weight:700">Open website ↗</a></div>`;
  }

  /* ---------- BROWSING ENGINE ----------
     One timer per card + a generation counter, so pausing/resuming
     can never leave two loops running on the same card. */
  function schedule(i, delay) {
    const st = browsers.get(i);
    if (!st) return;
    clearTimeout(st.timer);
    const gen = st.gen;
    st.timer = setTimeout(() => step(i, gen), delay);
  }

  function stopAll() {
    browsers.forEach((st) => { st.gen++; clearTimeout(st.timer); });
    browsers.clear();
    if (io) io.disconnect();
  }

  function step(i, gen) {
    const st = browsers.get(i);
    if (!st || st.gen !== gen || st.hover) return;
    if (!st.visible || document.hidden) return schedule(i, 1000);

    const vp = $(`.preview-viewport[data-index="${i}"]`);
    const cam = $(`#camera-${i}`);
    const cur = $(`#cursor-${i}`);
    if (!vp || !cam || !cur) return;

    const prof = PROFILES[websites[i].animation] || PROFILES.zoom;
    const max = Math.max(250, FRAME_H - vp.clientHeight);
    let next = st.pos + pick(prof.chunks) * st.dir;
    let dur = pick(prof.dur);
    let wait;

    if (st.dir === 1 && next >= max) {
      next = max; st.dir = -1; wait = 1800 + Math.random() * 2500;
    } else if (st.dir === -1 && next <= 0) {
      next = 0; st.dir = 1; dur = 1300; wait = 1800 + Math.random() * 3000;
    } else {
      wait = Math.random() < prof.pause ? 1000 + Math.random() * 2300 : 80 + Math.random() * 250;
    }

    st.pos = next;
    const s = prof.scale > 1 ? (st.dir === 1 ? prof.scale : 1) : 1;
    cam.style.transformOrigin = "50% 0";
    cam.style.transition = `transform ${dur}ms cubic-bezier(.22,.61,.36,1)`;
    cam.style.transform = `translate3d(0,-${next}px,0) scale(${s})`;
    moveCursor(cur, vp);
    schedule(i, dur + wait);
  }

  function moveCursor(cur, vp) {
    const w = vp.clientWidth, h = vp.clientHeight;
    const spots = [[.22, .26], [.72, .30], [.48, .52], [.78, .68], [.25, .74]];
    const [x, y] = pick(spots);
    cur.style.opacity = ".82";
    cur.style.left = Math.max(8, w * x) + "px";
    cur.style.top = Math.max(8, h * y) + "px";
  }

  // Pause on hover — freezes exactly where the camera is (no jump)
  function setHover(card, on) {
    const vp = $(".preview-viewport", card);
    if (!vp) return;
    const i = Number(vp.dataset.index);
    const st = browsers.get(i);
    const cam = $(`#camera-${i}`);
    const status = $(`#status-${i}`);
    if (!st || !cam || st.hover === on) return;
    st.hover = on;
    st.gen++;
    clearTimeout(st.timer);

    if (on) {
      const y = new DOMMatrix(getComputedStyle(cam).transform).m42;
      cam.style.transition = "none";
      cam.style.transform = `translate3d(0,${y}px,0)`;
      st.pos = Math.max(0, -y);
      if (status) status.textContent = "● Paused on hover";
    } else {
      if (status) status.textContent = "● Auto browsing";
      if (!reduceMotion) schedule(i, 700);
    }
  }

  document.addEventListener("mouseover", (e) => {
    const c = e.target.closest(".website-card");
    if (c) setHover(c, true);
  });
  document.addEventListener("mouseout", (e) => {
    const c = e.target.closest(".website-card");
    if (c && !c.contains(e.relatedTarget)) setHover(c, false);
  });

  /* ---------- BUTTONS (no inline onclick with URLs) ---------- */
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const site = websites[Number(b.dataset.index)];
    if (!site) return;
    if (b.dataset.action === "live") window.open(safeUrl(site.url), "_blank", "noopener,noreferrer");
    if (b.dataset.action === "explore") openPresentation(site);
  });

  /* ---------- MODAL ---------- */
  function openPresentation(site) {
    currentUrl = site.url;
    $("#modalTitle").textContent = `${site.name} — Live Website`;
    const f = $("#modalFrame");
    f.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups");
    f.src = safeUrl(site.url);
    $("#presentationModal").classList.add("show");
    document.body.style.overflow = "hidden";
  }

  window.closePresentation = () => {
    $("#presentationModal").classList.remove("show");
    $("#modalFrame").src = "about:blank";
    document.body.style.overflow = "";
  };

  window.openCurrentWebsite = () => {
    if (currentUrl) window.open(safeUrl(currentUrl), "_blank", "noopener,noreferrer");
  };

  $("#presentationModal").addEventListener("click", (e) => {
    if (e.target.id === "presentationModal") window.closePresentation();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") window.closePresentation(); });

  /* ---------- THEME ---------- */
  window.toggleTheme = () => {
    document.body.classList.toggle("light");
    try { localStorage.setItem(THEME_KEY, document.body.classList.contains("light") ? "light" : "dark"); } catch (e) {}
  };
  try { if (localStorage.getItem(THEME_KEY) === "light") document.body.classList.add("light"); } catch (e) {}

  /* ---------- MOBILE MENU ---------- */
  const css = document.createElement("style");
  css.textContent = `
    .nav-links.open{display:flex;position:absolute;top:64px;left:16px;right:16px;padding:10px;flex-direction:column;
      align-items:stretch;background:var(--card);border:1px solid var(--line);border-radius:16px}
    .salah-item.next{color:var(--accent)} .salah-item.next strong{color:var(--accent)}
    .salah-city{font-size:10px;color:var(--muted);opacity:.7;white-space:nowrap}`;
  document.head.appendChild(css);

  window.toggleMobileMenu = () => $(".nav-links").classList.toggle("open");
  document.querySelectorAll(".nav-links a").forEach((a) =>
    a.addEventListener("click", () => $(".nav-links").classList.remove("open")));

  /* ---------- ANCHOR ALIAS (home.html links to #packages) ---------- */
  const pkg = $("#package");
  if (pkg && !$("#packages")) { const s = document.createElement("span"); s.id = "packages"; pkg.before(s); }

  /* ---------- ACTIVE NAV ---------- */
  const links = document.querySelectorAll(".nav-links a[href^='#']");
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === `#${en.target.id}`));
    });
  }, { threshold: .25 });
  document.querySelectorAll("main section[id]").forEach((s) => spy.observe(s));

  /* ---------- SALAH (Dhaka, live from Aladhan; cached daily) ---------- */
  const SALAH_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  const SALAH_FALLBACK = { Fajr: "04:45", Dhuhr: "12:05", Asr: "16:15", Maghrib: "18:00", Isha: "19:20" };
  let salahTimes = SALAH_FALLBACK;

  async function loadSalah() {
    const today = new Date().toDateString();
    try {
      const c = JSON.parse(localStorage.getItem(SALAH_KEY));
      if (c && c.day === today) { salahTimes = c.times; return renderSalah(); }
    } catch (e) {}
    renderSalah();
    try {
      const r = await fetch("https://api.aladhan.com/v1/timingsByCity?city=Dhaka&country=Bangladesh&method=1&school=1");
      const t = (await r.json()).data.timings;
      salahTimes = Object.fromEntries(SALAH_ORDER.map((n) => [n, String(t[n]).slice(0, 5)]));
      localStorage.setItem(SALAH_KEY, JSON.stringify({ day: today, times: salahTimes }));
      renderSalah();
    } catch (e) { /* keep fallback times */ }
  }

  function renderSalah() {
    const box = $(".salah-inner");
    if (!box) return;
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    const next = SALAH_ORDER.find((n) => toMin(salahTimes[n]) > mins) || "Fajr";
    box.innerHTML = SALAH_ORDER.map((n) =>
      `<div class="salah-item${n === next ? " next" : ""}"><strong>${n}</strong>${esc(salahTimes[n])}</div>`).join("")
      + `<div class="salah-city">Dhaka</div>`;
  }
  setInterval(renderSalah, 60000);

  /* ---------- LIVE SYNC WITH ADMIN + RESUME ---------- */
  window.addEventListener("storage", (e) => { if (e.key === STORAGE_KEY) loadWebsites(); });

  /* ---------- START ---------- */
  $("#year").textContent = new Date().getFullYear();
  loadWebsites();
  loadSalah();
})();
