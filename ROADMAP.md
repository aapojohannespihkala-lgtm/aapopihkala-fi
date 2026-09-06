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

- Standalone `/current/news/` käyttää ensimmäisessä live-versiossa Soundin, Pitchforkin, The Quietusin ja The Comics Journalin RSS-syötteitä. Worker normalisoi ja deduplikoi ehdokkaat, mutta henkilökohtainen peukkuprofiili säilyy selaimen localStoragessa.
- Tarkista ja lisää seuraavaksi vahvempia suomalaisia kulttuuri-, design- ja arkkitehtuurilähteitä, kuten Kulttuuritoimitus, Archinfo ja Arkkitehti, vasta kun niiden tekninen syöte ja käyttöehdot on erikseen varmennettu.
- Lisää vahvempi elokuvalähde samalla periaatteella. Älä ota käyttöön lähdettä vain siksi, että sisältö sopii, jos vakaa syöte tai käyttöehdot jäävät epäselviksi.
- Arvioi käytännön käytön perusteella rankingin, diversity-penaltyjen ja positiivisen/negatiivisen palautteen painot.
- Laajenna tapahtumien deduplikointia, jos otsikkopohjainen lähiläisyys ei riitä usean median käsitellessä samaa asiaa.
- Nosta News `/current/`-juureen vasta, kun standalone-näkymän lähteet ja oppimiskäytös ovat riittävän vakaat.
