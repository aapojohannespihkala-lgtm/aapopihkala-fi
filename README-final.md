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
- @astrojs/sitemap

## Kehitys paikallisesti

Asenna riippuvuudet:

    npm install

Käynnistä kehityspalvelin:

    npm run dev

Tee tuotantobuild:

    npm run build

Build kannattaa ajaa aina ennen muutosten viemistä tuotantoon.

## Cloudflare

Cloudflare käyttää tuotantobuildiin komentoa:

    npm run build

Deploy-komento:

    npx wrangler deploy

Tuotantohaara:

    main

## Projektin tärkeimmät tiedostot

    src/
    ├── components/
    │   ├── ArticlePage.astro
    │   ├── FeedPost.astro
    │   ├── HomePage.astro
    │   ├── SiteHeader.astro
    │   └── Topography.astro
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

Julkiset kuvat ja muut staattiset tiedostot sijaitsevat:

    public/

Artikkelien grafiikat sijaitsevat:

    public/graphics/

## Sivuston yhteiset asetukset

Sivuston yhteiset perustiedot sijaitsevat tiedostossa:

    src/config/site.ts

Siellä määritellään:

- sivuston nimi
- pääosoite
- LinkedIn-osoite
- kielikoodit
- locale-arvot
- Open Graph -locale-arvot
- FI- ja EN-etusivujen polut

Jos jokin näistä tiedoista muuttuu, muuta se ensisijaisesti tässä tiedostossa.

Huomaa, että sivuston domain esiintyy lisäksi Astro- ja robots-asetuksissa:

    astro.config.mjs
    public/robots.txt

## Uuden artikkelin lisääminen

Uusi artikkeli tehdään uutena Markdown-tiedostona kansioon:

    src/content/posts/

Valmis pohja löytyy:

    src/content/post-template.md

### 1. Kopioi pohja

Esimerkiksi:

    src/content/posts/2026-09-15-kaupunkiluonnon-merkitys.md

Tiedostonimen suositeltu rakenne:

    YYYY-MM-DD-artikkelin-nimi.md

Päivämääräosa poistetaan automaattisesti julkisesta URL-osoitteesta.

Esimerkiksi tiedostosta:

    2026-09-15-kaupunkiluonnon-merkitys.md

muodostuvat osoitteet:

    https://aapopihkala.fi/artikkelit/kaupunkiluonnon-merkitys/

ja:

    https://aapopihkala.fi/en/articles/kaupunkiluonnon-merkitys/

Älä muuta tiedostonimeä artikkelin julkaisemisen jälkeen ilman hyvää syytä, koska tiedostonimi määrittää artikkelin URL-osoitteen.

## Artikkelin tila

Uusi artikkeli kannattaa aloittaa luonnoksena:

    status: "draft"
    publishedAt: null

Luonnosta ei näytetä sivustolla eikä sille muodosteta julkista artikkelisivua.

Kun artikkeli julkaistaan:

    status: "published"
    publishedAt: "2026-09-15T12:00:00+03:00"

publishedAt kirjoitetaan ISO 8601 -muodossa aikavyöhykkeen kanssa.

Suomen kesäaika:

    +03:00

Suomen talviaika:

    +02:00

## Artikkelin sisältö

Suomen- ja englanninkielinen versio ovat samassa Markdown-tiedostossa.

Perusrakenne:

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

## Artikkelin kuva

Kuva on vapaaehtoinen.

Lisää kuvatiedosto esimerkiksi:

    public/graphics/artikkelin-kuva.svg

ja lisää artikkelin frontmatteriin:

    graphic: "/graphics/artikkelin-kuva.svg"

Jos artikkelilla on kuva, molemmille kielille vaaditaan alt-teksti:

    fi:
      graphicAlt: "Kuvan suomenkielinen kuvaus."

    en:
      graphicAlt: "English description of the image."

Jos graphic on määritelty mutta jompikumpi graphicAlt puuttuu, Astro-build epäonnistuu.

Jos artikkelilla ei ole kuvaa, jätä graphic ja graphicAlt pois.

## Artikkelien järjestys

Julkaistut artikkelit järjestetään automaattisesti publishedAt-kentän perusteella uusimmasta vanhimpaan.

Logiikka sijaitsee tiedostossa:

    src/utils/posts.ts

Samaa artikkelihakua käyttävät:
- etusivu
- suomenkieliset artikkelisivut
- englanninkieliset artikkelisivut

## Content Collection

Artikkelien rakenne validoidaan tiedostossa:

    src/content.config.ts

Jos artikkelista puuttuu pakollinen kenttä tai kenttä on väärässä muodossa, Astro-build epäonnistuu.

Tämä on tarkoituksellista, jotta virheellinen artikkeli ei päädy tuotantoon.

## Sivujen rakenne

### Etusivu

Etusivun rakenne:

    src/components/HomePage.astro

Etusivun artikkelit renderöidään komponentilla:

    src/components/FeedPost.astro

### Artikkelisivu

Kaikkien yksittäisten artikkelien varsinainen sivurakenne sijaitsee yhdessä tiedostossa:

    src/components/ArticlePage.astro

Suomen- ja englanninkieliset reittitiedostot ovat:

    src/pages/artikkelit/[id].astro
    src/pages/en/articles/[id].astro

Ne muodostavat reitit ja käyttävät yhteistä ArticlePage-komponenttia.

### Header

Kaikkien sivujen yhteinen header:

    src/components/SiteHeader.astro

### Topografia

Etusivun animoitu topografiakuvio:

    src/components/Topography.astro

### Tyylit

Sivuston yhteiset tyylit:

    src/styles/global.css

## SEO

Astro generoi sitemapin automaattisesti @astrojs/sitemap-integraatiolla.

Asetukset:

    astro.config.mjs

Sitemap:

    https://aapopihkala.fi/sitemap-index.xml

Robots-tiedosto:

    public/robots.txt

Yksittäisillä artikkelisivuilla on:

- canonical URL
- FI/EN hreflang
- Open Graph -metatiedot
- BlogPosting JSON-LD

Nämä sijaitsevat yhteisesti:

    src/components/ArticlePage.astro

## Tarkistus ennen julkaisua

Ennen kuin viet uuden artikkelin tuotantoon, tarkista:

1. Artikkelin status on oikein.
2. publishedAt on oikein.
3. Suomenkielinen sisältö on valmis.
4. Englanninkielinen sisältö on valmis.
5. Lähteen URL toimii.
6. Mahdollinen kuva löytyy public/graphics/-kansiosta.
7. Kuvalla on FI- ja EN-alt-tekstit.
8. Cloudflare-build onnistuu.

Julkaisun jälkeen tarkista:

    https://aapopihkala.fi/
    https://aapopihkala.fi/en/

sekä uuden artikkelin FI- ja EN-osoitteet.

## Uuden artikkelin julkaisu lyhyesti

Käytännössä uuden jutun julkaiseminen menee näin:

1. Kopioi src/content/post-template.md.
2. Tallenna kopio src/content/posts/-kansioon.
3. Anna tiedostolle nimi muodossa YYYY-MM-DD-artikkelin-nimi.md.
4. Kirjoita FI- ja EN-sisällöt.
5. Lisää mahdollinen kuva public/graphics/-kansioon.
6. Vaihda status arvoksi published.
7. Lisää publishedAt.
8. Vie muutos main-haaraan.
9. Tarkista Cloudflare-deployment.
10. Tarkista uusi artikkeli selaimessa.
