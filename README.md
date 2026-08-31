# aapopihkala.fi

Aapo Pihkalan henkilökohtainen kaksikielinen Astro-sivusto.

Sivusto:
- https://aapopihkala.fi/
- https://aapopihkala.fi/en/

## Teknologia

- Astro
- Astro Content Collections
- TypeScript
- Cloudflare
- `@astrojs/sitemap`

## Kehitys paikallisesti

Asenna riippuvuudet:

```bash
npm install
```

Käynnistä kehityspalvelin:

```bash
npm run dev
```

Tee tuotantobuild:

```bash
npm run build
```

Build kannattaa ajaa aina ennen muutosten viemistä tuotantoon.

## Cloudflare

Cloudflare käyttää tuotantobuildiin komentoa:

```bash
npm run build
```

Deploy-komento:

```bash
npx wrangler deploy
```

Tuotantohaara:

```text
main
```

## Projektin tärkeimmät tiedostot

```text
src/
├── components/
│   ├── ArticlePage.astro
│   ├── FeedPost.astro
│   ├── HomePage.astro
│   ├── SiteHeader.astro
│   └── Topography.astro
│
├── content/
│   ├── post-template.md
│   └── posts/
│       └── *.md
│
├── pages/
│   ├── index.astro
│   ├── artikkelit/
│   │   └── [id].astro
│   └── en/
│       ├── index.astro
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

Julkiset kuvat ja muut staattiset tiedostot sijaitsevat:

```text
public/
```

Artikkelien grafiikat sijaitsevat tällä hetkellä:

```text
public/graphics/
```

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

Älä muuta tiedostonimeä artikkelin julkaisemisen jälkeen ilman hyvää syytä, koska tiedostonimi määrittää artikkelin URL-osoitteen.

## Artikkelin tila

Uusi artikkeli kannattaa aloittaa luonnoksena:

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

Esimerkiksi Suomen kesäaika:

```text
+03:00
```

ja talviaika:

```text
+02:00
```

## Artikkelin sisältö

Suomen- ja englanninkielinen versio ovat samassa Markdown-tiedostossa.

Perusrakenne:

```yaml
---
status: "draft"
publishedAt: null

sourceUrl: "https://example.com/"

fi:
  title: "Suomenkielinen otsikko"
  tags:
    - maisema-arkkitehtuuri
  intro: "Johdanto."
  sourceName: "Lähde"
  sourceLinkText: "Lähde · Julkaisun nimi"
  sourceTitle: "Julkaisun nimi"
  perspective:
    - "Ensimmäinen kappale."
    - "Toinen kappale."

en:
  title: "English title"
  tags:
    - landscape architecture
  intro: "Introduction."
  sourceName: "Source"
  sourceLinkText: "Source · Publication title"
  sourceTitle: "Publication title"
  perspective:
    - "First paragraph."
    - "Second paragraph."
---
```

## Artikkelin kuva

Kuva on vapaaehtoinen.

Lisää kuvatiedosto esimerkiksi:

```text
public/graphics/artikkelin-kuva.svg
```

ja lisää artikkelin frontmatteriin:

```yaml
graphic: "/graphics/artikkelin-kuva.svg"
```

Lisää myös molempien kielten vaihtoehtoiset tekstit:

```yaml
fi:
  graphicAlt: "Kuvan suomenkielinen kuvaus."

en:
  graphicAlt: "English description of the image."
```

Jos artikkelilla ei ole kuvaa, jätä `graphic` ja `graphicAlt` pois.

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

## Sivujen rakenne

### Etusivu

```text
src/components/HomePage.astro
```

Etusivun artikkelit renderöidään komponentilla:

```text
src/components/FeedPost.astro
```

### Artikkelisivu

Kaikkien yksittäisten artikkelien varsinainen sivurakenne sijaitsee yhdessä tiedostossa:

```text
src/components/ArticlePage.astro
```

Suomen- ja englanninkieliset `[id].astro`-tiedostot vastaavat pääasiassa reittien muodostamisesta.

### Header

Kaikkien sivujen yhteinen header:

```text
src/components/SiteHeader.astro
```

### Topografia

Etusivun animoitu topografiakuvio:

```text
src/components/Topography.astro
```

### Tyylit

Sivuston yhteiset tyylit:

```text
src/styles/global.css
```

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
- `BlogPosting` JSON-LD

Nämä sijaitsevat yhteisesti:

```text
src/components/ArticlePage.astro
```

## Tarkistus ennen julkaisua

Ennen kuin viet muutokset tuotantoon, tarkista vähintään:

1. Artikkelin `status` on oikein.
2. `publishedAt` on oikein.
3. Suomenkielinen sisältö on valmis.
4. Englanninkielinen sisältö on valmis.
5. Lähteen URL toimii.
6. Mahdollinen kuva löytyy `public/graphics/`-kansiosta.
7. Kuvalla on FI- ja EN-alt-tekstit.
8. `npm run build` onnistuu.

Julkaisun jälkeen tarkista:

```text
/
```

```text
/en/
```

sekä uuden artikkelin FI- ja EN-osoitteet.
