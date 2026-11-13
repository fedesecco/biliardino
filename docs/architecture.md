# Architettura

Specifiche retrospettive dell'applicazione Coppa Telenia. Indice e autorità: [README](README.md). La baseline coerente è stata approvata dal proprietario il 2026-11-13; l'approvazione non equivale a verifica dell'esecuzione. Le motivazioni storiche non disponibili sono dichiarate, non ricostruite per supposizione.

## ARCH-001 — Workspace e applicazione browser

Type: Decision
Status: Accepted
Evidence: Observed behavior; ispezione dei manifest e della configurazione Nx risolta.

Il repository usa npm e Nx. `web` è un'applicazione Angular standalone con TypeScript, template HTML e SCSS in `apps/web`; `web-e2e` contiene gli scenari Playwright in `apps/web-e2e`. La configurazione applicativa registra la lingua italiana `it-IT`; il documento HTML dichiara `lang="it"`. L'applicazione usa router e caricamento differito delle pagine, non un rendering server configurato in questo workspace.

Rationale: la scelta storica di Angular/Nx non è documentata nelle fonti esaminate. La separazione fra applicazione e scenari E2E è osservata, non una richiesta di creare nuove librerie.

Code: [manifest](../package.json), [Nx](../nx.json), [bootstrap](../apps/web/src/main.ts), [provider](../apps/web/src/app/app.config.ts), [rotte](../apps/web/src/app/app.routes.ts).
Verification: `npx nx show project web --json` e `npx nx show project web-e2e --json` eseguiti il 2026-11-13; individuati i due progetti e i target risolti. Non dimostra l'avvio dell'applicazione.

## ARCH-002 — Stato client e confine di persistenza

Type: Decision
Status: Accepted
Evidence: Observed behavior; ispezione del sorgente e delle migrazioni.

`SupabaseService` possiede configurazione, client e sessione di autenticazione. `AppStore` possiede lo stato condiviso Angular, letture, operazioni di persistenza e sottoscrizioni realtime. Le pagine consumano questi servizi. I tipi database del client sono raccolti in `database.types.ts`; i modelli di presentazione sono in `models.ts`.

Le regole autoritative di selezione, registrazione, ELO, ricalcolo e concorrenza della partita sono nelle funzioni PostgreSQL, non soltanto nei pulsanti della UI. Il client invoca `start_play`, `mutate_play` e `delete_match`; crea e aggiorna i giocatori tramite la tabella protetta da RLS. La presenza di una guard client non sostituisce i controlli database descritti in [accesso](features/access.md).

`AppStore` sottoscrive cambiamenti di giocatori, partite e campioni mensili; il canale della partita in corso ha un ciclo di vita separato, legato all'account autorizzato. Questo descrive i confini correnti: non impone un nuovo strato di adapter o una riscrittura del servizio.

Rationale: non è disponibile una decisione storica che spieghi la concentrazione delle responsabilità in `AppStore`.

Code: [SupabaseService](../apps/web/src/app/core/supabase.service.ts), [AppStore](../apps/web/src/app/core/app-store.service.ts), [tipi database](../apps/web/src/app/core/database.types.ts), [modelli](../apps/web/src/app/core/models.ts).
Verification: ispezione dei percorsi client e delle funzioni nelle migrazioni; non verificata la corrispondenza con un database distribuito.

## ARCH-003 — Evoluzione database e protezione degli aggiornamenti

Type: Decision
Status: Accepted
Source: istruzioni repository preesistenti, sezione Database workflow.

Le migrazioni sotto `supabase/migrations` sono una cronologia append-only: una migrazione applicata non si riscrive. Le modifiche DDL e alle funzioni PostgreSQL passano da una nuova migrazione e dalla verifica del comportamento distribuito. Prima di intervenire su incidenti database si ispezionano log API e PostgreSQL; prima delle modifiche si leggono schema e funzioni correnti.

Ogni `UPDATE`, anche intenzionalmente esteso a tutta una tabella, deve contenere una clausola `WHERE` esplicita perché il progetto abilita la protezione safe-update. Le funzioni critiche usano transazioni e lock per mantenere coerenti risultato, partecipanti e aggregati; i contratti specifici restano nei documenti di dominio.

Rationale: preservare la cronologia distribuita e rispettare la protezione safe-update già adottata dal progetto.

Code: [migrazioni](../supabase/migrations), in particolare [correzione safe-update](../supabase/migrations/202607290001_fix_recalculate_elo_safe_updates.sql).
Verification: revisione delle istruzioni e delle migrazioni; nessuna migrazione applicata durante l'adozione documentale. Non è una certificazione dell'intero schema live.

## ARCH-004 — Strategia di verifica e limiti delle prove

Type: Decision
Status: Accepted
Evidence: Observed behavior; configurazione dei target, test e pipeline ispezionati.

Le verifiche di progetto passano da Nx con prefisso `npx nx`. Il target `web:test` usa `@angular/build:unit-test` con esecuzione non watch e i test esistenti usano Vitest/TestBed. `web:lint` usa ESLint; `web:build` usa il builder Angular. `web-e2e:e2e` avvia Playwright. La configurazione Playwright corrente include il progetto `mobile-chromium` con dispositivo Pixel 7 e avvia il server attraverso `npm run start`.

La pipeline CI installa dipendenze e browser, esegue controllo di formattazione e target lint/test/build/typecheck/e2e attraverso Nx. Il target `typecheck` non compare nella configurazione risolta di `web`: non si documenta un comando isolato `web:typecheck` come disponibile.

Un test di componente o servizio con Supabase simulato dimostra solo le asserzioni client. Non certifica policy RLS, privilegi RPC, transazioni reali, concorrenza PostgreSQL o consegna realtime fra due dispositivi. L'E2E corrente simula il backend di autenticazione. Le prove e le lacune sono in [verification.md](verification.md).

Rationale: riutilizzare gli strumenti esistenti senza introdurre un framework soltanto per SpecLedger.

Code: [CI](../.github/workflows/ci.yml), [Playwright](../apps/web-e2e/playwright.config.mts), [test realtime client](../apps/web/src/app/core/app-store-live.spec.ts), [E2E](../apps/web-e2e/src/example.spec.ts).
Verification: configurazione Nx interrogata; risultati delle esecuzioni separati nell'inventario delle verifiche.

## ARCH-005 — Configurazione runtime e distribuzione SPA

Type: Decision
Status: Accepted
Evidence: Observed behavior; ispezione dei file di configurazione.

Prima di bootstrap, `index.html` carica `env.js`, che espone `window.__BILIARDINO_ENV__`. Il generatore legge `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`: il valore non vuoto del processo prevale sul file `.env`. Produce soltanto URL e chiave pubblicabile destinati al browser; una chiave server privilegiata non appartiene a questo contratto.

`readRuntimeEnvironment` rimuove gli spazi e restituisce configurazione assente se manca uno dei due valori. In questo caso non viene creato un client Supabase e la shell mostra l'avviso di configurazione mancante. `npm run start` e `npm run build:web` eseguono il generatore prima di Nx; invocare direttamente `npx nx build web` non equivale a rigenerare `env.js`.

Netlify è configurato per eseguire `npm run build:web`, pubblicare `dist/apps/web/browser` e riscrivere le rotte su `/index.html`. Il changelog radice è copiato fra gli asset dal target build. I documenti `docs/` sono specifiche della repository, non nuove pagine pubblicate nell'app.

Divergenza operativa: `package.json` dichiara Node 24.18.0 tramite Volta e la CI usa Node 24, mentre `netlify.toml` dichiara Node 22.22.3. Si conserva la distinzione fra configurazioni osservate, senza certificare compatibilità o cambiare hosting durante l'adozione; limite in [open-questions.md](open-questions.md).

Rationale: il motivo storico della configurazione runtime e del provider di hosting non è registrato nelle fonti.

Code: [generatore](../tools/generate-env.mjs), [lettore runtime](../apps/web/src/app/core/runtime-env.ts), [HTML](../apps/web/src/index.html), [Netlify](../netlify.toml).
Verification: ispezione statica; nessun segreto letto e nessun deploy eseguito.

## ARCH-006 — Release, changelog e fonte della versione

Type: Decision
Status: Accepted
Source: istruzioni repository preesistenti, sezione Delivery and versioning; implementazione della versione ispezionata.

Ogni commit rappresenta una versione applicativa. Il lavoro implementativo non ancora committato confluisce in una sola versione pendente nel changelog e nei due manifest npm. Solo fix: patch; se si aggiunge una feature prima del commit, la versione pendente diventa la prossima minor e ingloba i fix. `Bugfixes` descrive difetti verificati; `Changes` descrive affinamenti non difettuali.

La versione mostrata dalla shell proviene da `package.json` attraverso `APP_VERSION`. Il changelog rivolto all'utente resta in radice; le specifiche descrivono i contratti correnti e conservano separatamente la loro evoluzione. Non si duplica nel ledger il testo integrale di ogni release.

Code: [versione applicativa](../apps/web/src/app/app-version.ts), [manifest](../package.json), [lockfile](../package-lock.json), [changelog](../CHANGELOG.md).
Verification: lettura delle istruzioni e del collegamento alla versione; l'adozione documentale non corregge o implementa le regole di prodotto. La nota di rilascio e i manifest mantengono una sola versione pendente.
