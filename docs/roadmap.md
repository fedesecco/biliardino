# Roadmap dell'evoluzione multi-gruppo

## Perimetro e stato

Questa è la scaletta di lavoro concordata nella pianificazione del 2026-11-13, non una dichiarazione di funzionalità implementate. L'incarico attuale è solo documentale: nessuna modifica all'app, al database, alla configurazione Auth o ai deployment è autorizzata da una casella in questa pagina.

Il lessico è nel [dizionario](glossary.md). Le specifiche correnti e i loro prefissi restano indicizzati in [README.md](README.md); gli scostamenti già noti restano in [open-questions.md](open-questions.md). La direzione futura qui concordata non riscrive retroattivamente la baseline dell'app esistente.

I codici P00–P19 sono identificatori stabili di pacchetti di lavoro, non ID di requisiti SpecLedger. Nessun pacchetto implementativo è completato. Gli elementi contrassegnati **Da decidere** non diventano approvati per il solo fatto di essere elencati.

### Come una voce passa dalla scaletta alle feature

Per ogni incremento, non necessariamente per un intero pacchetto:

1. Risolvere le decisioni aperte che riguardano quell'incremento; non bloccare gli altri pacchetti indipendenti.
2. Cercare i requisiti correnti e i consumatori, comprese regole condivise, database, UI e test non annotati.
3. Trasferire il comportamento concordato nel documento canonico di dominio; creare un documento sotto `features/` solo quando serve davvero. Riutilizzare le autorità esistenti per accesso, rating, premi e regole condivise.
4. Assegnare gli ID di requisito necessari e registrarne il prefisso nell'indice. Preservare gli ID esistenti per chiarimenti; per sostituzioni sostanziali conservare il vecchio record e collegare la sostituzione in entrambe le direzioni.
5. Sostituire qui il testo di comportamento promosso con un collegamento ai requisiti e una breve nota di avanzamento: non mantenere due specifiche concorrenti.
6. Validare accordo, riferimenti, permessi e impatti prima di implementare.
7. Implementare l'incremento; successivamente aggiungere/aggiornare solo i test necessari, con riferimenti ai requisiti toccati.
8. Eseguire i controlli Nx pertinenti e osservare il percorso reale, includendo il database quando il contratto dipende da esso. Simulazioni client non verificano RLS, RPC, concorrenza o OAuth reali.
9. Aggiornare evidenze, changelog e versione secondo le regole della repository; solo dopo spuntare l'incremento effettivamente completato.

Una voce può quindi essere **Da specificare**, **Specificata**, **In implementazione**, **Implementata ma non verificata** oppure **Completata**. Queste etichette di avanzamento non sostituiscono `Status` e `Implementation` dei requisiti canonici. Non spuntare una funzione perché è stata soltanto documentata o perché un'altra feature è stata cherry-pickata.

## Ordine e percorsi

L'ordine è una guida di dipendenze, non l'obbligo di consegnare ogni pacchetto come un unico grande commit.

| Pacchetto | Percorso | Dipendenze principali | Risultato |
| --- | --- | --- | --- |
| P00 | Questo branch | — | Confini, lessico e gate di specifica |
| P01 | Questo branch | P00 | Ambiente di sviluppo isolato |
| P02 | `main`, poi integrazione | P00 | i18n e changelog localizzabile |
| P03 | Questo branch | P01 | Modello gruppi e migrazione del gruppo esistente |
| P04 | Questo branch | P01, P03 | Google OAuth e account personali |
| P05 | Questo branch | P03, P04 | Ruoli e quota di partecipazione |
| P06 | Questo branch | P03 | Consultazione tramite URL del gruppo |
| P07 | Questo branch | P04, P05, P06 | Inviti monouso e ingresso sicuro |
| P08 | Questo branch | P05, P07 | Collegamento e scollegamento giocatore |
| P09 | Questo branch | P05, P08 | Rosa e archiviazione giocatori |
| P10 | Questo branch | P03, P05 | Impostazioni versionate |
| P11 | Questo branch | P05, P06, P10 | Gioco condiviso per gruppo |
| P12 | Questo branch | P10, P11 | ELO e rimozione partite con ricalcolo |
| P13 | Questo branch | P09, P11, P12 | Classifiche, profili, premi e job per gruppo |
| P14 | `main` | P00; P02 da integrare se disponibile | Discovery e avatar 3D |
| P15 | Questo branch | P02, P08, P13, P14 | Cherry-pick e adattamento avatar/i18n |
| P16 | Questo branch | P05, P07, P08, P11 | Ciclo di vita gruppi e account |
| P17 | Questo branch | Pacchetti del rilascio | Verifica integrata e cutover |
| P18 | Futuro, non nel primo rilascio | P05, P16 | Slot aggiuntivi a pagamento |
| P19 | Futuro, non nel primo rilascio | P14, P15 | Cosmetici commerciali e altri sistemi di rating |

P02 e P14 possono procedere su `main` indipendentemente dalla fondazione multi-gruppo. P06 non va distribuito con controlli incompleti soltanto perché dipende da meno pacchetti. P15 può essere integrato in due incrementi distinti: i18n non deve aspettare gli avatar.

## P00 — Confini e contratti di base

**Stato:** Da specificare. **Destinazione:** indice, dizionario, architettura e documenti di dominio pertinenti.

- [ ] Usare **gruppo** per il contesto permanente che oggi coincide con l'intera app; non progettare un tabellone tornei non richiesto.
- [ ] Separare account, sessione Google, giocatore sportivo, associazione al gruppo e ruolo.
- [ ] Confermare il modello di un solo giocatore per account nel medesimo gruppo e un solo account per giocatore.
- [ ] Modellare un solo admin per gruppo, che mantiene anche le capacità ordinarie del giocatore; nessun ruolo separato di proprietario.
- [ ] Mantenere un database per ambiente, non un database per gruppo; isolamento dei dati applicativi tramite appartenenza al gruppo e controlli server.
- [ ] Stabilire come distinguere configurazioni della piattaforma, preferenze dell'account e impostazioni del gruppo.
- [ ] Tracciare gli impatti sui contratti esistenti senza rinominare in massa ID, sorgenti o specifiche non coinvolti nell'incremento.
- [ ] Promuovere alle specifiche solo il prossimo incremento concreto, mantenendo il resto nella scaletta.

**Uscita:** il primo incremento ha un ambito approvato e non esistono due autorità attive in conflitto per lo stesso comportamento.

## P01 — Ambiente isolato e base riproducibile

**Stato:** Da specificare. **Destinazione:** [architettura](architecture.md), configurazione operativa pertinente.

- [ ] Scegliere Supabase locale oppure ambiente cloud separato per questo branch; non creare risorse a pagamento senza accordo sul costo.
- [ ] Impedire che sviluppo, preview e prove di migrazione puntino al database di produzione usato da `main`.
- [ ] Separare `SUPABASE_URL`, chiave pubblicabile, configurazione Google e URL di callback per ambiente.
- [ ] Predisporre soli dati di prova: almeno due gruppi, admin e giocatori distinti, giocatori senza account, account con quota piena, gruppi/giocatori archiviati.
- [ ] Rendere riproducibile la costruzione dell'ambiente dalle migrazioni, rispettando l'import legacy e i relativi prerequisiti; non assumere che ogni vecchia migrazione sia già eseguibile su un database vuoto.
- [ ] Prima delle nuove migrazioni ispezionare schema e funzioni dell'ambiente bersaglio; per eventuali incidenti leggere sia log API sia PostgreSQL.
- [ ] Usare nuove migrazioni append-only e `WHERE` esplicito in ogni `UPDATE`, inclusi backfill e reset intenzionali.
- [ ] Preparare una prova di migrazione dei dati e un piano di ripristino operativo prima del cutover, senza applicare ora cambiamenti a produzione.

**Uscita:** un percorso reale di sviluppo usa solo l'ambiente dedicato e la preparazione dei dati non richiede informazioni o segreti di produzione.

## P02 — i18n su main e changelog

**Stato:** Da specificare. **Destinazione:** [regole condivise](general.md), [architettura](architecture.md), feature consumatrici. **Percorso:** `main`, poi cherry-pick degli incrementi pertinenti.

- [ ] Scegliere le lingue iniziali e la strategia Angular coerente con cambio lingua, distribuzione e fallback richiesti; non imporre una libreria prima della scelta.
- [ ] Definire preferenza lingua dell'account e comportamento prima del login; non confondere lingua con fuso competitivo.
- [ ] Migrare shell, navigazione, autenticazione, gioco, rosa, classifiche, storico, profili, premi, dialog e stati vuoti/errore.
- [ ] Includere label accessibili, notifiche, descrizioni dei cosmetici, plurali e interpolazioni.
- [ ] Localizzare date, numeri, percentuali e importi senza tradurre nomi inseriti dagli utenti.
- [ ] Rimuovere le concatenazioni che impediscono una traduzione corretta e scegliere fallback espliciti per chiavi mancanti.
- [ ] Mappare errori riconoscibili del server in messaggi localizzati; non tentare di tradurre automaticamente messaggi SQL arbitrari.
- [ ] Mantenere una sola cronologia di release: `CHANGELOG.md` resta la fonte italiana, le traduzioni condividono versione e data e usano fallback italiano per le release non tradotte.
- [ ] Definire organizzazione degli asset localizzati e scelta del documento nella pagina changelog senza creare versioni indipendenti per lingua.
- [ ] Non richiedere la traduzione retroattiva completa dello storico per abilitare la localizzazione delle nuove release.
- [ ] Predisporre chiavi e convenzioni da riusare nelle nuove schermate multi-gruppo; gli errori dei nuovi endpoint devono essere integrati quando questi vengono specificati.

**Verifiche da eseguire nell'incremento:** cambio lingua sulle superfici reali, testi lunghi/mobile, plurali, fallback del changelog, date/numeri e percorso con errore. Le sole chiavi presenti nei file non provano la localizzazione.

## P03 — Modello dati gruppi e migrazione dell'app attuale

**Stato:** Da specificare. **Destinazione:** nuovo dominio gruppi quando formalizzato; [architettura](architecture.md) per confini e migrazioni.

- [ ] Definire identità del gruppo, nome, logo, data di creazione, stato e data di fine facoltativa.
- [ ] Definire account personali e collegamento opzionale al giocatore senza rendere obbligatorio un account per ogni persona che gioca.
- [ ] Definire dove risiedono ruolo e associazione; impedirne il disallineamento o l'aggiornamento diretto non autorizzato.
- [ ] Introdurre l'appartenenza al gruppo per rosa, partite, partecipazioni, candidati/panchina, priorità, partita attiva, impostazioni e premi persistenti.
- [ ] Adattare chiavi, FK, indici e vincoli perché nessuna partita, squadra, associazione o premio possa riferirsi a giocatori di un altro gruppo.
- [ ] Rendere l'unicità dei nomi dei giocatori locale al gruppo, mantenendo normalizzazione e vincoli concordati.
- [ ] Conservare la distinzione tra identificativi tecnici, URL di consultazione e segreti di invito.
- [ ] Trasformare l'attuale applicazione nel primo gruppo, conservando ID dei giocatori, risultati, date, delta legacy locked, premi e collegamenti storici necessari.
- [ ] Convertire i giocatori preesistenti in giocatori senza account; non collegarli automaticamente a Google per nome o email.
- [ ] Pianificare l'assegnazione iniziale dell'admin e la dismissione dell'account condiviso senza introdurre un super-admin implicito.
- [ ] Aggiornare tipi database generati e modelli client con la stessa migrazione di contratto.
- [ ] Verificare tutti gli aggregati e gli ordinamenti che oggi presuppongono un solo insieme globale di giocatori.

**Uscita:** due gruppi di prova possono avere giocatori omonimi e storie indipendenti; la migrazione del gruppo attuale non riscrive risultati o attribuzioni legacy.

## P04 — Google OAuth, sessioni e rimozione della password

**Stato:** Da specificare. **Destinazione:** [accesso](features/access.md), architettura e navigazione condivisa.

- [ ] Sostituire accesso con password/account condiviso con Google OAuth per gli account personali.
- [ ] Aggiornare restrizioni di registrazione, hook, helper SQL e policy oggi basati sull'email condivisa: la sola sostituzione del form non è sufficiente.
- [ ] Definire callback, ritorno alla destinazione richiesta, annullamento, errore provider e sessione iniziale in caricamento.
- [ ] Consentire il normale rientro di un account già associato senza un nuovo invito a ogni logout, scadenza o cambio browser.
- [ ] Distinguere autenticazione dell'account dall'ingresso in un gruppo esistente: Google da solo non concede mai un'associazione o un ruolo.
- [ ] Dal percorso pubblico del gruppo non offrire un ingresso diretto; per un nuovo ingresso occorre P07. La creazione del proprio gruppo ha un percorso autenticato distinto e rispetta P05.
- [ ] Gestire sessioni persistenti, aggiornamento token e logout senza cambiare l'associazione memorizzata nel database.
- [ ] Non esporre chiavi privilegiate o credenziali Google server al browser; convalidare destinazioni di ritorno e stato del flusso OAuth.
- [ ] Rimuovere form password, guard dell'email condivisa, messaggi obsoleti e percorsi morti nel cutover; nessun alias di compatibilità che mantenga i vecchi privilegi.

**Verifiche da eseguire:** login Google reale nell'ambiente isolato, rifiuto/annullamento, ripristino sessione e rientro nello stesso giocatore. L'E2E attuale con autenticazione simulata non certifica questo percorso.

## P05 — Due ruoli e slot per partecipazione

**Stato:** Da specificare. **Destinazione:** dominio gruppi per quota e ruoli, [accesso](features/access.md) per applicazione dei permessi.

- [ ] Formalizzare la matrice seguente nei domini proprietari, senza aggiungere ruoli di proprietario, moderatore o segnapunti.
- [ ] Assegnare un solo slot iniziale a ogni account: ogni gruppo attivo cui l'account è associato occupa uno slot, sia come giocatore sia come admin.
- [ ] Contare anche la creazione del proprio gruppo; impedire di creare un gruppo quando la partecipazione esistente ha già esaurito la quota.
- [ ] Non contare consultazione pubblica, inviti non ancora accettati o giocatori senza account come partecipazioni dell'account.
- [ ] Rendere atomici controllo quota e creazione/ingresso: due richieste concorrenti non devono occupare due gruppi con un solo slot.
- [ ] Non liberare uno slot al solo trasferimento del ruolo admin: l'ex admin rimane giocatore e continua a partecipare.
- [ ] Se il nuovo admin è già associato allo stesso gruppo, il trasferimento non crea una seconda partecipazione né richiede un secondo slot per quel gruppo.
- [ ] Non considerare l'archiviazione del solo giocatore una scorciatoia per liberare quota mentre l'account resta associato al gruppo attivo; distinguere stato della rosa e partecipazione dell'account.
- [ ] Archiviare il gruppo libera quota per tutti gli account associati; scegliere la politica di riattivazione in P16 prima di implementarla.
- [ ] Applicare limiti e ruoli nel database/endpoint autoritativo, non nel solo elenco gruppi della UI.
- [ ] Definire messaggi localizzati per quota piena e un'esperienza coerente quando un account autenticato legge un secondo gruppo senza poterci entrare.
- [ ] Non implementare adesso checkout, slot a pagamento o quota illimitata per un account speciale. Quando servirà, la quota extra sarà un diritto server, non un'eccezione hardcoded sull'email.

### Matrice di direzione concordata

Qui “giocatore” indica un account associato al gruppo; l'admin possiede anche i permessi ordinari. Un account autenticato estraneo ha soltanto i diritti di consultazione pubblica finché non completa P07. Le operazioni sono comunque soggette allo stato attivo/archiviato e alle politiche temporali.

| Azione | Sloggato con URL gruppo | Giocatore | Admin |
| --- | --- | --- | --- |
| Consultare rosa, storico, classifiche, profili e premi pubblicati dal gruppo | Sì | Sì | Sì |
| Entrare/associarsi tramite il solo URL di consultazione | No | No | No |
| Completare un nuovo ingresso tramite invito monouso | Dopo Google e controlli | Se non già associato; quota disponibile | Stessi controlli |
| Generare/condividere un nuovo invito monouso | No | Sì | Sì |
| Creare un giocatore senza account | No | Sì | Sì |
| Modificare nome/avatar di un giocatore senza account | No | Sì | Sì |
| Modificare il proprio nome/avatar | No | Sì | Sì |
| Modificare nome/avatar di un altro giocatore associato | No | No | No |
| Selezionare candidati, avviare partita, usare segnapunti e confermare | No | Sì | Sì |
| Annullare una partita in corso | No | Sì | Sì |
| Eliminare una partita registrata entro la finestra ammessa | No | Sì | Sì |
| Modificare direttamente il risultato di una partita registrata | No | No | No |
| Archiviare/riattivare un altro giocatore | No | No | Sì |
| Archiviare sé stesso | No | No | No |
| Eliminare definitivamente un giocatore dalla UI ordinaria | No | No | No |
| Scollegare il proprio account dal giocatore | No | Sì | Solo dopo aver trasferito admin |
| Scollegare l'account di un altro giocatore del gruppo | No | No | Sì |
| Forzare il logout Google globale di un altro account | No | No | No |
| Cambiare nome/logo/impostazioni del gruppo | No | No | Sì |
| Archiviare/riattivare o eliminare il gruppo | No | No | Sì |
| Trasferire admin a un altro giocatore associato | No | No | Sì |
| Eliminare il proprio account | No | Sì | Sì, con esito del gruppo definito in P16 |

Non è approvato un sistema aggiuntivo di ban permanente. Scollegare è sufficiente a revocare i poteri derivanti dall'associazione; l'eventuale divieto di rientro anche con nuovo invito va concordato separatamente.

## P06 — URL di consultazione e navigazione per gruppo

**Stato:** Da specificare. **Destinazione:** dominio gruppi, [accesso](features/access.md), [regole condivise](general.md), feature di lettura.

- [ ] Dare a ciascun gruppo un URL di consultazione distinto da qualsiasi invito.
- [ ] Consentire la consultazione senza login a chi conosce l'URL del gruppo; non descrivere questa modalità come privacy forte: il link può essere inoltrato.
- [ ] Non aggiungere per ora una modalità configurabile pubblico/privato o un catalogo pubblico dei gruppi.
- [ ] Usare un identificativo di consultazione non facilmente enumerabile e decidere se e come ruotarlo; nome e slug leggibile da soli non sono un segreto affidabile.
- [ ] Progettare l'accesso anonimo come lettura circoscritta al gruppo richiesto, non come SELECT indiscriminato di tutte le tabelle di tutti i gruppi.
- [ ] Non esporre account Google, email, associazioni sensibili, inviti, token o dati di fatturazione nelle proiezioni pubbliche.
- [ ] Il possesso dell'URL non autorizza iscrizione, scelta giocatore, mutazioni, generazione inviti o modifica impostazioni, anche chiamando direttamente le API.
- [ ] Definire esplicitamente se la partita in corso è visibile agli spettatori: l'accordo di consultazione non decide automaticamente il vecchio caso speciale di `active_play`.
- [ ] Introdurre percorsi contestuali per gioco, classifiche, storico, rosa, profili e impostazioni; evitare che una rotta con solo player ID aggiri il contesto del gruppo.
- [ ] Aggiornare marchio, intestazioni, logo, navigazione e collegamenti contestuali senza mostrare la gestione agli spettatori.
- [ ] Definire percorso iniziale, creazione gruppo e lista dei propri gruppi; non trasformare le visite anonime in partecipazioni conteggiate.
- [ ] Gestire gruppo inesistente, URL non valido/ruotato, gruppo eliminato e accesso a un profilo esterno al gruppo.
- [ ] Spegnere canali e richieste del vecchio gruppo al cambio contesto; ignorare risposte tardive, conservare solo bozze esplicitamente appartenenti al gruppo e non mescolare dati nella cache.
- [ ] Definire la migrazione dei vecchi link dell'unico gruppo senza esporre altri gruppi o conservare vecchi privilegi.

**Verifiche da eseguire:** lettura anonima dal link valido, nessun elenco anonimo globale, nessun dato personale Auth, nessuna mutazione o associazione tramite quel link, cambio rapido fra due URL senza contaminazione dei dati.

## P07 — Inviti monouso e ingresso

**Stato:** Da specificare. **Destinazione:** futuro dominio inviti/ingresso e [accesso](features/access.md).

- [ ] Generare un URL di invito diverso dall'URL di consultazione, con token non prevedibile e senza credenziali di altri servizi.
- [ ] Un invito permette un solo ingresso riuscito di un account in un gruppo; non è un link riutilizzabile per tutti gli amici.
- [ ] Definire scadenza e revoca, chi può revocare inviti emessi da altri e se mostrare un elenco degli inviti pendenti.
- [ ] Non consumare un invito su GET, anteprima del link, scanner, apertura pagina, inizio OAuth o login annullato.
- [ ] Conservare in modo sicuro il contesto invito durante OAuth senza sostituirlo al controllo server al termine del percorso.
- [ ] Verificare lato server account, gruppo attivo, validità invito, quota e associazioni prima di completare l'ingresso.
- [ ] Rendere consumo token, occupazione dello slot e associazione un'operazione atomica; due dispositivi non possono utilizzare lo stesso invito per due account diversi.
- [ ] Garantire esito coerente in caso di doppio invio o risposta persa dopo il successo, senza creare un secondo giocatore o consumare altri slot.
- [ ] Fallimenti per quota piena, gruppo archiviato, scelta già occupata o revoca non devono lasciare un invito consumato con ingresso incompleto.
- [ ] Presentare la scelta a riquadri dei giocatori senza account e l'opzione “Sono un nuovo giocatore”, con testi localizzati e accessibili.
- [ ] Conservare ID, partite, rating e premi quando si collega un giocatore esistente; creare un giocatore nuovo solo con l'opzione esplicita.
- [ ] **Da decidere prima dell'implementazione:** invito legato a un preciso giocatore oppure invito generico con selezione e conferma admin; definire un eventuale stato di attesa senza concedere poteri prima dell'approvazione. Il token autorizza l'ingresso, non prova da solo che una persona sia il titolare dello storico scelto.
- [ ] Definire quali informazioni minime del gruppo/rosa siano visibili nel percorso di associazione prima del completamento.
- [ ] Gestire invito usato, scaduto, revocato, alterato, appartenente a un altro gruppo o aperto da un account già associato.

**Uscita:** una sola persona può accettare un invito; il link di consultazione non può essere trasformato in invito cambiando una route o chiamando la stessa RPC con un altro parametro.

## P08 — Associazioni e scollegamento esplicito

**Stato:** Da specificare. **Destinazione:** [accesso](features/access.md), [giocatori](features/players.md), impostazioni account.

- [ ] Salvare l'associazione nel database e ripristinarla al rientro; non usare una scelta locale o un cookie come unica autorità.
- [ ] Garantire i vincoli uno-a-uno nel gruppo anche con due richieste concorrenti sullo stesso giocatore.
- [ ] In impostazioni account mostrare a quale giocatore si è associati in ciascun gruppo e l'azione esplicita di scollegamento.
- [ ] Lo scollegamento volontario conserva il giocatore e lo storico, rimuove associazione e permessi nel gruppo e conclude la sessione corrente come previsto dal flusso concordato.
- [ ] Distinguere logout corrente, revoca dei permessi del gruppo e rimozione dell'identità Google: non disconnettere il provider per cambiare giocatore.
- [ ] Per scegliere un altro giocatore dopo lo scollegamento, richiedere un nuovo percorso autorizzato con invito valido; non riaprire la scelta dal link pubblico né riutilizzare un invito già consumato.
- [ ] Permettere all'admin di scollegare l'account di un altro giocatore del proprio gruppo con conferma esplicita, senza cancellarne l'account globale o fare logout dagli altri gruppi.
- [ ] Revocare immediatamente i permessi nelle richieste server di tutte le sessioni dell'account scollegato, anche se i token Google/Supabase sono ancora validi; pulire lo stato UI e le sottoscrizioni pertinenti.
- [ ] Non impedire all'account scollegato la consultazione pubblica via URL, che rimane consentita a chiunque lo conosca.
- [ ] Liberare l'occupazione del gruppo per quell'account solo dopo il successo persistito dello scollegamento; definire esiti ripetuti senza duplicazioni.
- [ ] Impedire all'unico admin di abbandonare il ruolo tramite semplice scollegamento: prima trasferimento admin, salvo il distinto flusso di eliminazione account di P16.
- [ ] Consentire la correzione di associazioni sbagliate tramite scollegamento e nuovo ingresso, senza trasferire o fondere silenziosamente lo storico tra player ID diversi.
- [ ] Definire traccia minima delle operazioni amministrative, contenuto visibile e conservazione senza raccogliere dati personali inutili.

**Verifiche da eseguire:** scadenza sessione non cambia giocatore; scollegamento esplicito sì; vecchia sessione non può più registrare partite; lo scollegamento nel gruppo A non modifica associazioni o accessi nel gruppo B.

## P09 — Rosa, giocatori senza account e archiviazione

**Stato:** Da specificare. **Destinazione:** [giocatori](features/players.md), [profilo](features/player-profile.md), autorizzazioni condivise.

- [ ] Conservare la possibilità di giocare con un solo account registrato, creando tutti gli altri come giocatori senza account.
- [ ] Applicare la matrice P05 a creazione, modifica dei giocatori senza account e modifica del proprio giocatore associato.
- [ ] Non offrire eliminazione definitiva del giocatore nella normale UI; l'admin può archiviare e riattivare altri giocatori.
- [ ] Non consentire al giocatore di archiviare sé stesso; distinguere questa azione dallo scollegamento volontario dell'account.
- [ ] Escludere gli archiviati dalle nuove selezioni mantenendo identità, risultati, premi e profili storici.
- [ ] Conservare associazione all'account in caso di sola archiviazione: non trasformarla automaticamente in revoca o in liberazione dello slot.
- [ ] Mantenere inizialmente gli archiviati nelle statistiche storiche, coerentemente con l'attuale regola degli inattivi; definire etichetta e filtri, senza confondere filtro UI e ricalcolo classifica.
- [ ] Definire comportamento se viene archiviato un candidato, un panchinaro o un partecipante a una partita già iniziata; non perdere un risultato già giocato.
- [ ] Validare nomi e unicità per gruppo; due gruppi diversi possono contenere lo stesso nome.
- [ ] Collegare la rimozione dei colori di sfondo al passaggio avatar P14/P15, eliminando anche selettore, limiti della palette e vincoli obsoleti quando non hanno più consumatori.

**Uscita:** il ciclo senza account → associato → archiviato → riattivato → scollegato preserva lo stesso giocatore e il relativo storico, con permessi coerenti in ogni stato.

## P10 — Impostazioni del gruppo e versioni delle regole

**Stato:** Da specificare. **Destinazione:** dominio gruppi, [gioco](features/play.md), [rating](features/ratings.md), regole condivise.

- [ ] Consentire solo all'admin di modificare nome, logo e impostazioni del gruppo.
- [ ] Definire form e vincoli per nome/logo; per un eventuale caricamento file specificare autorizzazione, formato/dimensioni, sostituzione e cleanup.
- [ ] Prevedere data di fine facoltativa; archiviazione alla scadenza e casi limite sono trattati in P16.
- [ ] Separare modifiche descrittive del gruppo dalle modifiche delle regole sportive.
- [ ] Inizialmente imporre ELO senza selettore di algoritmo e senza cambio ELO/TrueSkill a gruppo avviato. Non introdurre conversioni automatiche.
- [ ] Valutare e specificare il catalogo iniziale: bonus per margine sì/no, goal per vincere, due goal di scarto sì/no, eventuale tetto massimo, criteri di selezione/bilanciamento e qualificazione alle classifiche. La presenza in questa lista non approva automaticamente ogni opzione.
- [ ] Definire combinazioni valide, valori di default e spiegazioni degli effetti per ogni opzione effettivamente inclusa.
- [ ] Persistire versioni immutabili delle regole sportive e applicarle alle nuove partite; modificare le impostazioni non ricalcola il passato.
- [ ] Fissare la versione applicabile all'avvio della partita: un cambio impostazioni non altera il finale richiesto o il rating della partita già in corso.
- [ ] Associare risultato e calcolo rating alla versione effettivamente usata, comprese le partite con modelli legacy.
- [ ] Stabilire separatamente come si applica la policy di eliminazione: quella della registrazione oppure quella corrente. Non dedurlo automaticamente dallo snapshot delle regole di punteggio.
- [ ] Il caso iniziale di correzione tramite eliminazione usa la finestra dei primi dieci minuti. **Da decidere:** se la durata diventerà configurabile; l'originaria ipotesi “eliminabile sempre” non va introdotta come scorciatoia per modificare liberamente vecchi risultati dopo l'ultima precisazione del proprietario.
- [ ] Separare lingua dell'utente dal calendario competitivo; mantenere Europe/Rome finché non venga concordata una configurazione del fuso del gruppo.

**Verifiche da eseguire:** cambiare impostazioni durante una partita, iniziarne una successiva e ricostruire lo storico senza applicare retroattivamente l'ultima versione.

## P11 — Gioco condiviso e concorrenza per gruppo

**Stato:** Da specificare. **Destinazione:** [gioco](features/play.md), [selezione squadre](features/team-selection.md), [accesso](features/access.md).

- [ ] Trasformare lo slot globale in una sola partita attiva per ciascun gruppo; più tavoli nello stesso gruppo non sono richiesti.
- [ ] Scopare selezioni locali, candidati, panchina, preferenze, priorità ed esclusioni al gruppo corretto.
- [ ] Adattare RPC, lock, revisione e round ID affinché due gruppi giochino in modo indipendente senza collisioni globali.
- [ ] Consentire le operazioni sportive a giocatori associati e admin; rifiutare spettatori anonimi, account estranei e account appena scollegati anche via chiamata diretta.
- [ ] Validare che ogni candidato e partecipante appartenga allo stesso gruppo e rispetti lo stato previsto dalle regole.
- [ ] Derivare punteggio valido, finale, conferma e correzione dalla versione delle regole della partita, non dal numero 6 hardcoded.
- [ ] Definire lo scarto di due e l'eventuale tetto senza introdurre pareggi o finali impossibili per combinazioni non previste.
- [ ] Preservare rifiuto dei comandi obsoleti, idempotenza di conferma e recupero dello snapshot; non usare aggiornamenti ottimistici per inventare un risultato condiviso.
- [ ] Applicare canali Realtime, reconnect e aggiornamenti di visibilità al solo gruppo corrente; risposte tardive di un altro gruppo non devono cambiare il tavolo.
- [ ] Trattare salvataggio del risultato e formazione successiva secondo PLAY-004: indisponibilità dei nuovi candidati non deve perdere la partita conclusa.
- [ ] Gestire rimozione dell'associazione o archiviazione del gruppo durante una sessione di gioco, senza affidarsi ai soli pulsanti disabilitati.
- [ ] Concordare nel relativo incremento gli scostamenti esistenti PLAY-003/PLAY-004; non riprodurli come nuovi requisiti né correggere automaticamente tutti gli altri scostamenti della baseline.

**Verifiche da eseguire:** due dispositivi nello stesso gruppo, due gruppi in parallelo, goal concorrenti, doppia conferma, reconnect e revoca durante una sessione aperta.

## P12 — ELO, risultati immutabili e ricalcolo

**Stato:** Da specificare. **Destinazione:** [rating](features/ratings.md), [storico](features/history.md), selezione/priorità.

- [ ] Conservare ELO come unico sistema iniziale e i rating separati per gruppo; nessun rating globale dell'account tra gruppi.
- [ ] Rispettare versioni storiche della formula e delta legacy locked; la data di gioco non sostituisce la versione persistita.
- [ ] Aggiornare anteprima UI e calcolo server per le opzioni ELO effettivamente approvate, con precisioni e arrotondamenti concordati.
- [ ] Non offrire editor del risultato dopo la registrazione: per correggere un errore si elimina la partita entro la finestra consentita e si registra una nuova partita attraverso il normale flusso.
- [ ] Dopo la scadenza la partita resta com'è; nessun privilegio admin di correzione tardiva è stato approvato. “Rifare” non significa introdurre un nuovo editor retrodatato.
- [ ] Applicare la finestra sul clock server; per i dieci minuti mantenere `0 <= età < 10 minuti` rispetto all'istante concordato, rifiutando anche date future.
- [ ] Ricalcolare dopo eliminazione rating, serie, statistiche e priorità dipendenti delle sole partite del gruppo, con l'ordine deterministico previsto.
- [ ] Ricostruire con le regole memorizzate per ogni partita, non con le impostazioni attuali; non modificare risultati delle altre partite.
- [ ] Preservare i premi permanenti già finalizzati secondo AWARD-003 anche quando cambiano le graduatorie derivate; distinguere questi dai bonus correnti.
- [ ] Non riformare automaticamente le squadre già estratte dopo una cancellazione; riaggiornare invece i dati derivati pertinenti.
- [ ] Coordinare eliminazione/ricalcolo e nuove registrazioni nel medesimo gruppo, con rollback coerente e lock ordinati.
- [ ] Evitare reset o lock globali tra gruppi non interessati e definire lo stato UI mentre il ricalcolo è in corso.
- [ ] Misurare il ricalcolo su uno storico rappresentativo dell'uso previsto. Non promettere tempi senza misure né eliminare la funzione preventivamente per presunte prestazioni.
- [ ] Decidere eventuali ottimizzazioni solo sulla base di misure, preservando equivalenza col replay completo e senza introdurre infrastruttura non necessaria.
- [ ] Definire traccia della rimozione e comportamento di una conferma ripetuta riferita a un round eliminato, per non riaprire accidentalmente un risultato cancellato.

**Verifiche da eseguire:** sequenza di regole diverse e legacy locked, cancellazione prima/dopo il limite, ricostruzione deterministica, errore con rollback, conferma concorrente, invariabilità del gruppo estraneo e misurazione del tempo.

## P13 — Classifiche, profili, premi e finalizzazione per gruppo

**Stato:** Da specificare. **Destinazione:** [classifiche](features/rankings.md), [profilo](features/player-profile.md), [premi/avatar](features/awards-avatars.md), storico.

- [ ] Rendere locali al gruppo tutte le statistiche globali: “globale” significa intero storico di quel gruppo, non tutti gli account della piattaforma.
- [ ] Adattare graduatorie mensili, qualificazione, pari merito e medaglie ai dati del gruppo preservando le differenze già concordate tra classifica globale e mensile.
- [ ] Scopare storico paginato, filtri, ultimi risultati e rivalità senza scaricare dati estranei o affidarsi alla sola selezione client.
- [ ] Preservare i profili di giocatori archiviati e senza account; non mostrare dati Google o associazioni sensibili nel profilo pubblico.
- [ ] Calcolare volti mensili, serie di vittorie e medaglie nel gruppo pertinente, non sull'account complessivo.
- [ ] Finalizzare un solo campione persistente per gruppo e mese, mantenendo congelati i premi già attribuiti e la storia importata.
- [ ] Adattare cron, fuso operativo, chiavi uniche e idempotenza; verificare davvero il job nell'ambiente isolato invece di dedurne l'attivazione dalle migrazioni.
- [ ] Definire finalizzazione dell'ultimo mese di un gruppo che termina o viene archiviato, senza assegnare in anticipo un premio di mese ancora aperto.
- [ ] Riutilizzare artwork mensili e catalogo dove condivisi, mantenendo distinta la disponibilità dell'immagine dal diritto al premio.
- [ ] Adattare notifiche di riconoscimento e refresh Realtime al gruppo, senza notificare risultati di un altro gruppo aperto prima.
- [ ] Affrontare gli scostamenti RANK-002/003/004, AWARD-003 e PROFILE-005 quando ricadono nei consumatori modificati, con specifica e prove pertinenti; non considerarli già risolti dalla documentazione.

**Verifiche da eseguire:** due gruppi con stessi nomi e diversi leader, premi mensili distinti, ricalcolo dopo premio congelato, archiviati, profili anonimi e cambio gruppo durante richieste di storico/rivalità.

## P14 — Discovery e avatar 3D su main

**Stato:** Da specificare. **Percorso:** `main`, non sviluppo del motore 3D su questo branch. **Destinazione:** [premi/avatar](features/awards-avatars.md), profilo/giocatori e architettura per le scelte effettive.

- [ ] Fare discovery orientata al 3D, come richiesto, senza scegliere preventivamente Three.js o un fornitore.
- [ ] Valutare motore/runtime, modelli e strumenti di creazione asset, licenze commerciali, dipendenza da servizi esterni e disponibilità di parti compatibili.
- [ ] Validare uno stile e un insieme minimo realmente utilizzabile di testa/pelle, viso, capelli, maglia/vestiti e accessori.
- [ ] Provare clipping, combinazioni, proporzioni e sovrapposizioni: un renderer da solo non risolve il problema della qualità degli asset.
- [ ] Provare caricamento, memoria, batteria e resa su telefoni, liste con molti avatar e vista hero; decidere riuso delle risorse, rendering statico/snapshot o altre ottimizzazioni solo sui dati raccolti.
- [ ] Definire caricamento e fallback accessibile quando il 3D non è disponibile, senza sostituire il requisito con una finta anteprima.
- [ ] Separare renderer, composizione salvata, catalogo di parti, diritti di sblocco e regole competitive; il renderer non decide chi è primo in classifica.
- [ ] Creare editor a riquadri per categoria: apertura opzioni, anteprima, selezione, salvataggio e ripristino dello stato in caso di errore.
- [ ] Includere varianti standard di pelle, capelli, viso, vestiti e accessori; non vincolare il nuovo editor al vecchio toggle binario di tipo se non necessario al modello scelto.
- [ ] Distinguere opzioni standard, sbloccate da premi e future opzioni commerciali tramite etichetta/indicatore accessibile, non solo colore.
- [ ] Rendere facoltativi tutti gli effetti positivi attuali: medaglie, capelli da serie, Bomboclat e ogni altro bonus, non soltanto la pelle oro dell'esempio.
- [ ] Applicare automaticamente il bonus acquisito senza riapplicarlo a ogni refresh dopo che il giocatore ha scelto un aspetto normale.
- [ ] **Da decidere:** durata dello sblocco, perdita del requisito, riacquisizione e precedenza tra più premi per la stessa parte.
- [ ] Imporre i malus attivi senza permettere di rimuoverli tramite normale editor; definirne durata, priorità e ritorno all'aspetto scelto quando terminano.
- [ ] Rimuovere i colori di sfondo individuali degli avatar e il relativo selettore/vincolo della palette; non eliminare implicitamente colori squadra o palette generale dell'app.
- [ ] Migrare gli avatar attuali a una composizione valida, senza perdere premi e preferenze che restano applicabili.
- [ ] Sostituire il vecchio sistema di livelli PNG e rimuoverne codice/asset solo quando non esistono più consumatori necessari; nessun doppio renderer permanente non concordato.
- [ ] Aggiornare laboratorio, card giocatori, selezione squadre, classifiche, profilo, storico e dialog di riconoscimento.
- [ ] Verificare tastiera, focus, lettori di schermo, movimento ridotto e label tradotte, oltre all'aspetto visivo reale.

**Uscita:** il sistema funziona sull'app di `main` con asset reali e personalizzazione persistita, senza incorporare assunzioni che impediscano P15. La discovery deve produrre una scelta e relativi limiti, non un semplice elenco di librerie.

## P15 — Integrazione da main e personalizzazione nei gruppi

**Stato:** Da specificare. **Destinazione:** contratti esistenti di avatar/accesso e dominio account/gruppi dove necessario.

- [ ] Cherry-pickare gli incrementi i18n e avatar effettivamente completati su `main`, registrando gli incrementi integrati e i conflitti risolti; non duplicare implementazioni parallele.
- [ ] Separare l'integrazione i18n da quella avatar affinché una non aspetti inutilmente l'altra.
- [ ] Portare i testi delle nuove superfici gruppo, inviti, quote, associazioni e impostazioni nelle convenzioni i18n introdotte in P02.
- [ ] Definire l'aspetto base condiviso dell'account e il comportamento dei giocatori senza account, delle scelte locali al gruppo e dell'associazione successiva.
- [ ] Applicare bonus e malus competitivi al giocatore del gruppo: primo nel gruppo A non significa oro anche nel gruppo B.
- [ ] **Da decidere:** al collegamento prevale la composizione del giocatore esistente o quella dell'account; quando si scollega, quale composizione rimane sul giocatore senza account.
- [ ] Definire diritti di modifica della personalizzazione secondo P05 e rifiutarne aggiornamenti non autorizzati lato server.
- [ ] Non permettere che un override manuale aggiri un malus o indossi una parte non sbloccata; distinguere anteprima di laboratorio da composizione pubblicata.
- [ ] Preservare coppe e premi storici indipendentemente dal cosmetico indossato e dalla migrazione del renderer.
- [ ] Non estendere i diritti a pagamento tra account e giocatori scollegati senza una decisione commerciale esplicita.
- [ ] Verificare consumatori reali, caricamento e cambio gruppo dopo l'integrazione; un cherry-pick riuscito non prova la compatibilità funzionale.

**Uscita:** le personalizzazioni e gli effetti competitivi vengono mostrati nel contesto corretto, e tutte le nuove schermate seguono lingua e convenzioni condivise.

## P16 — Archiviazione gruppi, trasferimento admin ed eliminazione account

**Stato:** Da specificare. **Destinazione:** dominio gruppi, [accesso](features/access.md), account e politica dati.

- [ ] Consentire all'admin di archiviare il gruppo conservandone URL di consultazione, rosa e storico; bloccare le mutazioni sportive di un gruppo archiviato.
- [ ] Liberare la quota di tutti gli account associati al gruppo archiviato, senza far scomparire le associazioni o promuovere automaticamente altri admin.
- [ ] Prima di implementare la riattivazione, risolvere il caso in cui alcuni associati abbiano già occupato lo slot in un altro gruppo. Non riattivare oltre quota né scollegare persone in silenzio; decidere se bloccare o richiedere un nuovo ingresso ai soggetti interessati.
- [ ] Verificare atomicamente la politica scelta anche con ingressi e riattivazioni concorrenti.
- [ ] Alla data di fine facoltativa pianificare archiviazione autoritativa; definire fuso, istante esatto, aggiornamento della data e recupero di un job non eseguito.
- [ ] Definire gestione della partita in corso all'archiviazione manuale o automatica: conferma preventiva, annullamento esplicito o altra scelta approvata; non perdere un risultato già salvato.
- [ ] Trasferire admin a un altro giocatore già associato attraverso un'operazione atomica, senza intervallo con due admin o nessun admin e senza alterare gli slot dei due partecipanti.
- [ ] Bloccare auto-archiviazione del giocatore admin e scollegamento amministrativo di sé tramite scorciatoie; per lasciare il ruolo usare il trasferimento.
- [ ] Consentire solo all'admin di eliminare il gruppo, distinguendo chiaramente questa azione dall'archiviazione.
- [ ] **Da decidere:** eliminazione fisica/logica, recuperabilità, conservazione dei dati e asset, conferme e trattamento dei premi; non scegliere una cancellazione distruttiva implicita.
- [ ] Definire l'effetto dell'eliminazione del gruppo su partecipazioni, quote, inviti pendenti, link, job e sottoscrizioni aperte.
- [ ] Offrire eliminazione del proprio account senza eliminare i giocatori sportivi: tutte le associazioni vengono rimosse, i giocatori restano senza account e i risultati mantengono i riferimenti necessari.
- [ ] Separare conservazione dei risultati sportivi dal trattamento dei dati personali: definire rimozione/anonimizzazione di email, identificativi provider, foto Google e altri dati non necessari.
- [ ] Eseguire l'eliminazione Auth solo tramite il confine server autorizzato; nessuna credenziale amministrativa nel browser.
- [ ] Gestire operazioni ripetute o parzialmente fallite senza account Auth cancellato con privilegi residui; rifiutare mutazioni anche da vecchi token/sessioni dopo la revoca delle associazioni.
- [ ] **Da decidere:** esito per l'unico admin che elimina l'account senza successore. Prevedere trasferimento guidato e un esito esplicito se nessuno subentra, senza cancellare automaticamente il gruppo né negare indefinitamente la cancellazione dell'account.
- [ ] Definire rientro successivo con la stessa identità Google come nuovo ingresso autorizzato: nessuna riappropriazione automatica dei vecchi giocatori dopo un'eliminazione esplicita.

**Verifiche da eseguire:** archivio/riattivazione con quote piene, data fine, trasferimento concorrente, cancellazione account con più associazioni archiviate, token precedenti, gruppo senza successore e conservazione dello storico.

## P17 — Verifica integrata, migrazione e rilascio

**Stato:** Da specificare. **Destinazione:** [verifiche](verification.md), architettura e requisiti dei singoli domini.

- [ ] Per ciascun incremento eseguire i controlli pertinenti attraverso Nx, con aspettative derivate dalla specifica approvata e non da snapshot del vecchio comportamento.
- [ ] Verificare RLS, grant, RPC e helper privilegiati con anonimo, account estraneo, giocatore e admin, includendo gruppi diversi e account appena scollegato.
- [ ] Provare login OAuth reale e consumo invito concorrente nell'ambiente dedicato; registrare separatamente ciò che resta simulato.
- [ ] Provare un solo account che crea il gruppo, crea amici senza account, registra partite e poi collega un amico al giocatore corretto conservandone lo storico.
- [ ] Provare che chi possiede solo l'URL legga i dati previsti ma non possa scegliere un giocatore, usare il segnapunti o generare inviti.
- [ ] Provare che un account associato a un gruppo non possa entrare o creare un secondo gruppo attivo con quota uno, anche dopo trasferimento admin o archiviazione del solo giocatore.
- [ ] Provare normale logout/scadenza, scollegamento volontario e scollegamento admin: solo gli ultimi cambiano l'associazione.
- [ ] Provare due gruppi con giocatori omonimi, premi e partite contemporanee, richieste tardive e cambi di pagina/lingua/gruppo.
- [ ] Provare impostazioni modificate durante una partita, cancellazione entro finestra, rifiuto tardivo e replay delle regole storiche.
- [ ] Provare archiviazione, riattivazione, data fine, eliminazione account e trasferimento admin con i casi limite concordati.
- [ ] Verificare interfaccia reale su mobile/desktop, tastiera e consumatori avatar; registrare limiti visuali o operativi invece di dichiarare conformità generale.
- [ ] Ripetere la migrazione su dati di prova rappresentativi, confrontando identità, conteggi, risultati legacy, rating e premi prima/dopo senza usare dati personali reali non necessari.
- [ ] Verificare gli asset realmente distribuiti, il changelog e le variabili runtime della preview senza credenziali di produzione.
- [ ] Pianificare ordine tra migrazione DB e deploy frontend, eventuale manutenzione, backup e ripristino senza presumere compatibilità tra vecchio client e nuovo schema.
- [ ] Rimuovere percorsi, helper, policy e asset diventati obsoleti nel cutover; non lasciare privilegi dell'account condiviso o percorsi diretti di ingresso come compatibilità temporanea permanente.
- [ ] Consolidare changelog e manifest in una sola versione pendente secondo le regole della repository; non creare una versione per ogni casella non committata.
- [ ] Aggiornare le evidenze dei requisiti davvero verificati e lasciare espliciti i limiti; nessun passaggio a `Verified` per test non eseguiti.
- [ ] Prima della consegna confermare che le sole voci completate hanno prove e collegamenti ai contratti canonici, mentre il residuo rimane nella roadmap.

## P18 — Futuro: slot aggiuntivi a pagamento

**Stato:** Pianificato per il futuro, fuori dal primo rilascio. **Destinazione:** dominio commerciale da definire, quota gruppi.

- [ ] Definire prezzo, valuta, imposte, condizioni e canale di acquisto; 9,99 euro è un'ipotesi, non un prezzo approvato.
- [ ] Vendere capacità permanente aggiuntiva, non un gruppo usa-e-getta: due slot consentono al massimo due partecipazioni attive, qualunque sia il ruolo.
- [ ] Verificare gli acquisti lato server, con attribuzione idempotente, ricevute, rimborsi e revoche secondo condizioni concordate.
- [ ] Definire l'interazione tra riduzione della quota e gruppi già attivi senza cancellazioni silenziose o perdita di storico.
- [ ] Prevedere, quando richiesta, una quota speciale illimitata assegnabile lato server all'account del proprietario della piattaforma; non confonderla con il ruolo admin del gruppo.
- [ ] Mantenere quota iniziale uno fin dall'introduzione dei gruppi, evitando una fase di partecipazioni illimitate da ridurre retroattivamente.
- [ ] Aggiornare termini, messaggi di quota e processo di assistenza solo quando il modello commerciale è effettivamente specificato.

## P19 — Futuro: cosmetici commerciali e altri rating

**Stato:** Pianificato per il futuro, fuori dal primo rilascio. **Destinazione:** dominio commerciale, [premi/avatar](features/awards-avatars.md), [rating](features/ratings.md).

- [ ] Definire eventuali pelli/accessori a pagamento, diritti dell'account, conservazione dopo scollegamento e rapporto con i giocatori senza account.
- [ ] Non usare un acquisto per rimuovere malus obbligatori o modificare rating e risultati senza una nuova decisione di prodotto esplicita.
- [ ] Valutare TrueSkill solo con discovery matematica, implementativa e di licenza/dipendenze applicabili, oltre a prove su gruppi e squadre.
- [ ] Se introdotto, definire rappresentazione di abilità/incertezza, classifica, bilanciamento, anteprima e premi senza riutilizzare ciecamente delta e formule ELO.
- [ ] Valutare inizialmente la scelta dell'algoritmo solo alla creazione di nuovi gruppi; nessun cambio retroattivo o conversione automatica è già approvato.
- [ ] Se in futuro si vorranno fasi/stagioni di rating, specificarle come concetto distinto dal gruppo permanente prima di implementarle.

## Decisioni residue da chiudere al momento giusto

Non è necessario rispondere ora a tutto. Ogni punto blocca solo il relativo incremento e deve essere risolto prima della sua specifica implementativa.

| Punto aperto | Pacchetto | Confine della decisione |
| --- | --- | --- |
| Lingue iniziali e strategia di cambio/fallback | P02 | Solo i18n e nuovi consumatori |
| Assegnazione iniziale dell'admin del gruppo storico | P03 | Cutover dell'account condiviso |
| Visibilità pubblica della partita in corso, URL ruotabile ed eventuale indicizzazione | P06 | Dati leggibili da chi conosce il link; nessuna directory pubblica implicita |
| Scadenza/revoca inviti e associazione mirata o confermata | P07 | Ingresso e protezione dello storico di un'altra persona |
| Traccia amministrativa e conservazione minima | P08 | Scollegamenti e gestione associazioni |
| Archiviazione di un giocatore già in partita | P09, P11 | Nessuna perdita di risultati; rosa e partita non sono lo stesso stato |
| Catalogo impostazioni, durata eliminazione, applicazione della policy e scarto/tetto | P10, P12 | Regole future, non ricalcolo retroattivo |
| Gestione ultimo mese/premi alla chiusura | P13 | Premi correnti e permanenti |
| Motore/asset 3D, durata sblocchi e riacquisizione dei premi | P14 | Discovery su `main`, non dipendenza della fondazione gruppi |
| Precedenza composizione account/giocatore e scollegamento | P15 | Aspetto base distinto dagli effetti del gruppo |
| Riattivazione con quote degli associati piene | P16 | Prevenzione superamento quota senza rimozioni silenziose |
| Data fine, partita pendente e operazione di eliminazione gruppo | P16 | Ciclo di vita e conservazione dati |
| Cancellazione dell'unico admin e trattamento dati personali | P16 | Diritto alla cancellazione e continuità del gruppo |
| Prezzi, quote speciali, acquisti/rimborsi e licenze di nuovi sistemi | P18, P19 | Nessuna implementazione commerciale nel primo rilascio |

## Contratti correnti da consultare prima della promozione

Questa mappa indica le autorità attuali da evolvere, non approva automaticamente modifiche a tutti i loro requisiti.

| Area | Autorità e impatti iniziali |
| --- | --- |
| Account condiviso, lettura e mutazioni | [Accesso](features/access.md): AUTH-001, AUTH-002, AUTH-003, AUTH-004 e AUTH-005 |
| Stato/RPC, migrazioni, runtime e release | [Architettura](architecture.md): ARCH-002, ARCH-003, ARCH-004, ARCH-005 e ARCH-006 |
| Lingua/calendario, shell, UI e changelog | [Regole condivise](general.md): GEN-001, GEN-002, GEN-003, GEN-005 e GEN-006 |
| Tavolo, punteggio, salvataggio e concorrenza | [Gioco](features/play.md): PLAY-001, PLAY-002, PLAY-003, PLAY-004, PLAY-005 e PLAY-006 |
| Candidati, bilanciamento e priorità | [Selezione](features/team-selection.md): PICK-001, PICK-002, PICK-003, PICK-004 e PICK-005 |
| Formula, versioni e replay | [Rating](features/ratings.md): ELO-001, ELO-002, ELO-003, ELO-004 e ELO-005 |
| Pagine, eliminazione e legacy | [Storico](features/history.md): HIST-001, HIST-002, HIST-003, HIST-004 e HIST-005 |
| Rosa, nomi, colori e tipo/avatar | [Giocatori](features/players.md): PLAYER-001, PLAYER-002, PLAYER-003, PLAYER-004 e PLAYER-005 |
| Graduatorie e qualificazione | [Classifiche](features/rankings.md): RANK-001, RANK-002, RANK-003, RANK-004 e RANK-005 |
| Bonus, trofei, renderer e notifiche | [Premi/avatar](features/awards-avatars.md): AWARD-001, AWARD-002, AWARD-003, AWARD-004, AWARD-005, AWARD-006, AWARD-007 e AWARD-008 |
| Identità sportiva, risultati e rivalità | [Profilo](features/player-profile.md): PROFILE-001, PROFILE-002, PROFILE-003, PROFILE-004 e PROFILE-005 |
