/* Sint in IJsselstein — Worker
   KV-sleutels:
     inhoud          de inhoud van de site (JSON)
     inhoud:vorige   de versie van voor de laatste keer opslaan
     instelling:ww   gehasht wachtwoord (als er geen secret WACHTWOORD is)
     media:<id>      geüploade foto's en logo's
*/

const MAX_INHOUD = 300 * 1024;
const MAX_BEELD = 10 * 1024 * 1024;
const BEELDTYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const fout = (bericht, status = 400) => json({ fout: bericht }, status);

async function hash(tekst) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(tekst));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function gelijk(a, b) {
  if (a.length !== b.length) return false;
  let v = 0;
  for (let i = 0; i < a.length; i++) v |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return v === 0;
}

/* Wachtwoord: een secret WACHTWOORD in Cloudflare gaat voor; anders het wachtwoord dat de eerste keer op /beheer is gekozen. */
async function wachtwoordStatus(env) {
  if (env.WACHTWOORD) return { ingesteld: true, bron: "secret" };
  return { ingesteld: !!(await env.KV.get("instelling:ww")), bron: "beheer" };
}
async function magBewerken(req, env) {
  const ww = req.headers.get("x-wachtwoord") || "";
  if (!ww) return false;
  if (env.WACHTWOORD) return gelijk(ww, env.WACHTWOORD);
  const opgeslagen = await env.KV.get("instelling:ww", "json");
  if (!opgeslagen) return false;
  return gelijk(await hash(opgeslagen.zout + ww), opgeslagen.hash);
}

async function leesInhoud(env, req) {
  const [opgeslagen, standaard] = await Promise.all([
    env.KV.get("inhoud", "json"),
    env.ASSETS.fetch(new URL("/standaard.json", req.url)).then(r => r.json())
  ]);
  if (!opgeslagen) return standaard;
  /* Nieuwe blokken en velden uit een update aanvullen, zonder iets van de opgeslagen inhoud te overschrijven. */
  for (const [k, v] of Object.entries(standaard)) {
    if (!(k in opgeslagen)) opgeslagen[k] = v;
    else if (v && typeof v === "object" && !Array.isArray(v) && opgeslagen[k] && typeof opgeslagen[k] === "object")
      for (const [k2, v2] of Object.entries(v)) if (!(k2 in opgeslagen[k])) opgeslagen[k][k2] = v2;
  }
  if (Array.isArray(opgeslagen.volgorde))
    standaard.volgorde.forEach((k, i) => { if (!opgeslagen.volgorde.includes(k)) opgeslagen.volgorde.splice(Math.min(i, opgeslagen.volgorde.length), 0, k); });
  return opgeslagen;
}

/* De homepagina krijgt de inhoud direct mee, zodat er niets verspringt bij het laden. */
async function homepagina(req, env) {
  const [pagina, inhoud] = await Promise.all([env.ASSETS.fetch(new URL("/", req.url)), leesInhoud(env, req)]);
  let html = await pagina.text();
  const veilig = JSON.stringify(inhoud).replace(/</g, "\\u003c");
  html = html.replace('<script id="inhoud"></script>', `<script id="inhoud">window.INHOUD=${veilig}</script>`);
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" } });
}

async function api(req, env, p, m) {
  if (p === "/api/inhoud" && m === "GET") return json(await leesInhoud(env, req));

  if (p === "/api/status") return json(await wachtwoordStatus(env));

  if (p === "/api/wachtwoord" && m === "POST") {
    const st = await wachtwoordStatus(env);
    if (st.bron === "secret") return fout("Het wachtwoord staat vast in Cloudflare (WACHTWOORD).", 409);
    if (st.ingesteld && !(await magBewerken(req, env))) return fout("Wachtwoord klopt niet", 401);
    const { nieuw = "" } = await req.json().catch(() => ({}));
    if (nieuw.length < 6) return fout("Kies een wachtwoord van minstens 6 tekens");
    const zout = crypto.randomUUID();
    await env.KV.put("instelling:ww", JSON.stringify({ zout, hash: await hash(zout + nieuw) }));
    return json({ ok: true });
  }

  if (p === "/api/login" && m === "POST")
    return (await magBewerken(req, env)) ? json({ ok: true }) : fout("Wachtwoord klopt niet", 401);

  if (p === "/api/inhoud" && m === "PUT") {
    if (!(await magBewerken(req, env))) return fout("Wachtwoord klopt niet", 401);
    const tekst = await req.text();
    if (tekst.length > MAX_INHOUD) return fout("De inhoud is te groot");
    let data;
    try { data = JSON.parse(tekst); } catch { return fout("Ongeldige inhoud"); }
    if (!data || typeof data !== "object" || Array.isArray(data)) return fout("Ongeldige inhoud");
    const vorige = await env.KV.get("inhoud");
    if (vorige) await env.KV.put("inhoud:vorige", vorige);
    await env.KV.put("inhoud", JSON.stringify(data));
    return json({ ok: true });
  }

  if (p === "/api/vorige" && m === "POST") {
    if (!(await magBewerken(req, env))) return fout("Wachtwoord klopt niet", 401);
    const vorige = await env.KV.get("inhoud:vorige");
    if (!vorige) return fout("Er is geen vorige versie", 404);
    const huidig = await env.KV.get("inhoud");
    await env.KV.put("inhoud", vorige);
    if (huidig) await env.KV.put("inhoud:vorige", huidig);
    return json(JSON.parse(vorige));
  }

  if (p === "/api/upload" && m === "POST") {
    if (!(await magBewerken(req, env))) return fout("Wachtwoord klopt niet", 401);
    const type = (req.headers.get("content-type") || "").split(";")[0];
    if (!BEELDTYPES.includes(type)) return fout("Alleen foto's en logo's (jpg, png, webp, gif of svg)");
    const data = await req.arrayBuffer();
    if (data.byteLength > MAX_BEELD) return fout("Het bestand is te groot (maximaal 10 MB)");
    const id = crypto.randomUUID().replace(/-/g, "");
    await env.KV.put("media:" + id, data, { metadata: { type } });
    return json({ url: "/media/" + id });
  }

  return fout("Niet gevonden", 404);
}

async function media(env, p) {
  const id = p.slice("/media/".length);
  if (!/^[a-f0-9]{32}$/.test(id)) return new Response("Niet gevonden", { status: 404 });
  const { value, metadata } = await env.KV.getWithMetadata("media:" + id, "arrayBuffer");
  if (!value) return new Response("Niet gevonden", { status: 404 });
  const headers = { "content-type": metadata?.type || "application/octet-stream", "cache-control": "public, max-age=31536000, immutable" };
  if (metadata?.type === "image/svg+xml") headers["content-security-policy"] = "default-src 'none'; style-src 'unsafe-inline'";
  return new Response(value, { headers });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname, m = req.method;
    try {
      if (p === "/") return await homepagina(req, env);
      if (p.startsWith("/api/")) return await api(req, env, p, m);
      if (p.startsWith("/media/")) return await media(env, p);
      return env.ASSETS.fetch(req);
    } catch (e) {
      return fout("Er ging iets mis: " + e.message, 500);
    }
  }
};
