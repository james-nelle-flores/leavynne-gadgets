/* =========================================================
   Leavynne Gadgets — Storefront, inquiry bag, staff inventory system
   Plain JavaScript (no frameworks). Data persists in localStorage.
   Staff sign-in is handled by js/auth.js (window.LGAuth).
   ========================================================= */
(function () {
  "use strict";

  /* ---------------- Utilities ---------------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const peso = (n) => "₱" + Number(n).toLocaleString("en-PH", { maximumFractionDigits: 0 });
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const memLabel = (v) => (v.ram ? `${v.ram} / ${v.storage}` : v.storage);
  const catLabel = (c) => (c === "tablet" ? "Tablets" : "Phones");
  const fmtDate = (d) => (d ? new Date(d).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }) : "—");
  const hexOf = (c) => COLOR_HEX[c] || "#B9B3B5";
  const cdot = (c, cls = "") => `<span class="cdot ${cls}" style="--c:${hexOf(c)}" title="${esc(c)}" aria-hidden="true"></span>`;
  const LOGO = `<img src="images/logo.png" alt="" onerror="this.replaceWith(Object.assign(document.createElement('b'),{textContent:'LG'}))">`;
  const ICON = {
    arrow: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    ext: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>',
    chat: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/></svg>',
    phone: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>',
    tablet: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M11 17h2"/></svg>',
    info: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>'
  };

  const store = {
    get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked */ } }
  };
  const KEYS = { inv: "lg_inventory_v2", bag: "lg_bag_v1", orders: "lg_orders_v1", theme: "lg_theme", colors: "lg_colors_v1" };
  Object.assign(COLOR_HEX, store.get(KEYS.colors, {})); /* custom swatches added by staff */

  /* Load saved inventory, but always take image fields from data.js so new images appear */
  function loadInventory() {
    const saved = store.get(KEYS.inv, null);
    if (!saved) return clone(PRODUCTS);
    saved.forEach((p) => {
      const src = PRODUCTS.find((x) => x.id === p.id);
      if (src) { p.image = src.image; p.imageColor = src.imageColor; p.colorImages = src.colorImages ? clone(src.colorImages) : undefined; }
    });
    return saved;
  }
  let inventory = loadInventory();
  let bag = store.get(KEYS.bag, []);
  let orders = store.get(KEYS.orders, []);
  const saveInv = () => store.set(KEYS.inv, inventory);
  const saveBag = () => { store.set(KEYS.bag, bag); updateBagCount(); };
  const saveOrders = () => store.set(KEYS.orders, orders);

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2800);
  }

  /* ---------------- Theme (light / dark) ---------------- */
  function setTheme(mode, save = true) {
    document.documentElement.setAttribute("data-theme", mode);
    const sw = $("#theme-switch");
    if (sw) { sw.setAttribute("aria-checked", String(mode === "dark")); $("#theme-label").textContent = mode === "dark" ? "Dark" : "Light"; }
    const meta = $('meta[name="theme-color"]'); if (meta) meta.content = mode === "dark" ? "#2A1A21" : "#7A3A4A";
    if (save) { try { localStorage.setItem(KEYS.theme, mode); } catch { /* ignore */ } }
  }

  /* ---------------- Product helpers ---------------- */
  const findProduct = (id) => inventory.find((p) => p.id === id);
  const findVariant = (sku) => {
    for (const p of inventory) { const v = p.variants.find((x) => x.sku === sku); if (v) return { p, v }; }
    return null;
  };
  const stockOf = (p) => p.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);
  const pricedVariants = (p) => p.variants.filter((v) => v.price != null && v.price !== "");
  function minPrice(p, inStockOnly = false) {
    const list = pricedVariants(p).filter((v) => !inStockOnly || v.stock > 0);
    return list.length ? Math.min(...list.map((v) => Number(v.price))) : null;
  }
  const uniq = (arr) => [...new Set(arr)];
  function metaLine(p) {
    const colors = uniq(p.variants.map((v) => v.color));
    const mems = uniq(p.variants.map(memLabel));
    const cond = p.condition ? ` · ${p.condition}` : "";
    if (p.variants.length === 1) return `${mems[0]} · ${colors[0]}${cond}`;
    if (mems.length === 1) return `${mems[0]} · ${colors.length} listed colors${cond}`;
    if (colors.length === 1) return `${mems.join(" or ")} · ${colors[0]}`;
    return `${p.variants.length} listed variants · Confirm quote`;
  }
  function priceLine(p) { const m = minPrice(p); return m == null ? "Price on request" : `Listed from ${peso(m)}`; }
  function availLine(p) {
    const s = stockOf(p);
    if (s <= 0) return '<span class="dot dot--out"></span>Sold out · Ask about restock';
    return `<span class="dot"></span>${s} unit${s > 1 ? "s" : ""} listed · Confirm availability`;
  }
  const defaultColor = (p) => (p.imageColor && p.variants.some((v) => v.color === p.imageColor) ? p.imageColor : p.variants[0].color);

  /* Which studio image belongs to a color: color-specific image first, then the main image (its own color only) */
  function imageFor(p, color) {
    const col = color || defaultColor(p);
    if (p.colorImages && p.colorImages[col]) return p.colorImages[col];
    if (p.image && (!p.imageColor || col === p.imageColor)) return p.image;
    return null;
  }
  const hasPhotoFor = (p, color) => !!imageFor(p, color);

  /* Studio image when one exists for the chosen color, otherwise a front + back drawing in that color */
  function media(p, color, { drawingOnly = false } = {}) {
    const col = color || defaultColor(p);
    const c = hexOf(col);
    const type = p.category === "tablet" ? "tablet" : "phone";
    const cams = type === "tablet" ? "<i></i>" : "<i></i><i></i><i></i>";
    const art = `<div class="device device--${type}" role="img" aria-label="${esc(p.name)} in ${esc(col)}">
      <div class="dv dv--back" style="--c:${c}"><div class="dv__cam">${cams}</div></div>
      <div class="dv dv--front" style="--c:${c}"><span class="dv__punch"></span><div class="dv__screen"></div></div></div>`;
    const src = drawingOnly ? null : imageFor(p, col);
    if (!src) return `<div class="media-wrap">${art}</div>`;
    return `<div class="media-wrap try-photo">${art}<img class="media-img" src="${esc(src)}" alt="${esc(p.name)} in ${esc(col)}" loading="lazy" decoding="async" onerror="this.parentNode.classList.remove('try-photo');this.remove()"></div>`;
  }

  /* ---------------- Header: bag, search ---------------- */
  const bagCount = () => bag.reduce((s, i) => s + i.qty, 0);
  function updateBagCount() { $$("[data-bag-count]").forEach((el) => (el.textContent = bagCount())); }

  function searchProducts(q) {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    const words = t.split(/\s+/);
    return inventory.filter((p) => {
      const hay = [p.name, p.brand, p.series, p.category, catLabel(p.category), ...p.variants.map((v) => `${v.color} ${v.ram} ${v.storage}`)].join(" ").toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }
  function initSearch() {
    const input = $("#search-input"), box = $("#search-results");
    let active = -1;
    const close = () => { box.classList.remove("open"); active = -1; input.setAttribute("aria-expanded", "false"); };
    const render = () => {
      const res = searchProducts(input.value).slice(0, 6);
      if (!input.value.trim()) return close();
      box.innerHTML = res.length
        ? res.map((p, i) => `<a class="search__item" role="option" href="#/product/${p.id}" data-i="${i}">
            <div class="search__thumb">${media(p)}</div>
            <div><b style="font-size:.86rem;color:var(--ink)">${esc(p.name)}</b><div class="small">${esc(priceLine(p))}</div></div></a>`).join("") +
          `<a class="search__item link" href="#/shop?q=${encodeURIComponent(input.value.trim())}">See all results ${ICON.arrow}</a>`
        : `<div class="search__empty">No match for “${esc(input.value)}”. Try “Redmi”, “tablet” or a color.</div>`;
      box.classList.add("open"); input.setAttribute("aria-expanded", "true"); active = -1;
    };
    input.addEventListener("input", render);
    input.addEventListener("focus", render);
    input.addEventListener("keydown", (e) => {
      const items = $$(".search__item", box);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); if (!items.length) return;
        active = (active + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items.forEach((el, i) => el.classList.toggle("active", i === active));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const target = items[active] || null;
        if (target) location.hash = target.getAttribute("href");
        else if (input.value.trim()) location.hash = `#/shop?q=${encodeURIComponent(input.value.trim())}`;
        close(); input.blur();
      } else if (e.key === "Escape") { close(); input.blur(); }
    });
    box.addEventListener("click", () => { close(); input.value = ""; });
    document.addEventListener("click", (e) => { if (!e.target.closest(".search")) close(); });
  }

  /* ---------------- Shared sections ---------------- */
  function card(p) {
    const s = stockOf(p);
    const colors = uniq(p.variants.map((v) => v.color));
    const badge = p.condition ? `<span class="badge badge--dark">${esc(p.condition)}</span>`
      : s <= 0 ? '<span class="badge badge--soft">Sold out</span>'
      : p.variants.some((v) => v.freebie) ? '<span class="badge">With freebie</span>' : "";
    return `<article class="card reveal">
      <a class="card__media" href="#/product/${p.id}" aria-label="${esc(p.name)}">${media(p)}${badge}</a>
      <div class="card__body">
        <div class="card__cat">${catLabel(p.category)}</div>
        <a href="#/product/${p.id}" class="card__name">${esc(p.name)}</a>
        <div class="card__meta">${esc(metaLine(p))}</div>
        <div class="dots" aria-label="Colors: ${esc(colors.join(", "))}">${colors.map((c) => cdot(c, "cdot--sm")).join("")}</div>
        <div class="card__price">${esc(priceLine(p))}</div>
        <div class="card__avail">${availLine(p)}</div>
        <a class="btn btn--ghost btn--sm" href="#/product/${p.id}">View details &amp; options ${ICON.arrow}</a>
      </div></article>`;
  }
  const ctaBand = (title = "Let’s find the right phone or tablet.", sub = "Ask about a phone or tablet, check availability, or simply say hello.") => `
    <section class="cta"><div class="container">
      <div><h2>${title}</h2><p>${sub}</p></div>
      <a class="btn btn--primary" href="${SHOP.facebook}" target="_blank" rel="noopener">Ask about phones &amp; tablets on Facebook ${ICON.chat}</a>
    </div></section>`;

  /* ---------------- Pages ---------------- */
  function pageHome() {
    const featured = ["samsung-galaxy-a56-5g", "xiaomi-pad-5", "redmi-pad-se-8-7", "redmi-a5"].map(findProduct).filter(Boolean);
    const hero = findProduct("samsung-galaxy-a56-5g") || inventory[0];
    const tab = findProduct("xiaomi-pad-5") || inventory.find((p) => p.category === "tablet") || inventory[0];
    const phones = inventory.filter((p) => p.category === "phone").length;
    const tablets = inventory.filter((p) => p.category === "tablet").length;
    const lowest = Math.min(...inventory.map((p) => minPrice(p, true) ?? Infinity));
    return `
    <section class="hero"><div class="container hero__grid">
      <div class="fade-in">
        <div class="eyebrow">Phones &amp; gadgets</div>
        <h1>Phones &amp; gadgets.<br>Better days.</h1>
        <p class="lead">Explore phones, tablets and everyday gadgets that fit your routine. Start with a conversation at Leavynne Gadgets.</p>
        <div class="hero__ctas">
          <a class="btn btn--primary" href="#/shop">Explore phones &amp; gadgets ${ICON.arrow}</a>
          <button class="btn btn--ghost" type="button" data-open-ai>Ask our shopping assistant ${ICON.ext}</button>
        </div>
        <p class="small" style="display:flex;gap:6px;align-items:center">${ICON.chat} Not sure which phone or gadget fits? Start with a conversation.</p>
        <div class="hero__stats">
          <div><b>${phones + tablets}</b><span>Models listed</span></div>
          <div><b>${inventory.reduce((s, p) => s + stockOf(p), 0)}</b><span>Units available</span></div>
          ${Number.isFinite(lowest) ? `<div><b>${peso(lowest)}</b><span>Starting price</span></div>` : ""}
        </div>
      </div>
      ${hero ? `<a class="hero__media fade-in" href="#/product/${hero.id}" aria-label="${esc(hero.name)}">${media(hero)}<span class="pill-cap">${esc(hero.name)} · ${hasPhotoFor(hero) ? "Studio image" : "Model illustration"}</span></a>` : ""}
    </div></section>

    <section class="section"><div class="container">
      <div class="row-between"><h2 style="font-size:1.3rem">Explore phones &amp; gadgets</h2><a class="link" href="#/shop">Browse phones &amp; gadgets ${ICON.ext}</a></div>
      <div class="tiles">
        <a class="tile" href="#/phones"><span class="tile__icon">${ICON.phone}</span><span><b>Phones</b><span class="small">${phones} models · Stay connected</span></span></a>
        <a class="tile" href="#/tablets"><span class="tile__icon">${ICON.tablet}</span><span><b>Tablets</b><span class="small">${tablets} models · More screen time</span></span></a>
      </div>
      <div style="margin-top:56px" class="eyebrow">Phones &amp; gadgets</div>
      <div class="row-between" style="margin-top:8px"><h2>Phones and gadgets for everyday.</h2><a class="link" href="#/shop">Explore phones &amp; gadgets ${ICON.ext}</a></div>
      <div class="notice">${ICON.info} Product images are for reference · Message Leavynne Gadgets on Facebook to confirm prices, specifications and current availability.</div>
      <div class="grid">${featured.map(card).join("")}</div>
    </div></section>

    ${tab ? `<section class="container reveal"><div class="feature">
      <a class="feature__media" href="#/product/${tab.id}" aria-label="${esc(tab.name)}">${media(tab)}</a>
      <div class="feature__body">
        <div class="eyebrow">The everyday edit / Tablets</div>
        <h2 style="margin-top:10px">A bigger screen for your everyday.</h2>
        <p>Reading, browsing, streaming and more. Explore tablets that fit the way you use your time.</p>
        <a class="btn btn--ghost" href="#/tablets">Let’s find your tablet ${ICON.ext}</a>
      </div></div></section>` : ""}

    <section class="section"><div class="container about reveal">
      <div class="about__card"><div class="brand__logo">${LOGO}</div>
        <div><h3>Small business. Phones &amp; gadgets.</h3><p class="small" style="margin-top:8px">📍 Pateros</p></div></div>
      <div><div class="eyebrow">Phones &amp; gadgets</div>
        <h2 style="margin:10px 0 14px">Your next phone or tablet starts with a hello.</h2>
        <p class="lead">We’re a small business and gadget shop in Pateros focused on phones and tablets. Whether you know exactly what you’re looking for or just have a question, connect with Leavynne Gadgets on Facebook. There’s a real conversation behind the screen.</p>
        <p style="margin-top:16px"><a class="link" href="${SHOP.facebook}" target="_blank" rel="noopener">Ask about phones &amp; tablets on Facebook ${ICON.ext}</a></p></div>
    </div></section>

    <section class="section section--sand"><div class="container faq">
      <div><div class="eyebrow">Shopping help</div><h2 style="margin:10px 0 14px">Phone &amp; tablet questions. Clear next steps.</h2>
        <p class="small">A few things to know before finding your next phone or tablet.</p></div>
      <div>
        <details open><summary>Is this phone or tablet available right now?</summary><p>Listed stock comes from the shop’s inventory. Message us on Facebook to confirm current prices and availability.</p></details>
        <details><summary>How do I choose the right phone or tablet?</summary><p>Tell us what you need, your budget and how you plan to use it — or try our shopping assistant at the bottom-right of the page.</p></details>
        <details><summary>What about delivery, pickup or support?</summary><p>Please confirm these details directly with the shop before placing an order.</p></details>
      </div></div></section>
    ${ctaBand()}`;
  }

  function pageShop(cat, query) {
    const q = query.get("q") || "";
    const sort = query.get("sort") || "featured";
    const avail = query.get("stock") === "1";
    let list = q ? searchProducts(q) : inventory.slice();
    if (cat) list = list.filter((p) => p.category === cat);
    if (avail) list = list.filter((p) => stockOf(p) > 0);
    const byPrice = (p) => minPrice(p) ?? Infinity;
    if (sort === "low") list.sort((a, b) => byPrice(a) - byPrice(b));
    if (sort === "high") list.sort((a, b) => (minPrice(b) ?? -1) - (minPrice(a) ?? -1));
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));

    const heads = {
      "": { crumb: "Home / All gadgets", h: "Find your everyday favorite.", p: "Phones, tablets and a little help choosing. Explore our product references, then ask us about the exact unit." },
      phone: { crumb: "Home / Shop all / Phones", h: "Find your everyday phone.", p: "From everyday essentials to a little more possibility. Browse the full phone selection and find a starting point for your next upgrade." },
      tablet: { crumb: "Home / Tablets", h: "A little more room for your day.", p: "For your reading, streaming and everything in between. Find a tablet that fits the way you use your time." }
    }[cat || ""];
    const base = cat === "phone" ? "#/phones" : cat === "tablet" ? "#/tablets" : "#/shop";
    return `
    <section class="page-hero"><div class="container page-hero__grid">
      <div><div class="crumbs">${heads.crumb}</div><h1>${q ? `Results for “${esc(q)}”` : heads.h}</h1><p class="lead">${heads.p}</p></div>
      ${cat === "phone" ? `<div class="hint-card">${ICON.chat}<b style="display:block;color:var(--ink);margin:6px 0 4px">Not sure where to start?</b>Tell us your budget and what matters to you. Let’s find a phone that fits.<br><button type="button" class="link" style="border:0;background:none;padding:0;margin-top:8px" data-open-ai>Ask the shopping assistant ${ICON.ext}</button></div>` : ""}
    </div></section>
    <section class="section" style="padding-top:36px"><div class="container">
      <div class="filters">
        <div class="seg" aria-label="Category">
          <a href="#/shop" class="${!cat ? "active" : ""}">Browse All gadgets</a>
          <a href="#/phones" class="${cat === "phone" ? "active" : ""}">Browse Phones</a>
          <a href="#/tablets" class="${cat === "tablet" ? "active" : ""}">Browse Tablets</a>
        </div>
        <form class="tools" id="shop-tools" data-base="${base}">
          <label class="sr-only" for="sort">Sort</label>
          <select class="select" id="sort" name="sort">
            <option value="featured"${sort === "featured" ? " selected" : ""}>Sort: Featured</option>
            <option value="low"${sort === "low" ? " selected" : ""}>Price: Low to high</option>
            <option value="high"${sort === "high" ? " selected" : ""}>Price: High to low</option>
            <option value="name"${sort === "name" ? " selected" : ""}>Name: A–Z</option>
          </select>
          <label class="check"><input type="checkbox" name="stock" value="1"${avail ? " checked" : ""}> In stock only</label>
          ${q ? `<input type="hidden" name="q" value="${esc(q)}"><a class="btn btn--ghost btn--sm" href="${base}">Clear search ✕</a>` : ""}
        </form>
      </div>
      <div class="notice notice--sand">Studio images are for reference · Listed prices are references, not live stock. Confirm the exact unit, finish and current quote with the shop.</div>
      <h2 class="count-title">${list.length} device${list.length === 1 ? "" : "s"} to explore</h2>
      ${list.length ? `<div class="grid">${list.map(card).join("")}</div>`
        : `<div class="empty"><h3>No devices match yet.</h3><p class="small" style="margin:8px 0 16px">Try a different search or ask us — we may have it in the next batch.</p><a class="btn btn--primary" href="#/shop">Browse all gadgets</a></div>`}
    </div></section>
    <section class="cta"><div class="container"><div><h2>A real conversation makes choosing easier.</h2><p>Tell us your budget, preferred size and what you use your device for. We’ll help you explore the options.</p></div>
      <button class="btn btn--ghost" type="button" data-open-ai>Get help choosing ${ICON.ext}</button></div></section>`;
  }
  function bindShop() {
    const f = $("#shop-tools"); if (!f) return;
    f.addEventListener("change", () => {
      const params = new URLSearchParams();
      for (const [k, v] of new FormData(f).entries()) if (v && !(k === "sort" && v === "featured")) params.set(k, v);
      const qs = params.toString();
      location.hash = f.dataset.base + (qs ? "?" + qs : "");
    });
    f.addEventListener("submit", (e) => e.preventDefault());
  }

  /* ---------- Product detail ---------- */
  const pdState = { id: null, color: null, sku: null, qty: 1 };
  function pageProduct(id) {
    const p = findProduct(id);
    if (!p || !p.variants.length) return pageNotFound();
    if (pdState.id !== id || !p.variants.some((x) => x.sku === pdState.sku)) {
      const dc = defaultColor(p);
      const first = p.variants.find((v) => v.color === dc && v.stock > 0) || p.variants.find((v) => v.stock > 0) || p.variants[0];
      Object.assign(pdState, { id, color: first.color, sku: first.sku, qty: 1 });
    }
    const v = p.variants.find((x) => x.sku === pdState.sku) || p.variants[0];
    const colors = uniq(p.variants.map((x) => x.color));
    const mems = uniq(p.variants.map(memLabel));
    const others = inventory.filter((x) => x.id !== p.id && x.category === p.category);
    const rel = others.length ? others[(inventory.indexOf(p) + 1) % others.length] : inventory.find((x) => x.id !== p.id);
    const maxQty = Math.max(0, Number(v.stock) || 0);
    const catPath = p.category === "tablet" ? "#/tablets" : "#/phones";
    const photo = hasPhotoFor(p, v.color);

    const colorOpts = colors.map((c) => {
      const has = p.variants.some((x) => x.color === c && x.stock > 0);
      const sel = c === pdState.color;
      return `<button type="button" class="opt ${sel ? "sel" : ""}" data-color="${esc(c)}" aria-pressed="${sel}" aria-label="${esc(c)}${sel ? ", selected" : ""}">
        <span class="sw" style="--c:${hexOf(c)}"></span>${esc(c)}<small>${sel ? "Selected ✓" : has ? "Choose color" : "Ask for restock"}</small></button>`;
    }).join("");
    const memOpts = mems.map((m) => {
      const mv = p.variants.find((x) => x.color === pdState.color && memLabel(x) === m);
      const sel = mv && mv.sku === v.sku;
      const [ram, sto] = m.includes(" / ") ? m.split(" / ") : ["", m];
      return `<button type="button" class="opt opt--mem ${sel ? "sel" : ""}" data-sku="${mv ? esc(mv.sku) : ""}" ${mv ? "" : "disabled"} aria-pressed="${!!sel}">
        <b>${esc(sto)}</b><small>${ram ? esc(ram) + " RAM" : "RAM to confirm"}${mv && mv.price ? " · " + peso(mv.price) : ""}</small>
        <small>${sel ? "Selected ✓" : mv ? (mv.stock > 0 ? "Available to request" : "Sold out") : "Not listed in this color"}</small></button>`;
    }).join("");

    return `
    <div class="container"><div class="crumbs" style="text-transform:none;letter-spacing:0;color:var(--muted);margin:24px 0 0">
      <a href="#/">Home</a> / <a href="${catPath}">${catLabel(p.category)}</a> / ${esc(p.name)}</div>
    <div class="pd">
      <div>
        <div class="pd__media">${media(p, v.color)}</div>
        <div class="pd__caption">${photo ? "Studio image" : "Model illustration"} / ${esc(v.color)}</div>
        ${p.highlights && p.highlights.length ? `<div class="hl">${p.highlights.map(([b, s]) => `<div><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join("")}</div>` : ""}
        <div class="note-box" style="margin-top:14px"><b>Photo &amp; variant note</b><p style="margin-top:4px">Images are for reference and colors are approximate. Ask for current photos of the exact unit, its condition and included items.</p></div>
      </div>
      <div>
        <div class="eyebrow">${esc(p.brand)} / ${catLabel(p.category)}</div>
        <h1>${esc(p.name)}</h1>
        <div class="pd__sub">${esc(v.color)} · ${esc(memLabel(v))}${p.condition ? " · " + esc(p.condition) : ""}</div>
        <div class="pd__price" aria-live="polite">${v.price ? "Listed price " + peso(v.price) : "Price on request"}</div>
        <div class="pd__srp">${v.srp && v.price && v.srp > v.price ? `SRP <s>${peso(v.srp)}</s> · You save ${peso(v.srp - v.price)}` : "Message us for the latest price and availability."}</div>
        ${v.freebie ? `<span class="free">🎁 Freebie: ${esc(v.freebie)}</span>` : ""}
        ${p.blurb ? `<p class="small" style="margin-top:12px">${esc(p.blurb)}</p>` : ""}
        <div class="opt-label">Choose your color · <span>${esc(pdState.color)}</span></div>
        <div class="opts">${colorOpts}</div>
        <p class="small" style="margin-top:8px">Approximate model colors. Only listed color–memory combinations can be selected.</p>
        <div class="opt-label">Choose RAM &amp; storage</div>
        <div class="opts">${memOpts}</div>
        <div class="req">${cdot(v.color)}<div><div class="eyebrow">Your requested variant</div><b>${esc(v.color)} · ${esc(memLabel(v))}</b>
          <span class="small">${maxQty > 0 ? `${maxQty} unit${maxQty > 1 ? "s" : ""} listed` : "Currently sold out"} · Price &amp; stock to confirm · No payment taken here</span></div></div>
        <div class="qty-row"><span style="font-weight:600;color:var(--ink);font-size:.86rem">Quantity</span>
          <div class="qty"><button type="button" data-q="-1" aria-label="Decrease" ${pdState.qty <= 1 ? "disabled" : ""}>−</button><span aria-live="polite">${pdState.qty}</span><button type="button" data-q="1" aria-label="Increase" ${pdState.qty >= maxQty ? "disabled" : ""}>+</button></div></div>
        ${maxQty > 0
          ? `<button type="button" class="btn btn--primary btn--block" id="add-bag">Review inquiry · ${esc(p.name)} ${ICON.arrow}</button>`
          : `<a class="btn btn--primary btn--block" href="${SHOP.facebook}" target="_blank" rel="noopener">Ask about restock ${ICON.ext}</a>`}
        <a class="btn btn--ghost btn--block" style="margin-top:10px" href="${SHOP.facebook}" target="_blank" rel="noopener">Ask about other variants ${ICON.ext}</a>
        <p class="small" style="margin-top:10px">No payment taken here. Price, condition, inclusions and availability are confirmed with the shop.</p>
      </div>
    </div></div>

    <section class="section section--sand"><div class="container specs">
      <div><div class="eyebrow">The details</div><h2 style="margin-top:8px">The specifications, made simple.</h2>
        <table class="spec-table"><tbody>
          <tr><th>Model</th><td>${esc(p.name)}</td></tr>
          ${(p.specs || []).map(([k, val]) => `<tr><th>${esc(k)}</th><td>${esc(val)}</td></tr>`).join("")}
          <tr><th>Requested variant</th><td><span class="cdot-label">${cdot(v.color, "cdot--sm")}${esc(v.color)} · ${esc(memLabel(v))}</span></td></tr>
        </tbody></table>
        <p class="small" style="margin-top:12px">Model specifications: ${esc(p.specSource || "Manufacturer")}. Specifications describe the global model, not a promise of stock or the supplied charger. Confirm the exact unit and inclusions with the shop.</p></div>
      <div class="confirm"><h3 style="margin-top:42px">A few things to confirm.</h3>
        <h4>Current unit &amp; condition</h4><p>Ask for current photos, cosmetic condition and the exact configuration.</p>
        <h4>Inclusions &amp; warranty</h4><p>Confirm included accessories, listed freebies and applicable warranty terms before payment.</p>
        <h4>Delivery or pickup</h4><p>Ask the shop which arrangements are available for your location.</p>
        <div class="configs" style="margin-top:28px"><h3>Listed configurations</h3><ul>
          ${p.variants.map((x) => `<li><span class="cdot-label">${cdot(x.color)}<span><b style="color:var(--ink)">${esc(x.color)}</b><br><span class="small">${esc(memLabel(x))}${x.stock > 0 ? "" : " · Sold out"}</span></span></span><b style="color:var(--accent-text)">${x.price ? peso(x.price) : "On request"}</b></li>`).join("")}
        </ul></div></div>
    </div></section>

    ${rel ? `<section class="section"><div class="container"><h2>Another ${p.category === "tablet" ? "tablet" : "phone"} to explore.</h2>
      <div class="related">
        <a class="rel-card" href="#/product/${rel.id}"><div class="rel-card__img">${media(rel)}</div>
          <div><div class="card__cat">${esc(rel.brand)} / ${catLabel(rel.category)}</div><h3 style="margin:6px 0">${esc(rel.name)}</h3><p class="small">${esc(priceLine(rel))}</p><span class="link" style="margin-top:8px">View details &amp; options ${ICON.arrow}</span></div></a>
        <div class="rel-card rel-card--blush"><h3>Not sure which one fits?</h3><p class="small" style="margin:8px 0 14px">Tell us your budget and what matters most. We’ll help you narrow down the options.</p>
          <button class="link" type="button" style="border:0;background:none;padding:0" data-open-ai>Ask the shopping assistant ${ICON.ext}</button></div>
      </div></div></section>` : ""}
    ${ctaBand()}`;
  }
  function bindProduct(id) {
    const p = findProduct(id); if (!p) return;
    /* Preload the other color images so switching colors is instant */
    Object.values(p.colorImages || {}).concat(p.image || []).forEach((src) => { const i = new Image(); i.src = src; });
    const rerender = () => { $("#app").innerHTML = pageProduct(id); bindProduct(id); bindAiButtons(); };
    $$("[data-color]").forEach((b) => b.addEventListener("click", () => {
      const c = b.dataset.color;
      const cur = p.variants.find((x) => x.sku === pdState.sku);
      const same = p.variants.find((x) => x.color === c && cur && memLabel(x) === memLabel(cur));
      const pick = same || p.variants.find((x) => x.color === c && x.stock > 0) || p.variants.find((x) => x.color === c);
      Object.assign(pdState, { color: c, sku: pick.sku, qty: 1 });
      rerender();
    }));
    $$("[data-sku]").forEach((b) => b.addEventListener("click", () => {
      if (!b.dataset.sku) return;
      Object.assign(pdState, { sku: b.dataset.sku, qty: 1 }); rerender();
    }));
    $$("[data-q]").forEach((b) => b.addEventListener("click", () => {
      const v = p.variants.find((x) => x.sku === pdState.sku);
      pdState.qty = Math.min(Math.max(1, pdState.qty + Number(b.dataset.q)), Math.max(1, v.stock));
      rerender();
    }));
    const add = $("#add-bag");
    if (add) add.addEventListener("click", () => {
      const v = p.variants.find((x) => x.sku === pdState.sku);
      const line = bag.find((i) => i.sku === v.sku);
      const qty = Math.min(pdState.qty, v.stock - (line ? line.qty : 0));
      if (qty <= 0) { toast("All listed units of this variant are already in your bag."); return; }
      if (line) line.qty += qty; else bag.push({ sku: v.sku, qty });
      saveBag();
      toast(`Added ${p.name} · ${v.color} · ${memLabel(v)}`);
      location.hash = "#/bag";
    });
  }

  /* ---------- Inquiry bag ---------- */
  let lastOrder = null;
  function bagLines() {
    return bag.map((i) => { const f = findVariant(i.sku); return f ? { ...i, p: f.p, v: f.v } : null; }).filter(Boolean);
  }
  function pageBag() {
    const lines = bagLines();
    const head = `<section class="page-hero"><div class="container"><div class="crumbs">Home / Inquiry bag</div>
      <h1>${lastOrder ? "Inquiry saved." : "Your next gadget starts here."}</h1>
      <p class="lead">Review your chosen product, then speak with the shop to confirm the details. This is an inquiry, not a completed order.</p></div></section>`;
    const steps = `<section class="section"><div class="container"><h2>Before you place an order</h2><div class="steps">
      <div><h3>01 · Share your selection</h3><p>Send the product name, color and memory preference shown in your review.</p></div>
      <div><h3>02 · Confirm the details</h3><p>Agree the current price, unit condition, inclusions and availability with the shop.</p></div>
      <div><h3>03 · Arrange your order</h3><p>Confirm delivery or pickup and payment arrangements directly with Leavynne Gadgets.</p></div></div></div></section>`;

    if (lastOrder) {
      const o = lastOrder;
      return head + `<section class="section" style="padding-bottom:0"><div class="container"><div class="panel fade-in">
        <div class="eyebrow">Reference ${esc(o.id)}</div><h2 style="margin:8px 0 10px">Thank you, ${esc(o.customer.name)}!</h2>
        <p class="lead">Last step: send this message to Leavynne Gadgets on Facebook so the shop can confirm price and availability.</p>
        <div class="msg-box" id="msg-box" style="margin:18px 0">${esc(orderMessage(o))}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn--primary" type="button" id="copy-msg">Copy message &amp; open Messenger ${ICON.ext}</button>
          <a class="btn btn--ghost" href="#/shop" id="continue">Continue browsing</a></div></div></div></section>` + steps;
    }
    if (!lines.length) {
      return head + `<section class="section" style="padding-bottom:0"><div class="container"><div class="panel" style="padding:48px 28px">
        <h2>Nothing picked just yet.</h2><p class="lead" style="margin:12px 0 22px">Explore phones and tablets, choose a product, then review your inquiry here.</p>
        <a class="btn btn--primary btn--block" href="#/shop">Browse all gadgets ${ICON.arrow}</a></div></div></section>` + steps;
    }
    const priced = lines.filter((l) => l.v.price);
    const total = priced.reduce((s, l) => s + l.v.price * l.qty, 0);
    const hasOnRequest = lines.length !== priced.length;
    return head + `<section class="section"><div class="container bag">
      <div class="panel panel--white"><h2 style="font-size:1.3rem">Your selection (${bagCount()})</h2>
        ${lines.map((l) => `<div class="line">
          <a class="line__img" href="#/product/${l.p.id}">${media(l.p, l.v.color)}</a>
          <div><a class="line__name" href="#/product/${l.p.id}">${esc(l.p.name)}</a>
            <div class="small cdot-label">${cdot(l.v.color, "cdot--sm")}${esc(l.v.color)} · ${esc(memLabel(l.v))}${l.v.freebie ? " · 🎁 " + esc(l.v.freebie) : ""}</div>
            <div class="line__ctrl"><div class="qty"><button type="button" data-bq="-1" data-sku="${esc(l.sku)}" aria-label="Decrease" ${l.qty <= 1 ? "disabled" : ""}>−</button><span>${l.qty}</span><button type="button" data-bq="1" data-sku="${esc(l.sku)}" aria-label="Increase" ${l.qty >= l.v.stock ? "disabled" : ""}>+</button></div>
              <button class="remove" type="button" data-remove="${esc(l.sku)}">Remove</button></div></div>
          <b style="color:var(--accent-text)">${l.v.price ? peso(l.v.price * l.qty) : "On request"}</b></div>`).join("")}
        <div class="totals"><span>Reference total</span><span>${peso(total)}${hasOnRequest ? " + items on request" : ""}</span></div>
        <p class="small" style="margin-top:6px">Reference prices only. The shop confirms the final quote.</p>
      </div>
      <form class="panel" id="inquiry-form" novalidate><h2 style="font-size:1.3rem">Your details</h2>
        <div class="form-grid">
          <label>Full name<input class="input" name="name" autocomplete="name" required maxlength="60"><span class="err" data-err="name"></span></label>
          <label>Mobile number<input class="input" name="phone" autocomplete="tel" inputmode="tel" placeholder="09XX XXX XXXX" required><span class="err" data-err="phone"></span></label>
          <label>Facebook name (optional)<input class="input" name="fb" maxlength="60"></label>
          <label>Preferred arrangement<select class="select" name="method"><option>Pickup in Pateros</option><option>Delivery</option></select></label>
          <label id="addr-wrap" hidden>Delivery area / address<input class="input" name="address" maxlength="160"><span class="err" data-err="address"></span></label>
          <label>Notes for the shop (optional)<textarea class="input" name="notes" rows="3" maxlength="300" placeholder="e.g. I'd like photos of the actual unit"></textarea></label>
          <button class="btn btn--primary btn--block" type="submit">Submit inquiry ${ICON.arrow}</button>
          <p class="small">No payment is taken on this website.</p>
        </div></form>
    </div></section>` + steps;
  }
  function orderMessage(o) {
    return [`Hi Leavynne Gadgets! I'd like to inquire (Ref ${o.id}):`, "",
      ...o.items.map((i) => `• ${i.qty} × ${i.name} — ${i.color}, ${i.mem}${i.price ? ` (listed ${peso(i.price)} each)` : " (price on request)"}`),
      "", `Name: ${o.customer.name}`, `Mobile: ${o.customer.phone}`,
      o.customer.fb ? `Facebook: ${o.customer.fb}` : null,
      `Arrangement: ${o.customer.method}${o.customer.address ? " — " + o.customer.address : ""}`,
      o.customer.notes ? `Notes: ${o.customer.notes}` : null, "", "Please confirm price and availability. Thank you!"]
      .filter((x) => x !== null).join("\n");
  }
  function bindBag() {
    $$("[data-bq]").forEach((b) => b.addEventListener("click", () => {
      const line = bag.find((i) => i.sku === b.dataset.sku); const f = findVariant(b.dataset.sku);
      if (!line || !f) return;
      line.qty = Math.min(Math.max(1, line.qty + Number(b.dataset.bq)), Math.max(1, f.v.stock));
      saveBag(); route();
    }));
    $$("[data-remove]").forEach((b) => b.addEventListener("click", () => {
      bag = bag.filter((i) => i.sku !== b.dataset.remove); saveBag(); toast("Removed from your bag"); route();
    }));
    const form = $("#inquiry-form");
    if (form) {
      const method = form.elements.method, wrap = $("#addr-wrap");
      method.addEventListener("change", () => (wrap.hidden = method.value !== "Delivery"));
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(form).entries());
        Object.keys(d).forEach((k) => (d[k] = String(d[k]).trim()));
        const phone = d.phone.replace(/[\s-]/g, "");
        const errs = {
          name: d.name.length < 2 ? "Please enter your name." : "",
          phone: /^(09\d{9}|\+639\d{9})$/.test(phone) ? "" : "Enter a valid PH mobile number (09XXXXXXXXX).",
          address: d.method === "Delivery" && d.address.length < 5 ? "Please enter your delivery area." : ""
        };
        $$("[data-err]", form).forEach((el) => (el.textContent = errs[el.dataset.err] || ""));
        const firstErr = Object.keys(errs).find((k) => errs[k]);
        if (firstErr) { form.elements[firstErr].focus(); return; }
        const lines = bagLines();
        if (!lines.length) { toast("Your bag is empty."); return; }
        const now = new Date();
        const id = "LG-" + now.toISOString().slice(2, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
        const o = {
          id, date: now.toISOString(), status: "New",
          customer: { name: d.name, phone, fb: d.fb, method: d.method, address: d.method === "Delivery" ? d.address : "", notes: d.notes },
          items: lines.map((l) => ({ sku: l.sku, productId: l.p.id, name: l.p.name, color: l.v.color, mem: memLabel(l.v), price: l.v.price || null, qty: l.qty })),
          total: lines.reduce((s, l) => s + (l.v.price || 0) * l.qty, 0)
        };
        orders.unshift(o); saveOrders();
        bag = []; saveBag(); lastOrder = o; route(); window.scrollTo(0, 0);
      });
    }
    const copy = $("#copy-msg");
    if (copy) copy.addEventListener("click", async () => {
      const text = orderMessage(lastOrder);
      try { await navigator.clipboard.writeText(text); toast("Message copied — paste it in Messenger."); }
      catch { const r = document.createRange(); r.selectNodeContents($("#msg-box")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Message selected — press Ctrl+C to copy."); }
      window.open(SHOP.messenger, "_blank", "noopener");
    });
    const cont = $("#continue"); if (cont) cont.addEventListener("click", () => (lastOrder = null));
  }

  /* ---------- Contact ---------- */
  function pageContact() {
    const qa = [
      ["Are these products available now?", "Listed stock comes from the shop’s inventory. Confirm live stock, colors and memory options with us before ordering."],
      ["How much does a product cost?", "Listed prices are references from our shop list. The shop quotes the exact unit — ask about the model, variant, condition and any applicable offers."],
      ["Can I request more photos?", "Ask for current views of the actual unit, its condition and the included items."],
      ["What about delivery or pickup?", "Confirm available arrangements and any related charges with the shop."],
      ["Is there a warranty or return policy?", "Confirm warranty coverage, checking periods and return conditions directly before payment."],
      ["Can you help me choose?", "Tell us your budget and what matters most — screen size, storage, camera or everyday use. Our shopping assistant can also suggest options."]
    ];
    return `<section class="page-hero"><div class="container"><div class="crumbs">Contact &amp; shopping help</div>
      <h1>Good gadgets. Real conversations.</h1><p class="lead">Not sure where to start? Tell us what you need and we’ll help you explore your options.</p></div></section>
    <section class="section"><div class="container contact">
      <div class="panel"><h2>Say hello to Leavynne Gadgets.</h2><p>Ask about a product, confirm a variant, or request current photos of the exact unit.</p>
        <p style="margin:14px 0"><a class="link" href="${SHOP.facebook}" target="_blank" rel="noopener">${SHOP.facebookLabel}</a></p>
        <a class="btn btn--primary btn--block" href="${SHOP.facebook}" target="_blank" rel="noopener">Visit Leavynne Gadgets on Facebook ${ICON.ext}</a></div>
      <div class="panel" style="background:var(--blush)"><h2>Small business. Local connection.</h2><p style="color:var(--ink);font-weight:500">${SHOP.location}</p>
        <p class="small" style="margin:12px 0 18px">Please message us to confirm the exact pickup location, visiting arrangements and hours before heading over.</p>
        <a class="btn btn--ghost btn--block" href="#/shop">Explore phones &amp; tablets ${ICON.arrow}</a></div>
    </div></section>
    <section class="section section--sand"><div class="container"><h2>A little help before you choose.</h2>
      <div class="qgrid">${qa.map(([q, a]) => `<div class="qcard reveal"><h3>${q}</h3><p>${a}</p></div>`).join("")}</div></div></section>`;
  }

  function pageNotFound() {
    return `<section class="section"><div class="container empty"><h2>We couldn’t find that page.</h2>
      <p class="small" style="margin:10px 0 18px">The product may have been removed or the link is incorrect.</p><a class="btn btn--primary" href="#/shop">Browse all gadgets</a></div></section>`;
  }

  /* ================== STAFF SIGN-IN / CREATE ACCOUNT ================== */
  const pwField = (name, label, auto) => `
    <label for="f-${name}">${label}</label>
    <div class="pw" style="margin-top:-8px"><input class="input" id="f-${name}" type="password" name="${name}" autocomplete="${auto}" maxlength="64" required>
      <button type="button" class="pw__toggle" data-toggle="f-${name}" aria-label="Show password" aria-pressed="false">Show</button></div>`;
  const meter = `<div class="meter" aria-hidden="true"><i id="pw-meter"></i></div><span class="hint" id="pw-meter-text" aria-live="polite">Use at least 8 characters with letters and numbers.</span>`;

  function authPage(mode) {
    const side = `<aside class="auth-side">
      <div><img src="images/logo.png" alt="Leavynne Gadgets logo" onerror="this.remove()"><div class="eyebrow">Leavynne Gadgets · Staff</div>
        <h2>${mode === "signup" ? "Join the shop team." : mode === "change" ? "One quick security step." : "Welcome back."}</h2>
        <p style="opacity:.85">The staff area keeps stock, prices and customer inquiries in one place.</p></div>
      <ul><li>Update stock and prices — the storefront updates instantly</li><li>Confirm inquiries and stock is deducted automatically</li><li>Automatic insights flag low stock and pricing issues</li></ul>
      <p class="small" style="color:#E9D9DC">Passwords are hashed before saving. Accounts are stored in this browser only.</p></aside>`;

    let body = "";
    if (mode === "signin") {
      const wait = LGAuth.lockedFor();
      body = `<div class="eyebrow">Staff only</div><h1>Sign in</h1><p class="small">Manage stock, prices and customer inquiries.</p>
        <div class="auth-tabs"><a href="#/admin" class="active" aria-current="page">Sign in</a><a href="#/admin/signup">Create account</a></div>
        <form id="auth-form" data-mode="signin" novalidate class="form-grid">
          <label for="f-username">Username</label>
          <input class="input" id="f-username" name="username" autocomplete="username" maxlength="20" required style="margin-top:-8px">
          ${pwField("password", "Password", "current-password")}
          <label class="check"><input type="checkbox" name="remember"> Keep me signed in on this device for 7 days</label>
          <span class="err" id="auth-err" role="alert">${wait ? `Too many attempts. Please wait ${wait} seconds and try again.` : ""}</span>
          <button class="btn btn--primary btn--block" type="submit">Sign in ${ICON.arrow}</button>
          <p class="small" style="text-align:center">Forgot your password? Ask the shop owner to reset it from the <b>Team</b> tab.</p>
        </form>`;
    } else if (mode === "signup") {
      body = `<div class="eyebrow">New staff member</div><h1>Create account</h1><p class="small">You’ll need the staff invite code from the shop owner.</p>
        <div class="auth-tabs"><a href="#/admin">Sign in</a><a href="#/admin/signup" class="active" aria-current="page">Create account</a></div>
        <form id="auth-form" data-mode="signup" novalidate class="form-grid">
          <div class="form-row-2">
            <label>Full name<input class="input" name="name" autocomplete="name" maxlength="60" required></label>
            <label>Username <input class="input" name="username" autocomplete="username" maxlength="20" required placeholder="e.g. juan.dc"></label>
          </div>
          ${pwField("password", "Password", "new-password")}
          ${meter}
          ${pwField("confirm", "Confirm password", "new-password")}
          <label>Staff invite code<input class="input" name="code" autocomplete="off" maxlength="40" required placeholder="Provided by the owner"></label>
          <span class="err" id="auth-err" role="alert"></span>
          <button class="btn btn--primary btn--block" type="submit">Create account ${ICON.arrow}</button>
          <p class="small" style="text-align:center">Already have an account? <a class="link" href="#/admin">Sign in</a></p>
        </form>`;
    } else {
      const me = LGAuth.current();
      body = `<div class="eyebrow">Signed in as ${esc(me.name)}</div><h1>Set a new password</h1>
        <p class="small">You signed in with a temporary password. Choose a new one to continue.</p>
        <form id="auth-form" data-mode="change" novalidate class="form-grid">
          ${pwField("old", "Current (temporary) password", "current-password")}
          ${pwField("password", "New password", "new-password")}
          ${meter}
          ${pwField("confirm", "Confirm new password", "new-password")}
          <span class="err" id="auth-err" role="alert"></span>
          <button class="btn btn--primary btn--block" type="submit">Save and continue ${ICON.arrow}</button>
          <button class="btn btn--ghost btn--block" type="button" id="auth-cancel">Sign out</button>
        </form>`;
    }
    return `<div class="container"><div class="auth-wrap fade-in">${side}<div class="auth-main">${body}</div></div></div>`;
  }

  function bindPwHelpers(root = document) {
    $$("[data-toggle]", root).forEach((b) => b.addEventListener("click", () => {
      const inp = document.getElementById(b.dataset.toggle);
      const show = inp.type === "password";
      inp.type = show ? "text" : "password";
      b.textContent = show ? "Hide" : "Show";
      b.setAttribute("aria-pressed", String(show));
      b.setAttribute("aria-label", show ? "Hide password" : "Show password");
    }));
    const pw = $("#f-password", root), bar = $("#pw-meter", root), txt = $("#pw-meter-text", root);
    if (pw && bar) pw.addEventListener("input", () => {
      const s = pw.value ? LGAuth.strength(pw.value) : 0;
      const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];
      const colors = ["#B3364A", "#B3364A", "#B7791F", "#3F8A5C", "#2F6B45"];
      bar.style.width = pw.value ? `${(s + 1) * 20}%` : "0";
      bar.style.background = colors[s];
      const problem = pw.value ? LGAuth.passwordProblem(pw.value) : "";
      txt.textContent = !pw.value ? "Use at least 8 characters with letters and numbers." : problem || `Strength: ${labels[s]}`;
    });
  }

  function bindAuth() {
    const form = $("#auth-form"); if (!form) return;
    bindPwHelpers(form);
    const err = $("#auth-err");
    const first = form.querySelector("input:not([type=checkbox])"); if (first) first.focus();
    const cancel = $("#auth-cancel");
    if (cancel) cancel.addEventListener("click", () => { LGAuth.signOut(); location.hash = "#/admin"; route(); });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form).entries());
      const mode = form.dataset.mode;
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      setTimeout(() => {
        let r;
        if (mode === "signin") r = LGAuth.signIn(d.username, d.password, !!d.remember);
        else if (mode === "signup") r = LGAuth.signUp(d);
        else r = LGAuth.changePassword(d.old, d.password, d.confirm);
        btn.disabled = false;
        if (!r.ok) {
          err.textContent = r.error;
          const f = r.field && form.elements[r.field];
          if (f) { f.focus(); if (f.select) f.select(); }
          return;
        }
        if (mode === "signup") toast("Account created. Welcome to the team!");
        else if (mode === "change") toast("Password updated.");
        else toast(`Welcome back, ${r.user.name.split(" ")[0]}!`);
        adminTab = "overview";
        if (location.hash !== "#/admin") location.hash = "#/admin"; else route();
      }, 30);
    });
  }

  /* ================== STAFF DASHBOARD (inventory system) ================== */
  let adminTab = "overview";
  const statusPill = (s) => s <= 0 ? '<span class="pill pill--out">Out of stock</span>' : s <= 1 ? '<span class="pill pill--low">Low stock</span>' : '<span class="pill pill--ok">In stock</span>';
  const DEDUCT = ["Confirmed", "Completed"];
  const initials = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";

  function pageAdmin(sub) {
    const me = LGAuth.current();
    if (!me) return authPage(sub === "signup" ? "signup" : "signin");
    if (me.mustChange) return authPage("change");
    const isOwner = me.role === "owner";
    if (adminTab === "team" && !isOwner) adminTab = "overview";
    const tabs = [["overview", "Overview"], ["inventory", "Inventory"], ["orders", `Inquiries (${orders.filter((o) => o.status === "New").length} new)`], ["account", "My account"]];
    if (isOwner) tabs.push(["team", "Team"]);
    const body = { overview: adminOverview, inventory: adminInventory, orders: adminOrders, account: () => adminAccount(me), team: adminTeam }[adminTab]();
    return `<div class="container admin-shell"><div class="row-between"><div><div class="eyebrow">Leavynne Gadgets · Staff</div><h1 style="font-size:2rem;margin-top:6px">Inventory system</h1></div>
      <div class="tools"><span class="user-chip"><span class="avatar" aria-hidden="true">${esc(initials(me.name))}</span><span><b style="color:var(--ink)">${esc(me.name)}</b><br><span class="small">${isOwner ? "Owner" : "Staff"} · @${esc(me.username)}</span></span></span>
        <button class="btn btn--ghost btn--sm" type="button" id="logout">Sign out</button></div></div>
      <div class="admin-tabs" role="tablist">${tabs.map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" class="${adminTab === k ? "active" : ""}" aria-selected="${adminTab === k}">${l}</button>`).join("")}</div>
      <div id="admin-body">${body}</div></div>`;
  }

  const allVariants = () => inventory.flatMap((p) => p.variants.map((v) => ({ p, v })));

  function insights() {
    const out = [];
    const rows = allVariants();
    const outStock = rows.filter((r) => r.v.stock <= 0);
    const low = rows.filter((r) => r.v.stock === 1);
    const demand = {};
    orders.filter((o) => o.status !== "Cancelled").forEach((o) => o.items.forEach((i) => (demand[i.productId] = (demand[i.productId] || 0) + i.qty)));
    Object.entries(demand).sort((a, b) => b[1] - a[1]).slice(0, 3).forEach(([id, n]) => {
      const p = findProduct(id);
      if (p) out.push(["#7A3A4A", `<b>${esc(p.name)}</b> has ${n} unit(s) requested in inquiries. ${stockOf(p) <= n ? "Demand meets or exceeds stock — consider restocking." : "Stock currently covers demand."}`]);
    });
    if (outStock.length) out.push(["#B3364A", `<b>${outStock.length} variant(s) are out of stock</b>: ${outStock.slice(0, 4).map((r) => esc(`${r.p.name} ${r.v.color}`)).join(", ")}${outStock.length > 4 ? "…" : ""}.`]);
    if (low.length) out.push(["#B7791F", `<b>${low.length} variant(s) have only 1 unit left.</b> Prioritise restocking fast movers.`]);
    const noRoom = rows.filter((r) => r.v.price && r.v.last != null && r.v.price === r.v.last);
    if (noRoom.length) out.push(["#B7791F", `<b>No negotiation room</b> on ${noRoom.map((r) => esc(`${r.p.name} (${r.v.color})`)).join(", ")} — selling price equals the last price.`]);
    const below = rows.filter((r) => r.v.price && r.v.last != null && r.v.price < r.v.last);
    if (below.length) out.push(["#B3364A", `<b>Price check:</b> ${below.map((r) => esc(`${r.p.name} (${r.v.color})`)).join(", ")} ${below.length > 1 ? "are" : "is"} priced below the last price.`]);
    const discounts = rows.filter((r) => r.v.price && r.v.srp && r.v.stock > 0).map((r) => ({ ...r, d: (r.v.srp - r.v.price) / r.v.srp })).sort((a, b) => b.d - a.d);
    if (discounts[0] && discounts[0].d > 0) out.push(["#3F8A5C", `<b>Best deal to promote:</b> ${esc(discounts[0].p.name)} (${esc(discounts[0].v.color)}) is ${Math.round(discounts[0].d * 100)}% below SRP.`]);
    const onReq = inventory.filter((p) => minPrice(p) == null);
    if (onReq.length) out.push(["#2A5390", `<b>${onReq.map((p) => esc(p.name)).join(", ")}</b> ${onReq.length > 1 ? "have" : "has"} no listed price — add one to improve conversions.`]);
    return out.length ? out : [["#3F8A5C", "Everything looks healthy. No alerts right now."]];
  }

  function adminOverview() {
    const rows = allVariants();
    const units = rows.reduce((s, r) => s + (r.v.stock || 0), 0);
    const value = rows.reduce((s, r) => s + (r.v.price || 0) * (r.v.stock || 0), 0);
    const room = rows.reduce((s, r) => s + (r.v.price && r.v.last != null ? Math.max(0, r.v.price - r.v.last) * (r.v.stock || 0) : 0), 0);
    const pending = orders.filter((o) => o.status === "New").length;
    const alerts = rows.filter((r) => r.v.stock <= 1).length;
    const maxUnits = Math.max(1, ...inventory.map(stockOf));
    return `<div class="kpis">
      <div class="kpi"><span>Models</span><b>${inventory.length}</b><small>${rows.length} SKUs · ${inventory.filter((p) => p.category === "phone").length} phones / ${inventory.filter((p) => p.category === "tablet").length} tablets</small></div>
      <div class="kpi"><span>Units in stock</span><b>${units}</b><small>${alerts} SKU(s) with 1 unit or fewer</small></div>
      <div class="kpi"><span>Inventory value</span><b>${peso(value)}</b><small>At selling price · ${peso(room)} negotiation room</small></div>
      <div class="kpi"><span>New inquiries</span><b>${pending}</b><small>${orders.length} total inquiries</small></div></div>
    <div class="two-col">
      <div class="panel panel--white"><h3>Inventory insights</h3><p class="small" style="margin:4px 0 8px">Generated automatically from current stock, prices and inquiries.</p>
        ${insights().map(([c, t]) => `<div class="insight"><i style="background:${c}"></i><span>${t}</span></div>`).join("")}</div>
      <div class="panel panel--white"><h3>Units by model</h3><div style="margin-top:12px">
        ${inventory.slice().sort((a, b) => stockOf(b) - stockOf(a)).map((p) => `<div class="bar-row"><span title="${esc(p.name)}" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.name)}</span><div class="bar"><i style="width:${(stockOf(p) / maxUnits) * 100}%"></i></div><b style="text-align:right">${stockOf(p)}</b></div>`).join("")}
      </div></div></div>`;
  }

  function adminInventory() {
    const isOwner = (LGAuth.current() || {}).role === "owner";
    return `<div class="filters" style="margin-bottom:14px">
      <div class="tools"><input class="input" id="inv-q" placeholder="Search model, color or SKU" aria-label="Search inventory">
        <select class="select" id="inv-cat" aria-label="Category"><option value="">All categories</option><option value="phone">Phones</option><option value="tablet">Tablets</option></select>
        <select class="select" id="inv-st" aria-label="Stock status"><option value="">All stock</option><option value="low">Low (1)</option><option value="out">Out of stock</option></select></div>
      <div class="tools"><button class="btn btn--primary btn--sm" type="button" id="add-sku">+ Add product / variant</button>
        <button class="btn btn--ghost btn--sm" type="button" id="export-csv">Export CSV</button>
        ${isOwner ? '<button class="btn btn--danger btn--sm" type="button" id="reset-inv">Reset to sheet data</button>' : ""}</div></div>
    <p class="small" style="margin-bottom:10px">Edit price, last price or stock directly — changes save automatically and update the storefront.${isOwner ? "" : " Only the owner can delete SKUs or reset data."}</p>
    <div class="table-wrap"><table class="table"><thead><tr><th>Product</th><th>SKU</th><th>Color</th><th>RAM / Storage</th><th>SRP</th><th>Selling price</th><th>Last price</th><th>Stock</th><th>Status</th><th></th></tr></thead>
      <tbody id="inv-body">${invRows()}</tbody></table></div>`;
  }
  function invRows(filter = {}) {
    const isOwner = (LGAuth.current() || {}).role === "owner";
    const q = (filter.q || "").toLowerCase();
    const rows = allVariants().filter(({ p, v }) =>
      (!filter.cat || p.category === filter.cat) &&
      (!filter.st || (filter.st === "out" ? v.stock <= 0 : v.stock === 1)) &&
      (!q || `${p.name} ${v.color} ${v.sku} ${memLabel(v)}`.toLowerCase().includes(q)));
    if (!rows.length) return `<tr><td colspan="10" style="text-align:center;padding:24px" class="small">No SKUs match your filters.</td></tr>`;
    return rows.map(({ p, v }) => `<tr data-row="${esc(v.sku)}">
      <td><b style="color:var(--ink)">${esc(p.name)}</b><div class="small">${catLabel(p.category)}${v.freebie ? " · 🎁 " + esc(v.freebie) : ""}${v.condition ? " · " + esc(v.condition) : ""}</div></td>
      <td class="small">${esc(v.sku)}</td><td><span class="cdot-label">${cdot(v.color, "cdot--sm")}${esc(v.color)}</span></td><td>${esc(memLabel(v))}</td>
      <td>${v.srp ? peso(v.srp) : "—"}</td>
      <td><input class="input" type="number" min="0" step="1" data-field="price" value="${v.price ?? ""}" placeholder="On request" aria-label="Selling price for ${esc(v.sku)}"></td>
      <td><input class="input" type="number" min="0" step="1" data-field="last" value="${v.last ?? ""}" aria-label="Last price for ${esc(v.sku)}"></td>
      <td><input class="input input--qty" type="number" min="0" max="999" step="1" data-field="stock" value="${v.stock}" aria-label="Stock for ${esc(v.sku)}"></td>
      <td>${statusPill(v.stock)}</td>
      <td>${isOwner ? `<button class="btn btn--danger btn--sm" type="button" data-del="${esc(v.sku)}" aria-label="Delete ${esc(v.sku)}">Delete</button>` : ""}</td></tr>`).join("");
  }

  function adminOrders() {
    if (!orders.length) return `<div class="empty"><h3>No inquiries yet.</h3><p class="small" style="margin-top:8px">Customer inquiries submitted from the Inquiry bag will appear here.</p></div>`;
    return `<p class="small" style="margin-bottom:10px">Setting an inquiry to <b>Confirmed</b> deducts stock. Cancelling a confirmed inquiry returns the units to stock.</p>
    <div class="table-wrap"><table class="table"><thead><tr><th>Reference</th><th>Date</th><th>Customer</th><th>Items</th><th>Reference total</th><th>Arrangement</th><th>Status</th></tr></thead><tbody>
    ${orders.map((o) => `<tr><td><b>${esc(o.id)}</b></td><td class="small">${fmtDate(o.date)}</td>
      <td>${esc(o.customer.name)}<div class="small">${esc(o.customer.phone)}${o.customer.fb ? " · FB: " + esc(o.customer.fb) : ""}</div></td>
      <td>${o.items.map((i) => `<span class="cdot-label">${cdot(i.color, "cdot--sm")}${i.qty} × ${esc(i.name)} <span class="small">(${esc(i.color)}, ${esc(i.mem)})</span></span>`).join("<br>")}${o.customer.notes ? `<div class="small" style="margin-top:4px">“${esc(o.customer.notes)}”</div>` : ""}</td>
      <td>${peso(o.total)}${o.items.some((i) => !i.price) ? '<div class="small">+ on request</div>' : ""}</td>
      <td class="small">${esc(o.customer.method)}${o.customer.address ? "<br>" + esc(o.customer.address) : ""}</td>
      <td><select class="select" data-order="${esc(o.id)}" aria-label="Status for ${esc(o.id)}">${["New", "Confirmed", "Completed", "Cancelled"].map((s) => `<option${s === o.status ? " selected" : ""}>${s}</option>`).join("")}</select>
        ${o.updatedBy ? `<div class="small" style="margin-top:4px">by ${esc(o.updatedBy)}</div>` : ""}</td></tr>`).join("")}
    </tbody></table></div>`;
  }

  function adminAccount(me) {
    return `<div class="two-col" style="margin-top:0">
      <form class="panel panel--white" id="name-form" novalidate><h3>Profile</h3>
        <div class="form-grid">
          <label>Full name<input class="input" name="name" value="${esc(me.name)}" maxlength="60" required></label>
          <label>Username<input class="input" value="@${esc(me.username)}" disabled></label>
          <p class="small">Role: <b>${me.role === "owner" ? "Owner" : "Staff"}</b> · Last sign-in: ${fmtDate(me.lastLogin)}</p>
          <span class="err" id="name-err" role="alert"></span>
          <button class="btn btn--primary" type="submit">Save profile</button>
        </div></form>
      <form class="panel panel--white" id="pw-form" novalidate><h3>Change password</h3>
        <div class="form-grid">
          ${pwField("old", "Current password", "current-password")}
          ${pwField("password", "New password", "new-password")}
          ${meter}
          ${pwField("confirm", "Confirm new password", "new-password")}
          <span class="err" id="pw-err" role="alert"></span>
          <button class="btn btn--primary" type="submit">Update password</button>
        </div></form></div>`;
  }

  function adminTeam() {
    const me = LGAuth.current();
    const list = LGAuth.listAccounts();
    return `<div class="panel panel--white" style="margin-bottom:20px"><h3>Invite new staff</h3>
      <p class="small" style="margin:6px 0 12px">Share this code with new staff. They create their own account from <b>Staff login → Create account</b>. To change the code, edit <code>staffCode</code> in <code>js/data.js</code>.</p>
      <span class="code-box">${esc(SHOP.staffCode)}</span></div>
    <div class="table-wrap"><table class="table table--sm"><thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Status</th><th>Last sign-in</th><th>Actions</th></tr></thead><tbody>
    ${list.map((a) => {
      const self = a.username === me.username;
      return `<tr><td><b style="color:var(--ink)">${esc(a.name)}</b>${self ? ' <span class="pill pill--new">You</span>' : ""}</td><td>@${esc(a.username)}</td>
        <td>${self ? (a.role === "owner" ? "Owner" : "Staff") : `<select class="select" data-role="${esc(a.username)}" aria-label="Role for ${esc(a.username)}"><option value="staff"${a.role === "staff" ? " selected" : ""}>Staff</option><option value="owner"${a.role === "owner" ? " selected" : ""}>Owner</option></select>`}</td>
        <td>${a.active ? '<span class="pill pill--ok">Active</span>' : '<span class="pill pill--out">Disabled</span>'}${a.mustChange ? ' <span class="pill pill--low">Temp password</span>' : ""}</td>
        <td class="small">${fmtDate(a.lastLogin)}</td>
        <td>${self ? '<span class="small">Use “My account”</span>' : `<div class="actions">
          <button class="btn btn--ghost btn--sm" type="button" data-reset="${esc(a.username)}">Reset password</button>
          <button class="btn btn--ghost btn--sm" type="button" data-active="${esc(a.username)}" data-to="${a.active ? "0" : "1"}">${a.active ? "Disable" : "Enable"}</button>
          <button class="btn btn--danger btn--sm" type="button" data-remove-acc="${esc(a.username)}">Remove</button></div>`}</td></tr>`;
    }).join("")}
    </tbody></table></div>`;
  }

  function bindAdmin() {
    if ($("#auth-form")) { bindAuth(); return; }
    const me = LGAuth.current(); if (!me) return;
    $("#logout").addEventListener("click", () => { LGAuth.signOut(); adminTab = "overview"; toast("Signed out."); route(); });
    $$("[data-tab]").forEach((b) => b.addEventListener("click", () => { adminTab = b.dataset.tab; route(); }));
    const guard = () => { if (!LGAuth.current()) { toast("Your session has expired. Please sign in again."); route(); return false; } return true; };

    if (adminTab === "inventory") {
      const body = $("#inv-body");
      const filt = () => ({ q: $("#inv-q").value, cat: $("#inv-cat").value, st: $("#inv-st").value });
      const refresh = () => (body.innerHTML = invRows(filt()));
      ["#inv-q", "#inv-cat", "#inv-st"].forEach((s) => $(s).addEventListener("input", refresh));
      body.addEventListener("change", (e) => {
        const inp = e.target.closest("[data-field]"); if (!inp || !guard()) return;
        const sku = inp.closest("tr").dataset.row; const f = findVariant(sku); if (!f) return;
        const field = inp.dataset.field; const raw = inp.value.trim();
        if (raw === "" && field !== "stock") f.v[field] = null;
        else {
          let n = Math.round(Number(raw));
          if (raw === "" || !Number.isFinite(n) || n < 0) { toast("Please enter a number of 0 or more."); inp.value = f.v[field] ?? ""; return; }
          if (field === "stock") n = Math.min(n, 999);
          f.v[field] = n;
        }
        saveInv(); refresh(); toast(`Saved ${sku}`);
      });
      body.addEventListener("click", (e) => {
        const b = e.target.closest("[data-del]"); if (!b || !guard()) return;
        const f = findVariant(b.dataset.del); if (!f) return;
        if (!confirm(`Delete ${f.p.name} · ${f.v.color} · ${memLabel(f.v)}?`)) return;
        f.p.variants = f.p.variants.filter((v) => v.sku !== f.v.sku);
        if (!f.p.variants.length) inventory = inventory.filter((p) => p !== f.p);
        bag = bag.filter((i) => i.sku !== f.v.sku); saveBag();
        saveInv(); refresh(); toast("Variant deleted");
      });
      $("#export-csv").addEventListener("click", exportCSV);
      const reset = $("#reset-inv");
      if (reset) reset.addEventListener("click", () => {
        if (!guard() || !confirm("Reset all products, prices and stock to the original spreadsheet data?")) return;
        inventory = clone(PRODUCTS); saveInv(); route(); toast("Inventory reset to sheet data");
      });
      $("#add-sku").addEventListener("click", openAddDialog);
    }

    if (adminTab === "orders") {
      $$("[data-order]").forEach((sel) => sel.addEventListener("change", () => {
        if (!guard()) return;
        const o = orders.find((x) => x.id === sel.dataset.order); if (!o) return;
        const from = o.status, to = sel.value;
        const was = DEDUCT.includes(from), will = DEDUCT.includes(to);
        if (!was && will) {
          const short = o.items.find((i) => { const f = findVariant(i.sku); return !f || f.v.stock < i.qty; });
          if (short) { toast(`Not enough stock for ${short.name} (${short.color}).`); sel.value = from; return; }
          o.items.forEach((i) => (findVariant(i.sku).v.stock -= i.qty));
        } else if (was && !will) {
          o.items.forEach((i) => { const f = findVariant(i.sku); if (f) f.v.stock += i.qty; });
        }
        o.status = to; o.updatedBy = LGAuth.current().name;
        saveOrders(); saveInv(); toast(`${o.id} set to ${to}`); route();
      }));
    }

    if (adminTab === "account") {
      const nf = $("#name-form");
      nf.addEventListener("submit", (e) => {
        e.preventDefault();
        const r = LGAuth.updateName(nf.elements.name.value);
        $("#name-err").textContent = r.ok ? "" : r.error;
        if (r.ok) { toast("Profile saved."); route(); }
      });
      const pf = $("#pw-form");
      bindPwHelpers(pf);
      pf.addEventListener("submit", (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(pf).entries());
        const r = LGAuth.changePassword(d.old, d.password, d.confirm);
        $("#pw-err").textContent = r.ok ? "" : r.error;
        if (!r.ok) { const f = r.field && pf.elements[r.field]; if (f) f.focus(); return; }
        pf.reset(); toast("Password updated."); route();
      });
    }

    if (adminTab === "team") {
      const done = (r, msg) => { if (!r.ok) { toast(r.error); return; } toast(msg); route(); };
      $$("[data-role]").forEach((s) => s.addEventListener("change", () => done(LGAuth.setRole(s.dataset.role, s.value), `@${s.dataset.role} is now ${s.value === "owner" ? "an owner" : "staff"}.`)));
      $$("[data-active]").forEach((b) => b.addEventListener("click", () => done(LGAuth.setActive(b.dataset.active, b.dataset.to === "1"), `@${b.dataset.active} ${b.dataset.to === "1" ? "enabled" : "disabled"}.`)));
      $$("[data-remove-acc]").forEach((b) => b.addEventListener("click", () => {
        if (!confirm(`Remove @${b.dataset.removeAcc}? They will no longer be able to sign in.`)) return;
        done(LGAuth.removeAccount(b.dataset.removeAcc), `@${b.dataset.removeAcc} removed.`);
      }));
      $$("[data-reset]").forEach((b) => b.addEventListener("click", () => {
        if (!confirm(`Reset the password for @${b.dataset.reset}? A temporary password will be generated.`)) return;
        const r = LGAuth.resetPassword(b.dataset.reset);
        if (!r.ok) { toast(r.error); return; }
        alert(`Temporary password for @${b.dataset.reset}:\n\n${r.temp}\n\nShare it privately. They must set a new password when they sign in.`);
        route();
      }));
    }
  }

  function openAddDialog() {
    const dlg = $("#add-dialog");
    const form = dlg.querySelector("form");
    form.reset();
    const sel = form.elements.product;
    sel.innerHTML = `<option value="__new">+ New product</option>` + inventory.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("");
    sel.value = "__new";
    dlg.querySelector("#new-fields").hidden = false;
    dlg.querySelector(".err").textContent = "";
    dlg.showModal();
  }
  function initAddDialog() {
    const dlg = $("#add-dialog"), form = dlg.querySelector("form");
    form.elements.product.addEventListener("change", () => (dlg.querySelector("#new-fields").hidden = form.elements.product.value !== "__new"));
    dlg.querySelector("[data-close]").addEventListener("click", () => dlg.close());
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!LGAuth.current()) { dlg.close(); route(); return; }
      const d = Object.fromEntries(new FormData(form).entries());
      Object.keys(d).forEach((k) => (d[k] = String(d[k]).trim()));
      const err = dlg.querySelector(".err");
      const num = (v) => (v === "" ? null : Math.max(0, Math.round(Number(v))));
      if (d.product === "__new" && d.name.length < 2) { err.textContent = "Enter the product name."; return; }
      if (!d.color || !d.storage) { err.textContent = "Color and storage are required."; return; }
      if ([d.price, d.srp, d.last, d.stock].some((v) => v !== "" && (!Number.isFinite(Number(v)) || Number(v) < 0))) { err.textContent = "Prices and stock must be 0 or more."; return; }
      let p;
      if (d.product === "__new") {
        const id = d.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "product";
        if (findProduct(id)) { err.textContent = "A product with this name already exists — select it from the list."; return; }
        p = { id, name: d.name, brand: d.brand || "Xiaomi", series: "", category: d.category, image: "", highlights: [], specs: [], specSource: "Manufacturer",
          ai: { camera: 0, battery: 0, perf: 5, amoled: false, fiveG: /5g/i.test(d.name), hz: 60 }, variants: [] };
        inventory.push(p);
      } else p = findProduct(d.product);
      const sku = (p.id.slice(0, 10) + "-" + (d.ram || "x") + "-" + d.storage + "-" + d.color.slice(0, 3)).toUpperCase().replace(/[^A-Z0-9-]/g, "") + "-" + Date.now().toString(36).slice(-3).toUpperCase();
      const v = { sku, color: d.color, ram: d.ram, storage: d.storage, price: num(d.price), srp: num(d.srp), last: num(d.last), stock: Math.min(num(d.stock) ?? 0, 999) };
      if (d.freebie) v.freebie = d.freebie;
      if (!COLOR_HEX[d.color]) {
        COLOR_HEX[d.color] = /^#[0-9a-f]{6}$/i.test(d.hex || "") ? d.hex : "#B9B3B5";
        const custom = store.get(KEYS.colors, {}); custom[d.color] = COLOR_HEX[d.color]; store.set(KEYS.colors, custom);
      }
      p.variants.push(v);
      saveInv(); dlg.close(); route(); toast(`Added ${p.name} · ${d.color}`);
    });
  }

  function exportCSV() {
    const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["Product", "Category", "SKU", "Color", "RAM", "Storage", "SRP", "Selling price", "Last price", "Stock", "Freebie"];
    const rows = allVariants().map(({ p, v }) => [p.name, catLabel(p.category), v.sku, v.color, v.ram, v.storage, v.srp, v.price, v.last, v.stock, v.freebie]);
    const csv = "\uFEFF" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })), download: `leavynne-inventory-${new Date().toISOString().slice(0, 10)}.csv` });
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ================== Scroll reveal ================== */
  let observer = null;
  function initReveal() {
    const els = $$(".reveal", $("#app"));
    if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("in")); return; }
    if (observer) observer.disconnect();
    observer = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); observer.unobserve(en.target); }
    }), { rootMargin: "0px 0px -40px 0px" });
    els.forEach((el, i) => { el.style.transitionDelay = `${Math.min(i % 4, 3) * 60}ms`; observer.observe(el); });
  }

  /* ================== Router ================== */
  function bindAiButtons() {
    $$("[data-open-ai]", $("#app")).forEach((b) => b.addEventListener("click", () => window.LGAssistant && window.LGAssistant.open()));
  }
  function route() {
    const raw = location.hash.replace(/^#/, "") || "/";
    const [path, qs] = raw.split("?");
    const query = new URLSearchParams(qs || "");
    const parts = path.split("/").filter(Boolean);
    const app = $("#app");
    let title = "Leavynne Gadgets — Phones & tablets in Pateros";
    let nav = "";
    if (parts[0] !== "bag") lastOrder = null;

    switch (parts[0] || "") {
      case "": app.innerHTML = pageHome(); break;
      case "shop": app.innerHTML = pageShop("", query); bindShop(); nav = "shop"; title = "Shop all · Leavynne Gadgets"; break;
      case "phones": app.innerHTML = pageShop("phone", query); bindShop(); nav = "phones"; title = "Phones · Leavynne Gadgets"; break;
      case "tablets": app.innerHTML = pageShop("tablet", query); bindShop(); nav = "tablets"; title = "Tablets · Leavynne Gadgets"; break;
      case "product": {
        const p = findProduct(parts[1]);
        app.innerHTML = pageProduct(parts[1]); bindProduct(parts[1]);
        if (p) { nav = p.category === "tablet" ? "tablets" : "phones"; title = `${p.name} · Leavynne Gadgets`; }
        break;
      }
      case "bag": app.innerHTML = pageBag(); bindBag(); title = "Inquiry bag · Leavynne Gadgets"; break;
      case "contact": app.innerHTML = pageContact(); nav = "contact"; title = "Contact & help · Leavynne Gadgets"; break;
      case "admin": {
        if (parts[1] === "signup" && LGAuth.current()) { location.replace("#/admin"); return; }
        app.innerHTML = pageAdmin(parts[1]); bindAdmin();
        title = LGAuth.current() ? "Inventory system · Leavynne Gadgets" : parts[1] === "signup" ? "Create staff account · Leavynne Gadgets" : "Staff sign in · Leavynne Gadgets";
        break;
      }
      default: app.innerHTML = pageNotFound();
    }
    document.title = title;
    $$(".navbar nav a").forEach((a) => a.classList.toggle("active", a.dataset.nav === nav));
    $(".navbar nav").classList.remove("open");
    bindAiButtons();
    initReveal();
  }

  /* Read-only API for the assistant */
  window.LG = { get inventory() { return inventory; }, stockOf, minPrice, media, peso, esc, memLabel, catLabel, ICON };

  document.addEventListener("DOMContentLoaded", () => {
    $("#year").textContent = new Date().getFullYear();
    setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light", false);
    $("#theme-switch").addEventListener("click", () => setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"));
    $(".menu-btn").addEventListener("click", () => $(".navbar nav").classList.toggle("open"));
    const top = $("#to-top");
    window.addEventListener("scroll", () => top.classList.toggle("show", window.scrollY > 600), { passive: true });
    top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    initSearch(); initAddDialog(); updateBagCount();
    window.addEventListener("hashchange", () => { route(); window.scrollTo(0, 0); });
    window.addEventListener("storage", (e) => {
      if (e.key === KEYS.inv) { inventory = loadInventory(); route(); }
      if (e.key === KEYS.orders) { orders = store.get(KEYS.orders, orders); if (location.hash.startsWith("#/admin")) route(); }
    });
    route();
  });
})();
