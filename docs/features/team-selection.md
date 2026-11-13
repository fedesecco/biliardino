# Selezione e composizione squadre — PICK

## Stato e fonti

Tutti i record attuali: **Type: Requirement; Status: Accepted; Implementation: Implemented**. Baseline e preferenze confermate dal proprietario il 2026-11-13; [decisioni](../open-questions.md). Evidenza dal sorgente, non conferma del deployment; esiti delle esecuzioni in [verification.md](../verification.md).

Fonti attuali: `apps/web/src/app/features/play/play-page.ts` (`toggleAny`, `chooseMode`, `updateSelection`, `createTeams`), `apps/web/src/app/core/app-store.service.ts` (`activePlayers`, `playSelection`, `teamPickingMode`, `startPlay`, `applyActivePlay`); migrazioni `202611050003_daily_first_game_priority.sql` (`pick_teams`), `202611050004_decrement_played_priority.sql` (`record_match`, `recalculate_excluded_counts`), `202611050001_shared_active_play.sql` (`start_play`, `mutate_play`). Tutti i percorsi SQL sono sotto `supabase/migrations/`.

Eredita calendario [GEN-001](../general.md), feedback [GEN-002](../general.md), autorizzazioni [AUTH](access.md). Dipende da [PLAY-002, PLAY-004, PLAY-005](play.md) per avvio, conferma e transazione; [ELO-001](ratings.md) per il rating usato. Non è un secondo contratto di accesso.

## PICK-001 — Candidati e preferenze locali

La selezione mostra soltanto giocatori attivi, con nome, avatar/stato corrente ed ELO arrotondato all'intero. Ogni candidato può essere non selezionato, automatico, rosso o blu; premere il colore già scelto deseleziona, mentre premere la card passa da assente ad automatico oppure da qualsiasi selezione ad assente. Il cambio colore sostituisce la scelta precedente. La UI non impone un limite di due preferenze per colore e consente più di quattro candidati; il contatore indica tutti i candidati, non soltanto i futuri partecipanti.

Le scelte locali persistono tra pagine nella stessa istanza dello store. I due comandi espliciti sono Random ed ELO balanced; la modalità iniziale è ELO balanced. La scelta della modalità non elimina la selezione. Stato condiviso, requisiti di connessione e aggiornamenti del roster seguono PLAY-002/PLAY-006.

Tests: `apps/web/src/app/features/play/play-page.spec.ts`, «keeps pre-start selections local across navigation» seleziona **tre rossi**, distrugge/ricrea la pagina e controlla tre card rosse; aggiungendo il quarto abilita l'avvio. Ciò documenta assenza del vecchio cap UI, non il risultato SQL. «shows start errors without discarding the local selection» conserva cinque candidati dopo errore simulato.

## PICK-002 — Priorità effettiva e cap della formazione

L'estrazione considera candidati attivi, ordinati per priorità effettiva decrescente; a parità usa `random()`. La priorità effettiva è `excluded_count` persistito (zero se assente) **più uno** se il giocatore non ha alcuna partecipazione registrata nella giornata corrente GEN-001, determinata da `matches.played_at` nell'intervallo locale [inizio giorno, inizio giorno successivo). Non è un reset giornaliero del contatore, né un bonus memorizzato. Una partita soltanto in corso non elimina il bonus; una partita cancellata non conta più. Non si usa il numero totale di incontri giornalieri come ordinamento secondario.

Scorrendo l'ordine, un preferito rosso/blu viene saltato se sono già stati scelti due preferiti di quel colore; gli automatici non incrementano quei contatori. Si ferma a quattro ammessi. Se non ne trova quattro compatibili, fallisce: non declassa una preferenza ad automatico e non aggiunge giocatori non candidati. Più di due preferenze per colore sono dunque valide come **pool**, non come promessa di partecipazione. Anche un preferito con priorità bassa può finire in panchina. La priorità non garantisce un posto quando il vincolo colore lo esclude.

Code: `pick_teams` nella migrazione `202611050003_daily_first_game_priority.sql`. Verification: mancano test SQL automatici per bonus a mezzanotte/ora legale, spareggi, overflow di colore, preferiti esclusi e composizioni impossibili. I test client non esercitano l'algoritmo SQL.

## PICK-003 — Bilanciamento o casualità dopo la selezione

Una volta selezionati quattro giocatori, entrambe le modalità rispettano il colore di **ogni preferito effettivamente selezionato**. Vengono enumerate le coppie rosse compatibili; gli altri due formano i blu. In modalità ELO balanced è scelta la coppia che minimizza la differenza assoluta fra somme ELO delle due squadre, con spareggio casuale. Dato che sono 2 contro 2, equivale a minimizzare la differenza fra medie. In Random tutte le coppie compatibili hanno lo stesso criterio numerico e la scelta è casuale.

Random non ignora le priorità per estrarre i quattro, né può violare i colori richiesti: cambia soltanto la suddivisione dei selezionati. Un errore di compatibilità non produce squadre parziali. Code: seconda query di `pick_teams`; `p_balance_by_elo` da `AppStore.startPlay`. Verification: assenti asserzioni backend sul minimo globale delle coppie compatibili o sulla separazione delle due fasi; le prove UI di anteprima ELO non sono prove di bilanciamento.

## PICK-004 — Validazione all'ingresso

L'avvio condiviso richiede almeno quattro candidati distinti e non nulli, tutti esistenti e attivi; blocca le loro righe in ordine UUID durante l'avvio. Rifiuta array non monodimensionali/nulli, preferenze duplicate/nulle e modalità nulla. Il helper `pick_teams` rifiuta preferenze esterne ai candidati e sovrapposizioni rosso/blu; un'insufficienza di attivi compatibili è un errore, non una selezione ridotta. I dettagli del conflitto di revisione e dell'accesso sono PLAY-005 e AUTH.

I limiti del helper preso isolatamente non sono il contratto browser: dopo la migrazione shared_active_play i chiamanti passano dal RPC `start_play`, non direttamente da `pick_teams`. Le stesse preferenze sono riutilizzate nei giri successivi. Code: `start_play`, `pick_teams`; `AppStore.startPlay`. Verification: nessuna prova automatica SQL individuata; servono input malformati, duplicati/nulli, inattivi, meno di quattro compatibili e controllo grant.

## PICK-005 — Aggiornamento dei contatori solo a risultato salvato

L'avvio, un goal, la correzione e l'annullamento di un giro non cambiano i contatori. Alla registrazione, tutti i candidati sono memorizzati in `match_pick_candidates`; i quattro partecipanti diminuiscono di uno con minimo zero, gli altri candidati aumentano di uno, i non candidati restano invariati. I contatori sono interi non negativi, senza reset giornaliero o massimo esplicito di prodotto.

Il server blocca candidati e contatori in ordine identificativo. Quando parte il giro successivo PLAY-004, l'estrazione usa già i nuovi contatori e la partecipazione appena salvata, quindi il nuovo bonus giornaliero. Cancellando una partita HIST-003, `recalculate_excluded_counts` azzera i contatori e rigioca le sole selezioni conservate, ordinate per `matches.created_at`, poi `match_id`, applicando decremento/incremento attuale. Non ricostruisce candidati ignoti degli incontri anteriori all'introduzione della tabella. Le priorità sono debiti di esclusione persistenti, non una statistica completa di tutta la storia.

Code: `202611050004_decrement_played_priority.sql`; tabelle/vincoli in `202610170001_exclusion_priority.sql`. Verification: mancano test SQL del replay, cancellazione, minimo zero, assenza di effetti su cancel e atomicità. Non confondere l'ispezione di `FOR UPDATE` con una prova di assenza di deadlock fra ricalcoli e altri RPC.

## Storia conservata, non regole attuali accettate

| Fonte | Regola storica e sostituzione osservata |
| --- | --- |
| `202607210001_initial.sql`, `CHANGELOG.md` 1.0.0 | Priorità a chi aveva meno partite nella giornata di Roma; successivamente sostituita da PICK-002/PICK-005. |
| `202607290002_team_picking_modes.sql`, `202607290003_fix_team_picking_mode_order.sql`, changelog 1.1.0 | Introduzione delle due modalità e correzione dell'ordinamento SQL del criterio ELO; la priorità giornaliera era ancora in uso. |
| `202610170001_exclusion_priority.sql`, changelog 1.6.0 | Introduzione dei contatori di esclusione e candidati persistiti; chi giocava passava a zero. Il cap di due preferenze per colore era un rifiuto dell'input. |
| `202610170002_preferred_players.sql` | I preferiti precedevano gli altri candidati e dovevano tutti entrare nei quattro; massimo due per colore. Questa garanzia non è più nell'algoritmo corrente. |
| `202610170003_preference_caps.sql` | Priorità alle esclusioni, non ai preferiti; cap applicato durante estrazione anziché rifiuto globale delle preferenze. |
| `202611050003_daily_first_game_priority.sql`, changelog 1.8.0 | Aggiunta del bonus temporaneo +1, PICK-002. |
| `202611050004_decrement_played_priority.sql`, changelog 1.8.0 | Il partecipante perde uno invece di azzerarsi; anche il replay dei vecchi contatori cambia secondo questa semantica, PICK-005. |

Le regole anteriori non sono obblighi correnti; non si attribuisce retroattivamente un ciclo di vita SpecLedger a record che non esistevano.

## Decisioni accettate e limiti

Il proprietario conferma preferenze di solo colore, senza posto garantito, pool superiore a due per colore con cap sui soli estratti, priorità persistenti e bonus giornaliero anche in Random. Il limite del salvataggio collegato alla nuova estrazione è registrato in PLAY-004, non una seconda regola locale. Nessuna modifica applicativa è inclusa.
