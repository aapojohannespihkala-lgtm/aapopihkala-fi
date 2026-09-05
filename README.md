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

`astro check` on osa pakollista CI-porttia. Tarkistuksen pitää valmistua ilman virheitä ennen kuin build- ja selainregressiovaiheisiin voidaan luottaa.

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

GitHub Actions -workflow:

```text
.github/workflows/build-check.yml
```

Workflow ajetaan:

- pushissa `main`-haaraan
- pull requestissa kohti `main`-haaraa
- manuaalisesti `workflow_dispatch`-ajona

CI käyttää Node 22.19.0:aa ja suorittaa järjestyksessä:

```text
npm ci
npm run check
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

`npm run check` on blokkaava vaihe: jos Astro- tai TypeScript-tarkistus palauttaa virheen, CI epäonnistuu eikä muutosta pidetä hyväksyttynä.

Jos Playwright-testi epäonnistuu, CI tallentaa `test-results/`-aineiston tutkittavaksi.

## Selainregressiotestit

Testit sijaitsevat:

```text
tests/e2e/site-regressions.spec.ts
tests/e2e/river-flow-regression.spec.ts
tests/e2e/photogrammetry-regression.spec.ts
tests/e2e/meshy-poise-regression.spec.ts
tests/e2e/meshy-vol4-regression.spec.ts
```

Nykyinen smoke/regressiosuoja tarkistaa muun muassa:

- etusivun keskeisen rakenteen
- etusivun topografiacanvasin renderöitymisen ja geometrian
- päivä/yö-tilan
- kielilinkit
- About-upotuksen sijainnin
- yhteisen interaktiokerroksen renderöitymisen kerran `BaseLayout`in kautta eikä headerin sisällä
- scroll readoutin arvot scrollauksen aikana ja automaattisen piilotuksen
- GRID-overlayn näkyvyyden A-moodien syklin aikana
- A/coordinate-moodien järjestyksen, koordinaattireadoutin ja akselien käyttäytymisen
- AREA-polygonin sulkeutumisen, pinta-alan, topografiapisteet, contourit ja drag-rotaation
- AREA-rasteripinnan syntymisen, rasterikuvan latautumisen ja rasteritason rotaation
- AREA-polishin sivukohtaisen rajauksen: käytössä etusivulla ja artikkeleissa, ei About-sivulla
- About-sivun 3D-pään latautumisen ja canvasin
- 3D-pään renderöinnin pause/resume-käyttäytymisen sen poistuessa näkyvältä alueelta
- artikkelisivun interaktiivisen grafiikan
- Animation Labin RiverFlow-canvasin oletusasetukset, renderöitymisen ja ajassa muuttuvan animaation
- Animation Labin PhotogrammetryModel-GLB:n latautumisen, canvasin koon ja vapaan orbitoinnin
- Animation Labin Pixelated Poise -GLB:n latautumisen, canvasin koon ja vapaan orbitoinnin
- selaimen `pageerror`- ja `console.error`-virheet

Testit on tarkoitettu suojaamaan erityisesti visuaalisesti herkkiä interaktiivisia osia refaktorointien aikana.

## Cloudflare

Cloudflare käyttää tuotantobuildiin komentoa:

```bash
npm run build
```

Tuotantohaara:

```text
main
```

GitHub Actionsin build-check ja Cloudflaren tuotantodeploy ovat eri vaiheita: CI tarkistaa repomuutoksen, Cloudflare julkaisee tuotantoversion oman integraationsa mukaisesti.

## Projektin tärkeimmät tiedostot

```text
src/
├── components/
│   ├── Analytics.astro
│   ├── ArticlePage.astro
│   ├── FeedPost.astro
│   ├── HomePage.astro
│   ├── SiteHeader.astro
│   ├── SiteInteractionLayer.astro
│   ├── MorphingTopography.astro
│   ├── AboutPortraitSection.astro
│   └── MeshyPixelatedPoiseVol4.astro
│
├── features/
│   └── interactions/
│       ├── aCoordinate.ts
│       ├── area.ts
│       ├── areaRaster.ts
│       ├── grid.ts
│       └── scrollReadout.ts
│
├── layouts/
│   └── BaseLayout.astro
│
├── scripts/
│   ├── postInteractiveGraphics.ts
│   └── threeRuntime.ts
│
├── config/
│   └── site.ts
│
├── content/
│   ├── post-template.md
│   └── posts/
│       └── *.md
│
├── pages/
│   ├── index.astro
│   ├── about.astro
│   ├── artikkelit/
│   │   └── [id].astro
│   └── en/
│       ├── index.astro
│       ├── about.astro
│       └── articles/
│           └── [id].astro
│
├── styles/
│   └── global.css
│
├── utils/
│   └── posts.ts
│
└── content.config.ts
```

Julkiset kuvat, 3D-mallit ja muut staattiset tiedostot:

```text
public/
```

Artikkelien grafiikat:

```text
public/graphics/
```

## Sivun perusrakenne

Koko HTML-dokumentin yhteinen runko sijaitsee tiedostossa:

```text
src/layouts/BaseLayout.astro
```

`BaseLayout` keskittää muun muassa:

- `<html>`, `<head>` ja `<body>` -rakenteen
- yhteiset globaalit tyylit
- `SiteHeader`-komponentin
- `SiteInteractionLayer`-komponentin erillisenä yhteisenä kerroksena
- Analytics-komponentin
- title-, description-, canonical- ja hreflang-metatiedot
- tarvittaessa yötilan ennen ensimmäistä maalausta

Etusivun, About-sivun ja artikkelisivujen omat komponentit renderöidään tämän layoutin sisään. Route-tiedostojen tehtävä on ensisijaisesti reititys ja oikean sivukomponentin käynnistäminen.

## Header ja yhteiset interaktiot

Varsinainen header:

```text
src/components/SiteHeader.astro
```

Sivuston laajempi yhteinen interaktiokerros:

```text
src/components/SiteInteractionLayer.astro
```

`SiteHeader` vastaa vain varsinaisesta navigaatiosta ja kielenvaihdosta. `BaseLayout` renderöi `SiteHeader`in ja `SiteInteractionLayer`in erillisinä sisaruksina, joten kokeellinen interaktiokerros ei kuulu headerin omistukseen.

`SiteInteractionLayer.astro` omistaa yhteisen interaktiokerroksen markupin ja tyylit sekä käynnistää pienemmät TypeScript-featuret. Scroll-, GRID-, A/coordinate- ja AREA-runtime eivät enää elä komponentin isossa inline-scriptissä.

Feature-moduulit:

```text
src/features/interactions/scrollReadout.ts
src/features/interactions/grid.ts
src/features/interactions/aCoordinate.ts
src/features/interactions/area.ts
src/features/interactions/areaRaster.ts
```

Vastuut:

- `scrollReadout.ts` hoitaa scroll-eventin, prosentti- ja Y-arvon laskennan, `requestAnimationFrame`-throttlen sekä cleanupin.
- `grid.ts` seuraa A-moodin `data-mode`-tilaa ja omistaa GRID-overlayn näkyvyysluokan.
- `aCoordinate.ts` omistaa A-moodien kierron, koordinaattireadoutin, ELEV-arvon ja akselien sijainnin.
- `area.ts` omistaa AREA-piirron, polygonigeometrian, pinta-alan, centroidin, contour/topografia-laskennan, drag-rotaation ja AREA-moodin elinkaaren.
- `areaRaster.ts` on AREA:n valinnainen rasteripinnan esityskerros. Se ei omista pointer- tai polygonitilaa, vaan saa geometrian ja rotaation suoraan `area.ts`:ltä.

AREA-polish aktivoidaan `BaseLayout`in `areaPolish`-asetuksella vain sivuille, joilla se oli aiemminkin käytössä: etusivulle ja artikkelisivuille. About- ja Lab-sivuilla AREA käyttää edelleen native-esitystä ilman rasterikerrosta.

Rasteripinnan `html2canvas` ladataan dynaamisella importilla vasta, kun käyttäjä sulkee kelvollisen AREA-polygonin. Näin rasterointikirjastoa ei tarvitse ladata sivun alkuperäiseen JavaScript-pakettiin vain piilotetun easter eggin vuoksi.

Aiempi erillinen `AreaTopographyPolish.astro` on poistettu. AREA:n varsinainen tila ja tapahtumankäsittely ovat nyt yhdessä kanonisessa runtimessa, eikä polish ylläpidä erillistä `MutationObserver`- tai pointer-eventtikerrosta.

## Etusivun keskeiset 3D-visualisoinnit

Etusivun animoitu topografia:

```text
src/components/MorphingTopography.astro
```

Etusivun/About-osion pistepilvipää:

```text
src/components/MeshyPixelatedPoiseVol4.astro
```

Pään About-kehys ja asetukset kootaan komponentissa:

```text
src/components/AboutPortraitSection.astro
```

Näiden visualisointien kamera-, geometria-, väri-, liike- ja interaktioasetuksia ei pidä muuttaa sivuvaikutuksena muiden refaktorointien yhteydessä. Selaintestit toimivat niiden perussuojana.

Pistepilvipään raskas Three.js/GLB-alustus käynnistyy vasta, kun komponentti tulee lähelle näkyvää aluetta. Varsinainen renderöintisilmukka on aktiivinen vain komponentin ollessa näkyvän alueen läheisyydessä ja dokumentin ollessa aktiivinen. Kun pää on ruudun ulkopuolella tai välilehti on piilossa, animaatiosilmukka pysäytetään ja käynnistetään uudelleen näkyvyyden palatessa. Tämä lifecycle-optimointi ei muuta pään kamera-, geometria-, piste-, väri- tai idle-liikeasetuksia.

Repo sisältää myös vanhemman/erillisen:

```text
src/components/Topography.astro
```

Etusivun nykyinen topografia käyttää kuitenkin `MorphingTopography.astro`-komponenttia.

## Three.js

Repo käyttää tällä hetkellä osittain npm-asennettua Three.js:ää.

Yhteinen npm-runtime:

```text
src/scripts/threeRuntime.ts
```

Runtime vie yhteiseen käyttöön `THREE`-moduulin, `OrbitControls`-ohjaimet, `GLTFLoader`-lataimen ja `MeshSurfaceSampler`-samplerin.

`PointBee.astro`, `PointButterfly.astro`, `SegmentedRing.astro`, `AccessibilityStep.astro`, `WaterDropMorph.astro`, `TreeField.astro`, `RiverFlow.astro`, `PhotogrammetryModel.astro`, `MeshyPixelatedPoise.astro` ja `MeshyPixelatedPoiseVol4.astro` käyttävät tätä yhteistä runtimea. Three.js:n TypeScript-tyypit pidetään samassa `0.180.0`-versiossa runtime-riippuvuuden kanssa `@types/three`-dev-riippuvuutena. Kaikkia 3D-komponentteja ei ole vielä siirretty CDN-tuonneista yhteiseen npm-runtimeen, joten migraatio on tarkoituksella vielä osittainen.

## README:n ylläpito

README tarkistetaan samassa muutoksessa aina, kun muutos vaikuttaa projektin käyttöön, rakenteeseen tai ylläpitoon. Tämä koskee erityisesti:

- Node- tai riippuvuusvaatimuksia
- paikallisia kehitys- ja build-komentoja
- CI- ja testauskäytäntöjä
- sivujen, layoutien tai keskeisten komponenttien omistajuutta
- sisältöskeemaa ja artikkelien julkaisuohjeita
- deploy- tai hosting-käytäntöjä
- 3D-visualisointien lifecyclea tai niiden suojaavia testejä

Jos merkittävä tekninen päivitystarve havaitaan mutta sitä ei tehdä samassa muutoksessa, se voidaan kirjata seuraavaan listaan. Kun tarve on ratkaistu, kohta poistetaan tai päivitetään.

### Tunnetut tekniset päivitystarpeet

- Three.js:n npm-migraatio on vielä osittainen. Loput 3D-komponentit kannattaa siirtää yhteiseen runtimeen vasta regressiosuojan alla ja ilman renderöintiasetusten muutoksia.
- Vanha yhden lähteen artikkelirakenne on vielä tuettu siirtymävaiheen vuoksi. Sisältö kannattaa myöhemmin yhtenäistää kokonaan `sources[]`-rakenteeseen.
- `SiteInteractionLayer`in varsinainen interaktioruntime on nyt pilkottu scroll-, GRID-, A/coordinate- ja AREA-featureihin. Jäljellä oleva inline-liimakoodi sisältää vielä legacy-näppäinoikoteitä ja päivämäärän format toggle -easter eggin; ne voidaan myöhemmin irrottaa omiksi pieniksi featureiksi.

## Artikkelien interaktiivinen grafiikka

`FeedPost.astro` käyttää yhteistä selainmoduulia interaktiivisten grafiikoiden hit-area- ja pointer-käsittelyyn:

```text
src/scripts/postInteractiveGraphics.ts
```

Älä lisää samaa logiikkaa takaisin erillisenä kopiona jokaiseen artikkelipostaukseen.

## Sivuston yhteiset asetukset

Yhteiset sivustoasetukset sijaitsevat tiedostossa:

```text
src/config/site.ts
```

Siellä määritellään muun muassa:

- sivuston nimi
- tuotanto-URL
- LinkedIn-osoite
- Google Analyticsin Measurement ID
- yhteinen meta-kuva
- FI- ja EN-kieliasetukset

Yhteinen meta-kuva:

```text
public/graphics/metakuva.png
```

Kaikki artikkelit käyttävät samaa meta-kuvaa automaattisesti.

Artikkelikohtaista `metaImage`-kenttää ei tarvitse lisätä uusiin artikkeleihin.

## Uuden artikkelin lisääminen

Uusi artikkeli tehdään aina uutena Markdown-tiedostona kansioon:

```text
src/content/posts/
```

Valmis pohja löytyy:

```text
src/content/post-template.md
```

### 1. Kopioi pohja

Esimerkiksi:

```text
src/content/posts/2026-09-15-kaupunkiluonnon-merkitys.md
```

Tiedostonimen suositeltu rakenne:

```text
YYYY-MM-DD-artikkelin-nimi.md
```

Päivämääräosa poistetaan automaattisesti julkisesta URL-osoitteesta.

Esimerkiksi tiedostosta:

```text
2026-09-15-kaupunkiluonnon-merkitys.md
```

muodostuvat osoitteet:

```text
https://aapopihkala.fi/artikkelit/kaupunkiluonnon-merkitys/
```

ja:

```text
https://aapopihkala.fi/en/articles/kaupunkiluonnon-merkitys/
```

Älä muuta tiedostonimeä julkaisemisen jälkeen ilman hyvää syytä, koska tiedostonimi määrittää artikkelin URL-osoitteen.

## Artikkelin tila

Uusi artikkeli aloitetaan luonnoksena:

```yaml
status: "draft"
publishedAt: null
```

Luonnosta ei näytetä sivustolla eikä sille muodosteta julkista artikkelisivua.

Kun artikkeli julkaistaan:

```yaml
status: "published"
publishedAt: "2026-09-15T12:00:00+03:00"
```

`publishedAt` kirjoitetaan ISO 8601 -muodossa aikavyöhykkeen kanssa.

Suomen kesäaika:

```text
+03:00
```

Suomen talviaika:

```text
+02:00
```

### Tärkeää ajastamisesta

Sivusto ei tällä hetkellä tue varsinaista automaattista ajastettua julkaisua.

Jos artikkelin tila on:

```yaml
status: "published"
```

se tulee näkyviin heti seuraavan buildin yhteydessä, vaikka `publishedAt` olisi tulevaisuudessa.

Älä siis aseta artikkelia `published`-tilaan etukäteen, jos sen ei kuulu vielä näkyä.

## Artikkelin sisältö

Suomen- ja englanninkielinen versio ovat samassa Markdown-tiedostossa.

Uusien artikkelien perusrakenne:

```yaml
---
status: "draft"
publishedAt: null

sources:
  - url: "https://example.com/"

    fi:
      name: "Lähteen nimi"
      linkText: "Lähteen nimi · Julkaisun nimi"
      title: "Julkaisun varsinainen nimi"

    en:
      name: "Source name"
      linkText: "Source name · Publication title"
      title: "Full publication title"

fi:
  title: "Suomenkielinen otsikko"

  tags:
    - maisema-arkkitehtuuri

  metaDescription: "Lyhyt yhden lauseen kuvaus hakukoneita ja some-esikatseluja varten."

  intro: "Artikkelin varsinainen johdanto."

  perspective:
    - "Ensimmäinen kappale."
    - "Toinen kappale."

en:
  title: "English title"

  tags:
    - landscape architecture

  metaDescription: "A short one-sentence description for search engines and social previews."

  intro: "The full article introduction."

  perspective:
    - "First paragraph."
    - "Second paragraph."
---
```

## Meta description

Jokaisella uudella artikkelilla pitää olla:

```yaml
fi:
  metaDescription: "..."

en:
  metaDescription: "..."
```

`metaDescription` on erillinen artikkelin `intro`-tekstistä.

Sitä käytetään muun muassa:

- HTML `meta description` -kentässä
- Open Graph -esikatselussa
- WhatsApp-esikatselussa
- LinkedIn-esikatselussa
- Twitter/X-esikatselussa
- `BlogPosting`-rakenteisessa datassa

### Ohje ChatGPT:lle meta descriptionin tekemiseen

Kun teet tai viimeistelet artikkelin tämän projektin rakenteeseen, luo aina automaattisesti sekä `fi.metaDescription` että `en.metaDescription`.

Meta descriptionin tulee:

- kuvata artikkelin ydinsisältö yhdellä napakalla lauseella
- perustua vain artikkelissa olevaan sisältöön
- olla sisällöllisesti sama FI- ja EN-versiossa
- olla luonnollinen lause, ei avainsanalista
- olla mielellään noin 90-140 merkkiä
- toimia hakukoneen sekä WhatsApp-, LinkedIn- ja muiden some-esikatselujen tekstinä
- olla introa tiiviimpi
- olla kopioimatta introa sellaisenaan
- välttää uusia faktoja, joita artikkeli tai lähteet eivät tue

Älä pyydä käyttäjältä meta descriptionia erikseen, ellei artikkelin ydinsisältö ole epäselvä.

Jos FI- tai EN-versiosta puuttuu meta description, luo se automaattisesti ennen valmiin `.md`-tiedoston palauttamista.

## Kieliversioiden synkronointi

FI- ja EN-versioiden pitää olla sisällöllisesti synkassa.

Tämä koskee ainakin:

- otsikkoa
- introa
- meta descriptionia
- näkökulman kappaleita
- keskeisiä vertailuja
- lukuja ja määriä
- lähteitä
- kuvan alt-tekstiä, jos artikkelilla on kuva

Käännöksen ei tarvitse olla sanasta sanaan, mutta kummankaan kieliversion ei pidä sisältää olennaista väitettä, vertailua tai tietoa, joka puuttuu toisesta.

Jos muutat toista kieliversiota sisällöllisesti, päivitä myös toinen vastaamaan samaa sisältöä.

## Lähteet

Artikkelilla pitää olla vähintään yksi lähde.

Lähteet määritellään `sources`-listana:

```yaml
sources:
  - url: "https://example.com/first"

    fi:
      name: "Ensimmäinen lähde"
      linkText: "Ensimmäinen lähde · Julkaisun nimi"
      title: "Julkaisun nimi"

    en:
      name: "First source"
      linkText: "First source · Publication title"
      title: "Publication title"

  - url: "https://example.com/second"

    fi:
      name: "Toinen lähde"
      linkText: "Toinen lähde · Julkaisun nimi"
      title: "Julkaisun nimi"

    en:
      name: "Second source"
      linkText: "Second source · Publication title"
      title: "Publication title"
```

Lähteitä voi olla 1-n kappaletta.

Ensimmäinen `sources`-listan lähde toimii artikkelin pääasiallisena lähteenä ja näkyy artikkelin johdannon yhteydessä.

Kaikki lähteet näytetään artikkelin alaosan `Lähde`- tai `Lähteet`-kohdassa.

`FeedPost.astro` hoitaa lähteiden näyttämisen sekä etusivulla että yksittäisellä artikkelisivulla.

### Vanha lähderakenne

Sisältöskeema hyväksyy toistaiseksi myös vanhan yhden lähteen rakenteen:

```yaml
sourceUrl: "https://example.com/"

fi:
  sourceName: "Lähde"
  sourceLinkText: "Lähde · Julkaisun nimi"
  sourceTitle: "Julkaisun nimi"

en:
  sourceName: "Source"
  sourceLinkText: "Source · Publication title"
  sourceTitle: "Publication title"
```

Tämä on mukana, jotta vanhat artikkelit eivät rikkoudu siirtymän aikana.

Kaikki uudet artikkelit tehdään `sources`-rakenteella.

## Artikkelin kuva

Artikkelin sisällä näkyvä kuva on vapaaehtoinen.

Lisää kuvatiedosto esimerkiksi:

```text
public/graphics/artikkelin-kuva.svg
```

ja lisää artikkelin frontmatteriin:

```yaml
graphic: "/graphics/artikkelin-kuva.svg"
```

Kun `graphic` on käytössä, molemmilla kielillä pitää olla myös alt-teksti:

```yaml
fi:
  graphicAlt: "Kuvan suomenkielinen kuvaus."

en:
  graphicAlt: "English description of the image."
```

Jos `graphic` on määritelty mutta FI- tai EN-alt-teksti puuttuu, Content Collection -validointi pysäyttää buildin.

Jos artikkelilla ei ole kuvaa, jätä `graphic` ja `graphicAlt` pois.

Artikkelin `graphic` ei vaikuta some-esikatselun meta-kuvaan. Meta-kuvana käytetään koko sivuston yhteistä:

```text
public/graphics/metakuva.png
```

## Artikkelien järjestys

Julkaistut artikkelit järjestetään automaattisesti `publishedAt`-kentän perusteella uusimmasta vanhimpaan.

Logiikka sijaitsee tiedostossa:

```text
src/utils/posts.ts
```

Samaa artikkelihakua käyttävät:

- etusivu
- suomenkieliset artikkelisivut
- englanninkieliset artikkelisivut

## Content Collection

Artikkelien rakenne validoidaan tiedostossa:

```text
src/content.config.ts
```

Jos artikkelista puuttuu pakollinen kenttä tai kenttä on väärässä muodossa, Astro-build epäonnistuu.

Tämä on tarkoituksellista, jotta virheellinen artikkeli ei päädy tuotantoon.

Nykyinen skeema hyväksyy siirtymävaiheessa sekä vanhan yhden lähteen rakenteen että uuden `sources`-rakenteen.

## Sivujen rakenne

### Etusivu

```text
src/components/HomePage.astro
```

Etusivun artikkelit renderöidään komponentilla:

```text
src/components/FeedPost.astro
```

### About-sivu

```text
src/components/AboutPage.astro
```

### Artikkelisivu

Kaikkien yksittäisten artikkelien varsinainen sivurakenne sijaitsee yhdessä tiedostossa:

```text
src/components/ArticlePage.astro
```

Suomen- ja englanninkieliset `[id].astro`-tiedostot vastaavat pääasiassa reittien muodostamisesta.

### Analytics

Google Analyticsin yhteinen komponentti:

```text
src/components/Analytics.astro
```

Analytics liitetään yhteisen `BaseLayout.astro`-layoutin kautta.

Analytics ladataan vasta, kun käyttäjä hyväksyy analytiikan sivuston suostumusvalinnassa. Käyttäjän valinta tallennetaan selaimen `localStorage`-tallennustilaan.

Google Analyticsin Measurement ID sijaitsee tiedostossa:

```text
src/config/site.ts
```

Älä lisää Googlen `gtag`-koodia erikseen sivuille, koska seuranta hoidetaan keskitetysti `Analytics.astro`-komponentissa.

### Meta-tiedot

Yhteisiä title-, description-, canonical- ja hreflang-kenttiä käsittelee `BaseLayout.astro`.

Artikkelisivujen artikkelikohtaiset metatiedot ja rakenteinen data muodostetaan `ArticlePage.astro`-komponentissa. Se käyttää muun muassa:

- artikkelin otsikkoa
- artikkelin kielikohtaista `metaDescription`-kenttää
- yhteistä `site.metaImage`-kuvaa
- canonical URL:ia
- FI/EN `hreflang`-osoitteita
- Open Graph -metatietoja
- Twitter/X-metatietoja
- `BlogPosting` JSON-LD:tä

### Tyylit

Sivuston yhteiset tyylit:

```text
src/styles/global.css
```

Komponenteilla on lisäksi omia Astro-tyylejä. Globaalien selectorien ja komponenttikohtaisten overridejen omistajuutta kannattaa pitää silmällä refaktoroinneissa.

## SEO

Astro generoi sitemapin automaattisesti `@astrojs/sitemap`-integraatiolla.

Asetukset:

```text
astro.config.mjs
```

Sitemap:

```text
https://aapopihkala.fi/sitemap-index.xml
```

Robots-tiedosto:

```text
public/robots.txt
```

Yksittäisillä artikkelisivuilla on:

- canonical URL
- FI/EN `hreflang`
- Open Graph -metatiedot
- Twitter/X-metatiedot
- yhteinen meta-kuva
- kielikohtainen meta description
- `BlogPosting` JSON-LD

## Tarkistus ennen julkaisua

Ennen muutosten viemistä tuotantoon tarkista vähintään:

1. Artikkelin `status` on oikein.
2. `publishedAt` on oikein ja käyttää oikeaa Suomen aikavyöhykettä.
3. Suomenkielinen sisältö on valmis.
4. Englanninkielinen sisältö on valmis.
5. FI- ja EN-versiot ovat sisällöllisesti synkassa.
6. Molemmilla kielillä on `metaDescription`.
7. `sources` sisältää vähintään yhden lähteen.
8. Kaikkien lähteiden URL-osoitteet toimivat.
9. Lähdetiedot on annettu sekä FI- että EN-versiolle.
10. Mahdollinen artikkelikuva löytyy `public/graphics/`-kansiosta.
11. Artikkelikuvalla on FI- ja EN-alt-tekstit.
12. `npm run build` onnistuu.
13. `npm run test:e2e` onnistuu.
14. CI:n Build check onnistuu ennen tuotantoon luottamista.

Paikallinen perustarkistus:

```bash
npm ci
npm run check
npm run build
npm run test:e2e
```

`npm run check` on pakollinen osa perustarkistusta ja sen pitää onnistua ennen buildin ja selainregressiotestien hyväksymistä.

Julkaisun jälkeen tarkista:

```text
/
```

```text
/en/
```

sekä uuden artikkelin FI- ja EN-osoitteet.

## Uuden artikkelin tekeminen ChatGPT:n avulla

Kun annat tämän README-tiedoston ja artikkeliluonnoksen toiselle ChatGPT-keskustelulle, voit käyttää esimerkiksi pyyntöä:

> Tässä ovat sivustoni README ja julkaisematon artikkelitiedosto. Tee artikkelista julkaisuvalmis nykyisen projektirakenteen mukaisesti. Älä muuta artikkelin sisältöä ilman että kysyt. Anna minulle koko valmis `.md`-tiedosto ja kerro tarkka polku, johon se kuuluu.

Jos annat lisäksi:

```text
src/content/post-template.md
```

ChatGPT:n pitää käyttää sitä artikkelin teknisen rakenteen pohjana.

### Ohje ChatGPT:lle

Kun tuotat tähän projektiin uuden tai päivitetyn artikkelitiedoston:

- käytä uuden artikkelin `sources`-rakennetta
- säilytä FI- ja EN-versiot samassa tiedostossa
- pidä FI- ja EN-versiot sisällöllisesti synkassa
- käytä `draft`-tilaa, ellei julkaisemista pyydetä
- käytä pyydettyä Suomen päivämäärää ja oikeaa UTC-offsetia
- luo automaattisesti hyvä `fi.metaDescription`
- luo automaattisesti sitä vastaava `en.metaDescription`
- pidä meta descriptionit mielellään noin 90-140 merkin mittaisina
- älä keksi meta descriptioniin uusia faktoja
- älä lisää artikkelikohtaista `metaImage`-kenttää
- käytä artikkelin sisäistä `graphic`-kenttää vain, jos artikkelille annetaan erillinen artikkelikuva
- älä muuta käyttäjän artikkelisisältöä ilman lupaa
- jos käyttäjä muuttaa olennaista sisältöä toisessa kieliversiossa, päivitä myös toinen kieliversio vastaamaan sitä
- palauta aina koko valmis Markdown-tiedosto
- kerro aina tarkka projektipolku

Meta descriptionia ei tarvitse pyytää käyttäjältä erikseen. Se generoidaan automaattisesti artikkelin sisällöstä, ellei artikkelin ydinsisältö ole epäselvä.
