# Arkkitehtuuri

Tämä dokumentti kuvaa projektin vakaita vastuurajoja ja ylläpidon kannalta olennaisia periaatteita. Yksittäisten tiedostojen, testien ja animaatioparametrien tarkka nykytila kuuluu ensisijaisesti koodiin ja regressiotesteihin.

## Sivun yhteinen runko

Koko HTML-dokumentin yhteinen runko sijaitsee tiedostossa:

```text
src/layouts/BaseLayout.astro
```

`BaseLayout` keskittää muun muassa:

- yhteisen `<html>`, `<head>` ja `<body>` -rakenteen
- globaalit tyylit
- FI/EN skip-navigation-linkin
- `SiteHeader`-komponentin
- `SiteInteractionLayer`-komponentin erillisenä yhteisenä kerroksena
- Analytics-komponentin
- title-, description-, canonical- ja hreflang-metatiedot
- tavallisten sivujen Open Graph- ja Twitter/X-metatiedot
- tarvittaessa yötilan ennen ensimmäistä maalausta

Etusivu, About-sivu, artikkelisivut ja muut reitit käyttävät yhteistä layoutia silloin, kun niillä ei ole erityistä syytä poiketa siitä. Route-tiedostojen tehtävä pidetään ensisijaisesti reitityksessä ja oikean sivukomponentin käynnistämisessä.

## Sivukomponentit

Keskeiset sivut toteutetaan erillisillä komponenteilla `src/components/`-hakemistossa. Esimerkiksi:

- etusivu käyttää `HomePage.astro`-komponenttia
- About käyttää `AboutPage.astro`-komponenttia
- yksittäiset artikkelit käyttävät `ArticlePage.astro`-komponenttia

FI- ja EN-reittitiedostot eivät saa muodostua toisistaan eriytyviksi rinnakkaisiksi sivutoteutuksiksi ilman erityistä syytä.

## Header ja yhteiset interaktiot

Varsinainen navigaatio sijaitsee tiedostossa:

```text
src/components/SiteHeader.astro
```

Sivuston yhteinen interaktiokerros sijaitsee tiedostossa:

```text
src/components/SiteInteractionLayer.astro
```

`SiteHeader` vastaa varsinaisesta navigaatiosta ja kielenvaihdosta. `SiteInteractionLayer` omistaa sivustonlaajuisen kokeellisen interaktiokerroksen markupin ja käynnistää pienemmät TypeScript-featuret.

Yhteiset selaininteraktiot sijaitsevat pääosin hakemistossa:

```text
src/features/interactions/
```

Tähän kuuluvat esimerkiksi scroll-, GRID-, coordinate-, AREA-, legacy shortcut- ja päivämäärätoiminnot. Dokumentaatiossa ei ylläpidetä täydellistä featuretiedostojen inventaariota. Hakemisto ja testit ovat niiden tarkka lähde.

AREA:n varsinainen tila ja tapahtumankäsittely pidetään yhdessä kanonisessa runtimessa. Valinnainen rasteriesitys ei omista erillistä pointer- tai polygonitilaa. Raskaat tai harvoin tarvittavat riippuvuudet, kuten rasterointikirjasto, ladataan vasta silloin, kun toiminto niitä tarvitsee.

## Artikkelien interaktiivinen grafiikka

`FeedPost.astro` käyttää yhteistä selainmoduulia interaktiivisten grafiikoiden hit-area- ja pointer-käsittelyyn:

```text
src/scripts/postInteractiveGraphics.ts
```

Samaa logiikkaa ei pidä kopioida erikseen jokaiseen artikkelipostaukseen.

## Three.js

Repo käyttää npm-asennettua Three.js:ää yhteisen runtimen kautta:

```text
src/scripts/threeRuntime.ts
```

Yhteinen runtime tarjoaa tarvittavat Three.js-moduulit ja tavallisesti käytetyt apuluokat, kuten orbit-ohjaimet ja GLTF-latauksen. Three.js-komponenttien tulee käyttää tätä yhteistä runtimea eikä erillisiä CDN-tuonteja.

Runtime- ja TypeScript-tyyppiversiot pidetään yhteensopivina. Tarkat versionumerot ovat `package.json`-tiedoston vastuulla eikä niitä toisteta tässä dokumentissa.

## 3D-visualisointien elinkaari

Etusivun ja About-osion keskeiset 3D-visualisoinnit sijaitsevat omissa komponenteissaan. Raskas Three.js- tai GLB-alustus pyritään lykkäämään siihen hetkeen, jolloin visualisointi on oikeasti tulossa näkyviin.

Renderöintisilmukoiden tulee huomioida näkyvyys ja dokumentin aktiivisuus. Kun visualisointi ei ole näkyvissä tai välilehti ei ole aktiivinen, turhaa renderöintiä vältetään silloin kun se voidaan tehdä muuttamatta näkyvää käyttäytymistä.

Kamera-, geometria-, materiaali-, piste-, morph-, damping- ja animaatioparametreja ei muuteta sivuvaikutuksena arkkitehtuuri- tai cleanup-refaktoroinneissa. Regressiotestit suojaavat tarkoituksellista käyttäytymistä.

Interaktiivisten 3D-animaatioiden orbitointia koskeva projektisääntö on `AGENTS.md`-tiedostossa.

## Animation Lab

Animation Lab sijaitsee `src/pages/lab/`-reitissä. Uusien interaktiivisten animaatiotutkielmien pariteettisääntö on määritelty `AGENTS.md`-tiedostossa.

Lab toimii erillisenä kokeilu- ja tarkistusympäristönä eikä sen yksittäisten kokeiden täydellistä luetteloa ylläpidetä tässä dokumentissa.

## Current

Henkilökohtainen Current-näkymä sijaitsee reitissä:

```text
/current/
```

Route ja sivukomponentti ovat erillään, ja Current käyttää yhteistä `BaseLayout.astro`-layoutia. Currentia ei linkitetä sivuston päänavigaatioon ilman erillistä päätöstä, ja näkymä pidetään hakukoneilta rajattuna silloin kun se on tarkoitettu henkilökohtaiseksi näkymäksi.

Currentin selainruntimet sijaitsevat omassa `src/features/current/`-kokonaisuudessaan. Ulkoiset datalähteet, päivitysvälit ja moduulikohtaiset regressiosopimukset kuuluvat ensisijaisesti toteutukseen ja testeihin eikä niitä toisteta yksityiskohtaisesti tässä dokumentissa.

## Analytics

Google Analyticsin yhteinen komponentti on:

```text
src/components/Analytics.astro
```

Analytics liitetään yhteisen layoutin kautta eikä Googlen `gtag`-koodia lisätä erikseen sivuille. Seuranta käynnistyy vasta käyttäjän hyväksynnän jälkeen.

Sivuston yhteiset analytiikka- ja muut asetukset sijaitsevat tiedostossa:

```text
src/config/site.ts
```

## SEO ja metatiedot

Yhteisiä title-, description-, canonical- ja hreflang-kenttiä sekä tavallisten sivujen Open Graph- ja Twitter/X-metatietoja käsittelee `BaseLayout.astro`.

Artikkelisivut muodostavat artikkelikohtaiset metatiedot ja rakenteisen datan `ArticlePage.astro`-komponentissa.

Astro generoi sitemapin `@astrojs/sitemap`-integraatiolla. Robots-tiedosto sijaitsee `public/robots.txt`-polussa.

Yhteinen meta-kuva määritellään sivuston yhteisissä asetuksissa. Artikkelien sisältökuvat ovat eri asia kuin sosiaalisen median meta-kuva.

## Tyylien omistajuus

Sivuston yhteiset tyylit sijaitsevat tiedostossa:

```text
src/styles/global.css
```

Komponenteilla on lisäksi omia Astro-tyylejä. Globaalien selectorien ja komponenttikohtaisten overridejen omistajuus pidetään mahdollisimman selkeänä.

Refaktoroinnissa poistetaan vain todistetusti kuollut tai päällekkäinen CSS. Cleanupia ei yhdistetä tarkoituksettomaan visuaaliseen muutokseen.

## Testaus arkkitehtuurin suojana

Playwright-regressiot sijaitsevat hakemistossa:

```text
tests/e2e/
```

Testit suojaavat erityisesti:

- sivujen keskeistä rakennetta ja lokalisaatiota
- saavutettavuutta
- reduced motion -käyttäytymistä
- SEO- ja metadata-sopimuksia
- mobiilinäkymiä
- interaktiivisia 3D- ja selainominaisuuksia
- suorituskyvyn kannalta tarkoituksellisia latausratkaisuja

Dokumentaatiossa ei ylläpidetä täydellistä testitiedostojen tai yksittäisten assertioiden luetteloa. Testikoodi on niiden tarkka lähde.

## Dokumentoinnin periaate

Tämä dokumentti päivitetään, kun projektin arkkitehtuurin vastuuraja tai pysyvä ylläpitoperiaate muuttuu.

Sitä ei tarvitse päivittää esimerkiksi silloin, kun:

- lisätään uusi regressiotesti olemassa olevan testistrategian sisään
- lisätään uusi komponentti olemassa olevaan arkkitehtuuriin
- muutetaan yksittäisen animaation parametria
- tehdään paikallinen CSS-korjaus
- refaktoroidaan toteutusta muuttamatta omistajuutta tai julkista sopimusta

Näissä tapauksissa koodi ja testit ovat ensisijainen dokumentaatio.