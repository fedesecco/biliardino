# Partita condivisa — PLAY

## Ambito e provenienza

Baseline retrospettiva approvata dal proprietario il 2026-11-13; decisioni in [open-questions.md](../open-questions.md). Tutti i record hanno **Type: Requirement; Status: Accepted; Implementation: Implemented**, salvo gli scostamenti espliciti sotto. Evidenza: ispezione del sorgente e dei test, non conferma dello schema distribuito; esecuzioni in [verification.md](../verification.md).

Fonti: `apps/web/src/app/core/app-store.service.ts` (`startPlay`, `changePlay`, `applyActivePlay`, `synchronizePlay`, `subscribeToPlayChanges`, `retryPlaySync`, `assertPlayWritable`), `apps/web/src/app/features/play/play-page.ts` e `.html`, `supabase/migrations/202611050001_shared_active_play.sql` (`active_play`, `start_play`, `mutate_play`). Per composizione squadre: [PICK](team-selection.md); calcoli e statistiche: [ELO](ratings.md); archivio e cancellazione: [HIST](history.md). Permessi: [AUTH](access.md), senza ridefinirne qui la politica. Eredita [GEN-002 e GEN-003](../general.md); confine RPC: [ARCH-002](../architecture.md).

## PLAY-001 — Un solo tavolo condiviso

Esiste uno slot `active_play` identificato da `id=true`, con revisione non negativa e fasi `selection`, `playing`, `confirming`, `correcting`. In selezione non esistono round, squadre o punti; nelle altre fasi esistono un `round_id` e due giocatori per colore. I candidati non schierati costituiscono la panchina. In UI la partita attiva è mostrata solo all'utente riconosciuto da AUTH; la lettura SQL dello slot è invece pubblicamente concessa dalla migrazione: il nascondimento UI **non** è una garanzia di riservatezza.

Code: tabella `active_play`, `AppStore.playDraft`, `playScore`, `playConfirming`. Tests: `app-store-live.spec.ts`, «loads an already running game including the shared bench and preferences» verifica squadre, panchina e preferenze da snapshot simulato; «does not read or subscribe to a game while logged out, including reconnect events» verifica il client, non RLS/grant reali. Il proprietario conferma la lettura pubblica API e il solo nascondimento UI: autorità [AUTH-005](access.md).

## PLAY-002 — Avvio e selezione locale

Prima dell'avvio le scelte sono locali all'istanza dello store e sopravvivono alla navigazione, non sono una bozza persistita condivisa. Sono modificabili dall'utente AUTH anche mentre lo snapshot iniziale è in attesa o offline, ma non durante un comando pendente. L'avvio richiede almeno quattro selezionati e connessione sincronizzata. `start_play` riceve candidati, preferenze, modalità e revisione attesa; accetta solo la fase `selection`, array monodimensionali non nulli, candidati distinti/non nulli, almeno quattro, esistenti e attivi, preferenze distinte e modalità non nulla. La compatibilità delle preferenze e il sorteggio seguono PICK-001–PICK-004. All'esito crea un nuovo UUID di round, squadre e 0–0, passa a `playing`, incrementa la revisione.

Un errore non scarta deliberatamente la selezione locale; lo store tenta una risincronizzazione e propaga l'errore alla pagina. Una partita già iniziata altrove viene recuperata senza sovrascriverla. Code: `PlayPage.canSelect`, `canCreateTeams`, `createTeams`; `start_play`. Tests: `play-page.spec.ts`, «shows editable player selection while the shared snapshot loads, then opens an active game», «keeps pre-start selections local across navigation», «keeps local selection editable offline but disables team creation until reconnected», «shows start errors without discarding the local selection» controllano DOM, conteggi, disabilitazioni e messaggio, con store simulato.

## PLAY-003 — Segnapunti e correzione
Implementation: Partially implemented


Ogni punteggio rimane tra 0 e 6 e il 6–6 è vietato. Un goal è ammesso solo in `playing` o `correcting`; raggiungere 6 porta a `confirming`, senza richiedere due reti di scarto. In conferma la UI mostra una dialog col risultato e le azioni Conferma, Correggi, Cambia. `correct` è ammesso solo da `confirming` e apre `correcting` **senza abbassare i punti**. `undo` sottrae uno al colore indicato, rifiuta valori negativi e, se rimuove l'ultimo 6 in conferma, passa a `correcting`; annullare un punto della squadra perdente può invece lasciare la conferma aperta. La UI non aggiunge punti durante `confirming`, non supera 6 e non sottrae da zero.

Un risultato finale valido deve poter essere riconfermato dopo «Correggi», anche senza cambiamenti al punteggio: non occorre togliere e riaggiungere artificialmente il sesto goal. **Scostamento attuale:** `finish` è consentito soltanto da `confirming`, mentre `correct` mantiene 6–4 ma passa a `correcting`; manca il percorso di riconferma diretta. L'intento è stato deciso dal proprietario; nessun fix applicativo è incluso nell'adozione.

Code: `mutate_play`, vincoli tabella, `PlayPage.addGoal`, `removeGoal`, `correctScore`, `confirmMatch`. Tests: «renders shared game, score, correction and cancellation state from the store» verifica rendering di stati iniettati, **non** queste transizioni SQL. Mancano prove backend automatiche dei confini 0, 6, 6–6 e di tutti gli archi di fase.

## PLAY-004 — Conferma, giro successivo e annullamento
Implementation: Partially implemented


Confermare deve registrare il risultato, attribuire `source_round_id` e aggiornare ELO, serie e priorità in modo coerente. Se è possibile, parte immediatamente un nuovo giro con gli stessi candidati/preferenze/modalità e punteggio 0–0; se non è più possibile formare squadre valide, il risultato deve comunque essere salvato e si torna alla selezione. Una disattivazione successiva all'avvio non deve perdere il risultato già giocato.

**Scostamento attuale:** `mutate_play` registra e riestrae nella stessa transazione senza fallback: un errore nella nuova estrazione annulla anche la registrazione; `record_match` richiede inoltre i partecipanti ancora attivi. Il contratto accettato di indipendenza fra risultato e prossimo giro è quindi solo parzialmente implementato. Non è stata modificata questa transazione.

`cancel` («Cambia») non registra il risultato: torna a `selection`, azzera round, squadre e punti, mantenendo nello slot candidati, preferenze e modalità. Il client ripristina queste scelte al passaggio di round/uscita dalla partita, non a ogni goal.

Dopo successo lo store mostra la notifica, ricarica giocatori/statistiche/premi e, se già aperto, storico; confronta i riconoscimenti dei quattro partecipanti prima/dopo e prepara la coda dei nuovi riconoscimenti. Un errore di aggiornamento dati può lasciare dati derivati incompleti: non equivale automaticamente a mancata registrazione. Code: `mutate_play` rami `finish`/`cancel`, `AppStore.changePlay`, `refreshMatchData`, `recognitionSnapshots`. Tests UI: «keeps the final shared score visible when confirmation fails», «keeps the shared game visible when cancellation fails» verificano risultato e messaggio dopo errore simulato; non verificano atomicità, aggiornamento ELO o nuova estrazione.

## PLAY-005 — Concorrenza e idempotenza circoscritta

`start_play` e `mutate_play` bloccano lo stesso slot con `FOR UPDATE`. Ogni modifica accettata aumenta `revision`. Round o revisione obsoleti producono conflitto SQLSTATE `40001`; input/fase non validi `22023`; utente non autorizzato `42501`. Non esiste fusione automatica di due goal concorrenti: il comando obsoleto viene rifiutato e il client recupera lo stato server, senza applicazioni ottimistiche.

Solo `finish` ha una deduplicazione esplicita: se esiste una partita con `source_round_id` richiesto, restituisce lo slot corrente prima del controllo round/revisione, anche se un altro giro è già iniziato. Il vincolo unico completa questa protezione. Non vale per goal, undo, cancel o start; cancellare la partita rimuove anche il riferimento usato per riconoscere un vecchio finish. Le autorizzazioni e la chiusura dei vecchi RPC diretti appartengono ad AUTH.

Tests: `app-store-live.spec.ts`, «rejects a stale command and displays the authoritative score instead of optimistic data» verifica risincronizzazione con errore simulato; `play-page.spec.ts`, «does not change the score optimistically while a command is pending» verifica punti invariati e pulsanti disabilitati. Mancano test reali su due transazioni concorrenti, doppio finish, retry dopo nuovo giro/cancellazione e rollback completo.

## PLAY-006 — Recupero e disconnessione

Il client abilita mutazioni solo dopo conferma della sottoscrizione database Realtime e lettura dello snapshot; il solo socket `joined`/`SUBSCRIBED` non basta. Applica esclusivamente revisioni maggiori, ignorando snapshot/eventi vecchi o uguali. Recupera lo stato al ritorno visibile e alla nuova sottoscrizione; offline/interruzione disabilitano le modifiche ma conservano l'ultima partita visibile. Il retry esplicito rimuove e ricrea il canale, impedendo rientri sovrapposti. Gli epoch impediscono a risposte tardive dopo logout o perdita connessione di riabilitare modifiche. Logout rimuove canale e stato condiviso dal client.

La UI presenta errore e retry anche nella dialog finale, senza nascondere la partita; la selezione iniziale rimane visibile durante l'attesa. Code: costruttore AppStore, `synchronizePlay`, `retryPlaySync`, `subscribeToPlayChanges`, `applyActivePlay`, template gioco. Tests: tutti i casi di `app-store-live.spec.ts` ispezionati, compresi «does not replace a newer realtime score with a delayed initial snapshot», «does not confuse a joined socket with an active database subscription», «does not unlock editing when a snapshot completes after the connection was lost», «clears the game on logout and ignores late events and pending snapshots»; `play-page.spec.ts` verifica anche gioco read-only sia normale sia in conferma e retry. Sono simulazioni del client, non prova di consegna Realtime o resilienza multi-dispositivo reale.

## Storia e limiti

- `CHANGELOG.md` 1.1.0 descrive conservazione durante navigazione; 1.8.0 introduce sincronizzazione e recupero dopo reload. La bozza iniziale rimane locale (PLAY-002).
- Le scelte su riconferma e salvataggio indipendente sono accettate, ma PLAY-003 e PLAY-004 restano parzialmente implementati. Non si riscrive l'intento per giustificare l'SQL corrente.
- Lacune di verifica: integrazione SQL con AUTH, sequenze di fasi, rollback, gare fra comandi e due browser reali. Le esecuzioni disponibili sono separate dalle prove mancanti in [verification.md](../verification.md).
