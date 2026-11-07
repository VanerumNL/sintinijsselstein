# Sint in IJsselstein

De website van de Sinterklaasintocht in IJsselstein, met een beheerpagina waarin je alles zelf aanpast.

- **Site:** `https://<adres>/`
- **Beheer:** `https://<adres>/beheer` — inloggen met het wachtwoord.

## Wat je in het beheer kunt doen

- Per blok (header, aftelklok, programma, foto's, Facebook, sponsors) de teksten aanpassen
- Blokken aan- en uitzetten en de volgorde veranderen
- Plekken en tijden in het programma toevoegen, wijzigen en verwijderen
- Foto's, het logo en sponsorlogo's uploaden (ze worden automatisch verkleind)
- Op **Opslaan** klikken: de site is meteen bijgewerkt
- **Vorige versie terugzetten** als je je hebt vergist

## Wachtwoord

De eerste keer dat je `/beheer` opent, kies je een wachtwoord. Doe dat direct nadat de site online staat.
Wachtwoord vergeten? Zet in Cloudflare bij de Worker onder **Settings → Variables and Secrets** een secret `WACHTWOORD`; dat gaat dan altijd voor.

## Hoe het werkt

| Bestand | Wat |
|---|---|
| `public/index.html`, `site.js`, `site.css` | De site |
| `public/beheer.html` | De beheerpagina |
| `public/standaard.json` | De beginwaarden, gebruikt zolang er nog niets is opgeslagen |
| `src/worker.js` | Opslag (Cloudflare KV), wachtwoord en foto-upload |
| `wrangler.jsonc` | Cloudflare-instellingen, met de KV-opslag `sint-in-ijsselstein` |

## Lokaal testen

```
npm install
npx wrangler dev
```
