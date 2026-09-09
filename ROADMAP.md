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

- Tuotantobuild varoittaa tällä hetkellä vähintään yhdestä yli 500 kB minifioidusta chunkista. Selvitä bundle-analyysillä, mistä chunk muodostuu, ja arvioi lazy loading, `dynamic import()` tai muu tarkoituksenmukainen code splitting ennen varoitusrajan muuttamista.
- Tee optimoinnit mitatun vaikutuksen perusteella. Älä hajota bundlea vain varoituksen poistamiseksi, jos se heikentää latauspolkua tai kasvattaa kokonaiskustannusta.

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
- `html2canvas` on edelleen käytössä AREA-rasterikaappauksessa `src/features/interactions/areaRaster.ts`:n dynaamisen importin kautta. Älä käsittele sitä kuolleena riippuvuutena, ellei kyseinen toiminto myöhemmin poistu tai korvaudu.
- Käsittele `npm ci`:n install-script-policy tietoisesti. Nykyinen CI varoittaa `esbuild`- ja `workerd`-install-skripteistä, joita ei ole eksplisiittisesti hyväksytty allowScripts-politiikassa. Älä hyväksy skriptejä automaattisesti ilman pakettien ja tarpeen varmennusta.
- Tee pienet Astro-, Wrangler-, Playwright-, TypeScript- ja Three.js-päivitykset rajattuina maintenance-passeina. Priorisoi regressioriski ja hyöty versionumeron tuoreuden sijaan.
- Älä lisää automaattista riippuvuuspäivitys-PR-virtaa rakennusvaiheessa pelkän hygienian vuoksi, jos se kasvattaa PR-kohinaa. Arvioi Dependabot tai vastaava uudelleen vakaammassa vaiheessa.

## 9. SEO- ja reittihygienia

- Pidä sitemap ja sivukohtaiset `robots`-metat keskenään johdonmukaisina.
- Tee samalla kevyt sisäisten linkkien ja reittien tarkistus, jotta vanhentuneita tai rikkinäisiä polkuja ei jää sivustolle.

## 10. Currentin ulkoisten datalähteiden toimintavarmuus

Currentin Electricity-, Markets-, News- ja Liiga-näkymät riippuvat useista ulkoisista lähteistä. Marketsin viimeisimmät korjaukset ovat jo lisänneet rajattuja timeout-, retry- ja recovery-polkuja, ja Currentin production-smoke kattaa portfolion, market macro -syötteen sekä Liigan keskeiset rakennesopimukset. Sama toimintavarmuustaso ei silti vielä kata kaikkia lähteitä ja upstream-rakenteita fixture- tai source-contract-tasolla.

- Pidä retryt rajattuina ja lähdekohtaisina. Älä kasvata yhden API-pyynnön kokonaislatenssia hallitsemattomalla fallback-ketjulla.
- Arvioi, missä Current-datassa stale-while-revalidate- tai viimeksi onnistuneen datan fallback parantaa käytettävyyttä ilman harhaanjohtavaa vanhaa tietoa. Jos viimeksi onnistunutta dataa käytetään, sen ikä pitää pystyä esittämään tai tulkitsemaan yksiselitteisesti.
- Suojaa HTML- ja tekstimuotoa parsivat lähteet, erityisesti Bank of Finland- ja OP-adapterit, source-contract- tai fixture-regressiotesteillä, jotta upstream-rakenteen muutos havaitaan nopeasti. Nykyinen portfolio-resilience-testi käyttää itse muodostettuja parserifixtureja, joten lisää tarkoituksenmukaisiin adaptereihin upstream-rakenteesta johdettuja pysyviä fixtureja tai vastaavia source-contract-tarkistuksia.
- Lisää tarvittaessa vastaavat fixture- tai contract-testit RSS-lähteille ja Liigan upstream-rakenteelle, jos lähdekohtaiset rakenteet alkavat aiheuttaa toistuvia regressioita. Liigan production-smoke suojaa jo lähteen, upstream-valinnan, joukkue- ja rankkirakenteen sekä Ilves-yhteenvedon johdonmukaisuutta, mutta se ei korvaa pysyvää upstream-fixturea.
- Hyödynnä nykyistä Cloudflare-observabilityä lähdekohtaisten virheiden tunnistamiseen ennen uuden seurantainfran lisäämistä. Tavoite on nähdä ainakin epäonnistunut lähde, vaihe, timeout tai HTTP-virhe ilman että sisäistä diagnostiikkaa näytetään loppukäyttäjälle.

## 11. GitHub- ja ChatGPT-työnkulun optimointi

Nykyinen ChatGPT -> branch -> PR -> nopea pre-merge-CI -> automerge -malli toimii jo hyvin. Optimoinnissa seurataan ensisijaisesti käyttäjän pyynnöstä oikeaan lopputulokseen kuluvaa kokonaisaikaa sekä korjaus-PR-ketjujen ja tarpeettomien repository-hakujen määrää.

Tehty:

- Repositoryn juureen on lisätty kompakti `CHATGPT.md`-tehtäväkartta Current UI-, Current data/Worker-, artikkeli-, 3D-, shared UI/SEO-, CI/dependency- ja dokumentaatiotehtäville.
- `AGENTS.md` ohjaa uuden session ensin tehtäväkarttaan ja tekee `README.md`:n lukemisesta tehtäväkohtaista sen sijaan, että se olisi pakollinen kaikissa rajatuissa muutoksissa.
- Visuaalisten muutosten one-pass-tarkistus on kirjattu pysyviin ohjeisiin: tarkista scoped CSS, route/global-overridet, breakpointit, custom-element/third-party-state ja relevantit regressiot ennen ensimmäistä kirjoitusta.
- Samaan visuaaliseen tavoitteeseen kuuluvien pienten muutosten batching yhteen PR:ään on kirjattu pysyväksi työskentelyperiaatteeksi.
- PR #131 lisäsi Currentin section-boundary Playwright-guardin. Guard on rajattu vain Current-layoutiin mahdollisesti vaikuttaviin muutoksiin, jotta Chromium-asennus ei hidasta jokaista suoritettavaa pull requestia.
- `CHATGPT.md` kuuluu dokumentaatio-only fast pathiin.
- Rakennusvaiheen tavallinen päivitys päättyy automergeen. Jälkivalidointi ja tuotantojulkaisu raportoidaan erillisinä tiloina. Jälkitarkistuksen korjaus ja erikseen pyydetty tuotantovarmennus ovat poikkeuksia.
- Pre-merge-selaintestit valitaan muutoksen kohteen mukaan `.github/scripts/select-browser-tests.sh`-skriptillä. Yhteisille riippuvuuksille ja tuntemattomille Current-tiedostoille säilyy laajempi tarkistus.
- Tiedostohauissa käytetään jo luettua ajantasaista aineistoa, päivitetään vain relevantit muuttuneet tiedostot ja tarkistetaan vastaava avoin PR ennen rinnakkaisen toteutuksen aloittamista.
- Onnistuneen owner-PR:n automerge dispatchaa ensin täyden `main`-validoinnin ja yrittää sen jälkeen poistaa mergetyn head-branchin. Poistovirhe ei muuta onnistunutta mergeä epäonnistuneeksi.
- Branchien suuri kertasiivous valmistui kolmella varmennetulla passilla: mergetyt same-repository-branchit, `main`in historiassa jo olevat tip-commitit ja erikseen varmennetut jäännösbranchit poistettiin ilman poistovirheitä.
- Vanhasta draft-PR #120:stä löydettiin kolme edelleen relevanttia Current-regressiotestien korjausta. Ne siirrettiin puhtaasti nykyisen `main`in päälle PR #137:ssä, minkä jälkeen vanha draft suljettiin ilman mergeä.
- Kaikki väliaikaiset kertasiivoushookit on poistettu workflowsta. Pysyväksi jää normaali automerge, täysi post-merge-validointi ja mergetyn head-branchin automaattinen best-effort-poisto.

Jäljellä:

- Laajenna pieniä kohdennettuja pre-merge UI-guardeja vain silloin, kun toistuva regressioluokka osoittaa niille todellisen tarpeen. Älä palauta koko Playwright-sarjaa blokkaavaksi rakennusvaiheessa.
- Kun UI:n toteutustapa muuttuu mutta käyttäytymissopimus säilyy, suosi regressiotesteissä käyttäytymistä, saavutettavuutta ja näkyvää lopputulosta toteutuskohtaisen DOM-rakenteen sijaan. Tämä vähentää turhia korjaus-PR-ketjuja.
- Arvioi käytännön käytön jälkeen, vähentääkö tehtäväkartta uuden session repository-hakuja ja vähenevätkö peräkkäiset korjaus-PR:t.
- Tee ajoittain kevyt stale-branch-tarkistus. Suuri historiallinen branchivelka on siivottu, mutta aktiivisen kehityksen aikana uusia työ-, kokeilu- ja noop-brancheja voi taas kertyä eikä ROADMAPin pidä olettaa, että repossa olisi pysyvästi vain `main`.

## 12. Current- ja Worker-arkkitehtuurin konsolidointi

Current Markets -kehityksen aikana `functions/api/current/`-hakemistoon on kertynyt useita rinnakkaisia market- ja portfolio-handlerisukupolvia. Nykyinen toimiva tuotantopolku pitää säilyttää, mutta historiallisten toteutusten määrä kasvattaa ylläpidon epäselvyyttä.

- Inventoi kaikki `markets*`- ja `portfolio*`-handlerit ja todista viittausten sekä testien avulla, mitkä ovat aktiivisen Worker-polun ulkopuolella. Poista vain varmasti käyttämättömät legacy-versiot rajatulla cleanup-PR:llä. Nykyinen Worker tuo suoraan tuotantopolkuun `markets-stable.ts`:n ja `portfolio-complete.ts`:n, mutta rinnakkaisia historiallisia handlerisukupolvia on edelleen useita.
- Keskitetään 19 portfolio-kohteen pysyvä metadata, järjestys ja periodisopimus yhteen kanoniseen määrittelyyn, jota backend, frontend ja testit voivat käyttää tarkoituksenmukaisesti ilman käsin synkronoitavia rinnakkaislistoja.
- Erota ulkoiset lähteet selkeiksi adaptereiksi tai muuten rajatuiksi vastuiksi, erityisesti Yahoo-, Nordnet-, OP- ja Bank of Finland -poluissa. Timeout-, retry-, parseri- ja fallback-logiikan pitää olla lähdekohtaisesti testattavaa.
- Pidä yhteinen data-contract selkeänä: aidosti puuttuva periodi saa olla `N/A`, mutta puuttuva rivi tai rikkoutunut lähdesopimus pitää erottaa siitä.
- Arvioi `/current2/`-reitin pysyvä rooli. Jos sitä tarvitaan diagnostisena layout- ja viewport-laboratoriona, dokumentoi tämä yksiselitteisesti. Jos sen tehtävä on pääosin siirtynyt varsinaiseen Currentiin, suunnittele myöhempi poistaminen tai supistaminen.
- Päivitä Current2-nimiset tuotantovalvonnat ja dokumentaatiot neutraalimpaan Current/portfolio-nimistöön silloin, kun ne eivät enää kuvaa vain `/current2/`-reittiä.
