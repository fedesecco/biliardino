# Specifiche di Coppa Telenia — SpecLedger

La repository adotta **SpecLedger (Specification Ledger Development)** dal 2026-11-13. Le specifiche accettate definiscono il comportamento voluto; codice, migrazioni e test sono evidenza dell'implementazione, non approvazione automatica. L'adozione richiesta dal proprietario comprende **tutti i domini del prodotto esistente e la loro evoluzione storica**, non soltanto la partita condivisa.

## Da dove iniziare

1. [Architettura](architecture.md) per confini applicativi, runtime, database, verifiche e release.
2. [Regole condivise](general.md) per calendario, feedback, shell, navigazione e convenzioni UI.
3. Il documento di dominio pertinente nella tabella seguente.
4. [Decisioni e scostamenti](open-questions.md) e [verifiche](verification.md) prima di dichiarare conformità.
5. [Fonti ed evoluzione](sources-and-history.md) per ricostruire il passato senza ripristinare regole sostituite.

## Mappa canonica e proprietà dei prefissi

Ogni prefisso ha un solo ambito proprietario nell'intera repository. I collegamenti portano al documento contenente le definizioni `## PREFIX-NNN — Titolo`; cercare l'ID in quel documento per trovarlo senza dipendere dagli anchor del renderer.

| Prefisso | Documento canonico | ID inizialmente allocati / ambito |
| --- | --- | --- |
| ARCH | [architecture.md](architecture.md) | ARCH-001–ARCH-006: workspace, stato/RPC, migrazioni, test, runtime/deploy, release |
| GEN | [general.md](general.md) | GEN-001–GEN-006: calendario, feedback, percorsi, dock, UI/accessibilità, changelog |
| AUTH | [features/access.md](features/access.md) | AUTH-001–AUTH-006: account, sessione, lettura, mutazioni, slot pubblico, configurazione |
| PLAY | [features/play.md](features/play.md) | PLAY-001–PLAY-006: tavolo, avvio, punteggio, conferma, concorrenza, recupero |
| PICK | [features/team-selection.md](features/team-selection.md) | PICK-001–PICK-005: candidati, priorità, bilanciamento, validazione, replay contatori |
| ELO | [features/ratings.md](features/ratings.md) | ELO-001–ELO-005: formula, modelli, replay/legacy, anteprima, propagazione |
| HIST | [features/history.md](features/history.md) | HIST-001–HIST-005: pagine/filtro, card, eliminazione, import, realtime |
| PLAYER | [features/players.md](features/players.md) | PLAYER-001–PLAYER-005: rosa, validazione, colori, tipo, salvataggio |
| RANK | [features/rankings.md](features/rankings.md) | RANK-001–RANK-005: aggregati, classifica, medaglie, anteprime, mensile |
| AWARD | [features/awards-avatars.md](features/awards-avatars.md) | AWARD-001–AWARD-008: volti, serie, premio, artwork, workflow, livelli, notifiche, laboratorio |
| PROFILE | [features/player-profile.md](features/player-profile.md) | PROFILE-001–PROFILE-005: identità, bacheca, risultati, rapporti, caricamenti/categorie |

Le pagine di indice, fonti, decisioni e verifiche rimandano alle autorità sopra; non sono un secondo elenco di definizioni. La formula ELO non è ridefinita dalla classifica; la posizione globale non è ridefinita dall'avatar; l'accesso non è ridefinito dalla visibilità di un pulsante.

## Perimetro dell'adozione

Sono documentati shell e navigazione, autenticazione, configurazione, tutti i domini in `features/`, laboratorio avatar, store e confini RPC, algoritmi PostgreSQL, patrimonio legacy, test esistenti e cronologia delle 30 migrazioni e delle release 1.0.0–1.8.0. La baseline coerente e le precisazioni sono state approvate esplicitamente dal proprietario; la provenienza è in [open-questions.md](open-questions.md).

**Copertura documentale non significa piena conformità del prodotto.** I requisiti parzialmente implementati sono registrati con evidenza e verifiche mancanti. Non sono stati corretti automaticamente durante l'adozione. I test non coprono in modo equivalente client, database e sincronizzazione reale.

Restano fuori dall'evidenza raccolta: configurazione/schema e log live Supabase, effettive esecuzioni cron, dati produttivi, validazione riga per riga del payload legacy contro fonti esterne, qualità binaria degli artwork, rendering/browser e dispositivi reali. Non sono aree volutamente ignorate del prodotto: sono limiti di verifica dichiarati, senza fingere di averle certificate. Nessuna fonte esterna è stata indicata dal proprietario.

## Convenzioni per record e riferimenti

- Un ID identifica una decisione o un requisito significativo, non una modifica di testo. Formato nuovo: prefisso registrato, trattino e numero positivo con almeno tre cifre. Non riusare né rinumerare ID, neppure ritirati.
- `Type: Decision` descrive una scelta; `Type: Requirement` un obbligo osservabile. Per i documenti di feature i metadati comuni sono dichiarati all'inizio: valgono per tutti i record, salvo override esplicito sotto il singolo titolo.
- `Status` separa accordo/ciclo di vita: `Proposed`, `Accepted`, `Deprecated`, `Superseded`. `Implementation` separa evidenza: `Not implemented`, `Partially implemented`, `Implemented`, `Verified`. Gli override del singolo record prevalgono sui metadati comuni.
- Una decisione descrittiva può non avere stato di implementazione. `Implemented` può derivare dall'ispezione del sorgente; non afferma un deploy verificato. `Verified` richiede prove attuali riferite all'obbligo intero, con comando/check, ambito, risultato e data/revisione.
- `Code`, `Tests` e `Verification` rendono rintracciabili implementazione, asserzioni e strategia; un campo Verification formulato come attività futura **non** è prova eseguita. Le esecuzioni sono raccolte una volta in [verification.md](verification.md).
- I riferimenti nominano gli ID e il documento; `Inherits` applica una regola condivisa senza copiarla, `Depends on` indica una dipendenza, `Architecture` il vincolo architetturale. Abbreviazioni come `ELO-002/ELO-003` rimandano a due record dello stesso documento, non sono nuovi ID.
- Un'eccezione richiede ID/clausola sovrascritta, differenza precisa, ambito, ragione e approvazione. Nessuna eccezione autorizza a nascondere un conflitto.
- Sostituire sostanzialmente un obbligo richiede un nuovo ID e collegamenti reciproci `Supersedes`/`Superseded by`; la vecchia identità resta risolvibile. Le sole chiarificazioni mantengono l'ID. All'avvio del ledger non esistevano precedenti ID da migrare; le regole storiche sono conservate come provenienza, non come falsi record già approvati.

## Lavoro futuro

Usare la skill `$spec-ledger` installata nel contesto di lavoro. Sequenza: comprendere → chiarire → analizzare coerenza e impatti → documentare l'intento concordato → validare gli accordi → implementare → scrivere/aggiornare i test necessari → verificare → audit.

Prima di una modifica condivisa cercare l'ID e i suoi dipendenti in specifiche, codice e test, includendo consumatori privi di annotazioni. Leggere le asserzioni, non soltanto i nomi. Una richiesta che contraddice un requisito accettato non è approvazione implicita: risolvere il conflitto o approvare un'eccezione circoscritta.

Per un bug già completamente descritto da un requisito accettato basta citarlo: non cambiare la specifica per giustificare il codice. Le nuove aspettative dei test derivano dalla specifica dopo l'implementazione, non da uno snapshot dell'errore. Non annotare ogni riga né riscrivere tutti i test per il solo inserimento degli ID: i collegamenti esistenti sono tracciabilità iniziale e gli ID si aggiungono quando i test vengono modificati sostanzialmente.

I comandi, le coperture e l'ordine del lavoro residuo sono in [verification.md](verification.md). La prossima attività implementativa deve affrontare un ambito concordato dei requisiti parziali, non assumere che la sola presenza di questi documenti abbia corretto l'applicazione.
