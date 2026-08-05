# Changelog

## [1.2.0]

### Features

- Ogni mese, il giocatore che ha guadagnato più punti riceverà per sempre un badge esclusivo. Il badge è visible in "classifiche e premi".
- Badge settimanale temporaneo per chi ha guadagnato più punti: il bomboclat
- Badge settimanale temporaneo per chi ha perso più punti: lo scemo del villaggio
- **Statistiche**: rinominata in **statistiche e premi**. Contiene i premi con le loro classifiche
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
