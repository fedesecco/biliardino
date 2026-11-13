# Rating ELO e statistiche — ELO

## Ambito, stato ed evidenza

Contratto matematico e propagazione agli aggregati che alimentano gioco, classifica e profili. Tutti i record: **Type: Requirement; Status: Accepted; Implementation: Implemented**. Formule, versione persistita e precisione dell'anteprima sono confermate dal proprietario il 2026-11-13; [decisioni](../open-questions.md). Evidenza dal sorgente; esecuzioni in [verification.md](../verification.md). Nessuna affermazione sul contenuto del database remoto.

Fonti principali sotto `supabase/migrations/`: `202607210001_initial.sql`, `202607230002_import_legacy_history.sql`, `202607230003_legacy_statistics.sql`, `202607290001_fix_recalculate_elo_safe_updates.sql`, `202609280001_score_aware_elo.sql`, `202610100001_win_streak.sql`, `202610280001_avatar_types.sql`, `202611050004_decrement_played_priority.sql`. Implementazione client: `AppStore.loadStatistics`, `globalMedals`, `PlayPage.eloPreview`, `previewRange`, `roundElo`, `RankingPage.rankingRows`. Eredita [ARCH-002/ARCH-003](../architecture.md) e [GEN-002](../general.md); autorizzazioni e helper interni: [AUTH](access.md). Dipendenze: [PLAY-004](play.md), [PICK-003/PICK-005](team-selection.md), [HIST-003/HIST-004](history.md).

## ELO-001 — Formula delle nuove partite

Il rating iniziale di un giocatore è 1000. Ogni squadra ha rating pari alla media ELO dei suoi due partecipanti. Indicando tali medie con R e B, l'attesa rossa è `E = 1 / (1 + 10^((B-R)/400))`. L'esito rosso S è 1 per vittoria, 0 per sconfitta; non vi sono pareggi. Per le nuove registrazioni il moltiplicatore margine è `M = min(1,30; 1 + 0,15 × ln(1 + abs(golR-golB)))` e il delta rosso è `round(28 × (S-E) × M, 2)`; quello blu è esattamente l'opposto del delta rosso già arrotondato.

Entrambi i giocatori della stessa squadra ricevono lo **stesso delta individuale**, non metà del delta. `match_players` conserva ELO precedente e delta a due decimali; ogni `players.current_elo` viene aggiornato arrotondando a due decimali. La registrazione e gli aggiornamenti avvengono nella stessa transazione di PLAY-004; non vi è calcolo autoritativo nel browser. Il record usa `elo_model_version=2`, creator autenticato e orario `played_at` del server nel percorso condiviso.

Code: `record_match` in `202611050004_decrement_played_priority.sql`; tipi `numeric(8,2)` nello schema iniziale. Tests: nessun test SQL automatico individuato. Le sole asserzioni numeriche UI dell'anteprima ELO-004 non verificano formula PostgreSQL, arrotondamenti al mezzo centesimo, simmetria, persistenza o aggiornamento concorrente.

## ELO-002 — Versione persistita e cutover non basato sulla data

La colonna `elo_model_version` ammette 1 o 2, nasce con default 1 per righe preesistenti; la registrazione successiva scrive esplicitamente 2. Versione 1 usa K=32 e nessun bonus margine; versione 2 usa ELO-001. Durante il replay conta la versione **memorizzata**, non una condizione sulla data di gioco. Il default della colonna rimane 1: non autorizza nuovi inserimenti client diretti.

**Provenienza riconciliata:** il proprietario conferma che conta la versione salvata con la partita, non la data di gioco. Il riferimento «dal 29/09/26» in `CHANGELOG.md` 1.4.0 descrive il passaggio operativo, non una condizione retroattiva su `played_at`. Il nome della migrazione non dimostra la data effettiva del deploy. Non si cambiano i vecchi modelli o i delta locked per aderire a una diversa lettura del testo storico.

Verification: test di replay misto e di registrazione retrodatata in ambiente dedicato, attualmente assenti.

## ELO-003 — Ricalcolo deterministico e delta legacy bloccati

`recalculate_elo` riparte da 1000 e serie zero per tutti i giocatori, quindi percorre gli incontri in ordine crescente `played_at`, `created_at`, `id`. Aggiorna serie, ELO precedente e rating cumulato. Per incontri non bloccati ricalcola il delta secondo ELO-002 e lo stato ELO raggiunto in quel punto; non usa il rating odierno come base di tutte le partite.

Per `elo_locked=true` aggiorna gli ELO precedenti ma **conserva i delta importati**, sommandoli ai rating ricostruiti; il ramo locked precede la scelta della formula. Cancellare una partita può dunque cambiare tutti i delta successivi non locked e i relativi aggregati, ma non sostituisce i delta legacy con una formula moderna. Le righe aggiornate usano `WHERE` esplicito, inclusi i reset globali, come ARCH-003; la correzione safe-updates del 29 luglio non è una nuova formula.

Code corrente: `recalculate_elo` in `202610100001_win_streak.sql`; origine locked in `202607230002_import_legacy_history.sql`; correzione safe-updates in `202607290001_fix_recalculate_elo_safe_updates.sql`. Verification: non esistono prove automatiche individuate di sequenze miste v1/v2/locked, tie temporali, esclusione di un incontro o equivalenza fra aggiornamento incrementale e replay. Non è stata provata l'assenza di gare fra cancellazione/ricostruzione e registrazione; i lock ispezionati non sostituiscono test di transazioni concorrenti.

## ELO-004 — Anteprima e precisione mostrata

La pagina gioco calcola per entrambe le squadre intervalli positivi di guadagno/perdita possibili, usando rating attuali dei giocatori risolti nello store, K=28 e margini da 1 a 6. Gli estremi sono prima arrotondati a due decimali con `roundElo`, poi mostrati come interi con `DecimalPipe` (`1.0-0`), preceduti da + o −. Questa è un'anteprima, non il delta definitivo: non cambia né la formula server né i punti memorizzati. In storico i delta restano visibili con fino a due decimali (HIST-002); la modifica 1.8.0 non è stata applicata a tutte le superfici ELO.

Code: `play-page.ts` costanti ELO, `eloPreview`, `previewRange`, `roundElo`; `play-page.html` e `history-page.html`. Tests: `play-page.spec.ts`, «rounds ELO preview bounds to whole numbers for $red versus $blue» controlla esattamente `+15/18,-15/18,+15/18,-15/18` per formazioni bilanciate e `+11/13,-20/23,+20/23,-11/13` per quelle sbilanciate del fixture. Non controlla tutti i margini o accordo con SQL. Il proprietario conferma che l'arrotondamento all'intero della release 1.8.0 riguarda solo l'anteprima partita; lo storico conserva i decimali.

## ELO-005 — Propagazione del salvataggio e del replay agli aggregati

Depends on: [RANK-001](rankings.md) per definizione e formule degli aggregati statistici; [AWARD-002](awards-avatars.md) per definizione e fasce della serie corrente. Qui non vengono ridefinite tali regole.

Il salvataggio ricalcola la serie dei quattro partecipanti mediante `recalculate_win_streaks`; il replay globale ELO-003 ricostruisce tutte le serie, inclusi incontri locked. La vista `player_statistics` espone ELO corrente e serie memorizzati sul giocatore insieme agli aggregati RANK-001 e all'anagrafica corrente. Cancellazione e ricalcolo possono quindi modificare simultaneamente rating, statistiche e riconoscimenti dipendenti, senza riscrivere i delta locked. `loadStatistics` scarta righe con id/nome nulli, converte i valori numerici e assegna fallback per campi nulli; non filtra attivi o eleggibili. Il refresh dopo PLAY-004/HIST-003 rilegge questi dati, non li ricalcola nel browser.

Code: `202610280001_avatar_types.sql` (`player_statistics`), `202610100001_win_streak.sql` (`recalculate_win_streaks`, `recalculate_elo`), `AppStore.loadStatistics`. Verification: assente copertura automatica SQL di statistiche legacy, zero incontri, ordine a pari timestamp e serie dopo cancellazione. Le prove di capelli/badge con valori già forniti non verificano il calcolo della serie.

## Consumatori: classifica e riconoscimenti

Eleggibilità, numerazione, pari merito e presentazione della classifica appartengono a [RANK-002, RANK-003 e RANK-004](rankings.md), non alla formula ELO. Gli scostamenti di elenco, medaglie e anteprima sono registrati in quei requisiti: qui non si accetta un secondo ordinamento in conflitto. Non è stata eseguita una riproduzione con backend reale a pari merito.

## Storia e limiti dell'adozione

- Formula originaria K=32 senza margine: `202607210001_initial.sql`; resta rilevante per ELO-002, non per nuove partite.
- `202607230003_legacy_statistics.sql` sostituisce le vittorie «squadra a 6» della vista originale con confronto dei risultati; non è una garanzia di qualità dei dati importati.
- `CHANGELOG.md` 1.0.0 menziona grafico interattivo ELO e vittorie per colore; non costituisce prova di funzionalità corrente. `AnalyticsPage` ispezionato contiene anteprime/classifiche globali e mensili, non tali viste storiche. La gestione premi mensili non è definita qui.
- Nessuna asserzione SQL automatica individuata nelle fonti ispezionate; il solo E2E esistente (`apps/web-e2e/src/example.spec.ts`) simula autenticazione/rete e non registra partite. Restano necessarie prove di formula/replay/legacy e concorrenza in database dedicato, non semplici snapshot del risultato attuale. L'intento è accettato; gli esiti delle esecuzioni esistenti sono in [verification.md](../verification.md).
