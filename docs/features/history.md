# Storico e patrimonio legacy — HIST

## Ambito, stato e fonti

Tutti i record: **Type: Requirement; Status: Accepted; Implementation: Implemented**, salvo HIST-003. Baseline e precisazioni accettate dal proprietario il 2026-11-13; [decisioni](../open-questions.md). Evidenza dal sorgente e dalle migrazioni, non conferma del deployment/dati reali; esecuzioni in [verification.md](../verification.md).

Code: `apps/web/src/app/features/history/history-page.ts` e `.html`; `apps/web/src/app/core/app-store.service.ts` (`loadInitialHistory`, `loadHistoryForPlayer`, `loadMoreHistory`, `loadHistoryPageTracked`, `loadHistoryPage`, `fetchMatchRows`, `hydrateMatches`, `mapMatches`, `loadPlayerRecentMatches`, `deleteMatch`, `refreshMatchData`, `subscribeToChanges`). Migrazioni sotto `supabase/migrations/`: `202607210001_initial.sql`, `202607230002_import_legacy_history.sql`, `202607230003_legacy_statistics.sql`, `202607230004_delete_match_window.sql`, `202608050001_paginate_match_history.sql`, `202610170001_exclusion_priority.sql`.

Eredita lettura pubblica e modifiche [AUTH](access.md), feedback e navigazione [GEN-002/GEN-003](../general.md). Calcoli/replay [ELO-002/ELO-003/ELO-005](ratings.md), priorità [PICK-005](team-selection.md), partita corrente [PLAY-004/PLAY-005](play.md). Lo storico non possiede una seconda politica di accesso.

## HIST-001 — Paginazione, filtro e recupero errori

Lo store non carica l'intero archivio all'avvio: lo storico viene inizializzato su richiesta e caricato a pagine di 25, richiedendo 26 righe per determinare se esiste una pagina successiva. L'ordine è `played_at` decrescente, poi `id` decrescente; il cursore richiede data inferiore oppure stessa data e UUID inferiore. Non è lo stesso ordine usato dal replay ELO-003, che include anche `created_at`.

L'id dell'ultimo incontro della pagina determina il cursore; gli elementi già presenti sono deduplicati per id. Le partecipazioni sono caricate separatamente solo per i match di quella pagina e ordinate per match/player. Non carica tutte le partecipazioni del database. Se id del giocatore non è risolvibile nell'anagrafica caricata, `mapMatches` omette quel partecipante, non l'intero incontro. La richiesta dati è distinta dalla ricostruzione delle card: un errore di idratazione non conferma una pagina caricata.

Il filtro comprende tutti i giocatori (anche inattivi); un id selezionato richiede un inner join sui partecipanti. `?giocatore=<id>` inizializza il filtro dalla snapshot della route. Cambiarlo azzera risultati/cursore e forza ricarica; il codice non aggiorna l'URL né si sottoscrive a successive variazioni del query param sulla stessa istanza. Una normale riapertura senza force riutilizza lo stato inizializzato dello store. `loadPlayerRecentMatches` usa lo stesso caricamento/idratatore con default cinque risultati per il profilo.

Richieste di pagina sovrapposte vengono evitate; una ricarica forzata attende la richiesta già in corso. Durante caricamento viene mostrato skeleton iniziale o pulsante occupato; lo scorrimento carica automaticamente tramite IntersectionObserver (margine 192px), con pulsante manuale disponibile. Senza observer rimane il comando manuale. Errori di pagina sono mostrati con «Riprova», conservando le pagine già visualizzate; fine archivio e storico vuoto sono distinti, con messaggio vuoto specifico per filtro. Un caricamento iniziale fallito rimane riprovabile tramite `loadMoreHistory` perché l'inizializzazione è già stata segnata.

Code: simboli elencati sopra; indice `(played_at desc,id desc)` in `202608050001_paginate_match_history.sql`. Tests: `history-page.spec.ts`, «filters the history by the selected player» verifica select e chiamata mock con id; non verifica query, cursore o righe filtrate. **Gap:** nessun test individuato delle pagine 25/26, tie di timestamp, deduplica, cambio filtro durante richiesta, errori/idratatore, observer/fallback o conservazione del filtro nello store fra route diverse. La serializzazione ispezionata non dimostra correttezza di tutte le gare di cambio filtro.

## HIST-002 — Risultato storico e anagrafica corrente

Ogni card mostra data di gioco, punteggi finali, due formazioni, eventuale data di modifica, collegamento di ogni partecipante al profilo e delta ELO per colore con segno, fino a due decimali. Il delta di squadra visualizzato è quello del primo partecipante trovato per quel colore (zero se assente), non la somma dei due delta individuali: ciò dipende dall'uguaglianza individuale ELO-001 e dall'importazione simmetrica.

Nome, colore, tipo avatar e riconoscimenti sono **correnti**, non una fotografia dell'epoca del match; `elo_before` e `elo_delta` provengono invece dalla partecipazione storica e possono cambiare per ricalcolo ELO-003. Un giocatore inattivo non scompare dalla storia. `edited_at` è solo visualizzato se presente; non costituisce una funzione corrente di modifica del risultato.

Le date sono mostrate con locale italiano nel fuso del dispositivo. Il proprietario ha confermato la distinzione rispetto al calendario Europe/Rome usato per aggregazioni e regole [GEN-001](../general.md): non è uno scostamento da correggere.

Tests: `history-page.spec.ts`, «renders clickable player profiles with their current avatar status» controlla href `/giocatore/red-player`, avatar e immagine capelli winstreak fornita dal mock. Non verifica caricamento reale dei riconoscimenti né rettifiche dopo ricalcolo. `CHANGELOG.md` 1.4.0 corroborava storicamente avatar/badge correnti e link profilo.

## HIST-003 — Eliminazione con conferma e finestra temporale
Implementation: Partially implemented


L'azione è riservata ad AUTH, richiede una conferma esplicita e non è un editor di risultato. In UI la disponibilità si basa su `created_at`, non su `played_at`: età non negativa e strettamente inferiore a dieci minuti. Il tempo viene rivalutato ogni 15 secondi; il tooltip indica minuti residui arrotondati in alto, minimo uno finché il comando è visibile. L'alert di conferma è mostrato solo finché `canDelete` resta vero. Comandi pendenti sono bloccati; annullare chiude la conferma.

`delete_match` verifica accesso AUTH, blocca la riga (`FOR UPDATE`), rifiuta id assente e `created_at < now() - interval '10 minutes'`, poi elimina il match (cascata di partecipazioni e candidati), ricostruisce ELO/serie ed esclusioni nella stessa chiamata. Il successo aggiorna notifica, giocatori/statistiche/premi e lo storico se già inizializzato. L'errore lascia la conferma/storia e viene mostrato; la pagina usa il messaggio solo se `Error`, altrimenti il fallback «Eliminazione non riuscita.» (un oggetto errore RPC non necessariamente mantiene il suo messaggio originale).

**Contratto accettato:** fa fede l'orologio server e l'eliminazione è ammessa soltanto con età `0 <= età < 10 minuti` rispetto a `created_at`; nessun diritto di eliminazione per date future. La UI fornisce un'indicazione, non garantisce l'esito della successiva chiamata. **Scostamento attuale:** a dieci minuti esatti SQL accetta ancora l'operazione e non rifiuta timestamp futuri; la disponibilità UI dipende inoltre dall'orologio dispositivo. Nessun controllo è stato corretto durante l'adozione. Non serve che il creator del match coincida col chiamante oltre alla politica AUTH.

Il proprietario conferma che l'eliminazione non riforma le squadre del turno già estratto: `active_play` resta invariato, mentre rating, serie e priorità vengono ricalcolati. L'anteprima usa gli ELO ricaricati. La cancellazione rimuove anche `source_round_id` usato da PLAY-005 per riconoscere un finish ripetuto: il limite della deduplicazione è documentato, senza introdurre una memoria separata dei round conclusi.

Code: `HistoryPage.canDelete`, `deletionMinutesLeft`, `deleteMatch`; RPC corrente in `202610170001_exclusion_priority.sql`, aggiornamento dei contatori in `202611050004_decrement_played_priority.sql`. Tests: `history-page.spec.ts`, «offers deletion only during the first ten minutes» fornisce un match a 5 minuti e uno a 11, verifica un solo comando e «5 minuti»; **non** prova gli estremi 0/10 né tempo futuro/scadenza dinamica. «requires confirmation before deleting a match» apre alert e verifica una sola chiamata mock con `recent`; non prova eliminazione SQL, rollback, errori o ricalcolo.

## HIST-004 — Importazione legacy e invarianti preservati

La migrazione `202607230002_import_legacy_history.sql` è un'importazione una tantum versionata, non una funzione di importazione esposta nell'app. Richiede l'account condiviso esistente, inserisce giocatori per nome normalizzato senza duplicarli e controlla che i 14 giocatori attesi siano disponibili. Il dataset incorporato è percorso per `played_at`, poi `source_order` decrescente. Le chiavi `legacy_source_key` non nulle sono uniche; una chiave già presente viene saltata. Ogni record richiede due nomi per squadra, delta dei colori opposti e quattro partecipazioni effettivamente risolte, altrimenti l'importazione fallisce.

Gli incontri importati hanno `legacy_rules=true`, `elo_locked=true`, `created_at=played_at` e creator assegnato all'account condiviso. I delta originali vengono sommati ai giocatori e mantenuti nei replay ELO-003. Il vincolo di schema permette per legacy punteggi da 0 a 99, non pari e con massimo almeno 6: **non** impone due goal di scarto. Per non-legacy resta il finale 6 contro 0–5. È un vincolo di conservazione dell'archivio, non permesso di registrare nuove partite oltre 6 dal segnapunti.

L'importazione non crea `match_pick_candidates` retroattivi: la ricostruzione della priorità non inventa chi fosse in panchina in quegli incontri (PICK-005). Le statistiche di vittoria/sconfitta e serie usano il confronto dei punteggi anche per legacy (ELO-005).

Evidence scope: ispezionati schema, validazioni e ciclo importazione; il grande payload dei risultati è patrimonio storico incorporato, **non** validato riga per riga con dati originali esterni. Non sono stati letti dati di produzione. Verification: assenti test automatici individuati di idempotenza import, record mancanti, locked/replay e vincoli legacy; da verificare su database isolato, non rieseguendo la migrazione sulla produzione.

## HIST-005 — Aggiornamento in tempo reale dell'archivio

Gli eventi `matches` su Realtime provocano refresh di giocatori/statistiche/premi e, solo se storico inizializzato, reset e caricamento della prima pagina mantenendo il filtro dello store. Non è garantita la conservazione della posizione di scroll o di tutte le pagine già caricate dopo registrazione/cancellazione remota. Gli eventi `players` aggiornano anagrafica/statistiche/premi tramite `refresh`, ma non reidratano esplicitamente le card già memorizzate nello storico: un nome/colore cambiato può restare nel record idratato finché non viene ricaricata la pagina dati. I riconoscimenti richiesti dal template vengono invece risolti dinamicamente nello store.

Code: `AppStore.subscribeToChanges`, `refreshMatchData`, `mapMatches`; `HistoryPage`. Verification: nessun test individuato su pagine storiche aperte mentre un altro dispositivo salva/elimina/modifica anagrafica; le prove `app-store-live.spec.ts` riguardano lo slot partita, non il canale dell'archivio. Questi limiti non sono elevati a promesse di freschezza automatica globale.

## Storia e limiti

- Schema iniziale `202607210001_initial.sql`: `update_match` permetteva rettifica punteggi/data e ricalcolo; l'importazione legacy prevedeva anche sblocco del delta dopo rettifica. `202607230004_delete_match_window.sql` revoca ed elimina `update_match`, introducendo cancellazione temporizzata. I campi `edited_at`/`edited_by` rimangono per conservare evidenza storica, non per offrire quell'azione oggi.
- `CHANGELOG.md` 1.2.0 introduce 25 risultati e scroll; 1.3.0 filtro e cinque risultati nel profilo. Queste affermazioni sono corroborate dal percorso attuale HIST-001, senza attribuire al changelog autorità superiore al sorgente.
- Finestra stretta sul server, timestamp futuri vietati, date visualizzate nel fuso del dispositivo e squadre già estratte invariate sono decisioni accettate; lo scostamento temporale rimane HIST-003.
- Lacune: integrazione SQL eliminazione/replay/permessi e transazioni concorrenti, paginazione con timestamp uguali e cambi filtro, E2E di conferma/errore. L'E2E esistente simula autenticazione e non copre questi contratti backend; esecuzioni in [verification.md](../verification.md).
