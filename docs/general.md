# Regole condivise — GEN

Questa è l'autorità delle regole trasversali; le feature le ereditano senza copiarle. Baseline accettata dal proprietario il 2026-11-13, con le precisazioni in [open-questions.md](open-questions.md). `Implemented` indica riscontro nel sorgente; le esecuzioni e i limiti sono in [verification.md](verification.md), non implicano verifica end-to-end.

Tutti i record di questo documento hanno **Type: Requirement; Status: Accepted; Implementation: Implemented**. Le fonti sono sorgente e test ispezionati, più l'approvazione esplicita della baseline. Non si inventa un protocollo universale di salvataggio dove le pagine hanno comportamenti differenti.

## GEN-001 — Calendario di prodotto e orari visualizzati

Il giorno e il mese usati per priorità, classifiche e premi sono quelli del calendario `Europe/Rome`, inclusi i cambi di ora legale. Le finestre giornaliere comprendono l'inizio e non comprendono l'inizio del giorno successivo. Il mese è identificato dal suo primo giorno, non da trenta giorni mobili né dal mese UTC del dispositivo.

Le etichette sono italiane. Gli orari delle partite mostrati mediante DatePipe restano nel fuso del dispositivo: il proprietario ha confermato questa distinzione rispetto ai confini di aggregazione. Non si deve dedurre dal fuso di visualizzazione un diverso mese competitivo. La schedulazione del job database ha un proprio fuso operativo non accertato: non equivale automaticamente all'orario di Roma.

Code: [rome-calendar.ts](../apps/web/src/app/core/rome-calendar/rome-calendar.ts), `AppStore.loadMonthlyAwards`, [priorità giornaliera SQL](../supabase/migrations/202611050003_daily_first_game_priority.sql), [premi mensili SQL](../supabase/migrations/202608050002_monthly_elo_champions.sql), template storico/profilo.
Tests: [rome-calendar.spec.ts](../apps/web/src/app/core/rome-calendar/rome-calendar.spec.ts), caso «uses the complete calendar month in Europe/Rome», verifica due transizioni di mese a mezzanotte italiana durante l'ora legale. Non verifica confini invernali, DST, cron né conversioni SQL.
Verification: confronto statico fra helper e finestre SQL; nessuna esecuzione del job mensile.

## GEN-002 — Caricamento, errori e feedback delle operazioni

Il refresh condiviso segnala caricamento, azzera il precedente errore e carica giocatori, statistiche e premi; in caso di errore lo espone e termina comunque lo stato di caricamento. Il messaggio disponibile dall'oggetto errore viene preservato quando riconosciuto, altrimenti compare il fallback di sincronizzazione. Lo storico mantiene stati di caricamento/errore distinti da quelli globali. Le pagine espongono i propri errori locali e bloccano i rispettivi comandi pendenti; le condizioni precise di conservazione dei dati sono nei documenti di feature.

Le operazioni di creazione/aggiornamento giocatore, conferma ed eliminazione partita impostano una notifica di successo soltanto dopo una risposta di persistenza senza errore. Il successivo refresh dei dati è una fase distinta: un suo fallimento non significa automaticamente che il salvataggio sia fallito. Non è un contratto di cache offline o di aggiornamento ottimistico.

La notifica è chiudibile manualmente e scompare dopo due secondi; sostituirla o distruggere il componente annulla il timer precedente. La coda dei riconoscimenti non usa questo timeout: il suo contratto è [AWARD-007](features/awards-avatars.md).

Code: `AppStore.refresh`, `errorMessage`, `createPlayer`, `updatePlayer`, `changePlay`, `deleteMatch`; [App](../apps/web/src/app/app.ts) e [template](../apps/web/src/app/app.html).
Tests: [app.spec.ts](../apps/web/src/app/app.spec.ts), «dismisses notices automatically after two seconds», controlla presenza a 1999 ms e scomparsa a 2000 ms; i test di gioco e storico verificano alcuni errori simulati. Non coprono tutti i salvataggi o un fallimento reale di refresh dopo commit.

## GEN-003 — Shell, percorsi e consultazione

La shell identifica l'app come Coppa Telenia. Il marchio apre la nuova partita; la versione accanto al marchio apre il changelog. Il controllo account apre l'accesso senza sessione e consente di uscire quando una sessione esiste; l'etichetta Connesso non sostituisce la verifica di autorizzazione di [AUTH-001](features/access.md).

La navigazione principale comprende Gioca, Classifiche e Storico; Giocatori compare soltanto per l'account autorizzato. Le politiche di lettura e modifica sono definite in [accesso](features/access.md), non dal numero di link visibili.

| Percorso | Destinazione e accesso alla route |
| --- | --- |
| `/` | Nuova partita; route pubblica, partita condivisa nascosta ai non autorizzati |
| `/classifiche` | Anteprime e classifiche espandibili nella stessa pagina |
| `/storico` | Archivio pubblico e filtro giocatore |
| `/giocatore/:id` | Profilo pubblico |
| `/giocatori` | Gestione giocatori, guard dell'account condiviso |
| `/accedi` | Accesso con password dell'account condiviso |
| `/changelog` | Changelog pubblico |
| `/avatar-lab` | Laboratorio avatar senza voce nella navigazione principale |
| Altri percorsi | Redirect a `/` |

La route laboratorio non è protetta da guard nel sorgente; è una superficie di anteprima, non un comando di modifica del database. Le feature ricevono azioni contestuali nello stesso dock della navigazione; cambiare pagina rimuove le azioni della pagina precedente.

Code: [rotte](../apps/web/src/app/app.routes.ts), `App.pageActions`/`bottomActions`, [shell](../apps/web/src/app/app.html).
Tests: «renders the public navigation when Supabase is not configured» in [app.spec.ts](../apps/web/src/app/app.spec.ts) verifica navigazione pubblica, collegamento versione e avviso. Non copre tutti i deep link, la guard o il logout reale.

## GEN-004 — Dock responsive e leggibilità della superficie

Il menu è fissato in basso e rispetta le safe area. Su schermi stretti le azioni contestuali sono centrate sopra il menu; da 62rem sono affiancate e centrate come un gruppo. La shell riserva spazio inferiore per evitare che il dock copra il contenuto; il contenuto principale ha larghezza massima di 72rem. Le classifiche si espandono nella pagina, senza aprire sezioni o route dedicate aggiuntive.

Code: [app.scss](../apps/web/src/app/app.scss), `.bottom-dock`, `.bottom-nav`, `.app-shell.has-bottom-actions`; `CHANGELOG.md` 1.8.0. Per le interazioni delle classifiche si rimanda a [RANK](features/rankings.md).
Verification: ispezione di SCSS e changelog; non eseguita una verifica visuale su mobile/desktop durante l'adozione. Non è una certificazione anti-overlap per ogni dispositivo.

## GEN-005 — Convenzioni visive e accessibilità condivise

L'interfaccia usa la palette chiara e i token in `styles.scss`, con superfici color carta, azione primaria scura, azione secondaria chiara e azione distruttiva rossa. Le squadre sono rosso/blu; gli stili delle medaglie condividono i token oro/argento/bronzo, mentre l'attribuzione dei vantaggi è in [RANK-002](features/rankings.md). Non si copiano in ogni feature colori e misure globali.

I pulsanti disabilitati hanno indicatore visivo e cursore non consentito. Il focus da tastiera è evidenziato; il collegamento iniziale «Vai al contenuto» porta al main. La preferenza `prefers-reduced-motion` riduce animazioni e transizioni. Le immagini decorative della shell e del riepilogo riconoscimenti non aggiungono testo ridondante ai lettori di schermo; il titolo identifica la dialog dei riconoscimenti.

Code: [styles.scss](../apps/web/src/styles.scss), [app.html](../apps/web/src/app/app.html), [index.html](../apps/web/src/index.html).
Verification: ispezione delle regole presenti. Non eseguiti audit WCAG, contrasto, screen reader o navigazione tastiera completa: l'adozione non dichiara conformità generale.

## GEN-006 — Changelog consultabile nell'app

Il changelog pubblicato deriva dal file radice [CHANGELOG.md](../CHANGELOG.md), non da una copia scritta a mano nel componente. La pagina carica il Markdown, lo converte con `marked` e lo presenta nell'app; durante la richiesta espone stato di caricamento e, se il caricamento fallisce, un errore leggibile. Il documento è un asset di release controllato dalla repository, non una funzione di inserimento Markdown arbitrario da parte degli utenti.

Code: [ChangelogPage](../apps/web/src/app/features/changelog/changelog-page.ts), [template](../apps/web/src/app/features/changelog/changelog-page.html), configurazione asset di `web:build`.
Tests: [changelog-page.spec.ts](../apps/web/src/app/features/changelog/changelog-page.spec.ts), «renders the changelog Markdown as headings and a list», verifica il rendering di una risposta simulata. Non verifica errori HTTP, asset distribuito o validità dei collegamenti delle specifiche.
