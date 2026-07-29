import { computed, inject, Injectable, signal } from '@angular/core';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  MatchParticipant,
  MatchRecord,
  PickedPlayer,
  Player,
  PlayerStatistic,
  SelectionMode,
  TeamDraft,
  TeamPickingMode,
} from './models';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AppStore {
  private readonly supabase = inject(SupabaseService);
  private readonly playerColorReplacements: Record<string, string> = {
    '#e84a5f': '#fbc4ab',
    '#3279f6': '#bde0fe',
  };
  private realtimeChannel: RealtimeChannel | null = null;

  readonly players = signal<Player[]>([]);
  readonly statistics = signal<PlayerStatistic[]>([]);
  readonly matches = signal<MatchRecord[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly activePlayers = computed(() =>
    this.players().filter((player) => player.active),
  );
  readonly playSelection = signal(new Map<string, SelectionMode>());
  readonly teamPickingMode = signal<TeamPickingMode>('elo-balanced');
  readonly playDraft = signal<TeamDraft | null>(null);
  readonly playScore = signal({ red: 0, blue: 0 });
  readonly playConfirming = signal(false);

  constructor() {
    if (!this.supabase.configured()) {
      this.loading.set(false);
      return;
    }

    void this.refresh();
    this.subscribeToChanges();
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      await this.loadPlayers();
      await Promise.all([this.loadStatistics(), this.loadMatches()]);
    } catch (error: unknown) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  async pickTeams(
    candidates: string[],
    redPreferences: string[],
    bluePreferences: string[],
    mode: TeamPickingMode,
  ): Promise<PickedPlayer[]> {
    this.assertCompanyUser();
    const { data, error } = await this.supabase.client.rpc('pick_teams', {
      p_candidates: candidates,
      p_red_preferences: redPreferences,
      p_blue_preferences: bluePreferences,
      p_balance_by_elo: mode === 'elo-balanced',
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async recordMatch(
    redPlayers: string[],
    bluePlayers: string[],
    redScore: number,
    blueScore: number,
  ): Promise<void> {
    this.assertCompanyUser();
    const { error } = await this.supabase.client.rpc('record_match', {
      p_red_players: redPlayers,
      p_blue_players: bluePlayers,
      p_red_score: redScore,
      p_blue_score: blueScore,
    });

    if (error) {
      throw error;
    }

    this.notice.set('Partita registrata. Classifica aggiornata.');
    await this.refresh();
  }

  async deleteMatch(matchId: string): Promise<void> {
    this.assertCompanyUser();
    const { error } = await this.supabase.client.rpc('delete_match', {
      p_match_id: matchId,
    });

    if (error) {
      throw error;
    }

    this.notice.set('Partita eliminata. Classifica aggiornata.');
    await this.refresh();
  }

  async createPlayer(name: string, avatarColor: string): Promise<void> {
    this.assertCompanyUser();
    const { error } = await this.supabase.client.from('players').insert({
      name: name.trim(),
      avatar_color: avatarColor,
    });

    if (error) {
      throw error;
    }

    this.notice.set('Giocatore creato.');
    await this.loadPlayers();
  }

  async updatePlayer(
    playerId: string,
    changes: Pick<Player, 'name' | 'avatar_color' | 'active'>,
  ): Promise<void> {
    this.assertCompanyUser();
    const { error } = await this.supabase.client
      .from('players')
      .update({
        name: changes.name.trim(),
        avatar_color: changes.avatar_color,
        active: changes.active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', playerId);

    if (error) {
      throw error;
    }

    this.notice.set('Giocatore aggiornato.');
    await Promise.all([this.loadPlayers(), this.loadStatistics()]);
  }

  dismissNotice(): void {
    this.notice.set(null);
  }

  private async loadPlayers(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('players')
      .select('*')
      .order('name');

    if (error) {
      throw error;
    }

    for (const player of data) {
      player.avatar_color =
        this.playerColorReplacements[player.avatar_color.toLowerCase()] ??
        player.avatar_color;
    }
    this.players.set(data);
  }

  private async loadStatistics(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('player_statistics')
      .select('*')
      .order('current_elo', { ascending: false });

    if (error) {
      throw error;
    }

    this.statistics.set(
      data
        .filter(
          (row): row is typeof row & { id: string; name: string } =>
            row.id !== null && row.name !== null,
        )
        .map((row) => ({
          id: row.id,
          name: row.name,
          avatar_color:
            this.playerColorReplacements[
              row.avatar_color?.toLowerCase() ?? ''
            ] ??
            row.avatar_color ??
            '#a8e6cf',
          current_elo: Number(row.current_elo ?? 1000),
          games: Number(row.games ?? 0),
          wins: Number(row.wins ?? 0),
          losses: Number(row.losses ?? 0),
          goals_for: Number(row.goals_for ?? 0),
          goals_against: Number(row.goals_against ?? 0),
          goal_diff: Number(row.goal_diff ?? 0),
          win_rate: Number(row.win_rate ?? 0),
        })),
    );
  }

  private async loadMatches(): Promise<void> {
    const pageSize = 1000;
    const [matchesResult, firstParticipantsResult] = await Promise.all([
      this.supabase.client
        .from('matches')
        .select('*')
        .order('played_at', { ascending: false }),
      this.supabase.client
        .from('match_players')
        .select('*')
        .order('match_id')
        .order('player_id')
        .range(0, pageSize - 1),
    ]);

    if (matchesResult.error) {
      throw matchesResult.error;
    }
    if (firstParticipantsResult.error) {
      throw firstParticipantsResult.error;
    }

    const participantRows = firstParticipantsResult.data;
    while (
      participantRows.length > 0 &&
      participantRows.length % pageSize === 0
    ) {
      const nextParticipantsResult = await this.supabase.client
        .from('match_players')
        .select('*')
        .order('match_id')
        .order('player_id')
        .range(participantRows.length, participantRows.length + pageSize - 1);
      if (nextParticipantsResult.error) {
        throw nextParticipantsResult.error;
      }
      participantRows.push(...nextParticipantsResult.data);
    }

    const playersById = new Map(
      this.players().map((player) => [player.id, player] as const),
    );
    const participantsByMatch = new Map<string, MatchParticipant[]>();

    for (const participant of participantRows) {
      const player = playersById.get(participant.player_id);
      if (!player) {
        continue;
      }

      const mapped: MatchParticipant = {
        ...participant,
        elo_before: Number(participant.elo_before),
        elo_delta: Number(participant.elo_delta),
        player: {
          id: player.id,
          name: player.name,
          avatar_color: player.avatar_color,
        },
      };
      const current = participantsByMatch.get(participant.match_id) ?? [];
      current.push(mapped);
      participantsByMatch.set(participant.match_id, current);
    }

    this.matches.set(
      matchesResult.data.map((match) => ({
        ...match,
        participants: participantsByMatch.get(match.id) ?? [],
      })),
    );
  }

  private subscribeToChanges(): void {
    this.realtimeChannel = this.supabase.client
      .channel('scoreboard-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        () => void this.refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => void this.refresh(),
      )
      .subscribe();
  }

  private assertCompanyUser(): void {
    if (!this.supabase.companyUser()) {
      throw new Error('Questa azione richiede l’account condiviso.');
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error
      ? error.message
      : 'Impossibile sincronizzare i dati.';
  }
}
