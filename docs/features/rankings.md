# Classifiche globali e mensili

Documento canonico del prefisso `RANK`; [indice SpecLedger](../README.md). La pagina `/classifiche` è `AnalyticsPage`; `RankingPage` è incorporata nella card globale, non una seconda rotta pubblica autonoma.

## Stato della ricostruzione

Tutti i record hanno **Type: Requirement**, **Status: Accepted**, **Implementation: Implemented**, salvo RANK-002, RANK-003 e RANK-004. Baseline e decisioni del proprietario del 2026-11-13 in [open-questions.md](../open-questions.md). Evidenza dal sorgente e dalle asserzioni ispezionate; esecuzioni in [verification.md](../verification.md), non verifica SQL o visuale.

Inherits: [GEN-001](../general.md) per il calendario Europe/Rome, [GEN-002](../general.md) per errori/caricamento osservati, [GEN-003](../general.md) e [accesso](access.md) per navigazione e consultazione. Architecture: [ARCH-002](../architecture.md). Premi persistenti, parti dell'avatar e riconoscimenti sono definiti in [AWARD](awards-avatars.md), non dalla posizione visiva di una card.

## RANK-001 — Statistiche globali comprensive dello storico

La graduatoria deriva dalla vista `player_statistics`, con una riga per ogni giocatore, anche inattivo o senza partite, e non dal solo elenco dei giocatori selezionabili. Per ogni giocatore sono disponibili ELO corrente, partite, vittorie, sconfitte, goal fatti/subiti, differenza reti, percentuale di vittorie, serie corrente e tipo avatar. Non è osservato un filtro temporale per le statistiche globali.

Le partite contano quando il giocatore compare in `match_players`; vittoria e sconfitta si determinano confrontando il punteggio della propria squadra con quello avversario, non richiedendo che il vincitore abbia esattamente 6 goal. Questo include i risultati importati con regole legacy. Senza partite i conteggi, GF−GS e winrate sono zero; il winrate è `100 × vittorie / partite`, arrotondato a un decimale. L'ELO esposto è quello persistito sul giocatore, non una somma calcolata dal componente.

Code: [202610280001_avatar_types.sql](../../supabase/migrations/202610280001_avatar_types.sql), definizione corrente di `player_statistics`; [AppStore](../../apps/web/src/app/core/app-store.service.ts), `loadStatistics`, conversioni numeriche e filtro delle righe prive di ID/nome; [ranking-page.html](../../apps/web/src/app/features/ranking/ranking-page.html), colonne ELO/partite/winrate/GF−GS e riepilogo vittorie/sconfitte. Le partite legacy sono ammesse dalla [migrazione import](../../supabase/migrations/202607230002_import_legacy_history.sql), vincoli `legacy_rules`; formula e replay ELO sono definiti in [ELO-001 ed ELO-003](ratings.md).

Tests: [ranking-page.spec.ts](../../apps/web/src/app/features/ranking/ranking-page.spec.ts) fornisce statistiche simulate; non verifica la vista SQL. Gap: nessuna asserzione SQL individuata per aggregazione, assenza di partite, giocatori inattivi o punteggi legacy. La presenza di fixture numeriche non prova il calcolo del server.

Verification: interrogare in ambiente isolato una rosa con giocatore senza partite, risultati correnti e risultati legacy, e confrontare ogni aggregato con il relativo storico.

## RANK-002 — Soglia di dieci partite e posizione globale
Implementation: Partially implemented


La graduatoria è ordinata per ELO numerico decrescente, senza arrotondare il valore prima del confronto. Sotto 10 partite il giocatore rimane nell'ordine ELO ma non riceve una posizione ufficiale: `—`, stato accessibile `Non classificabile`, scala di grigi e partite mancanti. Da 10 partite è qualificato. I non qualificati non consumano posizioni.

**Pari merito accettato:** fra i soli qualificati, uguale ELO significa stessa posizione e stessi vantaggi; la posizione successiva salta tanti posti quanti sono gli ex aequo. Esempi: `1, 1, 3` e `1, 2, 2, 4`, non `1, 1, 2`. Un non qualificato intercalato non modifica il conteggio. L'ID crescente può stabilizzare la presentazione degli ex aequo, ma non separarne posizione o vantaggi.

**Scostamento attuale:** `rankingRows` assegna numeri progressivi anche a pari ELO; `loadStatistics` ordina solo per ELO. Il test A qualificato, B con 9 partite, C qualificato verifica `1, —, 2`, ma non contiene ex aequo.

Code: [RankingPage](../../apps/web/src/app/features/ranking/ranking-page.ts), `MINIMUM_GAMES_FOR_RANKING`, `rankingRows`; `AppStore.loadStatistics`; template `classification-progress`; [stile](../../apps/web/src/app/features/ranking/ranking-page.scss), `.ranking-row.unranked`.

Tests: `keeps ELO order but numbers only classified players` controlla ordine A/B/C, `—`, classe `unranked`, messaggio per una partita mancante e numero 2 per C. Non asserisce il confine esatto 10, parità ELO o stabilità dell'ordinamento server.

Verification: soglie 0/9/10, pari merito in prima/seconda/terza posizione, non qualificati intercalati e confronto coerente con medaglie e anteprima. Il verde del test senza parità non dimostra conformità al nuovo chiarimento.

## RANK-003 — Prime tre medaglie globali
Implementation: Partially implemented


La medaglia è determinata dalla posizione ufficiale [RANK-002](#rank-002--soglia-di-dieci-partite-e-posizione-globale): oro per posizione 1, argento per 2, bronzo per 3, a tutti gli ex aequo di quella posizione. Non deve esistere per forza una medaglia di ogni colore: con `1, 1, 3` si assegnano due ori e un bronzo, nessun argento. Gli inattivi restano eleggibili se hanno almeno dieci partite.

La medaglia alimenta pelle/bordo dell'avatar e colore del nome secondo [AWARD-006](awards-avatars.md). È uno stato corrente, non una coppa permanente. Tutti i consumatori e i riconoscimenti devono usare la stessa attribuzione; il limite di tre persone dell'anteprima non limita i beneficiari.

**Scostamento attuale:** `AppStore.globalMedals` spezza i pareggi per ID e assegna un solo oro, argento e bronzo ai primi tre. Non realizza i vantaggi condivisi richiesti dal proprietario.

Code: `AppStore.globalMedals`, `MINIMUM_GAMES_FOR_GLOBAL_RANKING`, `globalMedalFor`; [RankingPage/template](../../apps/web/src/app/features/ranking/ranking-page.html). Descrizioni in `GLOBAL_MEDAL_DETAILS` ([recognitions.ts](../../apps/web/src/app/core/recognitions/recognitions.ts)).

Tests: `keeps ELO order but numbers only classified players` controlla classi e testa oro/argento con **`globalMedalFor` simulato**, quindi non copre il calcolo reale `AppStore.globalMedals`. `links every ranking row to the player detail` controlla il link e assenza di `.monthly-cup`. Gap: soglia, spareggio per ID, meno di tre qualificati e inattivi nel computed reale.

Verification: verificare il computed e un consumatore reale su parità e soglie, non soltanto un mock che restituisce già il colore atteso.

## RANK-004 — Due card espandibili e anteprime
Implementation: Partially implemented


`/classifiche` presenta due card, globale e mensile, inizialmente chiuse e apribili/chiudibili indipendentemente nella stessa pagina, senza navigazione. Quando una card è aperta la sua anteprima scompare e compare la graduatoria completa; la card opposta mantiene il proprio stato. Trigger, regioni e pannelli usano `aria-expanded`, `aria-controls`, `aria-hidden` e `inert` per i contenuti chiusi.

L'anteprima globale mostra **soltanto i primi tre giocatori qualificati**, non le prime tre posizioni complete: il proprietario ha scelto di troncare a tre persone anche se un gruppo di ex aequo prosegue. Le posizioni e i vantaggi mostrati restano quelli ufficiali RANK-002/RANK-003 (ad esempio 1, 1, 3), non il numero della card. Per stabilizzare il taglio di un pareggio si usa ID crescente, senza cambiare il pari merito. Le righe complete aprono il profilo; le anteprime appartengono al pulsante di espansione, non sono link individuali.

**Scostamento attuale:** `globalLeaders` prende i primi tre elementi di `statistics` anche sotto dieci partite, con numeri 1/2/3. Il contratto di anteprima qualificata e coerente è parzialmente implementato.

La card mensile mostra il premio sopra l'anteprima. Le anteprime mensili sono i primi tre risultati del mese ordinati per `rank`, non i primi tre ELO globali. La graduatoria completa mensile contiene link al profilo. Vengono mostrate indicazioni distinte se non esistono statistiche globali o risultati mensili; durante il caricamento compare il blocco di caricamento e gli errori dello store sono visibili.

Code: [AnalyticsPage](../../apps/web/src/app/features/analytics/analytics-page.ts), `globalLeaders`, `globalRankingOpen`, `monthlyRankingOpen`, `monthlyStandings`, `monthlyLeaders`; [template](../../apps/web/src/app/features/analytics/analytics-page.html), card, `app-ranking-page [embedded]`, pannelli.

Tests: [analytics-page.spec.ts](../../apps/web/src/app/features/analytics/analytics-page.spec.ts):

- `shows both ranking cards collapsed initially`: due card chiuse e `aria-hidden`.
- `opens and closes the complete global ranking without navigating`: toggle, link al profilo, anteprima rimossa/ripristinata e URL immutato.
- `opens and closes the monthly ranking without navigating`: due righe mensili e toggle senza navigazione.
- `previews the first three monthly standings rather than the global ELO order`: ordine mensile separato dal globale e anteprima arrotondata all'intero.

Gap: anteprima globale con meno di dieci partite, tastiera/focus dei pannelli, stati vuoti/errori e comportamento su aggiornamenti realtime mentre una card è aperta.

Verification: espansione con dati qualificati/non qualificati, tre persone a pari ELO e un quarto escluso dall'anteprima ma con gli stessi vantaggi, senza navigazione.

## RANK-005 — Classifica mensile sul saldo ELO del mese di Roma

Inherits: [GEN-001](../general.md).

Il server raggruppa per giocatore e mese di `matches.played_at` in Europe/Rome, somma tutti gli `elo_delta` e arrotonda a due decimali. Solo chi ha partecipato almeno una volta nel mese ha una riga. Non sono osservate soglie di dieci partite, esclusioni degli inattivi o esclusioni dei saldi nulli/negativi dalla graduatoria mensile.

La vista corrente assegna posizioni uniche con `row_number()`, ordinando per saldo ELO decrescente e poi per ID del giocatore crescente. Un pareggio nel saldo non produce ex aequo. Lo store richiede soltanto il mese corrente calcolato con `romeMonthKey(new Date())`; la pagina usa il mese della prima riga, o il mese di Roma corrente se non ci sono righe. Risultati per un giocatore non presente nelle statistiche vengono omessi dalla visualizzazione, senza ricalcolare il `rank` server.

Il saldo positivo mostra `+`; l'anteprima è arrotondata all'intero, la tabella espansa espone fino a due decimali e l'unità ELO. La disponibilità dell'illustrazione non condiziona il calcolo della classifica ([AWARD-004](awards-avatars.md)). I volti temporanei e la finalizzazione del premio sono regole diverse ([AWARD-001](awards-avatars.md), [AWARD-003](awards-avatars.md)).

Confine temporale: `loadMonthlyAwards` sceglie il mese al momento della richiesta; non è presente un timer dedicato al cambio mese nel costruttore dello store. Refresh iniziale, variazioni di giocatori/partite e aggiornamenti `monthly_champions` ricaricano i dati. Non viene rivendicato un aggiornamento automatico esatto a mezzanotte per una pagina lasciata immobile.

Code: [202609280002_unique_monthly_ranks.sql](../../supabase/migrations/202609280002_unique_monthly_ranks.sql), `monthly_elo_rankings`; `AppStore.loadMonthlyAwards`, `subscribeToChanges`; `AnalyticsPage.monthStart`, `toAwardStanding`, `monthlyStandings`.

Tests: `previews the first three monthly standings rather than the global ELO order` include una riga di un altro mese che non appare, saldi negativi e valori decimali. Gli artwork usano mesi simulati nei test; nessun caso controlla la query reale, gli aggregati SQL, uno spareggio server o il passaggio di mese.

Verification: integrazione SQL/client con timestamp al confine del mese, parità del saldo, inattivi e aggiornamento della pagina a cavallo del mese; non inferire esito dall'helper del calendario isolato.

## Decisioni accettate e scostamenti

Il proprietario richiede pari merito globale con salto delle posizioni e stessi vantaggi; anteprima soltanto dei qualificati, limitata a tre persone anche se tronca un gruppo. RANK-002, RANK-003 e RANK-004 espongono lo scarto dal codice, senza modificarlo.

Restano confermati inattivi inclusi, soglia dieci solo globale, classifica mensile per saldo senza soglia e **posizioni mensili uniche** con spareggio per ID. Il chiarimento dei pari merito riguarda la classifica globale, non introduce co-vincitori mensili. Nessuna garanzia di aggiornamento esatto a mezzanotte è dedotta dalla presenza di Realtime.

## Storia, senza autorità concorrente

- [CHANGELOG 1.0.0](../../CHANGELOG.md): classifica ELO e statistiche, compreso grafico ELO/vittorie per colore allora presenti. Non prova che quelle visualizzazioni siano ancora attive; non compaiono nei template attuali ispezionati.
- [202607230003_legacy_statistics.sql](../../supabase/migrations/202607230003_legacy_statistics.sql): passaggio da vittoria esattamente a 6 al confronto dei punteggi, conservato nella vista corrente.
- [CHANGELOG 1.3.0](../../CHANGELOG.md): soglia dieci partite e rimozione della statistica vittorie per colore.
- [CHANGELOG 1.3.1](../../CHANGELOG.md): unificazione delle sezioni e pagina globale allora dedicata; lo stato corrente 1.8.0 è l'espansione incorporata descritta in RANK-004.
- [Migrazione premi iniziale](../../supabase/migrations/202608050002_monthly_elo_champions.sql): `dense_rank` mensile, sostituito da `row_number` nella migrazione del 28 settembre. [CHANGELOG 1.4.0](../../CHANGELOG.md) registra posizioni uniche e rimozione della classifica settimanale; la storia dei riconoscimenti è in [AWARD](awards-avatars.md).

## Limiti di verifica

Ispezionati componenti ranking/analytics, template, test, calcoli/store pertinenti e tutte le versioni individuate delle viste statistiche e classifica mensile. Nessun database live, job cron o rendering nel browser è stato esercitato. I test di pagina simulano lo store; copertura SQL e assegnazione globale reale restano distinte e non accertate da quei test.
