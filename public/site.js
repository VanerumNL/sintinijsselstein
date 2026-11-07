/* Bouwt de site op uit de inhoud (window.INHOUD, of /api/inhoud).
   Met ?voorbeeld=1 luistert de pagina naar de beheerpagina en toont die wijzigingen meteen. */
(function () {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const link = u => /^(https?:\/\/|\/)/i.test(String(u || "").trim()) ? esc(String(u).trim()) : (u ? esc("https://" + String(u).trim()) : "");
  const beeld = u => /^(https?:\/\/|\/)/i.test(String(u || "").trim()) ? esc(String(u).trim()) : "";
  const fbIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.5 1.6-1.5h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.4V14h2.8v8h3.3z"/></svg>';
  const BLOKKEN = ["nieuwsbalk", "hero", "aftelklok", "programma", "fotos", "facebookBlok", "sponsors"];

  const MAST = `<svg class="mast" viewBox="0 0 120 420" aria-hidden="true">
    <path class="golf" d="M38 20 A26 26 0 0 0 38 64"/><path class="golf g2" d="M26 8 A42 42 0 0 0 26 76"/><path class="golf g3" d="M14 -4 A58 58 0 0 0 14 88"/>
    <path class="golf" d="M82 20 A26 26 0 0 1 82 64"/><path class="golf g2" d="M94 8 A42 42 0 0 1 94 76"/><path class="golf g3" d="M106 -4 A58 58 0 0 1 106 88"/>
    <line x1="60" y1="10" x2="60" y2="42" stroke="#fbf7f0" stroke-width="3"/>
    <circle cx="60" cy="42" r="5" fill="#ffde59"/>
    ${Array.from({ length: 9 }, (_, i) => `<rect x="${55 - i * 0.6}" y="${46 + i * 40}" width="${10 + i * 1.2}" height="40" fill="${i % 2 ? "#fbf7f0" : "#bc1a14"}"/>`).join("")}
    <rect x="44" y="160" width="32" height="10" rx="2" fill="#fbf7f0"/><rect x="40" y="250" width="40" height="10" rx="2" fill="#fbf7f0"/>
  </svg>`;

  const blok = {
    nieuwsbalk: B => {
      const items = (B.items || []).map(x => typeof x === "string" ? x : x.tekst).filter(Boolean);
      if (!items.length) return "";
      const band = items.map(t => `<span>${esc(t)}</span>`).join("");
      const duur = Math.max(18, items.join(" ").length * 0.22);
      return `<div class="nieuwsbalk" role="region" aria-label="${esc(B.label || "Laatste nieuws")}">
  <span class="nb-label"><i></i>${esc(B.label || "Laatste nieuws")}</span>
  <div class="nb-loop"><div class="nb-band" style="--duur:${duur}s">${band}<div aria-hidden="true" style="display:contents">${band}</div></div></div>
</div>`;
    },

    hero: (B, C) => `
<header class="hero" style="${B.foto ? `background-image:linear-gradient(180deg,rgba(20,33,63,.55) 0%,rgba(20,33,63,.45) 45%,rgba(20,33,63,.92) 100%),url('${beeld(B.foto)}')` : ""}">
  <div class="wrap">
    <div class="topbar">
      ${C.logo ? `<a class="merk" href="/"><img src="${beeld(C.logo)}" alt="Sint in IJsselstein"></a>` : "<span></span>"}
      ${C.facebook ? `<a class="fb-knop" href="${link(C.facebook)}" target="_blank" rel="noopener">${fbIcon} Facebook</a>` : ""}
    </div>
    <div class="hero-kern">
      ${B.kicker ? `<span class="uitzending"><i></i>${esc(B.kicker)}</span>` : ""}
      <h1>${esc(B.titel)}${B.titel2 ? `<span>${esc(B.titel2)}</span>` : ""}</h1>
      ${B.tekst ? `<p class="sub">${esc(B.tekst)}</p>` : ""}
      ${B.datumGroot ? `<div class="onderbalk">${B.datumTekst ? `<span class="ob-label">${esc(B.datumTekst)}</span>` : ""}<span class="ob-tekst">${esc(B.datumGroot)}</span></div>` : ""}
    </div>
  </div>
  ${B.toren === false ? "" : MAST + `<span class="mast-tekst">Uitgezonden vanaf de Gerbrandytoren</span>`}
  <svg class="boot" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 70 Q150 40 300 70 T600 70 T900 70 T1200 70 V120 H0Z" fill="#1d2d55"/>
    <path d="M0 90 Q150 64 300 90 T600 90 T900 90 T1200 90 V120 H0Z" fill="#253a6e" opacity=".6"/>
  </svg>
</header>`,

    aftelklok: B => `
<section class="klok" aria-label="Aftelklok">
  <div class="wrap" id="klok">
    <span class="rubriek">Aftellen</span>
    <span class="label">${esc(B.tekst)}</span>
    <div class="letters">
      ${["dagen", "uren", "minuten", "seconden"].map(e => `<div class="letter"><div class="n" data-k="${e}">0</div><div class="e">${e}</div></div>`).join("")}
    </div>
  </div>
</section>`,

    programma: (B, C) => `
<section class="programma">
  <div class="wrap prog-grid">
    <div class="prog-intro">
      <span class="rubriek">Programma</span>
      <h2>${esc(B.titel)}</h2>
      ${B.tekst ? `<p>${esc(B.tekst)}</p>` : ""}
    </div>
    <ol class="tijdlijn">
      ${(B.onderdelen || []).map(o => `<li><span class="tijd">${esc(o.aankomst)}</span><div><strong>${esc(o.plek)}</strong><div class="tijden">${o.aankomst ? `<span class="chip">Aankomst ${esc(o.aankomst)}</span>` : ""}${o.vertrek ? `<span class="chip uit">Vertrek ${esc(o.vertrek)}</span>` : ""}</div>${o.info ? `<span class="waar">${esc(o.info)}</span>` : ""}</div></li>`).join("")}
    </ol>
  </div>
</section>`,

    fotos: B => {
      const lijst = (B.lijst || []).filter(f => beeld(f.bestand));
      const n = lijst.length;
      const pijl = r => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${r ? "M9 5l7 7-7 7" : "M15 5l-7 7 7 7"}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      const carrousel = !n
        ? `<div class="foto leeg"><span>Foto's volgen</span></div>`
        : `<div class="car" data-seconden="${esc(B.seconden ?? 5)}" role="region" aria-roledescription="carrousel" aria-label="${esc(B.titel)}">
      <div class="car-spoor" tabindex="0" aria-live="off">
        ${lijst.map((f, i) => `<figure class="slide" role="group" aria-roledescription="dia" aria-label="Foto ${i + 1} van ${n}"><img src="${beeld(f.bestand)}" alt="${esc(f.onderschrift)}" ${i ? 'loading="lazy"' : ""} decoding="async" draggable="false">${f.onderschrift ? `<figcaption>${esc(f.onderschrift)}</figcaption>` : ""}</figure>`).join("")}
      </div>
      ${n > 1 ? `<button class="car-pijl vorige" type="button" aria-label="Vorige foto">${pijl(false)}</button>
      <button class="car-pijl volgende" type="button" aria-label="Volgende foto">${pijl(true)}</button>
      <div class="car-onder">
        <button class="car-pauze" type="button" aria-label="Pauzeer de diavoorstelling" aria-pressed="false"><svg class="i-pauze" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg><svg class="i-speel" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg></button>
        <div class="car-stippen">${lijst.map((f, i) => `<button type="button" aria-label="Ga naar foto ${i + 1}" data-i="${i}"></button>`).join("")}</div>
      </div>` : ""}
    </div>`;
      return `
<section class="fotos">
  <div class="wrap">
    <div class="kop"><div><span class="rubriek">Terugblik</span><h2>${esc(B.titel)}</h2></div></div>
    ${carrousel}
  </div>
</section>`;
    },

    facebookBlok: (B, C) => `
<section class="facebook">
  <div class="wrap fb-blok">
    <div><span class="rubriek" style="background:var(--goud);color:var(--nacht)">Volg ons</span><h2>${esc(B.titel)}</h2>${B.tekst ? `<p>${esc(B.tekst)}</p>` : ""}</div>
    ${C.facebook ? `<a class="fb-knop" href="${link(C.facebook)}" target="_blank" rel="noopener">${fbIcon} Naar onze Facebookpagina</a>` : ""}
  </div>
</section>`,

    sponsors: B => `
<section class="sponsors">
  <div class="wrap">
    <h2>${esc(B.titel)}</h2>
    ${B.tekst ? `<p>${esc(B.tekst)}</p>` : ""}
    <div class="logo-rij">
      ${(B.lijst || []).map((s, i) => {
        if (!s.bestand && !s.naam) return `<div class="logo leeg">Sponsor ${i + 1}</div>`;
        const inhoud = s.bestand ? `<img src="${beeld(s.bestand)}" alt="${esc(s.naam)}">` : `<strong>${esc(s.naam)}</strong>`;
        return s.website ? `<a class="logo" href="${link(s.website)}" target="_blank" rel="noopener">${inhoud}</a>` : `<div class="logo">${inhoud}</div>`;
      }).join("")}
    </div>
  </div>
</section>`
  };

  let timer;
  function pepernoten() {
    const hero = document.querySelector(".hero");
    if (!hero || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let i = 0; i < 14; i++) {
      const p = document.createElement("span");
      p.className = "pepernoot";
      p.style.left = Math.random() * 100 + "%";
      p.style.animationDuration = 9 + Math.random() * 10 + "s";
      p.style.animationDelay = -Math.random() * 15 + "s";
      const s = 8 + Math.random() * 8;
      p.style.width = p.style.height = s + "px";
      hero.appendChild(p);
    }
  }
  function aftelklok(B) {
    clearInterval(timer);
    const plek = document.getElementById("klok");
    if (!plek) return;
    const doel = new Date(`${B.datum}T${B.tijd || "00:00"}:00`).getTime();
    if (isNaN(doel)) return;
    const vak = k => plek.querySelector(`[data-k="${k}"]`);
    const tik = () => {
      const rest = doel - Date.now();
      if (rest <= 0) {
        plek.innerHTML = `<div class="zover">${esc(B.klaarTekst)}</div>`;
        return clearInterval(timer);
      }
      vak("dagen").textContent = Math.floor(rest / 864e5);
      vak("uren").textContent = String(Math.floor(rest / 36e5) % 24).padStart(2, "0");
      vak("minuten").textContent = String(Math.floor(rest / 6e4) % 60).padStart(2, "0");
      vak("seconden").textContent = String(Math.floor(rest / 1e3) % 60).padStart(2, "0");
    };
    timer = setInterval(tik, 1000);
    tik();
  }

  /* Fotocarrousel: veegt of scrolt per foto, pijlen en stippen, wisselt zelf van foto (te pauzeren). */
  let carOpruim = null;
  function carrousel() {
    if (carOpruim) { carOpruim(); carOpruim = null; }
    const el = document.querySelector(".car");
    if (!el) return;
    const spoor = el.querySelector(".car-spoor");
    const slides = [...spoor.children];
    const n = slides.length;
    if (n < 2) return;
    const stippen = [...el.querySelectorAll(".car-stippen button")];
    const pauzeKnop = el.querySelector(".car-pauze");
    const rustig = matchMedia("(prefers-reduced-motion: reduce)");
    const seconden = parseFloat(el.dataset.seconden);
    const duur = seconden > 0 ? Math.max(2, seconden) * 1000 : 0;
    let nu = 0, wacht = false, handmatigGepauzeerd = false, zichtbaar = true, laatsteGebruik = 0;

    const toon = i => {
      nu = i;
      stippen.forEach((s, k) => s.setAttribute("aria-current", k === i ? "true" : "false"));
    };
    const ga = (i, zacht = true) => {
      i = (i + n) % n;
      spoor.scrollTo({ left: i * spoor.clientWidth, behavior: zacht && !rustig.matches ? "smooth" : "auto" });
      toon(i);
    };
    let raf = 0;
    const opScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const i = Math.round(spoor.scrollLeft / spoor.clientWidth);
        if (i !== nu && i >= 0 && i < n) toon(i);
      });
    };
    const gebruik = () => { laatsteGebruik = Date.now(); };

    el.querySelector(".vorige").addEventListener("click", () => { gebruik(); ga(nu - 1); });
    el.querySelector(".volgende").addEventListener("click", () => { gebruik(); ga(nu + 1); });
    stippen.forEach(s => s.addEventListener("click", () => { gebruik(); ga(+s.dataset.i); }));
    spoor.addEventListener("scroll", opScroll, { passive: true });
    spoor.addEventListener("keydown", e => {
      if (e.key === "ArrowLeft") { e.preventDefault(); gebruik(); ga(nu - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); gebruik(); ga(nu + 1); }
    });
    const pauzeer = () => { wacht = true; };
    const hervat = () => { wacht = false; gebruik(); };
    el.addEventListener("mouseenter", pauzeer);
    el.addEventListener("mouseleave", hervat);
    el.addEventListener("focusin", pauzeer);
    el.addEventListener("focusout", hervat);
    el.addEventListener("touchstart", () => { pauzeer(); gebruik(); }, { passive: true });
    el.addEventListener("touchend", () => { gebruik(); wacht = false; }, { passive: true });

    const zetPauzeKnop = () => {
      pauzeKnop.setAttribute("aria-pressed", String(handmatigGepauzeerd));
      pauzeKnop.setAttribute("aria-label", handmatigGepauzeerd ? "Speel de diavoorstelling af" : "Pauzeer de diavoorstelling");
      el.classList.toggle("gepauzeerd", handmatigGepauzeerd);
    };
    pauzeKnop.addEventListener("click", () => { handmatigGepauzeerd = !handmatigGepauzeerd; zetPauzeKnop(); });
    if (!duur || rustig.matches) pauzeKnop.hidden = true;

    const io = "IntersectionObserver" in window ? new IntersectionObserver(([x]) => { zichtbaar = x.isIntersecting; }, { threshold: 0.35 }) : null;
    if (io) io.observe(el);
    const opHerschalen = () => spoor.scrollTo({ left: nu * spoor.clientWidth, behavior: "auto" });
    addEventListener("resize", opHerschalen);

    const klok = duur && !rustig.matches ? setInterval(() => {
      if (wacht || handmatigGepauzeerd || !zichtbaar || document.hidden) return;
      if (Date.now() - laatsteGebruik < duur) return;
      ga(nu + 1);
      laatsteGebruik = Date.now(); // volgende wissel na een volle periode
    }, 500) : 0;
    laatsteGebruik = Date.now();
    toon(0);

    carOpruim = () => { clearInterval(klok); removeEventListener("resize", opHerschalen); if (io) io.disconnect(); cancelAnimationFrame(raf); };
  }

  function render(C) {
    if (!C || typeof C !== "object") return;
    const volgorde = (C.volgorde || BLOKKEN).filter(k => blok[k]);
    BLOKKEN.forEach((k, i) => { if (!volgorde.includes(k)) volgorde.splice(Math.min(i, volgorde.length), 0, k); });
    let html = volgorde.filter(k => C[k] && C[k].toon).map(k => blok[k](C[k], C)).join("");
    html += `<footer><div class="wrap"><span>© ${new Date().getFullYear()} ${esc(C.footer)} <span class="uitgezonden">· Uitgezonden vanuit IJsselstein</span></span>${C.facebook ? `<a href="${link(C.facebook)}" target="_blank" rel="noopener">Facebook</a>` : ""}</div></footer>`;
    document.getElementById("site").innerHTML = html;
    pepernoten();
    carrousel();
    if (C.aftelklok?.toon) aftelklok(C.aftelklok); else clearInterval(timer);
  }

  if (window.INHOUD) render(window.INHOUD);
  else fetch("/api/inhoud").then(r => r.json()).then(render).catch(() => {});

  if (new URLSearchParams(location.search).has("voorbeeld")) {
    addEventListener("message", e => {
      if (e.origin === location.origin && e.data && e.data.type === "inhoud") render(e.data.inhoud);
    });
    if (parent !== window) parent.postMessage({ type: "voorbeeld-klaar" }, location.origin);
  }
})();
