# Changelog

## [1.5.1]

### Changes

- **Avatar:** Al posto dei badge, ora vengono mostrati effetti unici per ogni status.

## [1.5.0]

### Features

- **Winstreak:** aggiunti badge correnti per 3+, 5+ e 10+ vittorie consecutive. Visibili anche nel dettaglio giocatore.
- **Profilo giocatore:** la medaglia di classifica è mostrata fra i badge
- **Riconoscimenti post-partita:** una dialog separata mostra ogni nuovo badge o la nuova medaglia di classifica ottenuti dai quattro partecipanti, in sequenza.

### Changes

- **Classifica globale:** rimosse le medaglie per le prime 3 posizioni Al loro posto, bordo avatar e nome colorato (oro/argento/bronzo)

### Bugfixes

- **Partita:** sui dispositivi iOS il doppio tap sui pulsanti annulla goal non attiva più lo zoom della pagina.

## [1.4.1]

### Bugfixes

- **Notifiche:** il toast dopo la registrazione di una partita ora scompare dopo 2 secondi.
- **Partita:** sui dispositivi iOS il doppio tap sui pulsanti goal non attiva più lo zoom della pagina.

## [1.4.0]

### Features

- **Premio mensile:** aggiunta l'illustrazione del premio esclusivo di ottobre 2026 (sarà visibile nella classifica mensile dal primo ottobre!)
- **Badge temporanei:** Bomboclat e Scemo del Villaggio spostati dalla classifica settimanale a quella mensile. Rimossa la classifica settimanale
- **Badge globali:** aggiunte le medaglie d’oro, d’argento e di bronzo per la classifica globale

### Changes

- **ELO:** le nuove partite (fatte dal 29/09/26 in poi) passano da K 32 a K 28, con bonus in base ai gol: la variazione ELO è moltiplicata per `min(1,30; 1 + 0,15 × ln(1 + Δgol))`, dove `Δgol` è il margine assoluto della vittoria. Anteprima ELO aggiornata di conseguenza.
- **Classifica globale:** i nomi dei giocatori ora aprono il relativo profilo.
- **Badge temporanei:** a parità di ELO, ogni posizione viene assegnata una sola volta, evitando duplicati di badge.
- **Storico:** i giocatori delle partite mostrano avatar e badge correnti e aprono il relativo profilo.
- **Profilo giocatore:** badge correnti mostrati in grande accanto al profilo, senza sovrapporli all’avatar. Sono ingrandibili.

## [1.3.1]

### Changes

- **Classifiche:** unificate le sezioni Classifica e Premi in un'unica pagina con anteprime della classifica globale, mensile e settimanale.
- **Classifica globale:** aggiunta una pagina dedicata con la classifica ELO completa.
- **Premio mensile:** aggiunta l'illustrazione del premio esclusivo di settembre 2026.
- **Navigazione:** la voce unica **Classifiche** sostituisce Classifica e Premi.
- **Versione:** spostato il collegamento alla versione accanto al titolo dell'app.
- **Premio mensile:** se l'immagine del premio non è ancora disponibile, viene mostrato un messaggio di attesa invece del titolo del premio.

## [1.3.0]

### Features

- **Storico:** puoi filtrare le partite per giocatore.
- **Profilo giocatore:** la bacheca dei premi mostra gli ultimi 5 risultati, con un collegamento allo storico già filtrato.
- **Profilo giocatore:** mostra:
  - **Miglior amico:** giocatore con cui si è vinto più ELO quando si era in squadra assieme.
  - **Peggior amico:** giocatore con cui si è perso più ELO quando si era in squadra assieme, con il messaggio “Sarà colpa sua o tua?”.
  - **Miglior nemico:** giocatore contro cui si è vinto più ELO.
  - **Peggior nemico:** giocatore contro cui si è perso più ELO.
  - I rapporti con saldo ELO zero non vengono mostrati.

### Changes

- **Classifica:** i giocatori con meno di 10 partite sono mostrati in grigio e senza numero, ma nella giusta posizione. È indicato quante partite mancano per entrare in classifica.
- **Statistiche e premi**: rinominata in **Premi**. La sezione non mostra più “Vittorie per colore”.

## [1.2.0]

### Features

- Ogni mese, il giocatore che ha guadagnato più punti riceverà un premio permanente, visibile in "classifiche e premi".
- Badge temporaneo settimanale per chi ha guadagnato più punti: il Bomboclat
- Badge temporaneo settimanale per chi ha perso più punti: lo Scemo del Villaggio
- **Statistiche**: rinominata in **Statistiche e premi**. Contiene i premi con le loro classifiche
- Aggiunta la pagina **Dettaglio giocatore**. Contiene una bacheca con i premi permanenti vinti fino ad ora. Accessibile in vari punti premendo il nome del giocatore

### Changes

- **Storico:** ora carica 25 risultati alla volta continuando automaticamente durante lo scorrimento, senza scaricare l’intero archivio all’avvio.
- Le icone personalizzate rendono subito riconoscibili Bomboclat e Scemo del Villaggio sugli avatar e nella spiegazione dei premi.
- La coppa cartacea dei riconoscimenti retroattivi e l’icona del sito adottano le nuove illustrazioni dedicate.

### Chores

- Soglie del bundle di produzione aggiornate a 1 MB per gli avvisi e 3 MB per gli errori.

## [1.1.0]

### Features

- Due azioni dedicate permettono di creare squadre casuali oppure bilanciate in base al punteggio ELO.
- Selezione dei giocatori, squadre e punteggio della partita in corso conservati durante la navigazione nell'app.
- Palette ampliata a 20 tonalità pastello: i giocatori attuali hanno colori distinti e le iniziali negli avatar sono scure.

### Changes

- Il marchio dell'app è ora Coppa Telenia, mostrato come unico titolo senza sottotitolo.

### Bugfixes

- Le card dei giocatori selezionati hanno un aspetto più evidente e curato, con accento caldo e bordi colorati per squadra.
- L'eliminazione di una partita recente completa nuovamente il ricalcolo ELO senza mostrare un errore.
- Avatar dei giocatori unificati tra selezione squadre, gestione giocatori, classifica e statistiche, sempre con iniziali scure.

## [1.0.1]

### Features

- Anteprima dei punti ELO guadagnati o persi da ciascuna squadra prima della partita.
- Numero di versione visibile nell'app con accesso a una pagina dedicata che renderizza questo changelog.

## [1.0.0]

### Features

- Accesso tramite account aziendale condiviso e consultazione pubblica in sola lettura.
- Creazione e modifica dei giocatori, colore dell'avatar e stato attivo.
- Selezione dei partecipanti con preferenza per la squadra rossa, blu o assegnazione automatica.
- Creazione automatica delle squadre con priorità a chi ha giocato meno durante la giornata e gestione dei giocatori in panchina per il giro successivo.
- Segnapunti fino a 6 goal, correzione del punteggio e conferma del risultato.
- Salvataggio delle partite e aggiornamento automatico del punteggio ELO.
- Classifica ELO con partite giocate, vittorie, sconfitte, percentuale di vittorie e differenza reti.
- Statistiche sulle vittorie per colore e grafico interattivo dell'andamento ELO nel tempo.
- Storico delle partite con formazioni, risultato e variazioni ELO.
- Eliminazione temporizzata delle partite con ricalcolo di ELO e statistiche.
