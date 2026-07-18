# KotróBázis

## MI EZ
Marketing/lead-gen oldal egy pécsi földmunka-vállalkozásnak: kotrás,
tereprendezés, medenceásás. **Statikus HTML oldal** — nincs framework, nincs
build lépés, nincs backend. Ügyfélmunka, nem DomRol SaaS-termék.
Címsor a kódból: „KotróBázis – Földmunkák Pécs | Kotrás, Tereprendezés,
Medenceásás".

## STACK (mérve: fájlstruktúra + vercel.json, 2026-07-18)
- **Nincs package.json, nincs node_modules, nincs build.** Kézzel írt HTML/CSS/JS.
- Vanilla JS, **zéró függőség** (`js/main.js` fejlécének saját állítása, kódban igazolt)
- 4 statikus oldal + 1 admin oldal, 1 CSS fájl (1178 sor), 1 JS fájl (218 sor)
- Adat: statikus JSON fájlok (`data/fleet.json`, `data/references.json`)
- Űrlap: **Formspree** (`https://formspree.io/f/xpwzgvkj`) — külső szolgáltatás
- Kapcsolat: WhatsApp deep link (`https://wa.me/36309602965`)
- SEO: JSON-LD structured data az `index.html`-ben (schema.org)
- Deploy: **Vercel** — `.vercel/project.json` szerint a valós projekt neve
  **`kotrobazis`** (projectId `prj_2wstha9M6oNvuKov9w8rnPVEJ5Jv`,
  orgId `team_V64ulBaqijgPiNpcecFTKvs9`)
- Live URL: **https://kotrobazis.hu/** (a kódból mérve — `<link rel="canonical">`
  és `og:url` az index.html-ben)

## FUTTATÁS
**Nincs `npm install`, nincs `npm run dev`.** Statikus fájlok — bármilyen
statikus szerver elég. Egy lehetőség:

```bash
cd C:\projects\kotrobazis
npx serve .          # vagy: python -m http.server 8000
```
Aztán: http://localhost:8000 · az admin: http://localhost:8000/admin/

> A `file://` protokollal való megnyitás **nem elég**: a `js/main.js`
> `fetch()`-csel tölti a `data/*.json`-t, amit a böngésző CORS miatt blokkol
> `file://`-ról. Szerver kell.

Deploy: `vercel --prod` (a `.vercel/` már be van linkelve a `kotrobazis`
projektre), vagy git push, ha a Vercel projekt a repóra van kötve.

## STRUKTÚRA
```
index.html          főoldal (805 sor) — hero, szolgáltatások, kalkulátor,
                    referenciák, JSON-LD, Formspree űrlap
gepek.html          géppark (266 sor)
tereprendezes.html  szolgáltatás-aloldal (183 sor)
medenceasas.html    szolgáltatás-aloldal (191 sor)
admin/index.html    admin felület (510 sor) — referencia + géppark szerkesztő,
                    ÖNÁLLÓ fájl, saját inline CSS/JS-sel (lásd FIGYELEM)
css/style.css       a teljes oldal stílusa (1178 sor)
js/main.js          nav, hamburger, kalkulátor, referencia-betöltés (218 sor)
data/fleet.json     géppark adatok
data/references.json referencia adatok
img/                CSAK placeholderek — nincs valódi kép (lásd FIGYELEM)
vercel.json         cleanUrls, cache headerek, security headerek, /admin rewrite
```

## KONVENCIÓK
- **Nincs framework és ne is legyen** — ez tudatosan statikus oldal.
  Ne erőltess rá Next.js-t/React-et; a teljes érték 4 HTML + 1 CSS + 1 JS fájl.
- Vanilla JS, IIFE-modulok (`(function () { ... })()`), zéró dependency.
- Az oldal magyar nyelvű, i18n **nincs** (nem is kell — helyi ügyfél).
- `vercel.json` konvenciók: `cleanUrls: true`, `trailingSlash: false` — a
  linkek kiterjesztés NÉLKÜL mennek (`/gepek`, nem `/gepek.html`).
- Cache-stratégia a `vercel.json`-ban: `css/js/img` = 1 év immutable,
  `data/*.json` = 1 óra + SWR, `*.html` = must-revalidate. Ha asset-et
  cserélsz, a fájlnév is változzon (nincs content hash!), különben a
  látogatók 1 évig a régit kapják.
- Security headerek már be vannak állítva (`X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy`) — ne vedd ki őket.
- Globális DomRol szabályokból ide vonatkozik: soha ne commitolj `.env`-et;
  commit-formátum `feat/fix/chore/style/seo: leírás`; soha ne törölj funkciót,
  amit nem értesz. A DomRol design system (Mediterranean gold / deep ocean)
  itt **NEM** alkalmazandó — ez ügyfél-márka, saját arculattal.

## HOL TART
- Utolsó commit: `1c22378` — 2026-05-23 — „fix: kalkulator teljes ujrairas
  inline styles"
- Branch: `main`
- Uncommitted: 1 (`.gitignore`) — a baseline-kör egészítette ki (`.env`,
  `node_modules/`, logok, OS-fájlok). A `.gitignore` egyébként már a kör előtt
  is „módosított"-ként jelent meg **sorvég-churn (CRLF vs LF)** miatt, tartalmi
  eltérés nélkül.
- Az oldal él a **https://kotrobazis.hu/** címen (a kód canonical/og:url
  szerint). Hogy a DNS/deploy ténylegesen mit szolgál ki, azt a kódból nem
  lehet megállapítani — ellenőrizd böngészőben, ha számít.
- **Képek nélkül van** — az `img/` csak placeholdereket tartalmaz.

## FIGYELEM
- 🔴 **BIZTONSÁGI: az admin jelszava a kliensoldali kódban van, nyílt szövegként.**
  **Mérve (2026-07-18):**
  - Fájl: `admin/index.html`, **202. sor**: `const PW = '<nyílt jelszó>';`
  - Mechanizmus: `doLogin()` (207–215. sor) a beírt értéket **a böngészőben**
    hasonlítja össze a `PW` konstanssal; siker esetén `sessionStorage.setItem('kb_admin','1')`.
    A 235. sor auto-login: ha a `kb_admin` kulcs `'1'`, a dashboard kérdés nélkül nyílik.
  - Kitettség: a `vercel.json` (48. sor) `/admin` → `/admin/index.html` rewrite,
    tehát a fájl **publikusan letölthető** a kotrobazis.hu-ról.
  - **Következmény: ez NEM biztonság.** A jelszó bárki számára olvasható a
    forrásban (Ctrl+U). Ráadásul a jelszó ismerete sem kell: elég a devtools
    konzolban `sessionStorage.setItem('kb_admin','1')`, majd újratöltés.
  - **Ez a repóban NEM javítható.** Statikus oldalon nincs hova tenni a titkot —
    minden, amit a böngésző lát, az a támadó kezében van. Kliensoldali
    „javítás" (hash, obfuszkáció, base64) **álmegoldás**, ne csináld.
  - **Valódi megoldás — szerveroldali réteg kell.** Lehetőségek:
    1. **Vercel Password Protection** az `/admin` útvonalra (Project → Settings →
       Deployment Protection). Legkisebb munka; fizetős csomagot igényelhet.
    2. **Cloudflare Access** vagy **Netlify** jelszóvédelem, ha a hosting váltható.
    3. **Minimál serverless auth**: egy Vercel Function + HMAC-aláírt cookie —
       a `dunaiauto` projekt `lib/adminSession.ts` + `app/api/admin/login/route.ts`
       megoldása pontosan ez, mintaként átvehető.
    Amíg egyik sem történik meg: **úgy kezeld, mintha az admin nyilvános lenne.**
  - Enyhítő körülmény (lásd a következő pont): az admin **nem ír szerverre**,
    csak `localStorage`-ba — így a betörő nem tudja az élő oldal tartalmát
    megváltoztatni, csak a saját böngészőjében lát/módosít adatot.
  - **Jelszócsere:** mivel a jelszó a git history-ban és a publikus deployon is
    szerepel, ismertnek tekintendő. Ha ezt a jelszót Roland **máshol is használja,
    ott azonnal cserélni kell.** (A jelszót szándékosan nem írjuk le doksiba.)
- **Az admin NEM ír szerverre — csak `localStorage`-ba.** A `getRefs/setRefs/
  getFleet/setFleet` a böngésző `localStorage`-át használja (`kb_references`,
  `kb_fleet` kulcsok), a `js/main.js` pedig **először a `localStorage`-ból
  olvas, és csak fallbackként fetch-eli a `data/*.json`-t**. Következmény:
  az adminban felvitt referencia/gép **csak azon az egy böngészőn látszik**,
  ahol felvitték — a látogatók továbbra is a `data/*.json` tartalmát látják.
  Ez valószínűleg nem a szándékolt működés. Valódi tartalomkezeléshez a
  `data/*.json`-t kell szerkeszteni és deployolni (vagy backend kell).
- **Nincsenek valódi képek.** Az `img/` egy `og-placeholder.txt`-t
  („OG image szükséges: 1200x630px, KotróBázis logó + gép fotó") és egy
  `img/placeholder/ref-placeholder.svg`-t tartalmaz. Ugyanakkor az
  `index.html` `og:image`-e a **`https://kotrobazis.hu/img/og-image.jpg`**
  fájlra mutat, ami a repóban **nem létezik** → a közösségi megosztás
  előnézete törött, hacsak a fájl nem került fel a deployra a repón kívül.
- **A Formspree endpoint (`/f/xpwzgvkj`) hardcode-olva van** az
  `index.html`-ben. Ez nem titok (publikus form endpoint), de ha kikerül a
  Formspree ingyenes limitje alól, az űrlap némán elhal — az oldalnak nincs
  fallbackje és nincs monitorozása.
- **Nincs `.env` és nincs is rá szükség** — a projekt semmilyen környezeti
  változót nem olvas (statikus HTML). Ezért **nincs `.env.example`**.
- **`.gitignore` figyelmeztetés:** a `.vercel` ignorálva van — ez helyes
  (projekt-linket tartalmaz), de azt is jelenti, hogy friss klón után a
  `vercel --prod` **nem tudja, melyik projektre deployoljon**. Ilyenkor
  `vercel link` kell: projekt neve **`kotrobazis`**.
- Az `admin/index.html` **510 soros önhordó fájl** saját inline CSS/JS-sel —
  nem használja a `css/style.css`-t és a `js/main.js`-t. Ha a design változik,
  az admint külön kell utánhúzni.
