/* Bouwt de site op uit de inhoud (window.INHOUD, of /api/inhoud).
   Met ?voorbeeld=1 luistert de pagina naar de beheerpagina en toont die wijzigingen meteen. */
(function () {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const link = u => /^(https?:\/\/|\/)/i.test(String(u || "").trim()) ? esc(String(u).trim()) : (u ? esc("https://" + String(u).trim()) : "");
  const beeld = u => /^(https?:\/\/|\/)/i.test(String(u || "").trim()) ? esc(String(u).trim()) : "";
  const fbIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.5 1.6-1.5h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.4V14h2.8v8h3.3z"/></svg>';
  const BLOKKEN = ["hero", "aftelklok", "programma", "fotos", "facebookBlok", "sponsors"];

  const blok = {
    hero: (B, C) => `
<header class="hero" style="${B.foto ? `background-image:linear-gradient(180deg,rgba(20,33,63,.55) 0%,rgba(20,33,63,.45) 45%,rgba(20,33,63,.92) 100%),url('${beeld(B.foto)}')` : ""}">
  <div class="wrap">
    <div class="topbar">
      ${C.logo ? `<a class="merk" href="/"><img src="${beeld(C.logo)}" alt="Sint in IJsselstein"></a>` : "<span></span>"}
      ${C.facebook ? `<a class="fb-knop" href="${link(C.facebook)}" target="_blank" rel="noopener">${fbIcon} Facebook</a>` : ""}
    </div>
    <div class="hero-kern">
      <h1>${esc(B.titel)}${B.titel2 ? `<span>${esc(B.titel2)}</span>` : ""}</h1>
      ${B.tekst ? `<p class="sub">${esc(B.tekst)}</p>` : ""}
      ${B.datumGroot ? `<div class="datum-chip">${esc(B.datumTekst)} <b>${esc(B.datumGroot)}</b></div>` : ""}
    </div>
  </div>
  <svg class="boot" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 70 Q150 40 300 70 T600 70 T900 70 T1200 70 V120 H0Z" fill="#1d2d55"/>
    <path d="M0 90 Q150 64 300 90 T600 90 T900 90 T1200 90 V120 H0Z" fill="#253a6e" opacity=".6"/>
  </svg>
</header>`,

    aftelklok: B => `
<section class="klok" aria-label="Aftelklok">
  <div class="wrap" id="klok">
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
      ${C.hero?.datumGroot ? `<span class="label">${esc(C.hero.datumGroot)}</span>` : ""}
      <h2>${esc(B.titel)}</h2>
      ${B.tekst ? `<p>${esc(B.tekst)}</p>` : ""}
    </div>
    <ol class="tijdlijn">
      ${(B.onderdelen || []).map(o => `<li><span class="tijd">${esc(o.aankomst)}</span><div><strong>${esc(o.plek)}</strong><div class="tijden">${o.aankomst ? `<span class="chip">Aankomst ${esc(o.aankomst)}</span>` : ""}${o.vertrek ? `<span class="chip uit">Vertrek ${esc(o.vertrek)}</span>` : ""}</div>${o.info ? `<span class="waar">${esc(o.info)}</span>` : ""}</div></li>`).join("")}
    </ol>
  </div>
</section>`,

    fotos: B => `
<section class="fotos">
  <div class="wrap">
    <div class="kop"><div><span class="label">Terugblik</span><h2>${esc(B.titel)}</h2></div></div>
    <div class="foto-grid">
      ${(B.lijst || []).map(f => beeld(f.bestand)
        ? `<figure class="foto"><img src="${beeld(f.bestand)}" alt="${esc(f.onderschrift)}" loading="lazy">${f.onderschrift ? `<figcaption>${esc(f.onderschrift)}</figcaption>` : ""}</figure>`
        : `<figure class="foto leeg"><figcaption>Foto volgt${f.onderschrift ? "<br>" + esc(f.onderschrift) : ""}</figcaption></figure>`).join("")}
    </div>
  </div>
</section>`,

    facebookBlok: (B, C) => `
<section class="facebook">
  <div class="wrap fb-blok">
    <div><h2>${esc(B.titel)}</h2>${B.tekst ? `<p>${esc(B.tekst)}</p>` : ""}</div>
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

  function render(C) {
    if (!C || typeof C !== "object") return;
    const volgorde = (C.volgorde || BLOKKEN).filter(k => blok[k]);
    BLOKKEN.forEach(k => { if (!volgorde.includes(k)) volgorde.push(k); });
    let html = volgorde.filter(k => C[k] && C[k].toon).map(k => blok[k](C[k], C)).join("");
    html += `<footer><div class="wrap"><span>© ${new Date().getFullYear()} ${esc(C.footer)}</span>${C.facebook ? `<a href="${link(C.facebook)}" target="_blank" rel="noopener">Facebook</a>` : ""}</div></footer>`;
    document.getElementById("site").innerHTML = html;
    pepernoten();
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
