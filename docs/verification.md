# Verifiche, tracciabilità e limiti

## Come leggere l'evidenza

La baseline è stata ricostruita sul sorgente della release 1.8.0, revisione `5ca8fa4`, e sulle decisioni del proprietario del 2026-11-13. La versione pendente 1.8.1 aggiunge documentazione e integrazione delle istruzioni, non fix applicativi. Il sorgente dei test non è stato modificato.

Tre domande restano separate: il requisito ha asserzioni pertinenti? Quelle asserzioni sono state eseguite? Corrispondono all'intento corrente? Un mock con valori già calcolati non verifica la formula SQL; un nome di test senza asserzioni pertinenti non stabilisce copertura. I documenti di feature specificano casi e lacune, questa pagina raccoglie una sola volta l'esecuzione.

Nessun requisito viene marcato `Verified` sull'intero ambito soltanto perché esiste o passa un test client. Gli stati `Implemented` derivano dall'ispezione; gli scostamenti accettati sono `Partially implemented`, con mappa in [open-questions.md](open-questions.md). Una successiva modifica di specifica o implementazione richiede rivalutazione dell'evidenza interessata.

## Inventario delle asserzioni esistenti

I percorsi client sono relativi a `apps/web/src/app/`. Sono stati individuati 13 file client e un E2E; non una suite automatica di integrazione PostgreSQL.

| File esistente | Requisiti rintracciabili | Cosa stabiliscono le asserzioni / limite principale |
| --- | --- | --- |
| [app.spec.ts](../apps/web/src/app/app.spec.ts) | GEN-002, GEN-003, AUTH-006, AWARD-007 | Navigazione pubblica senza configurazione, avviso/versione, coda inserita direttamente e timeout notifica 1999/2000 ms; non conferma partita reale. |
| [core/app-store-live.spec.ts](../apps/web/src/app/core/app-store-live.spec.ts) | AUTH-003, PLAY-001, PLAY-005, PLAY-006 | Stato client con Supabase simulato: logout, snapshot tardivo, revisioni, reconnect/subscription; non lock, RLS o due dispositivi reali. |
| [core/monthly-badges/monthly-badges.spec.ts](../apps/web/src/app/core/monthly-badges/monthly-badges.spec.ts) | AWARD-001, AWARD-002 | Destinatari temporanei e fasce serie su righe/conteggi forniti; non viste SQL o calcolo reale della serie. |
| [core/player-avatar/player-avatar.spec.ts](../apps/web/src/app/core/player-avatar/player-avatar.spec.ts) | AWARD-006 | Composizione, precedenza manuale, tipo, immagini e label; non qualità binaria o rendering reale multipiattaforma. |
| [core/recognitions/recognitions.spec.ts](../apps/web/src/app/core/recognitions/recognitions.spec.ts) | AWARD-007 | Confronto snapshot, nuove fasce e medaglie, esclusione progressi/retrocessioni; non catena RPC→refresh→dialog. |
| [core/rome-calendar/rome-calendar.spec.ts](../apps/web/src/app/core/rome-calendar/rome-calendar.spec.ts) | GEN-001 | Due transizioni di mese nel fuso Roma estivo; non DST, SQL o cron. |
| [features/analytics/analytics-page.spec.ts](../apps/web/src/app/features/analytics/analytics-page.spec.ts) | RANK-004, RANK-005, AWARD-004 | Card e toggle senza navigazione, ordine mensile distinto, artwork/fallback con store simulato; non anteprima qualificata/parità chiarita dal proprietario. |
| [features/changelog/changelog-page.spec.ts](../apps/web/src/app/features/changelog/changelog-page.spec.ts) | GEN-006 | Markdown simulato reso come titoli/lista; non asset distribuito o fallimenti HTTP. |
| [features/history/history-page.spec.ts](../apps/web/src/app/features/history/history-page.spec.ts) | HIST-001, HIST-002, HIST-003 | Filtro mock, avatar/link correnti, visibilità a 5/11 minuti e conferma; non soglie esatte, paginazione reale, eliminazione o replay SQL. |
| [features/play/play-page.spec.ts](../apps/web/src/app/features/play/play-page.spec.ts) | PLAY, PICK-001, ELO-004, AWARD-006 | Selezione/rendering/errori, comandi pendenti, conservazione dati e anteprima numerica con store simulato; non algoritmo di estrazione o transizioni PostgreSQL. |
| [features/player-detail/player-detail-page.spec.ts](../apps/web/src/app/features/player-detail/player-detail-page.spec.ts) | PROFILE-001–PROFILE-005, AWARD-004, AWARD-006 | Profilo, bacheca, cinque risultati, quattro rapporti forniti e cambio ID; non SQL, dialog trofeo, gare asincrone o categorie parziali. |
| [features/players/players-page.spec.ts](../apps/web/src/app/features/players/players-page.spec.ts) | PLAYER-001, PLAYER-003, PLAYER-004 | Link, venti colori/primo libero, tipo; non persistenza, unicità concorrente o esaurimento palette. |
| [features/ranking/ranking-page.spec.ts](../apps/web/src/app/features/ranking/ranking-page.spec.ts) | RANK-001, RANK-002, RANK-003 | Numerazione dei qualificati con dati forniti, stile e link; medaglie simulate, nessun pari merito o aggregato SQL. |
| [web-e2e/src/example.spec.ts](../apps/web-e2e/src/example.spec.ts) | AUTH-002 | Browser login con email fissa, minimo password e risposta Auth simulata; non autenticazione reale, policy o partita. |

Gli ID nei documenti collegano i casi già esistenti senza rinominarli soltanto per adottare il metodo. Quando un test viene modificato sostanzialmente, aggiungere l'ID nel nome o nei metadati. Non introdurre un test per ogni riga di documentazione né eliminare prove utili solo perché non hanno ancora un ID.

## Registro delle esecuzioni di adozione — 2026-11-13

| Comando / controllo | Ambito ed esito osservato |
| --- | --- |
| `npx nx show project web --json` | Eseguito con successo: target risolti build, serve, serve-static, test, lint. Nessun target web:typecheck isolato. |
| `npx nx show project web-e2e --json` | Eseguito con successo: target Playwright e configurazione risolta. |
| `npx nx test web` | Passato: 13 file, 73 test, nessun cache hit; target Nx concluso con successo in circa 73 secondi. Il log contiene errori non bloccanti di parsing CSS di jsdom e warning NO_COLOR/FORCE_COLOR; non provano la resa visuale né la conformità dei requisiti parziali. |
| Controllo documentale Node tramite stdin, senza file permanenti | Controllati 15 documenti, 62 definizioni uniche, 11 prefissi proprietari, 339 collegamenti locali/anchor e presenza nell'inventario di tutte le 30 migrazioni; versione 1.8.1 coerente fra manifest/changelog e rinvio delle istruzioni presente. Nessun errore su questi controlli. |
| Risoluzione dei riferimenti ID | 358 occorrenze, nessun riferimento irrisolto. Il primo scanner segnalava due falsi positivi nei nomi esemplificativi YYYY-MM-1024.webp e YYYY-MM-256.webp: il riconoscimento è stato ristretto ai token ID, senza creare requisiti fittizi o cambiare la documentazione per il parser. |

Il controllo documentale segue la checklist runtime-independent della skill: unicità delle definizioni, proprietà prefissi, riferimenti ID, collegamenti locali/anchor, stati e scostamenti, completezza dell'inventario migrazioni, coerenza versione/changelog e instradamento delle istruzioni. Un controllo sintattico non prova coerenza semantica, non-riuso in una storia inaccessibile o adeguatezza dei test: il confronto con l'intento è stato svolto tramite ispezione e questionari al proprietario.

Non eseguiti: E2E browser, build/lint applicativi, integrazione SQL, accesso Supabase live, deploy, migrazioni, cron, ispezione visuale o validazione artwork. Non sono necessari per provare un cambiamento di UI che qui non è avvenuto; restano necessari per future dichiarazioni di conformità dei rispettivi comportamenti. Non è stata rieseguita alcuna migrazione per creare una baseline.

## Comandi esistenti e ambiente sicuro

- Test client: `npx nx test web`.
- Lint client: `npx nx lint web`.
- Build con preparazione ambiente: `npm run build:web` (il wrapper esegue il generatore e poi Nx).
- Avvio: `npm run start`; genera l'asset runtime prima del target Nx serve.
- E2E: `npx nx e2e web-e2e`; la configurazione avvia `npm run start` e usa mobile Chromium, con eventuale `BASE_URL`.

Non serve aggiungere un runtime o un framework per SpecLedger. Le future prove database richiedono un ambiente dedicato con dati sintetici e ruoli reali, non dati/segreti di produzione né sole risposte mockate. Le istruzioni repository richiedono log API/PostgreSQL e schema live prima di futuri interventi database, non per questa sola ricostruzione statica.

## Ordine del lavoro di conformità, distinto dall'adozione conclusa

1. Contratti a rischio di perdita risultato o inconsistenza: PLAY-003/PLAY-004 e HIST-003, con controlli RPC/transazioni e superficie reale.
2. Coerenza delle classifiche e dei vantaggi: RANK-002/RANK-003/RANK-004, con pari merito, soglia e taglio dell'anteprima.
3. Vincoli condivisi di persistenza: PLAYER-003 e AWARD-003; prima di eventuali correzioni dati, ispezionare e chiedere decisioni sui casi storici reali.
4. Categorie parziali nel profilo: PROFILE-005; verificare i rapporti indipendentemente e le risposte asincrone.
5. Rafforzare la baseline esistente per formule/replay/import, paginazione e permessi, poi smoke reale di conferma e recupero fra due browser.

Questo elenco non è autorizzazione a implementare tutto insieme: delimita gli scostamenti scoperti e i test mancanti. L'adozione documentale non viene presentata come piena conformità funzionale.
