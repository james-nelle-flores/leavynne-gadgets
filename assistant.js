/* =========================================================
   Leavynne Gadgets — Shopping assistant ("Leavy")
   A rule-based recommender that runs in the browser using live
   inventory data: keyword detection, budget parsing, weighted
   scoring on product specs, comparisons and shop FAQs
   (English + common Taglish words).
   To upgrade to a large language model later, replace reply()
   with a call to your own secure backend endpoint.
   ========================================================= */
(function () {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);

  const FEATURES = {
    camera: { words: ["camera", "photo", "selfie", "picture", "mp", "vlog"], key: (p) => p.ai.camera, label: "camera" },
    battery: { words: ["battery", "long lasting", "matagal", "mah", "all day"], key: (p) => p.ai.battery, label: "battery" },
    perf: { words: ["gaming", "game", "games", "ml", "mobile legends", "codm", "fast", "performance", "multitask", "smooth"], key: (p) => p.ai.perf * 1000 + p.ai.hz, label: "performance" },
    display: { words: ["display", "screen", "amoled", "netflix", "watch", "streaming", "youtube"], key: (p) => (p.ai.amoled ? 1000 : 0) + p.ai.hz, label: "display" },
    fiveG: { words: ["5g"], key: (p) => (p.ai.fiveG ? 1 : 0), label: "5G", filter: (p) => p.ai.fiveG }
  };

  const norm = (s) => s.toLowerCase().replace(/[’']/g, "").replace(/\s+/g, " ").trim();
  const uniqStr = (a) => [...new Set(a)];

  function parseBudget(t) {
    const nums = [];
    const re = /(?:₱|php|p)?\s?(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s?(k)?\b/g;
    let m;
    while ((m = re.exec(t))) {
      let n = parseFloat(m[1].replace(/,/g, ""));
      if (m[2]) n *= 1000;
      if (n >= 1000 && n <= 200000) nums.push({ n, i: m.index });
    }
    if (!nums.length) return null;
    if (nums.length >= 2 && /(between|from|-|to)/.test(t)) return { min: Math.min(nums[0].n, nums[1].n), max: Math.max(nums[0].n, nums[1].n) };
    const n = nums[0].n, before = t.slice(Math.max(0, nums[0].i - 20), nums[0].i);
    if (/(above|over|at least|more than|higher than|starting)/.test(before)) return { min: n, max: Infinity };
    if (/(around|about|near|approx|mga|nasa)/.test(before)) return { min: n * 0.85, max: n * 1.15 };
    return { min: 0, max: n };
  }

  function findMentioned(t) {
    const inv = LG.inventory.slice().sort((a, b) => b.name.length - a.name.length);
    const hits = [];
    let rest = " " + t.replace(/\+/g, " plus ").replace(/[?!,;()]/g, " ").replace(/\.(\s|$)/g, " ").replace(/-inch/g, "") + " ";
    rest = rest.replace(/\s+/g, " ");
    for (const p of inv) {
      const n = norm(p.name).replace(/\+/g, " plus ").replace(/[()]/g, "").replace(/-inch/g, "").replace(/\s+/g, " ");
      const alias = uniqStr([n, n.replace(/^xiaomi /, ""), n.replace(/^samsung /, ""), n.replace(/ [45]g$/, ""), n.replace(/^samsung galaxy /, "")]);
      const hit = alias.find((v) => v.length > 3 && rest.includes(" " + v + " "));
      if (hit) { hits.push(p); rest = rest.replace(" " + hit + " ", " "); }
    }
    return hits;
  }

  function recCard(p) {
    const price = LG.minPrice(p, true) ?? LG.minPrice(p);
    const s = LG.stockOf(p);
    return `<a class="ai-rec" href="#/product/${p.id}"><div class="ai-rec__img">${LG.media(p)}</div>
      <div><b>${LG.esc(p.name)}</b><span>${price == null ? "Price on request" : "From " + LG.peso(price)} · ${s > 0 ? s + " in stock" : "Sold out"}</span></div></a>`;
  }

  function specLine(p, key) {
    const s = (p.specs.find(([k]) => k.toLowerCase().includes(key)) || [])[1];
    return s ? LG.esc(s) : "—";
  }

  function reply(raw) {
    const t = norm(raw);
    const inv = LG.inventory;
    const has = (...w) => w.some((x) => t.includes(x));

    if (!t) return { text: "Type what you need — for example “phone under ₱7,000 with good camera”." };
    if (/^(hi|hello|hey|good (morning|afternoon|evening)|kumusta|musta)\b/.test(t) && t.split(" ").length <= 4)
      return { text: "Hi! I’m Leavy, the Leavynne Gadgets assistant 👋 Tell me your budget and what matters most (camera, battery, gaming, screen size) and I’ll suggest phones or tablets that fit." };

    if (has("deliver", "shipping", "ship", "pickup", "pick up", "pick-up", "lalamove", "meet up", "meetup"))
      return { text: `We’re based in ${SHOP.location}. Pickup and delivery arrangements (and any charges) are confirmed directly with the shop on Facebook before you pay.` };
    if (has("warranty", "return", "refund", "replace"))
      return { text: "Warranty coverage, checking periods and return conditions are confirmed directly with the shop before payment. Ask for the exact terms on the unit you choose." };
    if (has("payment", "gcash", "cod", "cash on", "installment", "card", "bayad", "maya"))
      return { text: "Payment options are arranged directly with Leavynne Gadgets after the price and availability are confirmed. This website never takes payment." };
    if (has("how to order", "how do i order", "paano", "how to buy", "order process", "place an order"))
      return { text: "1) Open a product and pick the color + memory. 2) Select “Review inquiry” to add it to your Inquiry bag. 3) Submit your details and send the generated message on Messenger. The shop confirms the price, unit and arrangement." };
    if (has("where", "location", "address", "saan", "store hours", "open"))
      return { text: `We’re a small shop in ${SHOP.location}. Please message us on Facebook to confirm the exact pickup location and hours before visiting.` };
    if (has("freebie", "free", "promo", "kasama")) {
      const list = inv.filter((p) => p.variants.some((v) => v.freebie && v.stock > 0));
      return { text: list.length ? "These listed units come with a freebie:" : "No freebies are listed on in-stock units right now.", recs: list };
    }
    if (has("pre-loved", "preloved", "second hand", "secondhand", "used")) {
      const list = inv.filter((p) => p.condition);
      return { text: list.length ? "Here’s our pre-loved unit. Ask for current photos and its exact condition:" : "We don’t have pre-loved units listed right now.", recs: list };
    }

    const mentioned = findMentioned(" " + t + " ");

    if (mentioned.length >= 2 && (has("vs", "versus", "compare", "or", "better", "difference", "alin"))) {
      const [a, b] = mentioned;
      const row = (label, fa, fb) => `<tr><td style="padding:3px 6px 3px 0;color:var(--muted)">${label}</td><td style="padding:3px 6px">${fa}</td><td style="padding:3px 0">${fb}</td></tr>`;
      const price = (p) => (LG.minPrice(p) == null ? "On request" : LG.peso(LG.minPrice(p)));
      const chip = (p) => (specLine(p, "chip") !== "—" ? specLine(p, "chip") : specLine(p, "processor"));
      const table = `<table style="font-size:.76rem;border-collapse:collapse;margin-top:8px;width:100%"><tr><td></td><td><b>${LG.esc(a.name)}</b></td><td><b>${LG.esc(b.name)}</b></td></tr>
        ${row("Price", price(a), price(b))}${row("Display", specLine(a, "display"), specLine(b, "display"))}
        ${row("Chip", chip(a), chip(b))}
        ${row("Battery", specLine(a, "battery"), specLine(b, "battery"))}${row("Stock", LG.stockOf(a), LG.stockOf(b))}</table>`;
      const picks = [];
      if (a.ai.camera !== b.ai.camera) picks.push(`camera → ${a.ai.camera > b.ai.camera ? a.name : b.name}`);
      if (a.ai.battery !== b.ai.battery) picks.push(`battery → ${a.ai.battery > b.ai.battery ? a.name : b.name}`);
      if (a.ai.perf !== b.ai.perf) picks.push(`performance → ${a.ai.perf > b.ai.perf ? a.name : b.name}`);
      const pa = LG.minPrice(a), pb = LG.minPrice(b);
      if (pa != null && pb != null && pa !== pb) picks.push(`budget → ${pa < pb ? a.name : b.name}`);
      return { html: `Here’s a quick side-by-side:${table}<p style="margin-top:8px">${picks.length ? "<b>Best for</b> " + LG.esc(picks.join(" · ")) : "They’re very close — choose by color and price."}</p>`, recs: [a, b] };
    }

    if (mentioned.length === 1 && !parseBudget(t)) {
      const p = mentioned[0];
      const inStock = p.variants.filter((v) => v.stock > 0);
      const list = inStock.map((v) => `${v.color} ${LG.memLabel(v)}${v.price ? " – " + LG.peso(v.price) : " – price on request"}`).join("; ");
      return { text: inStock.length ? `${p.name}: ${inStock.length} listed variant(s) — ${list}. Please confirm the exact unit with the shop.` : `${p.name} is currently sold out. Message the shop to ask about restock.`, recs: [p] };
    }

    const budget = parseBudget(t);
    let cat = null;
    if (has("tablet", "pad", "ipad", "reading", "ebook", "online class", "drawing")) cat = "tablet";
    else if (has("phone", "cellphone", "cp", "smartphone", "selpon")) cat = "phone";
    const feats = Object.entries(FEATURES).filter(([, f]) => f.words.some((w) => new RegExp(`(^|[^a-z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(t))).map(([k]) => k);
    const cheapest = has("cheap", "cheapest", "mura", "lowest", "affordable", "pinakamura");
    const premium = has("best", "highest", "flagship", "top", "premium", "pinakamaganda");
    const kids = has("kid", "student", "lola", "lolo", "parent", "senior", "basic", "simple");

    if (!budget && !cat && !feats.length && !cheapest && !premium && !kids)
      return { text: "I can help with recommendations, comparisons, availability and shop questions. Try: “phone under 7k with good camera”, “best tablet for reading”, or “Redmi Note 13 vs Redmi 13”." };

    let pool = inv.filter((p) => LG.stockOf(p) > 0 && (!cat || p.category === cat));
    feats.forEach((f) => { if (FEATURES[f].filter) pool = pool.filter(FEATURES[f].filter); });
    if (budget) pool = pool.filter((p) => { const m = LG.minPrice(p, true); return m != null && m >= budget.min && m <= budget.max; });

    if (!pool.length) {
      const near = inv.filter((p) => LG.stockOf(p) > 0 && (!cat || p.category === cat) && LG.minPrice(p, true) != null)
        .sort((a, b) => Math.abs(LG.minPrice(a, true) - (budget ? budget.max : 0)) - Math.abs(LG.minPrice(b, true) - (budget ? budget.max : 0))).slice(0, 2);
      return { text: `Nothing in stock matches that exactly${budget && budget.max !== Infinity ? ` within ${LG.peso(budget.max)}` : ""}. Closest options:`, recs: near };
    }

    const price = (p) => LG.minPrice(p, true) ?? Infinity;
    const scored = pool.map((p) => {
      let s = 0;
      feats.forEach((f) => { const vals = pool.map(FEATURES[f].key); const mx = Math.max(...vals), mn = Math.min(...vals); s += mx === mn ? 1 : (FEATURES[f].key(p) - mn) / (mx - mn); });
      if (kids) s += (p.ai.battery / 6000) + (price(p) < 6000 ? 0.5 : 0);
      if (premium) s += p.ai.perf / 10;
      if (!feats.length && !kids && !premium) s += p.ai.perf / 10 + (p.ai.camera / 108) * 0.5;
      return { p, s };
    });
    if (cheapest) scored.sort((a, b) => price(a.p) - price(b.p));
    else scored.sort((a, b) => b.s - a.s || price(a.p) - price(b.p));
    const top = scored.slice(0, 3).map((x) => x.p);

    const parts = [];
    parts.push(cheapest ? "Here are the most affordable in-stock picks" : "Here are my top picks");
    if (cat) parts.push(`for ${cat === "tablet" ? "tablets" : "phones"}`);
    if (feats.length) parts.push(`ranked by ${feats.map((f) => FEATURES[f].label).join(" + ")}`);
    if (budget) parts.push(budget.max === Infinity ? `from ${LG.peso(budget.min)}` : budget.min > 0 ? `between ${LG.peso(Math.round(budget.min))} and ${LG.peso(Math.round(budget.max))}` : `within ${LG.peso(budget.max)}`);
    const why = top[0] ? ` <b>${LG.esc(top[0].name)}</b> stands out: ${LG.esc(top[0].highlights.map(([a, b]) => `${a} (${b})`).join(", "))}.` : "";
    return { html: LG.esc(parts.join(" ")) + ":" + why, recs: top };
  }

  function init() {
    const fab = $("#ai-fab"), panel = $("#ai-panel"), log = $("#ai-log"), form = $("#ai-form"), input = $("#ai-input");
    let greeted = false;
    const add = (who, content, recs) => {
      const d = document.createElement("div");
      d.className = `ai-msg ai-msg--${who}`;
      if (who === "me") d.textContent = content; else d.innerHTML = content + (recs && recs.length ? recs.map(recCard).join("") : "");
      log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
    };
    const open = () => {
      panel.classList.add("open"); fab.setAttribute("aria-expanded", "true"); fab.classList.add("seen");
      if (!greeted) { greeted = true; add("bot", "Hi! I’m <b>Leavy</b> 👋 I know every phone and tablet in the shop. Tell me your budget and what you need."); }
      setTimeout(() => input.focus(), 50);
    };
    const close = () => { panel.classList.remove("open"); fab.setAttribute("aria-expanded", "false"); fab.focus(); };
    const ask = (q) => {
      if (!q.trim()) return;
      add("me", q.trim());
      const typing = add("bot", '<span class="typing" aria-label="Typing"><i></i><i></i><i></i></span>');
      setTimeout(() => {
        typing.remove();
        let r;
        try { r = reply(q); } catch (e) { r = { text: "Sorry, I didn’t catch that. Try asking about a budget, a model, or a feature." }; }
        add("bot", r.html || LG.esc(r.text), r.recs);
      }, 450);
    };
    fab.addEventListener("click", () => (panel.classList.contains("open") ? close() : open()));
    $("#ai-close").addEventListener("click", close);
    panel.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    form.addEventListener("submit", (e) => { e.preventDefault(); const q = input.value; input.value = ""; ask(q); });
    $("#ai-chips").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) ask(b.textContent); });
    log.addEventListener("click", (e) => { if (e.target.closest(".ai-rec") && window.innerWidth < 600) close(); });
    window.LGAssistant = { open, ask, reply };
  }
  document.addEventListener("DOMContentLoaded", init);
})();
