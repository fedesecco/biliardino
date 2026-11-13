# Premi, avatar e riconoscimenti

Documento canonico del prefisso `AWARD`; [indice SpecLedger](../README.md). Distingue quattro concetti: stato mensile temporaneo, serie di vittorie corrente, medaglia globale corrente e premio mensile persistente. Non sono tutti trofei permanenti, anche se nel codice rimane il nome `Badge`.

## Stato ed eredità

Tutti i record hanno **Type: Requirement**, **Status: Accepted**, **Implementation: Implemented**, salvo AWARD-003. Baseline e decisioni del proprietario del 2026-11-13 in [open-questions.md](../open-questions.md). Evidenza da sorgente, asserzioni e skill artwork ispezionati; esecuzioni in [verification.md](../verification.md). Non sono state generate o validate immagini.

Inherits: [GEN-001](../general.md) per il calendario, [GEN-002](../general.md) per feedback osservato, [GEN-003](../general.md) e [accesso](access.md) per lettura pubblica. Architecture: [ARCH-002](../architecture.md), [ARCH-003](../architecture.md). La graduatoria e la medaglia globale sono [RANK-003/005](rankings.md); i dati del giocatore sono [PLAYER](players.md); la bacheca è [PROFILE-002](player-profile.md).

## AWARD-001 — Volti mensili temporanei

Il primo nella graduatoria del mese corrente riceve `Bomboclat` (`monthly-champion`); l'ultimo riceve `Scemo del Villaggio` (`monthly-last`) solo se la graduatoria ha almeno due giocatori distinti. Non sono richiesti dieci incontri, saldo positivo per il primo o saldo negativo per l'ultimo. Un solo partecipante riceve soltanto Bomboclat. Questi stati modificano il viso dell'avatar secondo AWARD-006, senza scrivere un premio in `monthly_champions`.

Il calcolo ordina le righe per `rank` e poi ID, deduplica il giocatore e assegna al massimo un destinatario per ciascuna estremità. Se il destinatario non esiste nell'elenco delle statistiche viene saltato, **senza promuovere** una posizione diversa. Il chiamante store passa le sole righe del mese corrente, secondo [RANK-005](rankings.md): il helper da solo non filtra per data. Un cambio di graduatoria ricalcola i volti; il vecchio leader non conserva il volto come premio permanente.

Code: [monthly-badges.ts](../../apps/web/src/app/core/monthly-badges/monthly-badges.ts), `calculateMonthlyBadgesFromStandings`, `CHAMPION_BADGE`, `LAST_BADGE`; [AppStore](../../apps/web/src/app/core/app-store.service.ts), `loadMonthlyAwards`, `badges`. Le due immagini mensili sono condivise fra tipi nel catalogo `AVATAR_SETS`.

Tests: [monthly-badges.spec.ts](../../apps/web/src/app/core/monthly-badges/monthly-badges.spec.ts):

- `calculates monthly awards without global ranking medals`: primo/ultimo, nessun badge al secondo, asset del tipo fornito.
- `resolves tied source ranks to one monthly award per position`: primo scelto per ID e un solo stato di ciascun tipo.
- `removes the old leader badge when the monthly ranking changes`: perdita del vecchio stato e assegnazione al nuovo leader.
- `skips unknown monthly recipients without promoting other positions`: nessun ripescaggio dei noti quando le estremità sono ignote.

Gap: insieme vuoto, unico giocatore, estremi a zero o dello stesso segno, duplicati e integrazione query/data di cambio mese non hanno asserzioni dedicate in questi casi.

Verification: testare estremità e cambio destinatario con dati del mese corretto; non confondere l'assegnazione temporanea con la finalizzazione AWARD-003.

## AWARD-002 — Serie corrente di vittorie e soglie dei capelli

La serie è il numero di vittorie consecutive più recenti del singolo giocatore, non un massimo storico né una serie giornaliera/mensile. Si leggono le sue partite ordinate a ritroso per `played_at`, `created_at`, `id`; una sconfitta interrompe il conteggio, non aver giocato non lo interrompe. Il vincitore è determinato confrontando i punteggi, incluse le partite legacy.

`current_win_streak` è persistito sul giocatore, non negativo e inizialmente zero. Dopo una partita si ricalcolano i quattro partecipanti; il ricalcolo ELO completo ricostruisce anche le serie in ordine cronologico. Il ricalcolo delle serie tiene conto dell'ordine delle partite, non del solo istante in cui arriva la richiesta di registrazione. Inizializzazione e backfill sono nella migrazione dedicata.

Le soglie correnti sono 3+, 5+, 10+. Si sceglie **solo la più alta** raggiunta: 2 non ha modifica, 3–4 usa `winstreak-3`, 5–9 `winstreak-5`, da 10 `winstreak-10`. Etichetta e descrizione riportano comunque il conteggio effettivo (es. `Winstreak: 14`, `14 vittorie consecutive`). Il cambio di tipo conserva la fascia e sceglie i relativi capelli; una serie finita ripristina i capelli base del tipo corrente.

Code: [202610100001_win_streak.sql](../../supabase/migrations/202610100001_win_streak.sql), `recalculate_win_streaks`, `recalculate_elo`, backfill; [registrazione corrente](../../supabase/migrations/202611050004_decrement_played_priority.sql), chiamata a `recalculate_win_streaks`; `calculateWinStreakBadges` in [monthly-badges.ts](../../apps/web/src/app/core/monthly-badges/monthly-badges.ts); `AppStore.badges`; `PlayerAvatar.avatarLayers`.

Tests: `assigns the highest matching current win streak badge` asserisce 2/3/5/10/14, fascia massima, descrizione e immagini; `uses female hair for a streak of %i wins` copre 3/5/10 femminili. [player-avatar.spec.ts](../../apps/web/src/app/core/player-avatar/player-avatar.spec.ts): `keeps the streak tier while switching between complete avatar types`, `restores the selected type’s base hair after a winstreak ends`. Sono test su conteggi forniti, **non sul calcolo SQL**.

Gap: ordinamento temporale, inserimento retrodatato, eliminazione/ricalcolo, assenza di partite e inclusione delle legacy non hanno copertura SQL individuata. La soglia 9 e il passaggio 4→5 non sono asseriti esplicitamente nel helper.

Verification: casi SQL deterministici di vittorie/sconfitta, pari timestamp e risultati retrodatati, più rendering della fascia ottenuta; nessun check è stato eseguito.

## AWARD-003 — Premio mensile persistente e finalizzazione
Implementation: Partially implemented


Inherits: [GEN-001](../general.md).

`finalize_monthly_champions` considera tutti i mesi precedenti al mese corrente di Roma e inserisce i giocatori con `rank=1` e saldo ELO **strettamente positivo** dalla vista mensile. Nessun premio per il mese corrente o un leader con saldo zero/negativo. La migrazione esegue un primo backfill e pianifica il job `finalize-monthly-champions` con espressione `5 3 1 * *`. Non è dichiarato il fuso orario del pianificatore: non si assume che equivalga alle 03:05 di Roma né si attesta che il job sia attivo nel servizio distribuito.

Il record conserva mese, giocatore, saldo assegnato e `awarded_at` con default `now()`. Il mese deve essere il primo giorno e il saldo deve essere positivo. La chiave primaria è **(mese, giocatore)**, non il solo mese. La funzione usa `ON CONFLICT (month_start, player_id) DO NOTHING`: ripetere la finalizzazione non aggiorna il saldo o l'istante di un premio già inserito e non rimuove premi preesistenti.

**Contratto accettato:** un solo vincitore permanente per mese; una volta assegnato, vincitore e saldo del premio sono congelati anche se lo storico viene successivamente ricalcolato. Una nuova esecuzione non deve aggiungere un altro vincitore né aggiornare quello già assegnato. Le condizioni mese chiuso e saldo positivo rimangono valide.

**Scostamento attuale:** dopo un ricalcolo la funzione può inserire un diverso vincitore dello stesso mese perché l'unicità è solo `(mese, giocatore)`. Il vecchio `dense_rank` poteva inoltre produrre co-vincitori; il successivo `row_number` non rimuove premi già salvati. Nessuna correzione dati o migrazione è inclusa. Se esistessero realmente co-vincitori storici, la loro riconciliazione richiederebbe un'ispezione e una decisione sui dati prima di eliminarli; non si presume che esistano.

La bacheca legge i record, non ricalcola i vincitori. `AppStore.loadMonthlyAwards` carica tutti i premi in ordine di mese decrescente; `subscribeToChanges` li ricarica agli eventi `monthly_champions`, pubblicati nella migrazione realtime. Lettura pubblica e impossibilità per il client ordinario di chiamare direttamente la finalizzazione sono definite dalle policy/grant e dal [dominio accesso](access.md).

Code: [202608050002_monthly_elo_champions.sql](../../supabase/migrations/202608050002_monthly_elo_champions.sql), tabella, `finalize_monthly_champions`, cron, revoca di esecuzione client; [202609280002_unique_monthly_ranks.sql](../../supabase/migrations/202609280002_unique_monthly_ranks.sql); [indice premi giocatore](../../supabase/migrations/202608050003_index_monthly_champions_player.sql); [realtime](../../supabase/migrations/202611050002_monthly_champions_realtime.sql); `AppStore.loadMonthlyAwards`, `subscribeToChanges`.

Tests: i test [PlayerDetailPage](../../apps/web/src/app/features/player-detail/player-detail-page.spec.ts) controllano premi forniti dal mock e asset in bacheca, non finalizzazione/persistenza. Gap: nessuna asserzione SQL individuata su mese chiuso, positività, idempotenza, spareggio, premio già esistente dopo ricalcolo o pianificazione cron.

Verification: integrazione isolata su mese corrente/passato, saldo positivo/nullo, doppia esecuzione e vincitore ricalcolato dopo assegnazione; audit operativo separato del job e dei suoi privilegi/fuso. La sola bacheca con fixture non verifica il congelamento unico.

## AWARD-004 — Illustrazione mensile, retroattivi e fallback

Il componente condiviso `TrophyArtwork` serve card mensile e bacheca/dialog; il nome accessibile del mese è italiano attraverso il calendario condiviso. I mesi **precedenti ad agosto 2026** sono retroattivi e usano la coppa cartacea `legacy-paper-256.webp`/`legacy-paper-1024.webp`, con etichetta `Miglior giocatore di …`.

Da agosto 2026 il premio è classificato come esclusivo per data, indipendentemente dalla presenza dell'immagine. Il registro corrente contiene agosto, settembre, ottobre e novembre 2026. Ciascun mese registrato ha WebP 256 per thumbnail e 1024 per hero; senza registrazione, un mese da agosto in poi mostra la coppa SVG di fallback e il nome accessibile `Nessun premio disponibile per …`. Non sostituisce la coppa cartacea per i mesi retroattivi.

Nella card mensile l'intestazione `Premio esclusivo …` compare solo se il mese è nel registro; altrimenti compare `Non c'è ancora un premio per questo mese`. In bacheca la classificazione permanente/esclusiva si basa invece sulla soglia agosto, anche per un mese privo di artwork. Disponibilità grafica e diritto al premio sono quindi separati.

Code: [trophy-artwork.ts](../../apps/web/src/app/core/trophy-artwork.ts), `TROPHY_IMAGE_BY_MONTH`, `LEGACY_PAPER_IMAGES`, `hasExclusiveTrophyArtwork`, `TrophyArtwork.isExclusive`, `imageUrl`, `artworkLabel`; [AnalyticsPage](../../apps/web/src/app/features/analytics/analytics-page.ts), `hasMonthlyArtwork`; [template card](../../apps/web/src/app/features/analytics/analytics-page.html); [PlayerDetailPage](../../apps/web/src/app/features/player-detail/player-detail-page.ts), `trophies`. I file registrati risultano presenti nella directory [public/trophies](../../apps/web/public/trophies); non sono state decodificate o validate le immagini.

Tests: [analytics-page.spec.ts](../../apps/web/src/app/features/analytics/analytics-page.spec.ts), `renders the registered hero artwork for November 2026`, `shows a pending message when the current month has no prize artwork` (dicembre 2026 e fallback accessibile); [player-detail-page.spec.ts](../../apps/web/src/app/features/player-detail/player-detail-page.spec.ts), `shows retroactive paper awards and exclusive prizes in the bacheca` (thumbnail luglio/agosto/ottobre/novembre).

Gap: mese esclusivo senza registro già in bacheca, mese registrato scelto nel dialog hero e aspetto visivo reale. La copertura dei due formati nei consumatori non prova la qualità/trasparenza degli asset.

Verification: controlli deterministici dei due consumatori e delle varianti; revisione visuale quando cambia componente/layout, non attestata in questa adozione.

## AWARD-005 — Preparazione e registrazione di nuovi artwork

Il percorso di repository per una futura aggiunta è `npm run badge:prepare -- --source "<immagine>" --month YYYY-MM`, dal workspace. La sorgente rimane fuori dall'albero asset dell'app. Il helper richiede PNG o WebP quadrata, da 1024×1024 a 4096×4096, canale alpha con almeno quattro canali, pixel realmente trasparenti e quattro angoli completamente trasparenti. Un'immagine non conforme viene rifiutata prima della generazione.

Genera i due WebP `YYYY-MM-1024.webp` e `YYYY-MM-256.webp` e registra la chiave `YYYY-MM-01` in `TROPHY_IMAGE_BY_MONTH`; rieseguire non duplica la voce già registrata (ma rigenera i file). La label del mese resta nel componente condiviso. Non si rimuovono i fallback.

Il workflow della skill richiede inoltre di controllare le fixture che usano quel mese come non registrato, aggiornare la release pendente del changelog e verificare consumatori hero/thumbnail con i task di progetto. Browser solo se cambiano componente/template/stile/layout, non per la normale sola aggiunta asset. Queste sono istruzioni per un **successivo incarico artwork**: qui non sono stati generati file, cambiati changelog/versioni o lanciati task.

Source / evidence: [skill monthly-badge-artwork](../../.agents/skills/monthly-badge-artwork/SKILL.md), [prepare-monthly-badge.mjs](../../.agents/skills/monthly-badge-artwork/scripts/prepare-monthly-badge.mjs), `assertSource`, `registerArtwork`, `parseArgs`; [package.json](../../package.json), script `badge:prepare`. La distinzione del fallback per epoca è esplicitata in AWARD-004 sulla base del consumatore corrente; la frase generica «mesi sconosciuti» della skill non implica sostituire i retroattivi.

Tests: nessun test automatico del helper individuato nel perimetro esplorato; le asserzioni sui consumatori sono quelle di AWARD-004. Verification: in un futuro incarico eseguire il workflow della skill e i controlli Nx previsti, una volta dopo le modifiche; nessuna esecuzione rivendicata qui.

## AWARD-006 — Composizione dei tre livelli dell'avatar

L'avatar è composto nell'ordine **testa/pelle → viso → capelli**, su canvas canonico 512×512, non da iniziali o badge sovrapposti. Il colore del giocatore rimane lo sfondo. Il tipo persistito ([PLAYER-004](players.md)) sceglie viso e capelli base; teste base/oro/argento/bronzo e volti Bomboclat/Scemo sono condivisi fra Maschio/Femmina. I capelli base e delle tre serie hanno varianti per tipo. Gli URL del catalogo aggiungono la versione applicativa come parametro.

In modalità automatica, la medaglia globale determina la testa e il bordo; il primo badge mensile determina il viso; il primo badge di serie riconosciuto determina i capelli. I tre stati coesistono e non si sostituiscono fra categorie. Senza stato si usa il corrispondente livello base. Lo store unisce prima il badge mensile e poi quello della fascia massima di serie; il componente non sceglie autonomamente la fascia più alta fra input arbitrari duplicati.

Un input esplicito `composition` ha precedenza su **tutti** i livelli automatici e può combinare tipi diversi per livello; rimuoverlo ripristina la composizione automatica. Bordo e classe medaglia seguono la testa effettiva, anche in manuale. Questa precedenza serve il laboratorio, non salva una personalizzazione nel profilo.

Il contenitore dei livelli ha ruolo immagine e label `Avatar di <nome>` con medaglia, stato mensile e descrizione della serie quando automatici; le immagini di livello sono decorative (`alt=""`, `aria-hidden`). In manuale la label contiene solo il nome. I nomi colorati sono resi dai consumatori in base alla medaglia, non dal componente avatar.

Code: [avatar-assets.ts](../../apps/web/src/app/core/avatar-assets/avatar-assets.ts), `AvatarVariants`, `AvatarComposition`, `AVATAR_SETS`; [PlayerAvatar](../../apps/web/src/app/core/player-avatar/player-avatar.ts), `headPart`, `monthlyBadge`, `streakBadge`, `avatarLayers`, `avatarLabel`, `medalBorderColor`; `AppStore.badges`.

Tests: [player-avatar.spec.ts](../../apps/web/src/app/core/player-avatar/player-avatar.spec.ts): `renders the three base avatar layers by default` (canvas, assenza iniziali, sfondo, ruolo/label); `uses the female base face and hair for female avatars`; `keeps hero avatars on the canonical artwork canvas`; `composes ranking, monthly and winstreak status in separate layers`; `lets manual parts override status and restores status when cleared`; `changes the face for the monthly last-place status`. Ulteriore consumo: `renders winstreak hair without clipping the player card` in [play-page.spec.ts](../../apps/web/src/app/features/play/play-page.spec.ts) controlla presenza capelli e overflow della card, non una prova visuale multipiattaforma.

Verification: mantenere test di composizione e precedenza e, per cambi di asset/layout, osservare i consumatori reali; non derivare dalle sole dimensioni dichiarate la correttezza grafica.

## AWARD-007 — Nuovi riconoscimenti dopo la conferma partita

Lo store confronta snapshot prima/dopo il comando `finish` **dei soli partecipanti della partita**, dopo aver richiesto il refresh dei dati. Non notifica automaticamente ogni cambiamento di classifica di un non partecipante o ogni premio permanente mensile appena finalizzato.

Un nuovo riconoscimento comprende giocatore, categoria, titolo/descrizione e immagine. Una medaglia genera riconoscimento solo all'acquisizione o al miglioramento (`nessuna < bronzo < argento < oro`), non alla retrocessione. Un badge mensile si notifica se il suo tipo prima mancava. La serie genera riconoscimento soltanto entrando in una nuova fascia e con conteggio cresciuto: 3→4 non notifica, 5→3 non notifica; 5→10 sì. Il confronto non è un archivio di riconoscimenti ottenuti in passato e non impedisce una riacquisizione futura.

Per ciascuno snapshot dopo, la medaglia precede i badge; fra giocatori vale l'ordine degli snapshot delle statistiche, non un ordine esplicitamente per squadra. La coda è in memoria, sostituita con il nuovo confronto. Il dialog applicativo mostra un riconoscimento alla volta: `OK` avanza; chiusura/Escape eliminano la coda restante. I titoli mantengono il termine `badge` per mensile/serie nonostante il rendering corrente avvenga con parti dell'avatar.

Code: `AppStore.changePlay`, `recognitionSnapshots`, `newRecognitions`, `currentRecognition`, `dismissRecognition`, `dismissRecognitions`; [recognitions.ts](../../apps/web/src/app/core/recognitions/recognitions.ts), `findNewRecognitions`, `recognitionDialogTitle`, `GLOBAL_MEDAL_DETAILS`; [app.ts](../../apps/web/src/app/app.ts), effetto dialog; [app.html](../../apps/web/src/app/app.html), dialog e pulsante.

Tests: [recognitions.spec.ts](../../apps/web/src/app/core/recognitions/recognitions.spec.ts), `detects a new medal and a higher streak tier`, `uses the recipient type for a new medal and preserves female badge artwork`, `ignores streak progress inside the same tier and downgrades`, `detects a new monthly badge`, `uses the glossary in recognition dialog titles`; [app.spec.ts](../../apps/web/src/app/app.spec.ts), `shows queued recognitions one dialog at a time` inserisce la coda direttamente e verifica avanzamento con OK.

Gap: il test del dialog non attraversa conferma partita → refresh → confronto; non copre Escape, chiusura, ordine di più giocatori, riacquisizione o non partecipanti. Non sono state esercitate le notifiche su più dispositivi.

Verification: integrazione di una conferma reale con acquisizioni simultanee e controllo che una progressione nella stessa fascia non apra un nuovo dialog; validare separatamente autorizzazione e sincronizzazione del gioco.

## AWARD-008 — Laboratorio locale senza modifica dei giocatori

`/avatar-lab` è una rotta senza guard, distinta dalla gestione giocatori. Consente di combinare liberamente base, occhi/viso e capelli nell'anteprima attraverso `composition`, senza usare `AppStore`, richieste di salvataggio o campi del giocatore. L'iniziale combina testa e viso maschili base con capelli femminili base. Parti condivise appaiono una volta con etichetta `Comune`, le altre riportano il tipo; il raggruppamento usa gli oggetti artwork condivisi del catalogo.

Un solo elenco è aperto alla volta. I controlli espongono combobox/listbox/opzioni, selezione e indice attivo; frecce navigano senza oltrepassare gli estremi, Home/End vanno agli estremi, Enter/spazio aprono o confermano, Tab ed Escape chiudono. Dopo scelta o Escape il focus torna al trigger. Pointer esterno/blur chiudono; il pannello si posiziona sopra o sotto in base allo spazio disponibile e l'opzione attiva viene mantenuta visibile.

Code: [AvatarLabPage](../../apps/web/src/app/features/avatar-lab/avatar-lab-page.ts), `avatarOptions`, `controls`, `composition`, `choose`, `onKeydown`, `onOutsidePointerDown`, `positionDropdown`, `scrollActiveOptionIntoView`; [template](../../apps/web/src/app/features/avatar-lab/avatar-lab-page.html); [rotte](../../apps/web/src/app/app.routes.ts).

Tests: nessun file di test del laboratorio individuato nella cartella. Il test manuale della `composition` in `PlayerAvatar` copre solo il consumatore dei livelli, non combobox, focus, deduplicazione o mancata persistenza del laboratorio.

Verification: navigazione via tastiera e pointer, gestione focus/pannello su viewport diversi e assenza di scritture al cambio delle parti, in un futuro ambiente di verifica.

## Decisioni accettate e limiti

Il premio già assegnato è unico e congelato; AWARD-003 resta parzialmente implementato. Confermati calendario Roma, soglie 3/5/10, estremi mensili senza soglia/segno, cutoff grafico agosto 2026, fallback cartaceo/SVG secondo epoca, tipo e precedenza dei livelli, notifiche ai soli partecipanti e laboratorio non persistente. Il fuso cron e la presenza di eventuali co-vincitori storici non sono accertati; non si inventano dati o correzioni distruttive.

## Storia conservata, non requisiti attivi

- [CHANGELOG 1.2.0](../../CHANGELOG.md): premi permanenti mensili e **badge settimanali** Bomboclat/Scemo, icone sovrapposte agli avatar. La graduatoria settimanale non è il contratto corrente di AWARD-001.
- 1.3.1: premio settembre e messaggio quando manca l'immagine; 1.4.0: ottobre, trasferimento dei due badge al mese e rimozione della settimana; posizioni mensili uniche. Fonti SQL: `dense_rank` della [migrazione iniziale](../../supabase/migrations/202608050002_monthly_elo_champions.sql), poi [row_number](../../supabase/migrations/202609280002_unique_monthly_ranks.sql). Non si cancellano i premi storici per dedurne l'intento.
- 1.5.0: serie 3/5/10, dialog sequenziale e styling medaglie; 1.5.1: effetti al posto dei badge; 1.6.0: avatar a pelle/viso/capelli, rimozione della resa badge precedente. Il tipo `Badge` sopravvive internamente, ma non autorizza il ripristino dei vecchi overlay.
- 1.7.0: tipo Maschio/Femmina e illustrazione novembre. 1.8.0: card espanse in pagina e premio sopra l'anteprima. Le voci storiche descrivono cambiamenti, non fonti concorrenti per rendering attuale.

## Perimetro non verificato

Ispezionati catalogo, componente avatar e test, helper badge/riconoscimenti e test, laboratorio e template, componenti card/bacheca e relative asserzioni, store pertinente, migrazioni mensili/serie e script artwork. Nessuna validazione binaria degli asset, verifica visuale, chiamata Supabase, controllo del cron distribuito o dato di produzione. Esiti delle esecuzioni in [verification.md](../verification.md); metadati e policy nei file non attestano lo stato del deployment.
