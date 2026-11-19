# Fonti ed evoluzione storica

## Inventario e autorità

Prima dell'adozione il solo documento Markdown di prodotto versionato individuato era il [CHANGELOG](../CHANGELOG.md); le istruzioni repository definivano i vincoli di lavoro. Il proprietario ha confermato il 2026-11-13 che non vi sono altre fonti esterne da integrare. Le specifiche correnti sono quelle indicizzate nel [README](README.md), accettate nei limiti della [decisione di baseline](open-questions.md). Il changelog conserva il significato storico delle release, non compete come seconda definizione di regole correnti.

| Fonte ispezionata | Classe e ambito | Evidenza di copertura / limiti | Riconciliazione |
| --- | --- | --- | --- |
| [CHANGELOG.md](../CHANGELOG.md), release 1.0.0–1.8.0 | Intenzioni e variazioni storiche di prodotto | Lette tutte le voci; non dimostra completezza, deploy o correttezza attuale | Cutover ELO, arrotondamento, accesso condiviso e rapporti riconciliati col proprietario; dettagli in open-questions |
| [AGENTS.md](../AGENTS.md) | Vincoli operativi e versionamento | Istruzioni preesistenti preservate | ARCH-003 e ARCH-006 le richiamano senza sostituirle |
| [package.json](../package.json), [nx.json](../nx.json), [Netlify](../netlify.toml), [CI](../.github/workflows/ci.yml) | Architettura e strumenti | Configurazione e target Nx risolti ispezionati; nessun deploy | Differenza Node documentata, compatibilità non provata |
| [app e core](../apps/web/src/app) | Comportamento client | Ispezionati shell, rotte, autenticazione, store, modelli, helper calendario/avatar/riconoscimenti e tutti i domini di pagina | Approvazione baseline distinta da verifica eseguita |
| [migrazioni](../supabase/migrations) | Evoluzione schema, RPC, viste, importatore | Inventariate tutte le 30 migrazioni; lette definizioni e successioni pertinenti; payload legacy non validato risultato per risultato | Sorgente storico non equivale a schema live |
| File `*.spec.ts` sotto [web](../apps/web/src/app) e [web-e2e](../apps/web-e2e/src) | Asserzioni esistenti | 13 file client e un E2E; mappa in verification | Simulazioni non provano autorizzazioni, concorrenza o aggregazioni PostgreSQL |
| [skill artwork](../.agents/skills/monthly-badge-artwork/SKILL.md) e script associato | Workflow operativo asset | Letti vincoli e registrazione; nessuna generazione/validazione binaria | Fallback retroattivo distinto da mesi esclusivi non registrati |
| Skill SpecLedger introdotta dal proprietario | Metodo di adozione | Letti skill e riferimenti di adozione, documentazione, template, conflitti e tracciabilità | Nessuna modifica alla skill durante l'adozione |

La precedente assenza di `docs/` non dimostra assenza di intenzioni; le conferme del proprietario rendono accettata la baseline ricostruita. Una data recente del file o una suite verde, da sole, non costituiscono approvazione.

## Cronologia funzionale per release

Questa è una sintesi di provenienza, non la specifica da implementare al posto dei documenti di dominio. Le versioni anteriori non ricevono retroattivamente ID di requisiti mai esistiti; non si inventano approvazioni o motivazioni storiche.

| Release storica | Variazioni documentate | Autorità corrente / cosa non ripristinare |
| --- | --- | --- |
| 1.0.0 | Account condiviso e lettura pubblica; rosa; squadre e panchina; risultato a 6; ELO; classifiche, grafico e vittorie per colore; storico ed eliminazione temporizzata | AUTH, PLAYER, PLAY, PICK, ELO, RANK, HIST. Grafico e vittorie per colore non sono superfici attuali nei template ispezionati. |
| 1.0.1 | Anteprima ELO e versione con changelog nell'app | ELO-004, GEN-006, ARCH-006. |
| 1.1.0 | Random/bilanciato, stato conservato durante navigazione, venti colori, marchio Coppa Telenia; fix ricalcolo con safe-update | PICK, PLAYER-003, GEN-003, ARCH-003. Persistenza nella navigazione non significa ancora sincronizzazione remota. |
| 1.2.0 | Premio mensile permanente, badge settimanali, profilo/bacheca, storico paginato e premi retroattivi | AWARD, PROFILE, HIST. Settimana e vecchi overlay sono storici, non regole correnti. |
| 1.3.0 | Filtro giocatore e ultimi cinque risultati; amici/nemici; soglia dieci partite; rimozione vittorie per colore | HIST-001, PROFILE-003/004, RANK-002. Le migrazioni precisano l'evoluzione lordo→netto. |
| 1.3.1 | Pagina classifiche unificata, globale allora dedicata, artwork settembre, messaggio premio mancante, link versione accanto al titolo | RANK-004 e AWARD-004; la globale corrente è incorporata, non una rotta autonoma. |
| 1.4.0 | ELO K28 con margine, classifiche mensili al posto delle settimanali, posizioni mensili uniche, artwork ottobre; profili da righe e storico | ELO-001/002, RANK-005, AWARD, PROFILE. Il cutover approvato è la versione persistita; il vecchio ingrandimento badge non impone un dialog per le parti avatar correnti. |
| 1.4.1 | Notifica di due secondi, correzione doppio tap iOS sui goal | GEN-002 e percorso punteggio PLAY; la correzione touch è evidenza storica, non test visuale iOS attuale. |
| 1.5.0 | Serie 3/5/10, riconoscimenti sequenziali post-partita, styling oro/argento/bronzo e fix doppio tap sui comandi di annullamento | AWARD-002/006/007 e PLAY. |
| 1.5.1 | Effetti avatar al posto dei badge | Evoluzione verso la composizione corrente AWARD-006; non ripristinare icone sovrapposte. |
| 1.6.0 | Avatar a pelle/viso/capelli e priorità basata sulle esclusioni | AWARD-006, PICK-002/005. L'azzeramento originario della priorità è sostituito dal decremento della 1.8.0. |
| 1.7.0 | Tipo Maschio/Femmina e artwork novembre | PLAYER-004, AWARD-004/006. |
| 1.8.0 | Partita condivisa, anteprima intera, bonus prima partita, priorità −1, dock e classifiche espandibili, semplificazione testi | PLAY, PICK, ELO-004, GEN-004, RANK-004. Le difformità emerse sono registrate, non corrette dall'adozione. |

## Cronologia database e contratti proprietari

I nomi sono identificatori dei file, **non attestazioni della data di applicazione al servizio**. Tutti i percorsi seguenti sono sotto `supabase/migrations/`. Le migrazioni restano intatte: l'indice permette di seguire definizioni sostituite senza copiarle come regole ancora attive.

| Migrazione | Significato storico e documento proprietario |
| --- | --- |
| `202607210001_initial.sql` | Schema, profili approvati, giocatori, match/partecipanti, statistiche, ELO K32, scelta giornaliera; ARCH, AUTH, PLAYER, ELO, PICK, HIST. |
| `202607210002_harden_function_grants.sql` | Restrizione esecuzione funzioni; AUTH-004. |
| `202607210003_optimize_policies_and_indexes.sql` | Policy profilo e indici creator/editor; AUTH e archivio. |
| `202607210004_company_domain_access.sql` | Passaggio dall'approvazione individuale al dominio aziendale; fase intermedia AUTH. |
| `202607230001_shared_account_access.sql` | Restrizione alla singola identità condivisa; AUTH-001. |
| `202607230002_import_legacy_history.sql` | Import una tantum, delta bloccati e risultati legacy; HIST-004, ELO-003. |
| `202607230003_legacy_statistics.sql` | Vittoria/sconfitta dal confronto dei goal anche per legacy; RANK-001. |
| `202607230004_delete_match_window.sql` | Eliminazione temporizzata al posto di update_match; HIST-003, AUTH-004. |
| `202607290001_fix_recalculate_elo_safe_updates.sql` | WHERE esplicito nel reset ELO; ARCH-003, ELO-003. |
| `202607290002_team_picking_modes.sql` | Scelta random o bilanciata; PICK-003. |
| `202607290003_fix_team_picking_mode_order.sql` | Correzione ordinamento criterio di bilanciamento; PICK-003. |
| `202607290004_assign_unique_pastel_player_colors.sql` | Assegnazione storica colori pastello; PLAYER-003, non vincolo globale permanente. |
| `202608050001_paginate_match_history.sql` | Indice per cursore composto; HIST-001. |
| `202608050002_monthly_elo_champions.sql` | Graduatoria mensile inizialmente dense_rank, premi e job di finalizzazione; RANK-005, AWARD-003. |
| `202608050003_index_monthly_champions_player.sql` | Indice FK dei premi; AWARD-003 e PROFILE-002. |
| `202608100001_player_rivalries.sql` | Rapporti inizialmente basati sui conteggi; storia PROFILE-004. |
| `202608100002_player_rivalries_elo.sql` | Criterio intermedio ELO lordo; storia PROFILE-004. |
| `202608100003_player_rivalries_net_elo.sql` | Passaggio al saldo netto firmato; PROFILE-004. |
| `202608100004_player_rivalries_best_enemy.sql` | Quarto rapporto e definizione corrente della vista; PROFILE-004. |
| `202609280001_score_aware_elo.sql` | Versioni ELO e bonus margine; ELO-001/002/003. |
| `202609280002_unique_monthly_ranks.sql` | Posizioni mensili uniche via row_number; RANK-005. |
| `202610100001_win_streak.sql` | Serie corrente, backfill e ricostruzione nel replay; AWARD-002, ELO-003/005. |
| `202610170001_exclusion_priority.sql` | Candidati, contatori esclusione, integrazione registrazione/cancellazione; PICK-005 e HIST-003. |
| `202610170002_preferred_players.sql` | Garanzia intermedia del posto ai preferiti, poi sostituita; storia PICK-002. |
| `202610170003_preference_caps.sql` | Cap applicato agli estratti per colore; PICK-002. |
| `202610280001_avatar_types.sql` | Tipo avatar e vista statistiche aggiornata; PLAYER-004, RANK-001. |
| `202611050001_shared_active_play.sql` | Slot condiviso, revisioni, round, RPC e chiusura helper diretti; PLAY, AUTH-004/005. |
| `202611050002_monthly_champions_realtime.sql` | Pubblicazione realtime dei premi; AWARD-003, RANK-005. |
| `202611050003_daily_first_game_priority.sql` | Bonus temporaneo prima partita del giorno; PICK-002. |
| `202611050004_decrement_played_priority.sql` | Partecipante −1 anziché reset; replay contatori e record_match corrente; PICK-005, ELO-001. |
| `20261119185013_stop_stale_play_rpc_retries.sql` | Restituisce HTTP 409 senza retry automatici per i comandi obsoleti; PLAY-005. |

## Conservazione e limiti

- Nessun documento storico viene eliminato o spostato; il changelog rimane consultabile nell'app.
- Il ledger documenta tutti i domini applicativi individuati, compreso il laboratorio. Non è una validazione di ogni riga del dataset legacy o di ogni pixel degli artwork.
- La presenza nel repository di codice precedente e migrazioni sostituite non impone di ripristinarli. Le specifiche correnti e gli scostamenti espliciti sono l'autorità per il lavoro futuro.
- Nessuna istanza Supabase, segreto, dato produttivo o configurazione remota è stata letta o modificata per questa ricostruzione.
