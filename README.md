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
- Cloudflare
- `@astrojs/sitemap`
- Google Analytics 4

## Ympäristövaatimus

Projektin Node-vaatimus on:

```text
Node.js >= 22.19.0
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

CI luokittelee ensin muutoksen. Jos muutos koskee ainoastaan projektidokumentaatiota (`README.md`, `AGENTS.md`, `ROADMAP.md` tai `docs/**`), raskas Node-, build- ja selainregressioketju ohitetaan tarkoituksella.

Kaikki muut muutokset, mukaan lukien lähdekoodi, sisältö, asetukset, testit ja itse workflowt, ajavat täyden tarkistuksen:

```text
npm ci
npm run check
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

Uusi ajo peruuttaa saman PR:n tai ref:n aiemman keskeneräisen ajon, jotta vanhentuneet tarkistukset eivät hidasta uusinta muutosta.

Jos selainregressio epäonnistuu, CI tallentaa `test-results/`-aineiston tutkittavaksi.

## Testaus

Playwright-regressiot sijaitsevat hakemistossa:

```text
tests/e2e/
```

Ne suojaavat muun muassa sivujen rakennetta, FI/EN-lokalisaatiota, saavutettavuutta, reduced motion -käyttäytymistä, SEO-metatietoja, mobiilinäkymiä sekä interaktiivisia selain- ja 3D-ominaisuuksia.

Testikoodi on yksittäisten regressiosopimusten tarkka lähde. README:ssa ei ylläpidetä täydellistä testitiedostojen tai assertioiden luetteloa.

## Cloudflare

Cloudflare käyttää tuotantobuildiin komentoa:

```bash
npm run build
```

Tuotantohaara on:

```text
main
```

GitHub Actionsin Build check ja Cloudflaren tuotantodeploy ovat eri vaiheita. CI tarkistaa repomuutoksen ja Cloudflare julkaisee tuotantoversion oman integraationsa mukaisesti.

## Projektin rakenne

Keskeiset hakemistot:

```text
src/components/          sivu- ja käyttöliittymäkomponentit
src/features/            selainruntimejen feature-moduulit
src/layouts/             yhteiset layoutit
src/scripts/             yhteiset selain- ja Three.js-runtimet
src/config/              sivuston yhteiset asetukset
src/content/posts/       artikkelien Markdown-tiedostot
src/pages/               Astro-reitit
src/styles/              globaalit tyylit
tests/e2e/               Playwright-regressiot
public/                  staattiset tiedostot
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
- `AGENTS.md` - projektin pysyvät kehitys- ja jatkuvuussäännöt
- `ROADMAP.md` - ajantasainen jatkokehityksen työlista

## Työn jatkuvuus

GitHub-repo toimii projektin pysyvänä lähteenä myös silloin, kun työ jatkuu uudessa ChatGPT-keskustelussa.

Ennen merkittävää muutosta tarkistetaan README, tehtävän kannalta relevantti dokumentaatio, tarvittaessa ROADMAP sekä viimeisimmät mergatut PR:t. Tarkat toteutusdetaljit tarkistetaan aina nykyisestä koodista ja testeistä.

Merkittävän PR:n kuvauksesta pitää selvitä tiiviisti mitä muutettiin, miksi, mitä rajattiin tarkoituksella muutoksen ulkopuolelle, miten muutos tarkistettiin ja jäikö jatkotyötä.

Keskeneräinen työ jätetään näkyviin avoimeen PR:ään tai `ROADMAP.md`-tiedostoon eikä vain chat-kontekstiin.

## Dokumentaation ylläpito

Dokumentaatio päivitetään silloin, kun dokumentoitu sopimus, kehitysprosessi tai arkkitehtuurin vastuuraja muuttuu.

Yksittäinen toteutusdetalji ei automaattisesti vaadi dokumentaatiomuutosta. Esimerkiksi uuden regressiotestin, uuden saman arkkitehtuurin mukaisen komponentin tai animaatioparametrin muutoksen tarkka dokumentaatio kuuluu ensisijaisesti koodiin ja testeihin.

Merkittävät keskeneräiset kehitystarpeet kirjataan `ROADMAP.md`-tiedostoon.
