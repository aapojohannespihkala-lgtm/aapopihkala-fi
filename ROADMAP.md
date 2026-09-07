# Jatkokehitys

Tämä tiedosto toimii projektin ajantasaisena työlistana. Se tarkistetaan ja päivitetään samassa muutoksessa aina, kun jokin alla oleva työ valmistuu, muuttuu olennaisesti tai uusi merkittävä jatkokehitystarve tunnistetaan.

Valmistunut kohta poistetaan tai merkitään selvästi tehdyksi, jotta tiedosto ei säilytä vanhentunutta backlogia.

## 1. Sisältötyö

- Kirjoita uusia artikkeleita ja päivitä nykyisiä tarpeen mukaan.
- Pidä FI- ja EN-versiot sisällöllisesti synkassa.
- About-tekstien placeholderit on jo korvattu.
- Perus-SEO ja sosiaalisen median metat ovat jo kunnossa, joten jäljellä on lähinnä sisältökohtainen hienosäätö.

## 2. Epäselvien source/reference-assetien lopullinen päätös

- Tarkista esimerkiksi `public/3d-source/*` sekä muut portrait/source-kuvat.
- Ne eivät vaikuta nykyisen runtimen kannalta tarpeellisilta, mutta voivat olla tarkoituksellista lähde- tai arkistomateriaalia.
- Päätä erikseen, dokumentoidaanko ne tarkoituksellisiksi vai poistetaanko ne varmennetulla cleanup-PR:llä.
- Tämä ei ole nykyinen bugi eikä kiireellinen työ.

## 3. Laajempi saavutettavuusaudit

Nykyisiä parannuksia ovat muun muassa skip navigation, vähimmäiskokoiset interaktiiviset kohteet, reduced motion -tuki ja regressiotestit.

Semantiikka- ja kohdekoko-passissa Current Newsin palautekontrollit ryhmiteltiin saavutettavasti ja Newsin reset- sekä Marketsin retry-kontrolleille lisättiin eksplisiittiset 24 px vähimmäiskohteet regressiotesteineen.

Jäljellä olevat kohdat vaativat osin erillisen design-/interaktiopäätöksen:

- kontrastipaletti: erityisesti pienessä tekstissä paljon käytetyt `--stone` ja `--stone-light` eivät nykyisellä vaalealla taustalla kaikissa käyttökohteissa yllä AA-tason normaalitekstin kontrastiin; korjaus muuttaisi sivuston näkyvää muted-väripalettia
- Aboutin pyöriteltävä 3D-muotokuva: päätä tarjotaanko sille varsinainen näppäimistöohjaus vai määritelläänkö rotaatio eksplisiittisesti ei-välttämättömäksi visuaaliseksi tutkimiseksi ja siistitään sen saavutettavuussemantiikka sen mukaisesti
- jatka manuaalista screen reader-, fokusjärjestys-, näppäimistö- ja mobiilitarkistusta näiden design-rajausten jälkeen

## 4. Lighthouse ja suorituskykyaudit

Mittaa vähintään Home-, About-, artikkeli- ja Current-sivut oikeilla suorituskykymittauksilla. Tarkista erityisesti:

- LCP
- CLS
- INP
- JavaScript- ja bundle-koko
- 3D-resurssien lataukset

Portrait-GLB:n latausta on jo lykätty näkyvyyteen asti. Bundle- ja Three.js-puolella voi silti olla lisäoptimointipotentiaalia.

## 5. Valinnainen 3D-arkkitehtuurin jatkohajotus

Tee vain, jos komponenttien ylläpidettävyys sitä tarvitsee. Älä muuta samassa työssä kamera-, geometria-, materiaali-, point-, morph-, damping- tai animaatioparametreja.

## 6. Valinnainen ajastettu julkaiseminen

Nykyinen sivusto ei tarvitse automaattista ajastettua julkaisua. Jos tarve myöhemmin syntyy, voidaan toteuttaa `publishAt`-tyyppinen työnkulku erillisenä ominaisuutena.

## 7. Current News -jatko

- Standalone `/current/news/` käyttää Soundin, Pitchforkin, The Quietusin, The Comics Journalin, Pelaajan, Muropaketin Pelit- ja Elokuvat-syötteiden, Infernon, Angry Metal Guyn, Kulttuuritoimituksen ja Episodin RSS-syötteitä. Worker normalisoi ja deduplikoi ehdokkaat sekä tuottaa lyhyen RSS-ingressin, mutta henkilökohtainen peukkuprofiili säilyy selaimen localStoragessa.
- Episodin kohinapitoista tv- ja suoratoistosisältöä alennetaan lähdekohtaisella ranking-penaltyllä. Elokuvien oppimissignaaleihin kuuluu muun muassa restaurointi, elokuvahistoria, festivaalit, kauhu, scifi, animaatio, suoratoisto ja ohjaajat.
- Tarkista seuraavaksi arkkitehtuuri- ja design-lähteitä, kuten Archinfo ja Arkkitehti, mutta lisää ne vasta kun vakaa tekninen syöte tai muu sopiva rajapinta ja käyttöehdot on varmennettu.
- Arvioi käytännön käytön perusteella rankingin, diversity-penaltyjen ja positiivisen/negatiivisen palautteen painot. Pelien, metallimusiikin ja elokuvien tarkemmat tagit on jo lisätty oppimissignaaleiksi.
- Laajenna tapahtumien deduplikointia, jos otsikkopohjainen lähiläisyys ei riitä usean median käsitellessä samaa asiaa.
- Nosta News `/current/`-juureen vasta, kun standalone-näkymän lähteet ja oppimiskäytös ovat riittävän vakaat.

## 8. Riippuvuus- ja runtime-ylläpito

Tee nämä erillisinä maintenance-passeina niin, etteivät ne hidasta aktiivisen rakennusvaiheen normaalia ChatGPT -> PR -> nopea CI -> automerge -työnkulkua.

- Pidä TypeScript nykyisessä tuetussa sarjassa, kunnes `@astrojs/check` tukee seuraavaa majoria. Nykyinen check-versio sallii TypeScript 5- ja 6-sarjat, ei 7-sarjaa.
- Tarkista `npm audit` -löydökset dependency- ja framework-päivitysten yhteydessä; käsittele jäljelle jäävät transitiiviset haavoittuvuudet erillisinä rajattuina maintenance-passeina.
- Älä lisää automaattista riippuvuuspäivitys-PR-virtaa rakennusvaiheessa pelkän hygienian vuoksi, jos se kasvattaa PR-kohinaa. Arvioi Dependabot tai vastaava uudelleen vakaammassa vaiheessa.

## 9. SEO- ja reittihygienia

- Pidä sitemap ja sivukohtaiset `robots`-metat keskenään johdonmukaisina.
- Sulje sitemapista tarkoituksella `noindex`-reitit, kuten `/current/**` ja `/lab/`, ellei niiden indeksointipäätös myöhemmin muutu.
- Lisää regressiotesti, joka varmistaa sitemap/noindex-konsistenssin keskeisille julkisille ja ei-indeksoitaville reiteille.
- Tee samalla kevyt sisäisten linkkien ja reittien tarkistus, jotta vanhentuneita tai rikkinäisiä polkuja ei jää sivustolle.

## 10. Currentin ulkoisten datalähteiden toimintavarmuus

Currentin Electricity-, Markets- ja News-näkymät riippuvat useista ulkoisista lähteistä. Nykyinen rakenne sietää jo osittaisia lähdevikoja, mutta toimintavarmuutta kannattaa vahvistaa ilman että normaali kehitystyönkulku raskautuu.

- Lisää Worker-puolen ulkoisiin verkkopyyntöihin eksplisiittiset timeoutit ja hallittu virheenkäsittely.
- Arvioi, missä Current-datassa stale-while-revalidate- tai viimeksi onnistuneen datan fallback parantaa käytettävyyttä ilman harhaanjohtavaa vanhaa tietoa.
- Suojaa HTML:ää parsivat lähteet, erityisesti Marketsin Bank of Finland -parseri, source-contract- tai fixture-regressiotesteillä, jotta upstream-rakenteen muutos havaitaan nopeasti.
- Hyödynnä nykyistä Cloudflare-observabilityä lähdekohtaisten virheiden tunnistamiseen ennen uuden seurantainfran lisäämistä.

## 11. GitHub- ja ChatGPT-työnkulun optimointi

Nykyinen ChatGPT -> branch -> PR -> nopea pre-merge-CI -> automerge -malli toimii jo hyvin. Seuraavat parannukset tähtäävät erityisesti siihen, että uuden ChatGPT-session tarvitsee tehdä vähemmän repository-hakuja ja että yksi käyttäjän pyyntö valmistuu mahdollisimman usein yhdellä PR:llä.

- Siivoa vanhat jo tarpeettomat työ-, backup-, noop- ja mergettyihin muutoksiin liittyvät branchit varmennetulla kertasiivouksella.
- Ota branchien automaattinen poisto mergen jälkeen käyttöön, jos kertasiivous vahvistaa ettei vanhoja brancheja tarvita erillisenä arkistona. Git-historia ja mergetyt pull requestit säilyvät varsinaisena muutoshistoriana.
- Arvioi pieni repositoryn juureen sijoitettava `CHATGPT.md`-tyyppinen tehtäväkartta, joka ohjaa tavallisissa tehtäväluokissa suoraan relevantteihin tiedostoihin, dokumentteihin ja testeihin. Sen tulee olla lyhyt navigointikerros eikä README:n, `AGENTS.md`:n tai arkkitehtuuridokumentaation kopio.
- Määritä tehtäväkarttaan ainakin tavalliset Current UI-, artikkeli-, 3D-, sisältö- ja Worker-tehtävät sekä niiden tärkeimmät lähdetiedostot ja erityissäännöt, jotta uuden session ei tarvitse kartoittaa koko repositorya ennen ensimmäistä muutosta.
- Arvioi Current- ja muiden visuaalisesti herkkien UI-muutosten yhteyteen pieni valikoiva pre-merge Playwright-smoke sen sijaan, että koko selainregressiosarja palautetaan blokkaavaksi. Smoke voisi tarkistaa esimerkiksi root-tason vaakavierityksen, keskeiset computed-tyylit, section-geometrian, relevantit custom element `:defined` -tilat ja tärkeimmät desktop- sekä 390 px mobiilinäkymät.
- Pidä koko Playwright-regressiosarja edelleen post-merge-validointina, jotta nopea rakennusvaiheen merge-polku säilyy.
- Täsmennä `AGENTS.md`:n one-pass-ohjetta visuaalisille muutoksille: ennen ensimmäistä kirjoitusta tarkista relevantin komponentin scoped CSS, route-level override CSS, responsive breakpointit, kolmannen osapuolen defined-state sekä olemassa olevat regressiotestit silloin kun ne voivat vaikuttaa lopputulokseen.
- Batchaa samaan visuaaliseen kokonaisuuteen kuuluvat pienet hienosäädöt yhteen PR:ään silloin kun niiden tavoite ja rajaus ovat jo selvät. Vältä erillisiä peräkkäisiä PR:iä muutoksille, jotka voidaan turvallisesti validoida yhtenä kokonaisuutena.
- Seuraa optimoinnin onnistumista ensisijaisesti käyttäjän pyynnöstä oikeaan lopputulokseen kuluvana kokonaisaikana, ei vain yksittäisen CI-ajon kestona. Tavoitteena on vähentää erityisesti korjaus-PR-ketjuja ja tarpeettomia GitHub-hakuja.
