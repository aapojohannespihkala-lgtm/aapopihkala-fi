# aapopihkala.fi

Aapo Pihkalan henkilökohtainen kaksikielinen Astro-sivusto.

Sivusto:

- https://aapopihkala.fi/
- https://aapopihkala.fi/en/

## Teknologia

- Astro
- Astro Content Collections
- TypeScript
- Three.js
- Playwright
- Cloudflare Workers
- `@astrojs/sitemap`
- Google Analytics 4

## Ympäristövaatimus

Projektin Node-vaatimus on:

```text
Node.js >= 24.20.0
```

Versiovaatimus on määritelty `package.json`-tiedoston `engines`-kentässä.

## Kehitys paikallisesti

Asenna lukitut riippuvuudet:

```bash
npm ci
```

Käynnistä kehityspalvelin:

```bash
npm run dev
```

Aja Astron staattiset tarkistukset:

```bash
npm run check
```

Tee tuotantobuild:

```bash
npm run build
```

Aja selainregressiotestit:

```bash
npm run test:e2e
```

Playwright käynnistää testipalvelimen automaattisesti `playwright.config.ts`-asetusten mukaan.

## Riippuvuudet ja lockfile

Repo sisältää `package-lock.json`-tiedoston.

Käytä normaalisti:

```bash
npm ci
```

`npm install` voi päivittää lockfilea, joten sitä käytetään vain silloin, kun riippuvuuksia tarkoituksella lisätään tai päivitetään.

## CI

GitHub Actions -workflow sijaitsee tiedostossa:

```text
.github/workflows/build-check.yml
```

Workflow ajetaan:

- pushissa `main`-haaraan
- pull requestissa kohti `main`-haaraa
- manuaalisesti `workflow_dispatch`-ajona

Rakennusvaiheen CI on tarkoituksella nopea ennen mergeä:

- pelkkä projektidokumentaatio (`README.md`, `AGENTS.md`, `ROADMAP.md`, `docs/**`) saa minimaalisen onnistuneen `build`-tarkistuksen ilman Node-, build- tai Playwright-vaiheita
- vain `.css`-tiedostoja muuttavat pull requestit ajavat `npm ci` ja `npm run build`, mutta ohittavat `npm run check` -vaiheen
- muut suoritettavat pull requestit ajavat `npm ci`, `npm run check` ja `npm run build`
- koko Playwright-regressiosarja ei blokkaa pull requestin mergeä rakennusvaiheessa

CSS-only-muutoksessa tuotantobuild on edelleen blokkaava ennen mergeä. Muissa suoritettavissa muutoksissa sekä `npm run check` että tuotantobuild ovat blokkaavia.

Omistajan samasta repositoriosta avaamat ei-draft pull requestit squash-mergataan automaattisesti heti onnistuneen pakollisen `build`-tarkistuksen jälkeen. Jos repositorion strict `main` -sääntö huomaa branchin jääneen jälkeen, workflow päivittää branchin ja seuraava CI-kierros jatkaa automaattisesti ilman manuaalista merge- tai polling-vaihetta.

Automaattinen merge käynnistää erikseen täyden `workflow_dispatch`-validoinnin `main`-haaraan. Tämä ajo suorittaa staattiset tarkistukset, tuotantobuildin, Chromium-asennuksen ja koko Playwright-regressiosarjan, joten mergeä seuraava selainregressio ei riipu tokenilla tehdyn mergen push-triggeristä.

Jos samaan pull requestiin tai refiin tulee uusi commit vanhan CI-ajon ollessa kesken, vanhentunut ajo perutaan automaattisesti.

Jos `main`-haaran selainregressio epäonnistuu, CI tallentaa `test-results/`-aineiston tutkittavaksi ja regressio korjataan erillisellä jatkomuutoksella.

## Testaus

Playwright-regressiot sijaitsevat hakemistossa:

```text
tests/e2e/
```

Ne suojaavat muun muassa sivujen rakennetta, FI/EN-lokalisaatiota, saavutettavuutta, reduced motion -käyttäytymistä, SEO-metatietoja, mobiilinäkymiä sekä interaktiivisia selain- ja 3D-ominaisuuksia.

Testikoodi on yksittäisten regressiosopimusten tarkka lähde. README:ssa ei ylläpidetä täydellistä testitiedostojen tai assertioiden luetteloa.

## Cloudflare

Tuotanto julkaistaan Cloudflare Workers Builds -integraatiolla. Projektin asetukset käyttävät:

```text
Build command: npm run build
Deploy command: npx wrangler deploy
Version command: npx wrangler versions upload
Root directory: /
Production branch: main
```

Wrangler on lukittu projektin paikalliseksi dev-riippuvuudeksi, joten `npx wrangler` käyttää repon hallittua versiota eikä hae ajon hetkistä uusinta versiota.

`wrangler.jsonc` on deployn kanoninen konfiguraatio. Astro tuottaa staattisen sivuston `dist/`-hakemistoon, jonka Wrangler julkaisee Worker Static Assets -resursseina. Worker-entry sijaitsee tiedostossa `worker/index.ts`.

Tavalliset sivupyynnöt palvellaan staattisista asseteista. Palvelinlogiikka ajetaan vain erikseen määritetyille reiteille, kuten Currentin pörssisähköreitille `/api/current/electricity`. Selain hakee tämän saman originin reitin kautta, ja Worker hakee varsinaisen datan ulkoisesta lähteestä.

GitHub Actionsin Build check ja Cloudflaren tuotantodeploy ovat eri vaiheita. CI tarkistaa repomuutoksen ja Cloudflare julkaisee tuotantoversion oman Workers Builds -integraationsa mukaisesti.

## Projektin rakenne

Keskeiset hakemistot ja deploy-tiedostot:

```text
worker/                  Cloudflare Worker -entry ja palvelinreititys
functions/               Worker-puolen rajatut palvelinhandlerit
wrangler.jsonc           Cloudflare Workers -deploykonfiguraatio
src/components/          sivu- ja käyttöliittymäkomponentit
src/features/            selainruntimejen feature-moduulit
src/layouts/             yhteiset layoutit
src/scripts/             yhteiset selain- ja Three.js-runtimet
src/config/              sivuston yhteiset asetukset
src/content/posts/       artikkelien Markdown-tiedostot
src/pages/               Astro-reitit
src/styles/              globaalit tyylit
tests/e2e/               Playwright-regressiot
public/                  staattiset lähdeassetit
dist/                    Astron generoima build-output
```

Tarkempi arkkitehtuurin omistajuus kuvataan `docs/ARCHITECTURE.md`-tiedostossa. Dokumentaatiossa ei ylläpidetä täydellistä tiedostopuuta, koska koodipohja muuttuu usein.

## Sisältö

Uudet artikkelit tehdään hakemistoon:

```text
src/content/posts/
```

Valmis tekninen pohja löytyy tiedostosta:

```text
src/content/post-template.md
```

Artikkelien rakenne validoidaan tiedostossa:

```text
src/content.config.ts
```

FI- ja EN-versiot ovat saman artikkelin kaksi kieliversiota ja ne pidetään sisällöllisesti synkassa.

Tarkemmat kirjoitus-, lähde-, meta description-, kuva- ja julkaisuohjeet ovat tiedostossa `docs/CONTENT.md`.

## Sivuston yhteiset asetukset

Yhteiset asetukset sijaitsevat tiedostossa:

```text
src/config/site.ts
```

Siellä määritellään muun muassa sivuston perustiedot, tuotanto-URL, analytiikan asetukset, yhteinen meta-kuva ja kieliasetukset.

## SEO

Astro generoi sitemapin `@astrojs/sitemap`-integraatiolla.

Sitemap:

```text
https://aapopihkala.fi/sitemap-index.xml
```

Robots-tiedosto:

```text
public/robots.txt
```

Yhteisiä metatietoja käsitellään keskitetysti layoutissa. Artikkelisivut muodostavat omat artikkelikohtaiset metatietonsa ja `BlogPosting`-rakenteisen datan.

## Current

Repo sisältää myös henkilökohtaisen Current-näkymän reitissä:

```text
/current/
```

Current käyttää projektin yhteistä layoutia mutta on erillinen, päänavigaatiosta piilotettu näkymä. Sen arkkitehtuuriperiaatteet kuvataan `docs/ARCHITECTURE.md`-tiedostossa.

## Projektidokumentaatio

- `docs/ARCHITECTURE.md` - arkkitehtuurin vastuurajat ja ylläpitoperiaatteet
- `docs/CONTENT.md` - artikkelien kirjoittaminen ja julkaiseminen
- `AGENTS.md` - projektin pysyvät kehityssäännöt
- `ROADMAP.md` - ajantasainen jatkokehityksen työlista

## Työn jatkuvuus

GitHub toimii projektin pysyvänä muistina. Uuden työsession ei pidä olla riippuvainen aiempien chat-keskustelujen kontekstista.

Ennen merkittävää muutosta tarkistetaan `README.md`, tehtävään liittyvät `docs/`-tiedostot, tarvittaessa `ROADMAP.md`, viimeisimmät relevantit pull requestit sekä varsinainen koodi ja testit.

Merkittävän pull requestin kuvaukseen jätetään tiivis handoff: mitä muutettiin, miksi, mikä rajattiin tarkoituksella ulos, miten muutos validoitiin ja mitä jatkotyötä mahdollisesti jäi.

Kun käyttäjä pyytää ChatGPT:tä tekemään repository-muutoksen, oletus on viedä työ loppuun asti branchista ja pull requestista vaadittuun nopeaan pre-merge-CI-tarkistukseen ja automaattiseen onnistuneeseen mergeen. Erillistä merge-lupaa ei oletuksena kysytä, eikä tavallista owner-PR:ää tarvitse pollata manuaalisesti mergen odottamiseksi, ellei automaattinen merge epäonnistu, käyttäjä pyydä jättämään PR:ää auki, vaadittu tarkistus epäonnistu, merge-konflikti synny tai työn rajaus muutu olennaisesti.

Keskeneräinen merkittävä työ pidetään näkyvissä avoimessa pull requestissa tai `ROADMAP.md`:ssä eikä vain chat-kontekstissa.

## Dokumentaation ylläpito

Dokumentaatio päivitetään silloin, kun dokumentoitu sopimus, kehitysprosessi tai arkkitehtuurin vastuuraja muuttuu.

Yksittäinen toteutusdetalji ei automaattisesti vaadi dokumentaatiomuutosta. Esimerkiksi uuden regressiotestin, uuden saman arkkitehtuurin mukaisen komponentin tai animaatioparametrin muutoksen tarkka dokumentaatio kuuluu ensisijaisesti koodiin ja testeihin.

Merkittävät keskeneräiset kehitystarpeet kirjataan `ROADMAP.md`-tiedostoon.
