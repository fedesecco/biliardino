# Decisioni di adozione e scostamenti

## Autorità e ambito dell'approvazione

Il 2026-11-13 il proprietario ha richiesto la documentazione di **tutto il prodotto passato**, non soltanto della partita condivisa. Nei due questionari di chiarimento ha dichiarato che non esistono ulteriori fonti esterne da integrare e ha approvato la baseline ricostruita coerentemente dalle fonti della repository, salvo i conflitti risolti qui o nuovi dubbi espliciti. I requisiti canonici restano nei documenti collegati: questa pagina registra provenienza e stato delle decisioni, non una seconda specifica.

L'incarico è documentale. Le risposte approvano l'intento, **non autorizzano in questa attività fix, migrazioni, correzioni dei dati o deploy**. Un requisito accettato può pertanto essere solo parzialmente implementato. Nessuna modifica alla skill personale SpecLedger è inclusa.

## Scelte risolte dal proprietario

| Tema del questionario | Esito / autorità canonica |
| --- | --- |
| Lettura della partita attiva | Confermata distinzione API pubblica / UI riservata: [AUTH-005](features/access.md). |
| Riconferma dopo Correggi | Approvato risultato valido riconfermabile senza modifiche artificiali: [PLAY-003](features/play.md). |
| Registrazione e turno successivo | Approvata indipendenza del salvataggio dalla nuova formazione: [PLAY-004](features/play.md). |
| Preferenza rosso/blu | Confermata preferenza di colore senza posto garantito: [PICK-002](features/team-selection.md). |
| Cutover ELO | Confermata versione persistita, non data di gioco: [ELO-002](features/ratings.md). |
| Confine temporale di eliminazione | Approvata finestra stretta sull'orologio server: [HIST-003](features/history.md). |
| Squadre dopo eliminazione | Confermate squadre già estratte invariate: [HIST-003](features/history.md). |
| Pari merito globale | Risposta libera del proprietario: stessa posizione e stessi vantaggi, con salto successivo; [RANK-002](features/rankings.md), [RANK-003](features/rankings.md). |
| Anteprima globale | Soltanto qualificati; secondo questionario: tre persone anche se tronca gli ex aequo; [RANK-004](features/rankings.md). |
| Unicità colori | Confermata su tutta la rosa, inclusi inattivi, accettando la palette di venti: [PLAYER-003](features/players.md). |
| Campione mensile | Approvato unico e congelato dopo assegnazione: [AWARD-003](features/awards-avatars.md). |
| Rapporti amici/nemici | Confermato saldo netto: [PROFILE-004](features/player-profile.md). |
| Visibilità rapporti | Approvata indipendenza di ogni categoria: [PROFILE-005](features/player-profile.md). |
| Precisione ELO visualizzata | Confermato arrotondamento della sola anteprima partita: [ELO-004](features/ratings.md). |
| Fuso di visualizzazione | Confermato fuso del dispositivo, distinto dal calendario competitivo Roma: [GEN-001](general.md). |

La scelta dei pari merito è stata formulata nella domanda sulla **classifica globale**: non si estende silenziosamente alla classifica mensile, che conserva posizioni uniche e un vincitore mensile. L'ID può stabilizzare la presentazione dei pari merito e il taglio dell'anteprima, ma non attribuire vantaggi diversi.

## Contratti accettati non completamente realizzati

| Requisito | Evidenza statica dello scostamento | Perimetro di una futura verifica, non eseguita qui |
| --- | --- | --- |
| [PLAY-003](features/play.md) | Stato `correcting` con finale valido non accettato da `finish`. | Transizioni e riconferma UI + RPC. |
| [PLAY-004](features/play.md) | Registrazione e sorteggio successivo nella stessa transazione senza ritorno a selezione; partecipanti richiesti ancora attivi. | Risultato preservato con candidati disattivati o nuova formazione impossibile. |
| [HIST-003](features/history.md) | SQL ammette confine di dieci minuti e timestamp futuri, diversamente dal contratto approvato. | Orologio server e soglie 0/10 minuti. |
| [RANK-002](features/rankings.md) | Numerazione progressiva senza pari merito. | Classifica competitiva con salti e non qualificati intercalati. |
| [RANK-003](features/rankings.md) | Medaglie uniche con spareggio per ID. | Medesimi vantaggi per tutti gli ex aequo. |
| [RANK-004](features/rankings.md) | Anteprima include giocatori sotto soglia e numeri 1/2/3 locali. | Tre qualificati, posizione ufficiale e taglio di un gruppo pari merito. |
| [PLAYER-003](features/players.md) | Unicità colori soltanto locale, senza vincolo database. | Scritture concorrenti e consistenza della rosa. |
| [AWARD-003](features/awards-avatars.md) | Chiave per mese+giocatore permette vincitori aggiuntivi dopo ricalcolo. | Ripetizione finalizzazione con vincitore cambiato, senza dati produttivi. |
| [PROFILE-005](features/player-profile.md) | Miglior nemico annidato nella condizione di peggior amico. | Categorie isolate e combinazioni parziali. |

Questi sono scostamenti documentati dal sorgente, non incidenti riprodotti sul deployment. Non vengono aggiunti test per sancire il comportamento sbagliato, né vengono modificati i test esistenti durante l'adozione. Prima dei futuri fix si usano i contratti accettati e le procedure della repository.

## Incognite operative e storiche non bloccanti

- **Database distribuito:** non ispezionato. Applicazione effettiva di tutte le migrazioni, grant, pubblicazioni Realtime e configurazione Auth hook non accertate; i documenti descrivono la repository.
- **Cron mensile:** espressione presente nelle migrazioni; fuso del pianificatore ed esecuzioni effettive non accertati. Nessuna promessa di 03:05 Europe/Rome.
- **Eventuali co-vincitori preesistenti:** non si afferma che esistano. Se una futura ispezione ne trovasse, non cancellarli scegliendo arbitrariamente una persona: chiedere una decisione sui dati.
- **Versioni Node:** Volta/CI usano 24, Netlify dichiara 22.22.3. Divergenza registrata in [ARCH-005](architecture.md), senza cambiare l'hosting o certificare compatibilità.
- **Motivazioni tecnologiche iniziali:** non disponibili; non attribuite retroattivamente all'autore.
- **Payload legacy:** importatore e invarianti ispezionati; singoli risultati non confrontati con fonti originali esterne, dichiarate non disponibili oltre la repository.
- **Visuale e dispositivi:** nessun nuovo layout e nessuna verifica browser/asset in questa attività; non si promette una conformità grafica o di accessibilità non misurata.

Non restano conflitti di intento aperti fra quelli sottoposti al proprietario. Le incognite sopra delimitano l'evidenza e non vengono trasformate in requisiti inventati o in autorizzazioni a intervenire sulla produzione.
