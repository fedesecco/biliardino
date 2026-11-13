# Giocatori

Documento canonico del prefisso `PLAYER`; mappa generale: [SpecLedger](../README.md).

## Ambito ed evidenze

Baseline della gestione rosa (`/giocatori`), del form e delle operazioni `AppStore` accettata dal proprietario il 2026-11-13; [decisioni](../open-questions.md). Tutti i record hanno **Type: Requirement**, **Status: Accepted**, **Implementation: Implemented**, salvo PLAYER-003. Evidenza dal sorgente e dai test ispezionati; esecuzioni in [verification.md](../verification.md), non conferma del database distribuito.

Dipendenze: [accesso](access.md) per identità, guard e autorizzazione; [GEN-002](../general.md) per feedback/errori osservati, [GEN-003](../general.md) per navigazione/lettura pubblica; [ARCH-002](../architecture.md) per il confine store/Supabase. La visualizzazione dell'avatar è definita in [AWARD-006](awards-avatars.md), le statistiche in [RANK-001](rankings.md).

## PLAYER-001 — Rosa, modifica e disattivazione senza eliminazione

La pagina elenca tutti i giocatori caricati, ordinati per nome, inclusi quelli inattivi. Ogni card mostra nome, avatar corrente, ELO e stato `Attivo`/`Fuori rosa`, apre il [profilo](player-profile.md) e offre la modifica. Una rosa vuota propone di creare il primo giocatore.

La creazione inizializza un giocatore attivo; solo la modifica espone il controllo dello stato attivo. Disattivare conserva identità, partite, ELO e premi: `activePlayers` filtra la selezione di gioco, mentre rosa e vista statistiche non filtrano `active`. Non è presente un'azione di eliminazione giocatore nel form o nello store. I riferimenti da `match_players` e `monthly_champions` impediscono inoltre la rimozione indiscriminata dei giocatori referenziati; questo non equivale a una funzione di eliminazione offerta dal prodotto.

Code: [PlayersPage](../../apps/web/src/app/features/players/players-page.ts), `createNew`, `editPlayer`; [template](../../apps/web/src/app/features/players/players-page.html), ciclo `store.players()` e toggle; [AppStore](../../apps/web/src/app/core/app-store.service.ts), `loadPlayers`, `activePlayers`; [schema iniziale](../../supabase/migrations/202607210001_initial.sql), `players`, `match_players`; [premi persistenti](../../supabase/migrations/202608050002_monthly_elo_champions.sql), FK `monthly_champions.player_id`.

Tests: `players-page.spec.ts` → `links each player card to its detail page` verifica il collegamento `/giocatore/player-one`, non la disattivazione. Gap: disattivazione/riattivazione e permanenza in statistiche/premi non hanno asserzioni dedicate nei test di pagina ispezionati.

Verification: verificare il ciclo attivo → inattivo → attivo attraversando form, persistenza e selezione, senza alterare lo storico; l'intento è accettato, la prova end-to-end non eseguita.

## PLAYER-002 — Nome normalizzato e vincoli di validità

Il form applica `required`, minimo 2 e massimo 40 caratteri al valore digitato; il campo ha anche `maxlength=40`. Prima di inserire o aggiornare, lo store invia il nome con `trim()`. Il database richiede una lunghezza del nome ripulito tra 2 e 40 e l'indice `players_name_unique` impedisce duplicati di `lower(trim(name))`: maiuscole/minuscole e spazi esterni non distinguono due giocatori.

Il colore inviato deve avere forma `#RRGGBB`, senza obbligo SQL di appartenenza alla palette. Il tipo è obbligatorio nel form e vincolato all'enum del database ([PLAYER-004](#player-004--tipo-avatar-salvato-nel-giocatore)).

Confine osservato: la validazione Angular del nome non esegue `trim`; ad esempio `" a "` supera la lunghezza minima locale ma diventa `"a"` ed è rifiutato dal database. Il form non ha un validatore locale di unicità del nome; l'errore arriva dalla persistenza, non da una ricerca preventiva. Non è stata stabilita la normalizzazione di accenti o spazi interni.

Code: `PlayersPage.playerForm`, `savePlayer`; `AppStore.createPlayer`, `updatePlayer`; [schema iniziale](../../supabase/migrations/202607210001_initial.sql), check `length(trim(name))`, check `avatar_color`, indice `players_name_unique`.

Tests: i tre casi di [players-page.spec.ts](../../apps/web/src/app/features/players/players-page.spec.ts) non asseriscono questi vincoli. Gap: soglie 1/2/40/41, soli spazi, spazi esterni, nome duplicato e propagazione degli errori SQL.

Verification: confronto fra validazione form e vincoli effettivi in un ambiente di test isolato; la sola presenza dei validator non prova il salvataggio end-to-end.

## PLAYER-003 — Palette e unicità dei colori per tutta la rosa

Implementation: Partially implemented

Il form propone 20 colori pastello. Alla creazione sceglie il primo non assegnato; in modifica il colore del giocatore stesso rimane selezionabile. I colori usati da qualsiasi altro giocatore, anche inattivo, sono disabilitati confrontando le stringhe senza distinzione maiuscole/minuscole. `chooseColor` e `savePlayer` ripetono il controllo: un colore già usato genera un errore locale e non invoca il salvataggio.

Il proprietario richiede colori unici per **tutti** i giocatori, inclusi gli inattivi, e accetta il limite di venti finché la palette non viene ampliata. In modifica il proprio colore resta disponibile. A palette esaurita non è ammesso creare un altro giocatore con una tinta già assegnata.

**Scostamento attuale:** la non duplicazione è controllata solo nel client, senza vincolo transazionale database. Due client concorrenti possono tentare la stessa tinta; l'unicità globale non è garantita. A palette esaurita `createNew` propone la prima tinta occupata e il salvataggio viene bloccato. Un colore valido già presente ma fuori palette è conservato dal form di modifica; non si amplia la palette durante l'adozione.

Code: `PlayersPage.colors`, `createNew`, `colorUsedByAnother`, `chooseColor`, `savePlayer`; [template](../../apps/web/src/app/features/players/players-page.html), `.color-choice`; [migrazione colori](../../supabase/migrations/202607290004_assign_unique_pastel_player_colors.sql), assegnazione storica dei primi 20 per `created_at, id`, non vincolo di unicità permanente. `AppStore.playerColorReplacements` converte in lettura due vecchie tinte (`#e84a5f` → `#fbc4ab`, `#3279f6` → `#bde0fe`), senza riscrittura automatica del database.

Tests: `offers twenty pastel colors and selects the first unused one` in [players-page.spec.ts](../../apps/web/src/app/features/players/players-page.spec.ts) asserisce 20 pulsanti, due disabilitati e prima tinta libera `#c7ceea`. Non copre esaurimento, concorrenza, inattivi o modifica del proprio colore.

Verification: casi prima tinta libera/tutte occupate, confronto case-insensitive, inattivi e due salvataggi concorrenti; il test del form non verifica l'obbligo globale di unicità.

## PLAYER-004 — Tipo avatar salvato nel giocatore

Ogni giocatore ha un tipo `male` o `female`, presentato come `Maschio`/`Femmina`. Un nuovo form parte da `male`; la modifica ripristina il tipo corrente e lo invia insieme agli altri dati. La migrazione ha aggiunto `players.type` non nullo, con default `male`, anche per i giocatori preesistenti. Il tipo non è una composizione personalizzata dei singoli livelli: le regole di rendering e le parti condivise sono [AWARD-006](awards-avatars.md).

Code: `PlayersPage.avatarTypes`, `playerForm`, `editPlayer`, `savePlayer`; `AppStore.createPlayer`, `updatePlayer`, `loadStatistics`; [202610280001_avatar_types.sql](../../supabase/migrations/202610280001_avatar_types.sql), enum `avatar_type` e vista aggiornata; [models.ts](../../apps/web/src/app/core/models.ts), `AvatarType`.

Tests: `offers a male/female avatar type toggle` verifica due opzioni e selezione di `Femmina`; i test del rendering sono mappati a AWARD-006. Gap: nessuna asserzione del ciclo form → insert/update → rilettura del tipo salvato.

Verification: persistenza del tipo in creazione/modifica e conservazione di ELO, serie vittorie e premi al cambio di tipo.

## PLAYER-005 — Ciclo di salvataggio e fallimenti

Inherits: [GEN-002](../general.md).

Un form invalido o già impegnato non avvia una seconda operazione. Durante la richiesta il pulsante di invio è disabilitato e mostra lo stato di salvataggio. Creazione e modifica richiedono l'account autorizzato attraverso `AppStore.assertCompanyUser`, oltre ai controlli server descritti in [accesso](access.md).

La creazione inserisce nome ripulito, colore e tipo; stato attivo ed ELO iniziale derivano dai default del database (`true`, `1000`). La modifica aggiorna nome, colore, tipo, stato attivo e `updated_at`, filtrando per ID. Dopo il successo lo store pubblica un avviso e ricarica i giocatori; la modifica ricarica anche le statistiche. La creazione non attende direttamente `loadStatistics`: l'aggiornamento delle statistiche passa dal successivo refresh, compreso l'evento realtime `players`.

Il form si chiude solo quando l'intera chiamata store termina senza errore. Un errore mantiene modulo e dati, mostra un messaggio locale e azzera `busy`; chiudere esplicitamente il modulo cancella l'errore. Il messaggio usa `Error.message` soltanto per istanze `Error`; altri errori, inclusi possibili oggetti del client, producono il testo generico. Se l'insert/update riesce ma la rilettura fallisce, il metodo può terminare in errore dopo aver impostato l'avviso di successo: non è documentata una transazione fra scrittura e refresh.

Code: `PlayersPage.savePlayer`, `closeForm`; `AppStore.createPlayer`, `updatePlayer`, `subscribeToChanges`; [template](../../apps/web/src/app/features/players/players-page.html), `role=alert` e submit disabilitato.

Tests: nessuna asserzione sul salvataggio nei test di pagina ispezionati; non attribuire al mock `createPlayer`/`updatePlayer` copertura di persistenza.

Verification: salvataggio valido, doppio invio, errore di scrittura, errore di rilettura successivo alla scrittura e mantenimento del form.

## Decisioni accettate

Il proprietario conferma unicità globale e riserva delle tinte anche agli inattivi, disattivazione senza eliminazione, permanenza nelle statistiche/premi e nome ripulito univoco senza distinzione maiuscole. PLAYER-003 resta parzialmente implementato; nessuna correzione funzionale è inclusa. La differenza fra validazione locale e rifiuto server del nome è esplicita in PLAYER-002, non una nuova normalizzazione inventata.

## Provenienza e limiti

[CHANGELOG 1.0.0](../../CHANGELOG.md) documenta creazione/modifica, colore e stato attivo; 1.1.0 introduce 20 tinte; 1.7.0 introduce il tipo avatar. È una fonte storica, non approvazione corrente dei casi limite. Ispezionati form, template, relativi test, metodi store citati e migrazioni sopra; non ispezionati dati reali né autorizzazioni live. La policy di accesso completa appartiene al documento AUTH, non a questo record.
