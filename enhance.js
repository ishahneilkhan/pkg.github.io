/* Website Deals — enhance.js
   Load AFTER your existing inline script, just before </body>:
   <script src="./enhance.js"></script>                                  */
(() => {
  "use strict";

  const WA = "8801705633700";
  const SALAH_KEY = "websiteDealsSalah2";
  const ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  const FALLBACK = { Fajr: "04:45", Dhuhr: "12:05", Asr: "16:15", Maghrib: "18:00", Isha: "19:20" };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
  const wa = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
  const okUrl = (u) => { try { return /^https?:$/.test(new URL(u).protocol); } catch (e) { return false; } };

  /* ---------- CSS (same design tokens as your page) ---------- */
  const css = document.createElement("style");
  css.textContent = `
  .reveal:not(.in){opacity:0}
  .reveal.in{animation:revealUp .7s cubic-bezier(.22,.61,.36,1) backwards}
  @keyframes revealUp{from{opacity:0;transform:translateY(24px)}}
  .scroll-progress{position:fixed;top:0;left:0;height:2px;width:0;background:var(--lime);z-index:9000;box-shadow:0 0 12px var(--lime)}
  .hero-stats{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
  .hero-stat{padding:13px 16px;border:1px solid var(--border);border-radius:14px;background:var(--surface)}
  .hero-stat strong{display:block;font-size:20px;letter-spacing:-.04em}
  .hero-stat span{display:block;margin-top:3px;color:var(--muted-2);font-size:8px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
  .filter-bar{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px}
  .chip{min-height:34px;padding:0 14px;border:1px solid var(--border);border-radius:999px;background:var(--surface);color:var(--muted);font-size:10px;font-weight:800;transition:.2s}
  .chip:hover{border-color:var(--lime-border);color:var(--text)}
  .chip.active{background:var(--lime-soft);border-color:var(--lime-border);color:var(--lime)}
  .website-card.is-offscreen .website-camera{animation-play-state:paused}
  .pv-loader{position:absolute;inset:0;z-index:4;display:grid;place-items:center;text-align:center;padding:20px;
    background:linear-gradient(110deg,#171a1a 30%,#222727 50%,#171a1a 70%) 0 0/200% 100%;animation:shimmer 1.4s linear infinite;color:#9ba4a4;font-size:10px}
  .pv-loader a{color:var(--lime);font-weight:800}
  @keyframes shimmer{to{background-position:-200% 0}}
  .pv-loader.hide{display:none}
  .salah-time.next{padding:3px 10px;border:1px solid var(--lime-border);border-radius:999px;background:var(--lime-soft);color:var(--lime)}
  .salah-time.next strong{color:var(--lime)}
  .salah-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:20px}
  .salah-tile{padding:16px 10px;text-align:center;border:1px solid var(--border);border-radius:14px;background:var(--surface-2)}
  .salah-tile span{display:block;color:var(--muted-2);font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
  .salah-tile strong{display:block;margin-top:6px;font-size:17px;letter-spacing:-.03em}
  .salah-tile.next{border-color:var(--lime-border);background:var(--lime-soft)}
  .salah-tile.next strong,.salah-tile.next span{color:var(--lime)}
  .package-wa{display:block;margin-top:12px;text-align:center;color:var(--muted);font-size:10px;font-weight:700}
  .package-wa:hover{color:var(--lime)}
  .wa-float{position:fixed;right:20px;bottom:20px;z-index:7000;width:54px;height:54px;display:grid;place-items:center;border-radius:50%;
    background:#25d366;box-shadow:0 12px 35px rgba(37,211,102,.35);transition:.25s}
  .wa-float:hover{transform:translateY(-3px) scale(1.05)}
  .wa-float svg{width:28px;height:28px;fill:#fff}
  .toast{bottom:88px}
  .menu-btn{display:none}
  @media(max-width:760px){
    .menu-btn{display:grid}
    .nav-links.open{display:flex;position:absolute;top:68px;left:12px;right:12px;flex-direction:column;align-items:stretch;
      padding:10px;background:var(--surface);border:1px solid var(--border);border-radius:16px;z-index:1200}
    .salah-grid{grid-template-columns:repeat(3,1fr)}
    .salah-label{display:none}
  }`;
  document.head.appendChild(css);

  /* ---------- HEAD: favicon, manifest, social tags ---------- */
  const head = (tag, attrs) => { const e = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); document.head.appendChild(e); };
  head("link", { rel: "icon", href: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#b7ff00"/><text x="32" y="43" font-size="30" font-weight="900" text-anchor="middle" font-family="Arial" fill="#000">WD</text></svg>') });
  if (!$('link[rel="manifest"]')) head("link", { rel: "manifest", href: "./manifest.json" });
  [["og:title", document.title], ["og:description", $('meta[name="description"]')?.content || ""], ["og:type", "website"]]
    .forEach(([p, c]) => head("meta", { property: p, content: c }));

  /* ---------- SAFER DATA (admin values can't inject odd URLs) ---------- */
  const rawGet = window.getWebsites;
  window.getWebsites = () => rawGet()
    .filter((s) => s && s.status !== false && s.status !== "false" && okUrl(s.url));

  // sandbox every preview frame (stops sites from navigating your page away) + tag with package
  const rawCard = window.createWebsiteCard;
  window.createWebsiteCard = (site, i) => rawCard(site, i)
    .replace('class="website-card"', `class="website-card reveal" data-package="${esc(String(site.package || "").toLowerCase())}"`)
    .replace("<iframe", '<iframe sandbox="allow-scripts allow-same-origin allow-forms"');

  const rawOpen = window.openPresentation;
  window.openPresentation = (site) => {
    $("#presentationFrame").setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox");
    rawOpen(site);
  };

  /* ---------- FILTER + CARD DECORATION ---------- */
  let filter = "all";

  function ensureFilterBar() {
    if ($("#filterBar")) return;
    const bar = document.createElement("div");
    bar.className = "filter-bar"; bar.id = "filterBar";
    bar.innerHTML = ["all", "starter", "business", "premium"]
      .map((f) => `<button class="chip" data-filter="${f}">${f[0].toUpperCase() + f.slice(1)}</button>`).join("");
    $("#websiteGrid").before(bar);
    bar.addEventListener("click", (e) => { const b = e.target.closest("[data-filter]"); if (b) setFilter(b.dataset.filter); });
  }

  function setFilter(f) {
    filter = f;
    $$("#filterBar .chip").forEach((c) => c.classList.toggle("active", c.dataset.filter === f));
    let shown = 0;
    $$(".website-card").forEach((c) => {
      const on = f === "all" || c.dataset.package === f;
      c.style.display = on ? "" : "none";
      if (on) shown++;
    });
    let msg = $("#filterEmpty");
    if (!shown && $$(".website-card").length) {
      if (!msg) { msg = document.createElement("div"); msg.id = "filterEmpty"; msg.className = "empty-state"; $("#websiteGrid").appendChild(msg); }
      msg.innerHTML = `<strong>No ${esc(f)} websites yet.</strong>Message us and we'll show you what's possible.`;
    } else if (msg) msg.remove();
  }

  const cardIO = new IntersectionObserver((entries) => entries.forEach((e) => {
    e.target.classList.toggle("is-offscreen", !e.isIntersecting);
    if (e.isIntersecting) e.target.classList.add("in");
  }), { threshold: .08 });

  function decorate() {
    ensureFilterBar();
    const sites = new Map(window.getWebsites().map((s, i) => [String(s.id || i), s]));

    $$(".website-card").forEach((card) => {
      cardIO.observe(card);
      const site = sites.get(card.dataset.websiteId);
      const vp = $(".preview-viewport", card);
      if (!site || !vp || $(".pv-loader", vp)) return;

      const loader = document.createElement("div");
      loader.className = "pv-loader"; loader.textContent = "Loading live website…";
      vp.appendChild(loader);
      const timer = setTimeout(() => {
        loader.innerHTML = `Taking a while — this site may block previews.<br><a href="${esc(site.url)}" target="_blank" rel="noopener">Open website ↗</a>`;
      }, 12000);
      $("iframe", card).addEventListener("load", () => { clearTimeout(timer); loader.classList.add("hide"); }, { once: true });

      const actions = $(".website-actions", card);
      const order = document.createElement("a");
      order.className = "small-btn"; order.target = "_blank"; order.rel = "noopener";
      order.href = wa(`Hello Website Deals, I'm interested in "${site.name}" (${site.packageLabel || site.package}). Please share details.`);
      order.textContent = "Order";
      actions.prepend(order);
    });

    updateStats();
    setFilter(filter);
  }

  const rawRender = window.renderWebsites;
  window.renderWebsites = () => { rawRender(); decorate(); };

  /* ---------- PACKAGE CARDS → filter + WhatsApp ---------- */
  $$(".package-card").forEach((card) => {
    card.classList.add("reveal");
    const name = $(".package-name", card).textContent.trim();
    const btn = $(".package-btn", card);
    btn.addEventListener("click", () => setFilter(name.toLowerCase()));
    const link = document.createElement("a");
    link.className = "package-wa"; link.target = "_blank"; link.rel = "noopener";
    link.href = wa(`Hello Website Deals, I want the ${name} package. Please guide me.`);
    link.textContent = `Order ${name} on WhatsApp →`;
    btn.after(link);
  });
  $$(".section-head, .about-card, .wall-box").forEach((el) => el.classList.add("reveal"));
  const revealIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); revealIO.unobserve(e.target); } }), { threshold: .12 });
  $$(".reveal").forEach((el) => { if (!el.classList.contains("website-card")) revealIO.observe(el); });

  /* ---------- HERO STATS (real counts) ---------- */
  const stats = document.createElement("div");
  stats.className = "hero-stats";
  stats.innerHTML = `
    <div class="hero-stat"><strong id="statSites">0</strong><span>Live websites</span></div>
    <div class="hero-stat"><strong>3</strong><span>Packages</span></div>
    <div class="hero-stat"><strong>24/7</strong><span>Marketplace</span></div>`;
  $(".hero-actions")?.after(stats);

  function updateStats() {
    const el = $("#statSites"); if (!el) return;
    const n = window.getWebsites().length, from = Number(el.textContent) || 0, t0 = performance.now();
    (function tick(t) {
      const p = Math.min(1, (t - t0) / 800);
      el.textContent = Math.round(from + (n - from) * p);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ---------- SALAH: live times, next-prayer pill, countdown ---------- */
  let times = FALLBACK;
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const dhakaNow = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));

  const sec = document.createElement("section");
  sec.className = "section"; sec.id = "salah";
  sec.innerHTML = `<div class="container"><div class="about-card reveal">
    <div class="section-kicker">Salah · Dhaka</div>
    <h3 id="salahNext" style="margin-top:8px;font-size:22px">Prayer times</h3>
    <div class="salah-grid" id="salahGrid"></div>
    <a class="package-wa" href="./salah/" style="text-align:left;margin-top:18px">Full Salah page with live countdown →</a></div></div>`;
  $("#about")?.before(sec);
  revealIO.observe($(".about-card", sec));
  if (typeof observer !== "undefined") observer.observe(sec);

  function renderSalah() {
    const d = dhakaNow(), mins = d.getHours() * 60 + d.getMinutes();
    let next = ORDER.find((n) => toMin(times[n]) > mins), diff;
    if (next) diff = toMin(times[next]) - mins;
    else { next = "Fajr"; diff = 1440 - mins + toMin(times.Fajr); }
    const left = `${Math.floor(diff / 60) ? Math.floor(diff / 60) + "h " : ""}${diff % 60}m`;

    $(".salah-label") && ($(".salah-label").textContent = `${next} in ${left}`);
    $(".salah-times").innerHTML = ORDER.map((n) =>
      `<div class="salah-time${n === next ? " next" : ""}">${n} <strong>${esc(times[n])}</strong></div>`).join("");
    $("#salahNext").textContent = `Next: ${next} at ${times[next]} · in ${left}`;
    $("#salahGrid").innerHTML = ORDER.map((n) =>
      `<div class="salah-tile${n === next ? " next" : ""}"><span>${n}</span><strong>${esc(times[n])}</strong></div>`).join("");
  }

  async function loadSalah() {
    const day = dhakaNow().toDateString();
    try { const c = JSON.parse(localStorage.getItem(SALAH_KEY)); if (c?.day === day) times = c.times; } catch (e) {}
    renderSalah();
    if (times !== FALLBACK) return;
    try {
      const r = await fetch("https://api.aladhan.com/v1/timingsByCity?city=Dhaka&country=Bangladesh&method=1&school=1");
      const t = (await r.json()).data.timings;
      times = Object.fromEntries(ORDER.map((n) => [n, String(t[n]).slice(0, 5)]));
      localStorage.setItem(SALAH_KEY, JSON.stringify({ day, times }));
      renderSalah();
    } catch (e) {}
  }
  setInterval(renderSalah, 30000);

  /* ---------- MOBILE MENU ---------- */
  const menu = document.createElement("button");
  menu.className = "icon-btn menu-btn"; menu.setAttribute("aria-label", "Menu"); menu.textContent = "☰";
  $(".nav-actions").prepend(menu);
  menu.addEventListener("click", () => $(".nav-links").classList.toggle("open"));
  $$(".nav-links a").forEach((a) => a.addEventListener("click", () => $(".nav-links").classList.remove("open")));

  /* ---------- MODAL: ← → to browse sites ---------- */
  function step(dir) {
    const list = window.getWebsites().sort((a, b) => (Number(a.sort) || 999) - (Number(b.sort) || 999));
    if (list.length < 2) return;
    const i = list.findIndex((s) => s.url === currentPresentationUrl);
    window.openPresentation(list[(i + dir + list.length) % list.length]);
  }
  const actions = $(".presentation-actions");
  [["‹", -1], ["›", 1]].forEach(([label, dir], k) => {
    const b = document.createElement("button");
    b.className = "small-btn"; b.textContent = label; b.setAttribute("aria-label", dir < 0 ? "Previous site" : "Next site");
    b.addEventListener("click", () => step(dir));
    k === 0 ? actions.prepend(b) : actions.children[1].before(b);
  });
  document.addEventListener("keydown", (e) => {
    if (!$("#presentation").classList.contains("open")) return;
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });

  /* ---------- SCROLL PROGRESS + WHATSAPP FLOAT ---------- */
  const bar = document.createElement("div");
  bar.className = "scroll-progress"; document.body.appendChild(bar);
  addEventListener("scroll", () => {
    const h = document.documentElement;
    bar.style.width = (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight) * 100) + "%";
  }, { passive: true });

  const float = document.createElement("a");
  float.className = "wa-float"; float.target = "_blank"; float.rel = "noopener";
  float.setAttribute("aria-label", "Chat on WhatsApp");
  float.href = wa("Hello Website Deals, I'd like to know more about your website packages.");
  float.innerHTML = '<svg viewBox="0 0 32 32"><path d="M16 4C9.4 4 4 9 4 15.2c0 2.600 1 5 2.600 6.900L5.500 27l5.200-1.600c1.600.7 3.400 1 5.300 1 6.600 0 12-5 12-11.200S22.600 4 16 4z"/><circle cx="11" cy="15.500" r="1.600" fill="#25d366"/><circle cx="16" cy="15.500" r="1.600" fill="#25d366"/><circle cx="21" cy="15.500" r="1.600" fill="#25d366"/></svg>';
  document.body.appendChild(float);

  /* ---------- CONTACT SECTION (sends to WhatsApp) ---------- */
  const ccss = document.createElement("style");
  ccss.textContent = `
  .contact-grid{display:grid;grid-template-columns:.9fr 1.1fr;gap:20px}
  .contact-info p{margin-top:12px;color:var(--muted);font-size:12px;line-height:1.85}
  .contact-lines{display:grid;gap:10px;margin-top:22px}
  .contact-line{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border:1px solid var(--border);
    border-radius:14px;background:var(--surface-2);font-size:12px;font-weight:700;transition:.2s}
  .contact-line:hover{border-color:var(--lime-border);color:var(--lime)}
  .contact-line span{color:var(--muted-2);font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
  .contact-form{display:grid;gap:12px}
  .field label{display:block;margin-bottom:6px;color:var(--muted);font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
  .field input,.field select,.field textarea{width:100%;padding:13px 14px;border:1px solid var(--border);border-radius:12px;
    background:var(--surface-2);color:var(--text);font-size:13px;outline:none;transition:.2s}
  .field textarea{min-height:110px;resize:vertical}
  .field input:focus,.field select:focus,.field textarea:focus{border-color:var(--lime-border);box-shadow:0 0 0 3px var(--lime-soft)}
  .field.bad input{border-color:var(--danger)}
  @media(max-width:900px){.contact-grid{grid-template-columns:1fr}}`;
  document.head.appendChild(ccss);

  const contact = document.createElement("section");
  contact.className = "section"; contact.id = "contact";
  contact.innerHTML = `<div class="container"><div class="section-head reveal"><div>
      <div class="section-kicker">Contact</div><h2 class="section-title">Let's launch your website.</h2></div>
      <p class="section-description">Tell us what you need. Your message opens in WhatsApp, so you get a reply directly from us.</p></div>
    <div class="contact-grid">
      <div class="about-card contact-info reveal"><h3>Talk to Website Deals</h3>
        <p>Pick a package, choose a ready-made website, or ask for a custom build. We'll guide you from demo to launch.</p>
        <div class="contact-lines">
          <a class="contact-line" href="https://wa.me/${WA}" target="_blank" rel="noopener"><span>WhatsApp</span>01705633700</a>
          <a class="contact-line" href="tel:+${WA}"><span>Call</span>01705633700</a>
        </div></div>
      <form class="about-card contact-form reveal" id="contactForm" novalidate>
        <div class="field"><label for="cName">Your name</label><input id="cName" autocomplete="name" placeholder="e.g. Rahim Uddin"></div>
        <div class="field"><label for="cPkg">Package</label><select id="cPkg">
          <option>Starter — ৳549/month</option><option selected>Business — ৳999/month</option>
          <option>Premium — ৳1,999/month</option><option>Not sure yet</option></select></div>
        <div class="field"><label for="cMsg">Message</label><textarea id="cMsg" placeholder="What kind of business or website do you need?"></textarea></div>
        <button class="btn btn-primary" type="submit">Send on WhatsApp →</button>
      </form></div></div>`;
  ($("#about") || $("main")).after(contact);
  contact.querySelectorAll(".reveal").forEach((el) => revealIO.observe(el));
  if (typeof observer !== "undefined") observer.observe(contact);

  $("#contactForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#cName").value.trim();
    $("#cName").parentElement.classList.toggle("bad", !name);
    if (!name) return $("#cName").focus();
    const msg = $("#cMsg").value.trim();
    window.open(wa(`Hello Website Deals, I'm ${name}.\nPackage: ${$("#cPkg").value}${msg ? "\n" + msg : ""}`), "_blank", "noopener");
  });

  // nav + footer links
  const supportLink = $$(".nav-links a").find((a) => /support/i.test(a.textContent));
  if (supportLink) { const a = document.createElement("a"); a.href = "#contact"; a.textContent = "Contact"; supportLink.before(a); }
  const fl = $(".footer-links a"); if (fl) { const a = document.createElement("a"); a.href = "#contact"; a.textContent = "Contact"; fl.parentElement.insertBefore(a, $$(".footer-links a").pop()); }
  $$(".nav-links a[href^='#']").forEach((a) => a.addEventListener("click", () => $(".nav-links").classList.remove("open")));

  /* ---------- SUPPORT LINKS → local support page ---------- */
  $$('a[href*="support.websitedeals.com"]').forEach((a) => { a.href = "./support/"; a.removeAttribute("target"); a.removeAttribute("rel"); });

  /* ---------- START ---------- */
  loadSalah();
  if ($$(".website-card").length) decorate();   // in case cards rendered first
})();
