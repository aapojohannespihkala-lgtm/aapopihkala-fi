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
- Google Analytics 4

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

Jos muutokset tehdään GitHubissa selaimella, Cloudflare ajaa buildin automaattisesti commitin jälkeen.

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

GitHubiin tehty commit käynnistää tuotantodeployn automaattisesti.

## Projektin tärkeimmät tiedostot

```text
src/
├── components/
│   ├── Analytics.astro
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
```

Julkiset kuvat ja muut staattiset tiedostot:

```text
public/
```

Artikkelien grafiikat:

```text
public/graphics/
```

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

### Analytics

Google Analyticsin yhteinen komponentti:

```text
src/components/Analytics.astro
```

Komponentti on liitetty:

```text
src/components/HomePage.astro
```

ja:

```text
src/components/ArticlePage.astro
```

Analytics ladataan vasta, kun käyttäjä hyväksyy analytiikan sivuston suostumusvalinnassa.

Käyttäjän valinta tallennetaan selaimen `localStorage`-tallennustilaan.

Google Analyticsin Measurement ID sijaitsee tiedostossa:

```text
src/config/site.ts
```

Älä lisää Googlen `gtag`-koodia erikseen sivuille, koska seuranta hoidetaan keskitetysti `Analytics.astro`-komponentissa.

### Meta-tiedot

Artikkelisivujen meta-tiedot muodostetaan keskitetysti tiedostossa:

```text
src/components/ArticlePage.astro
```

Se käyttää:

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
12. Cloudflare-build onnistuu.

Jos työskentelet paikallisesti, tarkista lisäksi:

```bash
npm run build
```

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
