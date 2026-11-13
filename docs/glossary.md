# Dizionario di prodotto

Vocabolario per la pianificazione dell'evoluzione multi-gruppo, organizzata nella [roadmap](roadmap.md). Le definizioni chiariscono i termini, non attestano implementazione e non sostituiscono i contratti correnti indicizzati in [README.md](README.md). Le opzioni indicate come da definire restano proposte; il comportamento dettagliato viene promosso dalla roadmap alle specifiche di dominio prima di implementarlo.

| Termine | Significato |
| --- | --- |
| **Account** | Identità personale dell'app. Non coincide con un giocatore: lo stesso account può essere associato a un giocatore diverso in ciascun gruppo. |
| **Identità Google** | Identità esterna usata per autenticare un account. Scollegare questa identità non significa scollegare un giocatore da un gruppo. |
| **Sessione** | Accesso autenticato dell'account da un dispositivo/browser. Logout o scadenza non cancellano le associazioni salvate nel database. |
| **Utente sloggato** | Persona senza sessione valida. Non è un ruolo del gruppo. |
| **Gruppo** | Contesto permanente con propria rosa, partite, classifiche, impostazioni e premi. È il termine da usare al posto di “torneo” per la nuova evoluzione. Può avere una data di fine programmata. |
| **Torneo** | Non è sinonimo di gruppo nella nuova evoluzione. L'eventuale futura competizione con calendario, tabellone o durata propria non è ancora definita. Nei documenti e nelle release precedenti il termine può avere significato storico. |
| **Giocatore** | Identità sportiva appartenente a un gruppo, con nome, risultati, rating e premi. Può esistere senza account associato. |
| **Giocatore senza account** | Giocatore non associato a un account; può partecipare alle partite registrate da altri. Termine rivolto agli utenti in luogo di “placeholder”. |
| **Associazione account–giocatore** | Collegamento persistito nel database tra account e giocatore del gruppo. Un account può rappresentare al massimo un giocatore per gruppo; il collegamento non viene perso alla scadenza della sessione. |
| **Partecipazione dell'account** | Associazione dell'account a un gruppo, indipendentemente dal ruolo admin/giocatore. Occupa quota quando il gruppo è attivo; consultare il gruppo non è parteciparvi. |
| **Associazione iniziale** | Collegamento di un account a un giocatore senza account, conservandone l'identità sportiva e lo storico, attraverso il percorso di invito. La verifica dell'identità sportiva è una decisione aperta in P07 della roadmap. |
| **Scollegamento dal giocatore** | Rimozione esplicita dell'associazione nel gruppo, volontaria o disposta dall'admin su un altro giocatore. Conserva account e storico sportivo, revoca i permessi del gruppo e non rimuove l'identità Google. |
| **Giocatore, come ruolo** | Ruolo ordinario nel gruppo. Nella matrice dei permessi indica una persona autenticata e autorizzata nel gruppo, non un giocatore senza account. |
| **Admin** | Unico ruolo amministrativo del gruppo, con anche i permessi ordinari del giocatore. Si trasferisce a un altro giocatore associato; non esiste un ruolo separato di proprietario né questo ruolo dà poteri sugli altri gruppi. |
| **URL di consultazione** | Link del gruppo che consente la lettura anche senza sessione. Non autorizza ingresso, scelta di un giocatore o modifiche. Non è un invito e può essere inoltrato: non equivale a riservatezza forte. |
| **Invito monouso** | Link diverso dall'URL di consultazione, che autorizza un solo ingresso riuscito nel gruppo, con autenticazione Google e controlli server. Apertura e normale login non equivalgono a consumo; scadenza e revoca sono da specificare in P07. |
| **Rosa** | Insieme dei giocatori del gruppo, compresi quelli eventualmente archiviati. |
| **Giocatore archiviato** | Giocatore conservato nello storico ma escluso dalle nuove selezioni. L'archiviazione non cancella l'associazione all'account e non equivale a scollegamento o liberazione della quota del gruppo. |
| **Gruppo archiviato** | Gruppo conservato in consultazione senza occupare slot attivi per gli account associati. Le condizioni di riattivazione e la gestione della partita pendente sono da definire in P16. |
| **Data di fine del gruppo** | Data facoltativa che programma l'archiviazione, non la cancellazione. Fuso, istante esatto e partita in corso richiedono la specifica di P16. |
| **Slot gruppo** | Unità di capacità di partecipazione a un gruppo attivo: conta sia da admin sia da giocatore. Un solo slot iniziale per account; il trasferimento admin non libera il posto di chi rimane giocatore. I futuri slot aggiuntivi a pagamento aumentano permanentemente questa capacità. |
| **Partita** | Singolo incontro del gruppo, con partecipanti e risultato. Non coincide con il gruppo o con una sessione di autenticazione. |
| **Partita in corso** | Stato condiviso del gioco prima della registrazione definitiva del risultato. |
| **Sistema di rating** | Algoritmo che stima l'abilità dei giocatori. Il primo rilascio multi-gruppo usa ELO senza selettore o cambio di sistema. TrueSkill resta un'evoluzione futura da specificare, non una conversione automatica. |
| **Versione delle regole** | Insieme identificabile delle regole applicabili a una partita. Consente di modificare le impostazioni future senza applicarle retroattivamente e di ricostruire i risultati derivati con le regole storiche corrette. |
| **Ricalcolo** | Ricostruzione dei dati derivati dalle partite rimaste valide, per esempio dopo la rimozione di una partita. Non equivale a rigiocare il passato usando le impostazioni correnti. |
| **Risultato registrato** | Esito salvato della partita, non modificabile direttamente. Un errore si corregge eliminando la partita entro la finestra consentita e registrandone una nuova; dopo la scadenza il risultato rimane com'è. |
| **Premio** | Riconoscimento sportivo; può avere durata e condizioni proprie. Va distinto dalla relativa opzione cosmetica. |
| **Cosmetico sbloccato** | Opzione estetica resa disponibile da un premio o da un altro diritto. Disponibilità e scelta di indossarla sono concetti distinti; la durata dello sblocco resta da definire. |
| **Aspetto scelto** | Personalizzazione che il giocatore desidera indossare. Può rinunciare agli effetti positivi dei premi, non ai malus obbligatori attivi. |
| **Malus** | Effetto negativo imposto dalle regole del gruppo, non sostituibile attraverso la personalizzazione. Durata, priorità e aspetto restano da definire. |
| **Eliminazione account** | Rimozione dell'identità personale dell'app. I giocatori associati restano nei rispettivi gruppi senza account; trattamento degli altri dati personali e caso dell'unico admin senza successore sono da definire in P16. |
| **Eliminazione gruppo** | Operazione amministrativa distinta dall'archiviazione. Conservazione dei dati, recuperabilità e conferme sono decisioni aperte di P16; non si presume una cancellazione fisica immediata. |

## Uso nella documentazione

- Scrivere “account” quando si parla della persona autenticata, “giocatore” quando si parla di identità sportiva, “sessione” quando si parla di accesso dal browser.
- Specificare sempre se “archiviare” riguarda un gruppo o un giocatore.
- Usare “scollegare dal giocatore” quando si vuole cambiare identità sportiva nel gruppo: non chiamarlo “scollegare Google”.
- La matrice della roadmap registra la direzione concordata, ma non cambia i permessi dell'app attuale: va formalizzata nei documenti canonici prima dell'implementazione.
