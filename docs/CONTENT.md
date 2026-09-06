# Artikkelien kirjoittaminen ja julkaiseminen

Tämä dokumentti kuvaa artikkelien toimituksellisen ja teknisen työnkulun. Varsinainen frontmatter-pohja sijaitsee tiedostossa `src/content/post-template.md` ja tekninen validointi tiedostossa `src/content.config.ts`.

Älä ylläpidä erillistä täydellistä YAML-pohjan kopiota tässä dokumentissa. Jos skeema muuttuu, päivitä ensin koodi ja `post-template.md`, ja päivitä tämä ohje vain silloin, kun käyttäjän työnkulku tai sisältösopimus muuttuu.

## Uuden artikkelin lisääminen

Artikkelit sijaitsevat hakemistossa:

```text
src/content/posts/
```

Aloita aina pohjasta:

```text
src/content/post-template.md
```

Suositeltu tiedostonimi on:

```text
YYYY-MM-DD-artikkelin-nimi.md
```

Päivämääräosa poistetaan julkisesta URL-osoitteesta. Esimerkiksi:

```text
src/content/posts/2026-09-15-kaupunkiluonnon-merkitys.md
```

muodostaa reitit:

```text
/artikkelit/kaupunkiluonnon-merkitys/
/en/articles/kaupunkiluonnon-merkitys/
```

Älä muuta tiedostonimeä julkaisemisen jälkeen ilman hyvää syytä, koska se määrittää artikkelin julkisen slug-arvon.

## Luonnos ja julkaisu

Uusi artikkeli aloitetaan luonnoksena:

```yaml
status: "draft"
publishedAt: null
```

Luonnosta ei näytetä julkisilla artikkelisivuilla.

Kun artikkeli julkaistaan:

```yaml
status: "published"
publishedAt: "2026-09-15T12:00:00+03:00"
```

`publishedAt` kirjoitetaan ISO 8601 -muodossa aikavyöhykkeen kanssa.

Suomessa käytetään vuodenajan mukaan oikeaa UTC-offsetia:

```text
kesäaika +03:00
talviaika +02:00
```

### Ajastettu julkaiseminen

Sivusto ei tällä hetkellä tue varsinaista automaattista ajastettua julkaisua.

Jos artikkelin `status` on `published`, artikkeli tulee näkyviin seuraavan buildin yhteydessä myös silloin, kun `publishedAt` olisi tulevaisuudessa. Älä siis vaihda artikkelia `published`-tilaan etukäteen, jos sen ei kuulu vielä näkyä.

## FI- ja EN-versiot

Suomen- ja englanninkielinen versio ovat saman artikkelin kaksi kieliversiota samassa Markdown-tiedostossa.

Niiden pitää pysyä sisällöllisesti synkassa. Tämä koskee ainakin:

- otsikkoa
- introa
- meta descriptionia
- näkökulman kappaleita
- keskeisiä väitteitä ja vertailuja
- lukuja ja määriä
- lähteitä
- kuvan alt-tekstiä

Käännöksen ei tarvitse olla sanasta sanaan. Merkitys, faktat, argumentti, painotukset ja johtopäätös pidetään samoina.

Projektin laajempi kieliversioiden pariteettisääntö on `AGENTS.md`-tiedostossa.

## Lähteet

Artikkelilla pitää olla vähintään yksi lähde.

Kaikki artikkelit käyttävät kanonista `sources`-listaa, jonka tarkka rakenne löytyy `src/content/post-template.md`-pohjasta.

Lähteitä voi olla yksi tai useita. Ensimmäinen lähde toimii artikkelin pääasiallisena lähteenä ja muut lähteet näytetään sen lisäksi artikkelin lähdeosiossa.

Lähteiden URL-osoitteet pidetään samoina FI- ja EN-versioissa. Kielikohtaiset nimet ja linkkitekstit käännetään luonnollisesti mutta pidetään sisällöllisesti vastaavina.

## Meta description

Jokaiselle julkaistavalle artikkelille tehdään sekä `fi.metaDescription` että `en.metaDescription`.

Meta descriptionin tulee:

- kuvata artikkelin ydinsisältö yhdellä napakalla lauseella
- perustua artikkelin sisältöön ja lähteisiin
- olla sisällöllisesti sama FI- ja EN-versiossa
- olla luonnollinen lause, ei avainsanalista
- olla mielellään noin 90-140 merkkiä
- olla introa tiiviimpi
- välttää uusien faktojen lisäämistä

Meta descriptionia käytetään hakukone- ja sosiaalisen median metatiedoissa sekä artikkelin rakenteisessa datassa.

## Artikkelin kuva

Artikkelin sisäinen kuva on vapaaehtoinen. Kuvat sijoitetaan tavallisesti `public/graphics/`-hakemistoon ja viitataan artikkelissa `graphic`-kentällä.

Kun `graphic` tai interaktiivinen grafiikka on käytössä, molemmilla kielillä pitää olla kuvaava `graphicAlt`. Content Collection -validointi estää virheellisen rakenteen päätymisen buildiin.

Artikkelin sisältökuva ei määritä automaattisesti sosiaalisen median meta-kuvaa. Sivusto käyttää yhteisissä asetuksissa määriteltyä meta-kuvaa, ellei toteutukseen myöhemmin tehdä erillistä muutosta.

## Interaktiivinen grafiikka

Artikkelin interaktiiviset grafiikat valitaan sisältöskeeman sallimista vaihtoehdoista. Tarkka sallittu enum kuuluu `src/content.config.ts`-tiedoston vastuulle eikä sitä kopioida tähän dokumenttiin.

Uutta interaktiivista animaatiota koskeva Animation Lab -pariteettisääntö on `AGENTS.md`-tiedostossa.

## Artikkelien järjestys

Julkaistut artikkelit järjestetään `publishedAt`-kentän perusteella uusimmasta vanhimpaan.

Yhteinen artikkelihakulogiikka sijaitsee tiedostossa:

```text
src/utils/posts.ts
```

Samaa logiikkaa käyttävät etusivu sekä FI- ja EN-artikkelireitit.

## Content Collection

Artikkelien rakenne validoidaan tiedostossa:

```text
src/content.config.ts
```

Jos pakollinen kenttä puuttuu tai arvo on väärässä muodossa, validointi tai build epäonnistuu tarkoituksellisesti.

Koodi on teknisen skeeman ensisijainen lähde. Tätä dokumenttia ei pidä käyttää skeeman täydellisenä kenttäluettelona.

## Tarkistus ennen julkaisua

Tarkista vähintään:

1. `status` on oikein.
2. `publishedAt` on oikein ja käyttää oikeaa aikavyöhykettä.
3. FI- ja EN-versiot ovat valmiit ja sisällöllisesti synkassa.
4. Molemmilla kielillä on meta description.
5. `sources` sisältää vähintään yhden toimivan lähteen.
6. Lähdetiedot ovat molemmilla kielillä.
7. Mahdollinen artikkelikuva tai interaktiivinen grafiikka on oikein määritelty.
8. Kuvalla tai grafiikalla on FI- ja EN-alt-tekstit.
9. Paikallinen tarkistus onnistuu.
10. CI:n Build check onnistuu ennen tuotantoversioon luottamista.

Paikallinen perustarkistus:

```bash
npm ci
npm run check
npm run build
npm run test:e2e
```

Julkaisun jälkeen tarkista etusivut sekä uuden artikkelin FI- ja EN-reitit.

## Artikkelin tekeminen ChatGPT:n avulla

Kun ChatGPT tuottaa tai päivittää artikkelin tähän projektiin, sen pitää:

- käyttää `src/content/post-template.md`-pohjaa teknisen rakenteen lähteenä
- käyttää kanonista `sources`-rakennetta
- säilyttää FI- ja EN-versiot samassa tiedostossa
- pitää kieliversiot sisällöllisesti synkassa
- käyttää `draft`-tilaa, ellei julkaisemista pyydetä
- käyttää pyydettyä Suomen päivämäärää ja oikeaa UTC-offsetia
- luoda hyvä `fi.metaDescription` ja sitä vastaava `en.metaDescription`
- olla lisäämättä meta descriptioniin uusia faktoja
- käyttää artikkelin sisäistä kuvaa vain, kun sellainen kuuluu artikkeliin
- olla muuttamatta käyttäjän artikkelisisältöä ilman lupaa
- palauttaa koko valmis Markdown-tiedosto ja kertoa tarkka projektipolku

Meta descriptionia ei tarvitse pyytää käyttäjältä erikseen, ellei artikkelin ydinsisältö ole epäselvä.