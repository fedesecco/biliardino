# Accesso e autorizzazioni — AUTH

Documento canonico per identità e confini di accesso. Tutti i record correnti hanno **Type: Requirement; Status: Accepted; Implementation: Implemented**, sulla base dell'approvazione del proprietario del 2026-11-13 e delle fonti sotto. L'evidenza è ispezione del sorgente e delle migrazioni, non verifica del servizio distribuito. Esiti dei controlli: [verification.md](../verification.md).

## AUTH-001 — Identità autorizzata unica

L'app usa un account condiviso, `biliardino@teleniasoftware.com`. Il possesso di una sessione qualsiasi non autorizza alle modifiche: l'email della sessione deve corrispondere a quell'identità. Il controllo client rimuove spazi esterni e ignora maiuscole/minuscole; la funzione server richiede un UID autenticato e confronta l'email del JWT senza distinzione di maiuscole. Non è previsto un modello di ruoli individuali o un elenco di amministratori nella UI.

La funzione hook di registrazione ammette soltanto l'email condivisa e restituisce errore 403 alle altre. La presenza della funzione nelle migrazioni non dimostra che il relativo hook sia collegato nella configurazione Auth live. Il vecchio nome `companyUser` non amplia l'accesso a tutto il dominio aziendale.

Code: [company-access.ts](../../apps/web/src/app/core/auth/company-access.ts), `SupabaseService.companyUser`; [shared_account_access.sql](../../supabase/migrations/202607230001_shared_account_access.sql), `is_company_user`, `hook_restrict_signup_to_company`.
Tests: l'E2E descritto in AUTH-002 verifica l'email inviata dal browser con backend simulato; non verifica JWT reali, hook, policy o rifiuto server di account diversi. Mancano prove SQL isolate del confine di autorizzazione.

## AUTH-002 — Accesso con sola password e ciclo sessione

La pagina `/accedi` richiede la sola password; l'email condivisa non è modificabile dal form. Il form richiede almeno dodici caratteri, blocca invii invalidi o già pendenti e mostra lo stato di accesso. In caso di successo torna a `/`; credenziali errate producono il messaggio italiano dedicato, altri errori espongono il messaggio disponibile o un fallback.

Una sessione autorizzata vede lo stato di accesso condiviso; una sessione con altra email vede account non autorizzato e l'invito a uscire. La shell permette il logout. Il client Supabase conserva la sessione, aggiorna i token e rileva sessioni da URL; il servizio legge la sessione iniziale e aggiorna i signal agli eventi di autenticazione. `authReady` distingue inizializzazione e sessione effettiva.

Code: [SupabaseService](../../apps/web/src/app/core/supabase.service.ts), `initializeAuth`, `signIn`, `signOut`; [LoginPage](../../apps/web/src/app/features/auth/login-page.ts) e [template](../../apps/web/src/app/features/auth/login-page.html); shell App.
Tests: [example.spec.ts](../../apps/web-e2e/src/example.spec.ts), «signs in with the fixed shared account and password», disabilita il submit con password corta, invia quella valida, verifica email/password della richiesta e stato Connesso. Risposte Auth, token e letture dati sono simulati: non prova l'accesso Supabase reale. Non sono stati letti password o segreti di produzione.
Verification: login fallito, logout e ripristino/refresh sessione richiedono ulteriori prove isolate; non dichiarati verificati dalla sola configurazione del client.

## AUTH-003 — Lettura pubblica e route riservata

Giocatori, statistiche, classifiche, premi persistenti, profili e storico sono consultabili senza autenticazione. La gestione `/giocatori` richiede l'account condiviso: la guard attende `authReady`, poi consente la route oppure rimanda a `/accedi`. Nascondere la voce di navigazione non è l'unico controllo, e una guard non è la protezione database.

La route `/` resta pubblica, ma il client non legge né sottoscrive la partita attiva per utenti non autorizzati e non espone loro i comandi di modifica. Il laboratorio avatar resta pubblico e locale, come [AWARD-008](awards-avatars.md).

Code: [guard](../../apps/web/src/app/core/auth/company-user.guard.ts), [rotte](../../apps/web/src/app/app.routes.ts), `AppStore` effect di sottoscrizione; policy SELECT in [schema iniziale](../../supabase/migrations/202607210001_initial.sql), viste `security_invoker` e policy premi.
Tests: «does not read or subscribe to a game while logged out, including reconnect events» e «clears the game on logout and ignores late events and pending snapshots» in [app-store-live.spec.ts](../../apps/web/src/app/core/app-store-live.spec.ts) verificano il client simulato. Il test di navigazione pubblica in [app.spec.ts](../../apps/web/src/app/app.spec.ts) non verifica direttamente la guard o RLS.

## AUTH-004 — Mutazioni protette e helper interni

Creare/aggiornare un giocatore richiede account condiviso nel client e policy RLS `is_company_user` per INSERT/UPDATE nel database. Registrare, modificare lo stato o eliminare una partita richiede lo stesso controllo server nelle RPC. Non si autorizzano modifiche tramite una semplice sessione di email diversa né si affida l'invariante ai pulsanti disabilitati.

Dopo l'introduzione della partita condivisa il browser usa `start_play` e `mutate_play`; `pick_teams` e `record_match` sono helper interni, senza esecuzione concessa ai ruoli ordinari. Anche ricalcolo globale, trigger interni e finalizzazione dei campioni non sono comandi client ordinari. Le funzioni privilegiate dichiarano `search_path` vuoto; i controlli e i privilegi effettivi devono essere confrontati con lo schema distribuito prima di un futuro intervento database.

Il risultato storico non ha più un RPC pubblico di modifica: la migrazione della finestra di eliminazione rimuove `update_match`. L'azione corrente è l'eliminazione temporizzata [HIST-003](history.md), non un editor arbitrario dei match. Un account condiviso autorizzato non è limitato alle sole partite create dal proprio browser.

Code: [policy aziendale](../../supabase/migrations/202607210004_company_domain_access.sql), sostituzione dell'identità [shared account](../../supabase/migrations/202607230001_shared_account_access.sql); [hardening grant](../../supabase/migrations/202607210002_harden_function_grants.sql); [RPC condivisi](../../supabase/migrations/202611050001_shared_active_play.sql); [delete window](../../supabase/migrations/202607230004_delete_match_window.sql); finalizzazione [monthly champions](../../supabase/migrations/202608050002_monthly_elo_champions.sql).
Verification: controlli rintracciati nelle migrazioni. Non esistono prove automatiche SQL individuate dei ruoli anon/account diverso/account condiviso e dei grant realmente distribuiti; lo stato resta Implemented, non Verified.

## AUTH-005 — La riservatezza della partita attiva è soltanto di interfaccia

Decisione esplicita del proprietario, 2026-11-13: **è consentita la lettura pubblica via API dello slot `active_play`; basta nasconderlo nella UI non autorizzata**. Non si promette che candidati, panchina, squadre o punteggio in corso siano dati privati.

La migrazione concede SELECT ad `anon` e `authenticated` e crea la policy di lettura pubblica. Non concede per questo INSERT/UPDATE/DELETE diretti; le modifiche passano dalle RPC protette di AUTH-004. «Solo su account loggati» nel changelog 1.8.0 descrive la superficie applicativa [PLAY-001](play.md), non un divieto di consultazione API.

Code: [shared_active_play.sql](../../supabase/migrations/202611050001_shared_active_play.sql), grant/policy `Everyone reads active play`; `AppStore.playDraft` ed effect di accesso.
Verification: riconciliazione esplicita fra changelog e SQL; nessuna interrogazione anonima del database live durante questa attività.

## AUTH-006 — Configurazione assente

Inherits: [ARCH-005](../architecture.md).

Senza URL e chiave pubblicabile il client non viene creato, l'inizializzazione autenticazione viene considerata conclusa e lo store termina il caricamento senza richieste. La shell mostra configurazione mancante; il form di login non è disponibile. Leggere `SupabaseService.client` senza configurazione produce un errore esplicito, non credenziali fittizie o un backend di fallback.

Code: `readRuntimeEnvironment`, `SupabaseService` costruttore/getter `client`, `AppStore` costruttore, shell e template login.
Tests: navigazione pubblica e avviso in [app.spec.ts](../../apps/web/src/app/app.spec.ts). Non costituisce verifica di una configurazione distribuita.

## Evoluzione storica, non autorità concorrente

1. Lo schema iniziale usava `profiles.approved` e approvazione individuale: [initial.sql](../../supabase/migrations/202607210001_initial.sql), poi ottimizzazione policy/grant.
2. [company_domain_access.sql](../../supabase/migrations/202607210004_company_domain_access.sql) rimuove l'approvazione e ammette il dominio `teleniasoftware.com`.
3. [shared_account_access.sql](../../supabase/migrations/202607230001_shared_account_access.sql) restringe al solo account condiviso. È la regola corrente AUTH-001 confermata dal proprietario.

Queste versioni non sono tre politiche contemporaneamente valide. Nessun ID precedente è stato rinumerato: il ledger nasce ora e conserva la provenienza delle regole anteriori senza fingere che fossero già record SpecLedger accettati.
