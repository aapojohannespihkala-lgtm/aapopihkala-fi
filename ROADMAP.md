# Jatkokehitys

Tämä tiedosto toimii projektin ajantasaisena työlistana. Se tarkistetaan ja päivitetään samassa muutoksessa aina, kun jokin alla oleva työ valmistuu, muuttuu olennaisesti tai uusi merkittävä jatkokehitystarve tunnistetaan.

Valmistunut kohta poistetaan tai merkitään selvästi tehdyksi, jotta tiedosto ei säilytä vanhentunutta backlogia.

## 1. CSS ownership -auditin loppuunvienti

- Käy systemaattisesti läpi `src/styles/global.css` suhteessa komponenttien omiin Astro-tyyleihin.
- Poista vain todistetusti kuolleet tai päällekkäiset säännöt.
- Aiempi cleanup poisti jo vanhaa artikkeli-CSS:ää, mutta koko audit ei ole vielä valmis.
- Auditissa ei tehdä visuaalisia muutoksia.

## 2. Sisältötyö

- Kirjoita uusia artikkeleita ja päivitä nykyisiä tarpeen mukaan.
- Pidä FI- ja EN-versiot sisällöllisesti synkassa.
- About-tekstien placeholderit on jo korvattu.
- Perus-SEO ja sosiaalisen median metat ovat jo kunnossa, joten jäljellä on lähinnä sisältökohtainen hienosäätö.

## 3. Epäselvien source/reference-assetien lopullinen päätös

- Tarkista esimerkiksi `public/3d-source/*` sekä muut portrait/source-kuvat.
- Ne eivät vaikuta nykyisen runtimen kannalta tarpeellisilta, mutta voivat olla tarkoituksellista lähde- tai arkistomateriaalia.
- Päätä erikseen, dokumentoidaanko ne tarkoituksellisiksi vai poistetaanko ne varmennetulla cleanup-PR:llä.
- Tämä ei ole nykyinen bugi eikä kiireellinen työ.

## 4. Laajempi saavutettavuusaudit

Nykyisiä parannuksia ovat muun muassa skip navigation, vähimmäiskokoiset interaktiiviset kohteet, reduced motion -tuki ja regressiotestit.

Jäljellä oleva audit kattaa ainakin:

- semantiikan
- fokusjärjestyksen
- kontrastit
- screen reader -käytön
- näppäimistökäytön
- mobiilikäytön

## 5. Lighthouse ja suorituskykyaudit

Mittaa vähintään Home-, About-, artikkeli- ja Current-sivut oikeilla suorituskykymittauksilla. Tarkista erityisesti:

- LCP
- CLS
- INP
- JavaScript- ja bundle-koko
- 3D-resurssien lataukset

Portrait-GLB:n latausta on jo lykätty näkyvyyteen asti. Bundle- ja Three.js-puolella voi silti olla lisäoptimointipotentiaalia.

## 6. Valinnainen 3D-arkkitehtuurin jatkohajotus

Tee vain, jos komponenttien ylläpidettävyys sitä tarvitsee. Älä muuta samassa työssä kamera-, geometria-, materiaali-, point-, morph-, damping- tai animaatioparametreja.

## 7. Valinnainen ajastettu julkaiseminen

Nykyinen sivusto ei tarvitse automaattista ajastettua julkaisua. Jos tarve myöhemmin syntyy, voidaan toteuttaa `publishAt`-tyyppinen työnkulku erillisenä ominaisuutena.

## 8. Current News -jatko

- Standalone `/current/news/` käyttää Soundin, Pitchforkin, The Quietusin, The Comics Journalin, Pelaajan, Muropaketin Pelit- ja Elokuvat-syötteiden, Infernon, Angry Metal Guyn, Kulttuuritoimituksen ja Episodin RSS-syötteitä. Worker normalisoi ja deduplikoi ehdokkaat sekä tuottaa lyhyen RSS-ingressin, mutta henkilökohtainen peukkuprofiili säilyy selaimen localStoragessa.
- Episodin kohinapitoista tv- ja suoratoistosisältöä alennetaan lähdekohtaisella ranking-penaltyllä. Elokuvien oppimissignaaleihin kuuluu muun muassa restaurointi, elokuvahistoria, festivaalit, kauhu, scifi, animaatio, suoratoisto ja ohjaajat.
- Tarkista seuraavaksi arkkitehtuuri- ja design-lähteitä, kuten Archinfo ja Arkkitehti, mutta lisää ne vasta kun vakaa tekninen syöte tai muu sopiva rajapinta ja käyttöehdot on varmennettu.
- Arvioi käytännön käytön perusteella rankingin, diversity-penaltyjen ja positiivisen/negatiivisen palautteen painot. Pelien, metallimusiikin ja elokuvien tarkemmat tagit on jo lisätty oppimissignaaleiksi.
- Laajenna tapahtumien deduplikointia, jos otsikkopohjainen lähiläisyys ei riitä usean median käsitellessä samaa asiaa.
- Nosta News `/current/`-juureen vasta, kun standalone-näkymän lähteet ja oppimiskäytös ovat riittävän vakaat.

## 9. Riippuvuus- ja runtime-ylläpito

Tee nämä erillisinä maintenance-passeina niin, etteivät ne hidasta aktiivisen rakennusvaiheen normaalia ChatGPT -> PR -> nopea CI -> automerge -työnkulkua.

- Päivitä Astro hallitusti nykyisestä 5-sarjasta uudempiin majoreihin vaiheittain. Älä niputa kahta major-siirtymää samaan sokkopäivitykseen.
- Päivitä Three.js ja `@types/three` samassa muutoksessa ja validoi erityisesti Animation Labin sekä etusivun ja Aboutin 3D-regressiot.
- Pidä TypeScript nykyisessä tuetussa sarjassa, kunnes `@astrojs/check` tukee seuraavaa majoria. Nykyinen check-versio sallii TypeScript 5- ja 6-sarjat, ei 7-sarjaa.
- Lisää Wrangler projektin paikalliseksi lukituksi dev-riippuvuudeksi ennen seuraavaa deploy-työkalujen maintenance-päivitystä. Nykyinen `npx wrangler` ilman projektiversiota ei ole täysin toistettava.
- Tarkista `npm audit` -löydökset Astro-päivitysten yhteydessä. Nykyinen asennus raportoi kolme transitiivista haavoittuvuutta ja yhden vanhentuneen `tsconfck`-riippuvuuden.
- Arvioi Node 24 LTS erillisessä runtime-päivityksessä. Älä vaihda Node-majoria samalla kertaa Astro-majorin kanssa.
- Älä lisää automaattista riippuvuuspäivitys-PR-virtaa rakennusvaiheessa pelkän hygienian vuoksi, jos se kasvattaa PR-kohinaa. Arvioi Dependabot tai vastaava uudelleen vakaammassa vaiheessa.
