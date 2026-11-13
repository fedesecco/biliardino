# Profilo giocatore

Documento canonico del prefisso `PROFILE`; [indice SpecLedger](../README.md). Riguarda `/giocatore/:id`, statistiche personali, parti distintive, bacheca, ultimi risultati e rapporti amici/nemici.

## Stato ed evidenze

Tutti i record hanno **Type: Requirement**, **Status: Accepted**, **Implementation: Implemented**, salvo PROFILE-005. Baseline, saldo netto e indipendenza delle categorie accettati dal proprietario il 2026-11-13; [decisioni](../open-questions.md). Evidenza da sorgente e asserzioni ispezionati; esecuzioni in [verification.md](../verification.md). Nessuna modifica del template è inclusa.

Inherits: [GEN-002](../general.md) per errori/caricamento osservati, [GEN-003](../general.md) e [accesso](access.md) per navigazione/lettura. Architecture: [ARCH-002](../architecture.md). Definizioni condivise: [RANK-001](rankings.md) per aggregati, [AWARD-001/002/003/004/006](awards-avatars.md) per stati correnti, trofei e rendering; [PLAYER-001](players.md) per inattività. Queste regole non vengono ridefinite dal profilo.

## PROFILE-001 — Identità dalla rotta e statistiche personali

L'ID deriva dai parametri reattivi della rotta. Il profilo cerca il giocatore nelle statistiche globali e mostra nome, avatar corrente e ELO arrotondato all'intero; le quattro card mostrano partite, vittorie, winrate a un decimale e GF−GS con segno positivo quando applicabile. L'eventuale medaglia colora anche il nome. L'inattività non impedisce il profilo, perché la vista statistica comprende tutta la rosa.

Durante il caricamento globale compare lo scheletro del profilo. Se dopo il caricamento non esiste una statistica con quell'ID, il template mostra «Giocatore non trovato». Questo è un riscontro sull'elenco caricato, **non una richiesta server dedicata che attesta l'inesistenza**: la pagina non espone separatamente `store.error()` nel ramo principale. Il collegamento di ritorno porta sempre a `/classifiche`, non necessariamente alla pagina di provenienza.

Cambiare `:id` nella stessa istanza aggiorna statistiche, badge e premi; avvia nuove richieste per risultati e rivalità secondo PROFILE-005. I link dai nomi nei domini rosa/classifica/storico sono consumatori della medesima rotta.

Code: [PlayerDetailPage](../../apps/web/src/app/features/player-detail/player-detail-page.ts), `routeParamMap`, `playerId`, `statistic`, `playerBadges`; [template](../../apps/web/src/app/features/player-detail/player-detail-page.html), hero/card/ramo non trovato; [rotte](../../apps/web/src/app/app.routes.ts), `giocatore/:id` senza guard.

Tests: [player-detail-page.spec.ts](../../apps/web/src/app/features/player-detail/player-detail-page.spec.ts), `reloads the selected player when the route id changes` verifica nuovo nome e chiamate col nuovo ID; `shows retroactive paper awards and exclusive prizes in the bacheca` verifica il titolo col nome. I dati principali sono fixture di `PlayerStatistic`, non aggregati SQL verificati.

Gap: ID inesistente, errore globale di caricamento, giocatore inattivo, formati/soglie delle statistiche e visita pubblica end-to-end. Verification: aprire profili esistenti/assenti e aggiornare l'ID senza ricreare il componente, verificando dati e stati di caricamento reali.

## PROFILE-002 — Parti distintive e bacheca personale

Il profilo rende l'avatar hero secondo [AWARD-006](awards-avatars.md), poi una sezione «Parti distintive dell'avatar» soltanto se esistono riconoscimenti correnti. L'elenco contiene prima la testa della medaglia e poi le parti associate ai badge mensile/serie, con immagine, etichetta e descrizione se disponibile. Non è una collezione storica dei badge: perdere lo stato rimuove la corrispondente parte distintiva.

La bacheca filtra `monthlyChampions` per ID, conserva l'ordine ricevuto dallo store (mesi decrescenti) e mostra il numero dei premi; se non ne esistono appare lo stato vuoto. L'illustrazione thumbnail e la distinzione fra retroattivo ed esclusivo seguono [AWARD-003/004](awards-avatars.md). Per i retroattivi il titolo è «Miglior giocatore di <mese>»; da agosto 2026 è «Premio esclusivo <Mese>», indipendentemente dal fatto che il relativo artwork sia registrato.

Un premio apre un dialog con artwork hero, titolo, nome del giocatore e saldo ELO salvato nel premio (fino a due decimali). Si chiude col pulsante, Escape o click sul fondale; il click sul contenuto non è trattato come fondale. Le parti distintive sono immagini descrittive nel layout corrente, **non pulsanti di ingrandimento**; soltanto i trofei hanno l'apertura dettaglio.

Code: `PlayerDetailPage.avatarParts`, `trophies`, `selectedAward`, `openTrophy`, `closeAward`, `closeFromBackdrop`, effetto `awardDialog`; [template](../../apps/web/src/app/features/player-detail/player-detail-page.html), `avatar-parts`, `trophy-cabinet`, `award-dialog`; `AppStore.loadMonthlyAwards`.

Tests: [player-detail-page.spec.ts](../../apps/web/src/app/features/player-detail/player-detail-page.spec.ts):

- `shows retroactive paper awards and exclusive prizes in the bacheca` controlla titoli luglio/agosto/ottobre/novembre, ordine della fixture, coppa cartacea e thumbnail WebP registrati.
- `shows %s status through the composed avatar and its distinctive parts`, parametrizzato Maschio/Femmina, controlla i tre livelli del hero e le tre parti oro/Bomboclat/serie 5.

Gap: nessun caso apre/chiude il dialog del trofeo, verifica il saldo persistito, bacheca vuota, sparizione di uno stato o mese esclusivo senza artwork nella bacheca. L'ordine di fixture non verifica l'ordinamento della query reale.

Verification: bacheca con premio retroattivo, esclusivo registrato e non registrato; apertura/chiusura del dialog e aggiornamento dei riconoscimenti correnti separato dai premi permanenti.

## PROFILE-003 — Cinque risultati personali recenti

Il profilo richiede al massimo cinque partite filtrate sul giocatore, ordinate per `played_at DESC, id DESC`, senza scaricare l'intero archivio. I partecipanti vengono idratati successivamente da `match_players` e dai giocatori correnti nello store: nome/colore/tipo non sono una fotografia del giorno dell'incontro. Il collegamento «Vedi tutto» apre `/storico?giocatore=<id>`.

Ogni risultato mostra data/ora, nomi delle due squadre e punteggio. La variazione ELO è visibile **solo per la squadra del giocatore del profilo**; `teamDelta` prende il delta del primo partecipante di quella squadra, non la somma dei due compagni. Il modello corrente assegna il medesimo delta ai due compagni; anche la migrazione import assegna `blue_elo` a ciascun blu e `red_elo` a ciascun rosso. Non è mostrato un delta complessivo delle quattro persone.

I risultati hanno stati locali di caricamento, errore e lista vuota, distinti da quelli delle rivalità. La data usa `DatePipe` con locale italiano e timezone non specificata: la resa ora segue la configurazione/default del client, non un'esplicita conversione a Roma in questo template. [GEN-001](../general.md) governa i confini calendario del dominio, non costituisce prova che questo timestamp sia reso in un fuso esplicito.

Code: `RECENT_MATCH_LIMIT=5`, `PlayerDetailPage.loadRecentMatches`, `participants`, `playerTeam`, `teamDelta`; [AppStore](../../apps/web/src/app/core/app-store.service.ts), `loadPlayerRecentMatches`, `fetchMatchRows`, `hydrateMatches`, `mapMatches`; [indice storico](../../supabase/migrations/202608050001_paginate_match_history.sql), `(played_at DESC, id DESC)`; template `recent-results`.

Tests: `shows the latest personal results with a link to the filtered history` controlla punteggio 6:4, una sola variazione visibile, `+12 ELO` della squadra del profilo, delta avversario nascosto e link filtrato. `reloads the selected player when the route id changes` controlla chiamata `loadPlayerRecentMatches(secondPlayer.id, 5)`.

Gap: i test non provano il filtro/limite/ordine della query reale, i sei risultati con esclusione del più vecchio, pari timestamp, profilo nella squadra blu, valori importati delle due squadre, timezone, errori o assenza di risultati.

Verification: integrazione della query su almeno sei incontri personali e incontri estranei, più resa di ciascuna squadra e stato errore; dati esclusivamente di test.

## PROFILE-004 — Amici e nemici dal saldo ELO netto

La vista `player_rivalries` unisce ogni partecipazione del giocatore con gli altri partecipanti della stessa partita, escludendo se stesso. Per ogni coppia accumula **il delta del giocatore del profilo**, non quello dell'altro: separatamente quando sono compagni e quando sono avversari. Non limita per mese, attività del giocatore o numero minimo di partite; comprende i delta storici importati. I saldi vengono arrotondati a due decimali.

| Rapporto | Candidati e scelta |
| --- | --- |
| Miglior amico | Saldo con il compagno > 0; massimo saldo netto condiviso. |
| Peggior amico | Saldo con il compagno < 0; minimo saldo netto condiviso (più negativo). |
| Miglior nemico | Saldo contro l'avversario > 0; massimo saldo netto contro. |
| Peggior nemico | Saldo contro l'avversario < 0; minimo saldo netto contro. |

I saldi zero non producono una categoria; le categorie possono mancare e non viene scelto «il meno negativo» per una categoria positiva o viceversa. A parità del saldo, vince chi ha più partite nel relativo rapporto (assieme per amici, contro per nemici), poi nome crescente e infine ID crescente. Il nome è quello corrente del giocatore. La vista produce una riga per ogni giocatore, anche senza controparti; lo store converte un saldo nullo in zero ma conserva gli ID assenti, senza inventare rapporti.

**Provenienza riconciliata:** il proprietario conferma il saldo netto corrente. La migrazione `player_rivalries_elo` sommava guadagni e perdite separatamente, poi `player_rivalries_net_elo` l'ha sostituita con il saldo firmato e `best_enemy` ha aggiunto il quarto rapporto. Esempio: +40 e −35 con A valgono +5 netto, non +40 vinto e −35 perso separati. Il testo sintetico di `CHANGELOG.md` 1.3.0 non ripristina la versione lorda.

Code: [202608100004_player_rivalries_best_enemy.sql](../../supabase/migrations/202608100004_player_rivalries_best_enemy.sql), `pair_stats`, `ranked_friends`, `ranked_worst_friends`, `ranked_best_enemies`, `ranked_worst_enemies`; `AppStore.loadPlayerRivalry`, query `maybeSingle` filtrata per `player_id`; [models.ts](../../apps/web/src/app/core/models.ts), `PlayerRivalry`.

Tests: `shows ELO-based friends and enemies from the server-side view` controlla quattro **valori simulati** (+42.5, −17.25, +25, −30) e relativo testo. Non esegue la vista: non prova somma netta, esclusione zero, spareggi, identità del delta accumulato o assenza di soglia.

Verification: integrazione SQL con coppie a segno misto, saldo zero, pari saldo e diverso numero di incontri/nome/ID; poi consumatore con categorie parziali. Le attese derivano dal saldo netto accettato.

## PROFILE-005 — Caricamenti locali e disponibilità delle categorie
Implementation: Partially implemented


Al cambio di ID il componente svuota risultati/rivalità e relativi errori, imposta i due caricamenti e avvia le richieste separatamente. Un contatore di versione impedisce a risposte o errori tardivi di un vecchio giocatore di sovrascrivere il nuovo. Un errore di una richiesta non viene usato come errore dell'altra; per ID vuoto i caricamenti terminano senza richiesta. Il recupero dei dati si attiva al cambio della rotta: non è presente nel componente una nuova richiesta automatica delle rivalità/ultimi risultati ad ogni evento partita mentre l'ID rimane identico.

La sezione amici/nemici mostra caricamento, errore o stato vuoto se nessun ID è disponibile. Le card richiedono sia ID sia nome e contengono link al relativo profilo. Il testo presenta saldo positivo per miglior amico/nemico, negativo per peggior amico/nemico e la frase «Sarà colpa sua o tua?» per il peggior amico.

**Contratto accettato:** ciascun rapporto con ID e nome validi deve essere mostrato indipendentemente dagli altri. **Scostamento attuale:** il blocco del miglior nemico è annidato nel blocco del peggior amico; quindi può nascondere un miglior nemico valido quando manca il peggior amico. La vista può produrre legittimamente questa combinazione; il test con tutte le categorie presenti non rileva lo scarto. Il comportamento non è un'eccezione approvata e resta da correggere in un incarico applicativo separato.

Code: `PlayerDetailPage.resetPlayerData`, `loadRequestVersion`, `loadRecentMatches`, `loadRivalry`, effetti del costruttore; [template](../../apps/web/src/app/features/player-detail/player-detail-page.html), sezione `rivalry-section`, in particolare blocchi originali alle righe 232–261.

Tests: `reloads the selected player when the route id changes` controlla richieste al nuovo ID ma non una gara fra risposte; `shows ELO-based friends and enemies from the server-side view` fornisce tutti e quattro i rapporti. Gap: risposte tardive, errori indipendenti, aggiornamento a ID invariato, zero rapporti, solo miglior nemico e altri sottoinsiemi.

Verification: categorie isolate e sottoinsiemi, in particolare solo miglior nemico; richieste vecchie completate dopo le nuove e fallimenti separati.

## Decisioni accettate

Confermati saldo netto e visibilità indipendente di ogni categoria; PROFILE-005 resta parzialmente implementato. La baseline comprende profilo pubblico anche per inattivi, cinque risultati, premi persistenti distinti dalle parti correnti e protezione dalle risposte tardive. Non è stabilita una promessa di ricaricamento automatico delle richieste personali a ID invariato.

## Storia e limiti

- [CHANGELOG 1.2.0](../../CHANGELOG.md): introduzione profilo e bacheca premi permanenti.
- 1.3.0: ultimi cinque risultati e amici/nemici. Le migrazioni conservano l'evoluzione: [conteggi vittorie/sconfitte](../../supabase/migrations/202608100001_player_rivalries.sql), [guadagni/perdite lordi](../../supabase/migrations/202608100002_player_rivalries_elo.sql), [saldo netto](../../supabase/migrations/202608100003_player_rivalries_net_elo.sql), [miglior nemico](../../supabase/migrations/202608100004_player_rivalries_best_enemy.sql). Solo l'ultima definizione ricostruisce la vista corrente.
- 1.4.0 descrive badge ingrandibili accanto al profilo; 1.6.0 li sostituisce con parti dell'avatar. Il template attuale espone il dialog dei trofei, non un dialog per le parti distintive: la descrizione storica non è il contratto attivo.

Ispezionati interamente logica/template del profilo e corrispondenti asserzioni, query store citate e tutte e quattro le migrazioni rivalità. Non ispezionati dati reali, schema distribuito o resa nel browser. Esiti delle esecuzioni in [verification.md](../verification.md); mancano prove end-to-end di caricamento personale, calcoli SQL e apertura dialog, non sostituite dai test di rendering.
