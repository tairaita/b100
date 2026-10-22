// B100 homepage: language switch, elevator floor display, screenshot viewer and the links from config.js.
(() => {
  const cfg = window.B100_SITE || {};
  const root = document.documentElement;
  const $$ = (sel) => document.querySelectorAll(sel);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("js");

  // ---------- language ----------

  const titles = {
    ja: document.title,
    en: "B100 — A roguelike horror shooter, one hundred floors down",
  };
  const shotUrl = (name, lang, small) => `img/shots/${lang}/${name}${small ? "_s" : ""}.webp`;

  function setLang(lang, remember) {
    root.lang = lang;
    root.dataset.lang = lang;
    document.title = titles[lang];
    $$("[data-set-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.setLang === lang)));
    $$("img[data-shot]").forEach((img) => (img.src = shotUrl(img.dataset.shot, lang, img.dataset.size === "small")));
    $$("a[data-shot]").forEach((a) => (a.href = shotUrl(a.dataset.shot, lang, false)));
    $$("[data-ja-label]").forEach((el) => el.setAttribute("aria-label", el.dataset[lang + "Label"]));
    if (remember) {
      try { localStorage.setItem("b100-lang", lang); } catch (e) { /* private mode: just don't remember */ }
    }
  }

  function initialLang() {
    const q = new URLSearchParams(location.search).get("lang");
    if (q === "ja" || q === "en") return q;
    try {
      const saved = localStorage.getItem("b100-lang");
      if (saved === "ja" || saved === "en") return saved;
    } catch (e) { /* ignore */ }
    return (navigator.language || "ja").toLowerCase().startsWith("ja") ? "ja" : "en";
  }

  $$("[data-set-lang]").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.setLang, true)));
  setLang(initialLang(), false);

  // ---------- links and numbers from config.js ----------

  if (cfg.downloadUrl) $$(".js-download").forEach((a) => (a.href = cfg.downloadUrl));
  if (cfg.steamUrl) {
    $$(".js-steam").forEach((a) => {
      a.href = cfg.steamUrl;
      a.target = "_blank";
      a.rel = "noopener";
    });
  }
  if (cfg.version) $$(".js-version").forEach((el) => (el.textContent = "v" + cfg.version));
  if (cfg.sizeMB) $$(".js-size").forEach((el) => (el.textContent = cfg.sizeMB));
  if (cfg.developer) $$(".js-dev").forEach((el) => (el.textContent = cfg.developer));
  if (cfg.contactUrl) {
    $$(".js-contact").forEach((el) => (el.hidden = false));
    $$(".js-contact-link").forEach((a) => (a.href = cfg.contactUrl));
  }

  $$(".js-copy").forEach((b) =>
    b.addEventListener("click", async () => {
      const url = location.href.split("#")[0];
      try {
        await navigator.clipboard.writeText(url);
        b.classList.add("copied");
      } catch (e) {
        prompt("URL", url);
      }
    })
  );

  // ---------- elevator floor display ----------

  const elev = document.querySelector(".elev");
  const num = document.querySelector(".elev-num");
  const arrow = document.querySelector(".elev-arrow");
  const stops = [...$$("[data-floor]")];
  const label = (f) => (f === 0 ? "1F" : "B" + String(f).padStart(2, "0"));
  let shown = 0;
  let target = 0;
  let timer = 0;

  function goTo(floor) {
    if (floor === target) return;
    target = floor;
    arrow.textContent = target > shown ? "▼" : "▲";
    clearInterval(timer);
    if (reduceMotion) {
      shown = target;
      num.textContent = label(shown);
      return;
    }
    elev.classList.add("moving");
    // Fast between far floors, slowing down as it arrives, like a real elevator.
    timer = setInterval(() => {
      const diff = target - shown;
      if (diff === 0) {
        clearInterval(timer);
        elev.classList.remove("moving");
        return;
      }
      shown += Math.sign(diff) * Math.max(1, Math.round(Math.abs(diff) / 6));
      num.textContent = label(shown);
    }, 55);
  }

  let pending = false;
  function onScroll() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      const line = innerHeight * 0.45;
      let floor = 0;
      for (const s of stops) if (s.getBoundingClientRect().top <= line) floor = Number(s.dataset.floor);
      if (innerHeight + scrollY >= root.scrollHeight - 4) floor = 100;
      goTo(floor);
    });
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  // ---------- section reveal (HUD objective bar, hall lines) ----------

  const reveal = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("in");
        reveal.unobserve(e.target);
      }
    },
    { threshold: 0.2 }
  );
  $$(".sec").forEach((s) => reveal.observe(s));

  // ---------- screenshot viewer ----------

  const dlg = document.querySelector(".lightbox");
  const shots = [...$$(".gallery .shot")];
  const big = dlg.querySelector("img");
  const caption = dlg.querySelector("figcaption");
  let cur = 0;

  function show(i) {
    cur = (i + shots.length) % shots.length;
    const a = shots[cur];
    const text = a.querySelector(".cap ." + root.dataset.lang).textContent;
    big.src = a.href;
    big.alt = text;
    caption.textContent = `${cur + 1} / ${shots.length}　${text}`;
  }

  if (typeof dlg.showModal === "function") {
    shots.forEach((a, i) =>
      a.addEventListener("click", (e) => {
        e.preventDefault();
        show(i);
        dlg.showModal();
      })
    );
    dlg.querySelector(".lb-prev").addEventListener("click", () => show(cur - 1));
    dlg.querySelector(".lb-next").addEventListener("click", () => show(cur + 1));
    dlg.querySelector(".lb-close").addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) dlg.close();
    });
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(cur - 1);
      if (e.key === "ArrowRight") show(cur + 1);
    });
    let touchX = null;
    dlg.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
    dlg.addEventListener("touchend", (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
    });
  }
})();
