import { DOCUMENT } from '@angular/common';
import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  MatchParticipant,
  MatchRecord,
  MonthlyChampion,
  MonthlyEloRanking,
  TeamColor,
  AvatarType,
  Player,
  PlayerRivalry,
  PlayerStatistic,
  PlayerAvatarMedal,
  SelectionMode,
  TeamDraft,
  TeamPickingMode,
} from './models';
import { SupabaseService } from './supabase.service';
import type { Database } from './database.types';
import {
  calculateMonthlyBadgesFromStandings,
  calculateWinStreakBadges,
  type Badge,
} from './monthly-badges/monthly-badges';
import {
  findNewRecognitions,
  type NewRecognition,
  type RecognitionSnapshot,
} from './recognitions/recognitions';
import { romeMonthKey } from './rome-calendar/rome-calendar';

type MatchRow = Database['public']['Tables']['matches']['Row'];
type MatchParticipantRow = Database['public']['Tables']['match_players']['Row'];
type ActivePlayRow = Database['public']['Tables']['active_play']['Row'];

type FilteredMatchRow = MatchRow & {
  match_players: Array<Pick<MatchParticipantRow, 'player_id'>>;
};

interface MatchHistoryCursor {
  playedAt: string;
  id: string;
}

const MINIMUM_GAMES_FOR_GLOBAL_RANKING = 10;
const GLOBAL_MEDAL_BY_POSITION: Record<
  1 | 2 | 3,
  PlayerAvatarMedal
> = {
  1: 'gold',
  2: 'silver',
  3: 'bronze',
};

@Injectable({ providedIn: 'root' })
export class AppStore {
  private readonly supabase = inject(SupabaseService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly activePlay = signal<ActivePlayRow | null>(null);
  private playConnectionEpoch = 0;
  private reconnectingPlay = false;
  private playDatabaseSubscribed = false;
  private readonly playerColorReplacements: Record<string, string> = {
    '#e84a5f': '#fbc4ab',
    '#3279f6': '#bde0fe',
  };
  private historyLoadPromise: Promise<void> | null = null;
  private realtimeChannel: RealtimeChannel | null = null;
  private playChannel: RealtimeChannel | null = null;
  private readonly historyPageSize = 25;
  private historyCursor: MatchHistoryCursor | null = null;
  private historyPlayerId: string | null = null;
  private historyInitialized = false;

  readonly players = signal<Player[]>([]);
  readonly statistics = signal<PlayerStatistic[]>([]);
  readonly monthlyRankings = signal<MonthlyEloRanking[]>([]);
  readonly monthlyChampions = signal<MonthlyChampion[]>([]);
  readonly historyMatches = signal<MatchRecord[]>([]);
  readonly historyLoading = signal(false);
  readonly historyError = signal<string | null>(null);
  readonly historyHasMore = signal(true);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly newRecognitions = signal<NewRecognition[]>([]);
  readonly currentRecognition = computed(
    () => this.newRecognitions()[0] ?? null,
  );
  readonly activePlayers = computed(() =>
    this.players().filter((player) => player.active),
  );
  readonly globalMedals = computed(() => {
    const medals = new Map<string, PlayerAvatarMedal>();
    const rankedPlayers = this.statistics()
      .filter(
        (statistic) =>
          statistic.games >= MINIMUM_GAMES_FOR_GLOBAL_RANKING,
      )
      .sort((left, right) => {
        const eloDifference = right.current_elo - left.current_elo;
        if (eloDifference !== 0) {
          return eloDifference;
        }

        if (left.id < right.id) {
          return -1;
        }

        if (left.id > right.id) {
          return 1;
        }

        return 0;
      })
      .slice(0, 3);

    for (const [index, statistic] of rankedPlayers.entries()) {
      const position = (index + 1) as 1 | 2 | 3;
      medals.set(statistic.id, GLOBAL_MEDAL_BY_POSITION[position]);
    }

    return medals;
  });
  readonly badges = computed(() => {
    const badges = calculateMonthlyBadgesFromStandings(
      this.monthlyRankings(),
      this.statistics(),
    );

    for (const [playerId, streakBadges] of calculateWinStreakBadges(
      this.statistics(),
    )) {
      badges.set(playerId, [
        ...(badges.get(playerId) ?? []),
        ...streakBadges,
      ]);
    }

    return badges;
  });
  readonly playSelection = signal(new Map<string, SelectionMode>());
  readonly teamPickingMode = signal<TeamPickingMode>('elo-balanced');
  readonly playReady = signal(false);
  readonly playConnected = signal(false);
  readonly playSyncError = signal<string | null>(null);
  readonly playDraft = computed<TeamDraft | null>(() => {
    const state = this.activePlay();
    if (!this.supabase.companyUser() || !state || state.phase === 'selection') {
      return null;
    }
    const playersById = new Map(this.players().map((player) => [player.id, player]));
    const resolve = (ids: string[]) =>
      ids.flatMap((id) => {
        const player = playersById.get(id);
        return player ? [player] : [];
      });
    const playing = new Set([...state.red_players, ...state.blue_players]);
    return {
      red: resolve(state.red_players),
      blue: resolve(state.blue_players),
      benched: resolve(state.candidates.filter((id) => !playing.has(id))),
    };
  });
  readonly playScore = computed(() => ({
    red: this.activePlay()?.red_score ?? 0,
    blue: this.activePlay()?.blue_score ?? 0,
  }));
  readonly playConfirming = computed(
    () => this.supabase.companyUser() && this.activePlay()?.phase === 'confirming',
  );

  constructor() {
    if (!this.supabase.configured()) {
      this.loading.set(false);
      return;
    }

    void this.refresh();
    this.subscribeToChanges();
    effect((onCleanup) => {
      if (!this.supabase.companyUser()) {
        return;
      }
      this.subscribeToPlayChanges();
      onCleanup(() => {
        this.playConnectionEpoch++;
        this.playDatabaseSubscribed = false;
        const channel = this.playChannel;
        this.playChannel = null;
        this.activePlay.set(null);
        this.playReady.set(false);
        this.playConnected.set(false);
        this.playSyncError.set(null);
        if (channel) {
          void this.supabase.client.removeChannel(channel);
        }
      });
    });
    const window = this.document.defaultView;
    const onVisibility = () => {
      if (this.document.visibilityState === 'visible') {
        void this.synchronizePlay();
      }
    };
    const onOffline = () => {
      if (!this.supabase.companyUser()) {
        return;
      }
      this.playDatabaseSubscribed = false;
      this.playConnectionEpoch++;
      this.playConnected.set(false);
      this.playSyncError.set('Connessione assente. Il punteggio non può essere modificato.');
    };
    const onOnline = () => void this.retryPlaySync();
    this.document.addEventListener('visibilitychange', onVisibility);
    window?.addEventListener('offline', onOffline);
    window?.addEventListener('online', onOnline);
    this.destroyRef.onDestroy(() => {
      this.playConnectionEpoch++;
      this.document.removeEventListener('visibilitychange', onVisibility);
      window?.removeEventListener('offline', onOffline);
      window?.removeEventListener('online', onOnline);
      if (this.realtimeChannel) {
        void this.supabase.client.removeChannel(this.realtimeChannel);
      }
    });
  }

  globalMedalFor(playerId: string): PlayerAvatarMedal | null {
    return this.globalMedals().get(playerId) ?? null;
  }

  badgesFor(playerId: string): Badge[] {
    return this.badges().get(playerId) ?? [];
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      await this.loadPlayers();
      await Promise.all([
        this.loadStatistics(),
        this.loadMonthlyAwards(),
      ]);
    } catch (error: unknown) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  async loadInitialHistory(force = false): Promise<void> {
    if (this.historyLoading()) {
      if (!force) {
        return;
      }
      const activeLoad = this.historyLoadPromise;
      if (activeLoad) {
        await activeLoad;
      }
      if (this.historyLoading()) {
        return;
      }
    }
    if (this.historyInitialized && !force) {
      return;
    }
    if (this.players().length === 0) {
      await this.loadPlayers();
    }

    this.historyInitialized = true;
    this.historyCursor = null;
    this.historyMatches.set([]);
    this.historyHasMore.set(true);
    await this.loadHistoryPageTracked();
  }

  async loadHistoryForPlayer(playerId: string | null): Promise<void> {
    this.historyPlayerId = playerId;
    await this.loadInitialHistory(true);
  }

  async loadPlayerRecentMatches(
    playerId: string,
    limit = 5,
  ): Promise<MatchRecord[]> {
    if (this.players().length === 0) {
      await this.loadPlayers();
    }
    return this.hydrateMatches(
      await this.fetchMatchRows(playerId, limit, null),
    );
  }

  async loadPlayerRivalry(playerId: string): Promise<PlayerRivalry | null> {
    const { data, error } = await this.supabase.client
      .from('player_rivalries')
      .select('*')
      .eq('player_id', playerId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!data?.player_id) {
      return null;
    }

    return {
      player_id: data.player_id,
      best_friend_id: data.best_friend_id,
      best_friend_name: data.best_friend_name,
      best_friend_elo_net: data.best_friend_elo_net ?? 0,
      worst_friend_id: data.worst_friend_id,
      worst_friend_name: data.worst_friend_name,
      worst_friend_elo_net: data.worst_friend_elo_net ?? 0,
      best_enemy_id: data.best_enemy_id,
      best_enemy_name: data.best_enemy_name,
      best_enemy_elo_net: data.best_enemy_elo_net ?? 0,
      worst_enemy_id: data.worst_enemy_id,
      worst_enemy_name: data.worst_enemy_name,
      worst_enemy_elo_net: data.worst_enemy_elo_net ?? 0,
    };
  }

  async loadMoreHistory(): Promise<void> {
    if (
      !this.historyInitialized ||
      this.historyLoading() ||
      !this.historyHasMore()
    ) {
      return;
    }

    await this.loadHistoryPageTracked();
  }

  async retryPlaySync(): Promise<void> {
    if (!this.supabase.companyUser() || this.reconnectingPlay) {
      return;
    }
    this.reconnectingPlay = true;
    this.playDatabaseSubscribed = false;
    const epoch = ++this.playConnectionEpoch;
    this.playConnected.set(false);
    const channel = this.playChannel;
    this.playChannel = null;
    try {
      if (channel) {
        await this.supabase.client.removeChannel(channel);
      }
      // Rejoin even if the socket stayed open but database registration failed.
      if (!this.destroyRef.destroyed && this.supabase.companyUser() &&
          epoch === this.playConnectionEpoch) {
        this.subscribeToPlayChanges();
      }
    } catch (error: unknown) {
      if (epoch === this.playConnectionEpoch && this.supabase.companyUser()) {
        this.playSyncError.set(this.errorMessage(error));
      }
    } finally {
      this.reconnectingPlay = false;
    }
  }

  async startPlay(
    candidates: string[],
    redPreferences: string[],
    bluePreferences: string[],
    mode: TeamPickingMode,
  ): Promise<void> {
    const state = this.assertPlayWritable();
    const { data, error } = await this.supabase.client.rpc('start_play', {
      p_candidates: candidates,
      p_red_preferences: redPreferences,
      p_blue_preferences: bluePreferences,
      p_balance_by_elo: mode === 'elo-balanced',
      p_expected_revision: state.revision,
    });
    if (error) {
      await this.synchronizePlay();
      throw error;
    }
    this.applyActivePlay(data);
  }

  async changePlay(
    action: 'goal' | 'undo' | 'correct' | 'cancel' | 'finish',
    team?: TeamColor,
  ): Promise<void> {
    const state = this.assertPlayWritable();
    if (!state.round_id) {
      throw new Error('Non c’è una partita in corso.');
    }
    const participantIds = [...state.red_players, ...state.blue_players];
    const before = action === 'finish' ? this.recognitionSnapshots(participantIds) : [];
    const { data, error } = await this.supabase.client.rpc('mutate_play', {
      p_round_id: state.round_id,
      p_expected_revision: state.revision,
      p_action: action,
      ...(team ? { p_team: team } : {}),
    });
    if (error) {
      await this.synchronizePlay();
      throw error;
    }
    this.applyActivePlay(data);
    if (action === 'finish') {
      this.notice.set('Partita registrata. Classifica aggiornata.');
      await this.refreshMatchData();
      this.newRecognitions.set(
        findNewRecognitions(before, this.recognitionSnapshots(participantIds)),
      );
    }
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
    await this.refreshMatchData();
  }

  async createPlayer(
    name: string,
    avatarColor: string,
    type: AvatarType,
  ): Promise<void> {
    this.assertCompanyUser();
    const { error } = await this.supabase.client.from('players').insert({
      name: name.trim(),
      avatar_color: avatarColor,
      type,
    });

    if (error) {
      throw error;
    }

    this.notice.set('Giocatore creato.');
    await this.loadPlayers();
  }

  async updatePlayer(
    playerId: string,
    changes: Pick<Player, 'name' | 'avatar_color' | 'type' | 'active'>,
  ): Promise<void> {
    this.assertCompanyUser();
    const { error } = await this.supabase.client
      .from('players')
      .update({
        name: changes.name.trim(),
        avatar_color: changes.avatar_color,
        type: changes.type,
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

  dismissRecognition(): void {
    this.newRecognitions.update((recognitions) => recognitions.slice(1));
  }

  dismissRecognitions(): void {
    this.newRecognitions.set([]);
  }

  private recognitionSnapshots(
    playerIds: readonly string[],
  ): RecognitionSnapshot[] {
    const requestedIds = new Set(playerIds);
    return this.statistics()
      .filter((statistic) => requestedIds.has(statistic.id))
      .map((statistic) => ({
        playerId: statistic.id,
        playerName: statistic.name,
        avatarType: statistic.type,
        currentWinStreak: statistic.current_win_streak,
        badges: [...this.badgesFor(statistic.id)],
        globalMedal: this.globalMedalFor(statistic.id),
      }));
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
          type: row.type ?? 'male',
          current_elo: Number(row.current_elo ?? 1000),
          current_win_streak: Number(row.current_win_streak ?? 0),
          games: Number(row.games ?? 0),
          wins: Number(row.wins ?? 0),
          losses: Number(row.losses ?? 0),
          goals_for: Number(row.goals_for ?? 0),
          goals_against: Number(row.goals_against ?? 0),
          goal_diff: Number(row.goal_diff ?? 0),
          win_rate: Number(row.win_rate ?? 0),
        }))
    );
  }

  private async loadMonthlyAwards(): Promise<void> {
    const currentMonthStart = romeMonthKey(new Date());
    const [rankingsResult, championsResult] = await Promise.all([
      this.supabase.client
        .from('monthly_elo_rankings')
        .select('*')
        .eq('month_start', currentMonthStart)
        .order('rank'),
      this.supabase.client
        .from('monthly_champions')
        .select('*')
        .order('month_start', { ascending: false }),
    ]);

    if (rankingsResult.error) {
      throw rankingsResult.error;
    }
    if (championsResult.error) {
      throw championsResult.error;
    }

    this.monthlyRankings.set(
      rankingsResult.data
        .filter(
          (
            row,
          ): row is typeof row & {
            month_start: string;
            player_id: string;
            elo_gained: number;
            rank: number;
          } =>
            row.month_start !== null &&
            row.player_id !== null &&
            row.elo_gained !== null &&
            row.rank !== null,
        )
        .map((row) => ({
          month_start: row.month_start,
          player_id: row.player_id,
          elo_gained: Number(row.elo_gained),
          rank: Number(row.rank),
        })),
    );
    this.monthlyChampions.set(
      championsResult.data.map((row) => ({
        ...row,
        elo_gained: Number(row.elo_gained),
      })),
    );
  }


  private async loadHistoryPageTracked(): Promise<void> {
    const pageLoad = this.loadHistoryPage();
    this.historyLoadPromise = pageLoad;
    try {
      await pageLoad;
    } finally {
      if (this.historyLoadPromise === pageLoad) {
        this.historyLoadPromise = null;
      }
    }
  }

  private async loadHistoryPage(): Promise<void> {
    this.historyLoading.set(true);
    this.historyError.set(null);

    try {
      const data = await this.fetchMatchRows(
        this.historyPlayerId,
        this.historyPageSize + 1,
        this.historyCursor,
      );

      const pageRows = data.slice(0, this.historyPageSize);
      const page = await this.hydrateMatches(pageRows);
      this.historyMatches.update((current) => {
        const knownIds = new Set(current.map((match) => match.id));
        return [...current, ...page.filter((match) => !knownIds.has(match.id))];
      });
      this.historyHasMore.set(data.length > this.historyPageSize);

      const lastMatch = pageRows[pageRows.length - 1];
      this.historyCursor = lastMatch
        ? { playedAt: lastMatch.played_at, id: lastMatch.id }
        : null;
    } catch (error: unknown) {
      this.historyError.set(this.errorMessage(error));
    } finally {
      this.historyLoading.set(false);
    }
  }
  private async fetchMatchRows(
    playerId: string | null,
    limit: number,
    cursor: MatchHistoryCursor | null,
  ): Promise<MatchRow[]> {
    if (playerId) {
      let query = this.supabase.client
        .from('matches')
        .select('*, match_players!inner(player_id)')
        .eq('match_players.player_id', playerId)
        .order('played_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit);

      if (cursor) {
        const { playedAt, id } = cursor;
        query = query.or(
          `played_at.lt.${playedAt},and(played_at.eq.${playedAt},id.lt.${id})`,
        );
      }

      const { data, error } = await query.overrideTypes<
        FilteredMatchRow[],
        { merge: false }
      >();
      if (error) {
        throw error;
      }

      return data.map((row) => {
        const { match_players, ...match } = row;
        void match_players;
        return match;
      });
    }

    let query = this.supabase.client
      .from('matches')
      .select('*')
      .order('played_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit);

    if (cursor) {
      const { playedAt, id } = cursor;
      query = query.or(
        `played_at.lt.${playedAt},and(played_at.eq.${playedAt},id.lt.${id})`,
      );
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }
    return data;
  }

  private async hydrateMatches(rows: MatchRow[]): Promise<MatchRecord[]> {
    if (rows.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('match_players')
      .select('*')
      .in(
        'match_id',
        rows.map((match) => match.id),
      )
      .order('match_id')
      .order('player_id');

    if (error) {
      throw error;
    }

    return this.mapMatches(rows, data);
  }

  private mapMatches(
    rows: MatchRow[],
    participantRows: MatchParticipantRow[],
  ): MatchRecord[] {
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
          type: player.type,
        },
      };
      const current = participantsByMatch.get(participant.match_id) ?? [];
      current.push(mapped);
      participantsByMatch.set(participant.match_id, current);
    }

    return rows.map((match) => ({
      ...match,
      participants: participantsByMatch.get(match.id) ?? [],
    }));
  }

  private async refreshMatchData(): Promise<void> {
    await this.refresh();
    if (this.historyInitialized) {
      await this.loadInitialHistory(true);
    }
  }

  private assertPlayWritable(): ActivePlayRow {
    this.assertCompanyUser();
    const state = this.activePlay();
    if (!state || !this.playReady() || !this.playConnected()) {
      throw new Error('Attendi la sincronizzazione della partita prima di modificarla.');
    }
    return state;
  }

  private applyActivePlay(state: ActivePlayRow): void {
    if (!this.supabase.companyUser()) {
      return;
    }
    const previous = this.activePlay();
    if (previous && state.revision <= previous.revision) {
      return;
    }
    this.activePlay.set(state);
    this.playReady.set(true);
    // Restore the shared roster when joining or leaving a round, not on every goal.
    if (state.phase !== 'selection' || (previous && previous.phase !== 'selection')) {
      if (!previous || previous.round_id !== state.round_id) {
        this.teamPickingMode.set(state.balance_by_elo ? 'elo-balanced' : 'random');
        this.playSelection.set(new Map(state.candidates.map((id) => [
          id,
          state.red_preferences.includes(id) ? 'red' :
            state.blue_preferences.includes(id) ? 'blue' : 'any',
        ])));
      }
    }
  }

  private async synchronizePlay(): Promise<void> {
    if (!this.supabase.companyUser() || !this.playDatabaseSubscribed ||
        this.playChannel?.state !== 'joined') {
      return;
    }
    const epoch = ++this.playConnectionEpoch;
    this.playConnected.set(false);
    try {
      const { data, error } = await this.supabase.client
        .from('active_play')
        .select('*')
        .eq('id', true)
        .single();
      if (epoch !== this.playConnectionEpoch || !this.supabase.companyUser()) {
        return;
      }
      if (error) {
        throw error;
      }
      this.applyActivePlay(data);
      this.playConnected.set(true);
      this.playSyncError.set(null);
    } catch (error: unknown) {
      if (epoch === this.playConnectionEpoch && this.supabase.companyUser()) {
        this.playSyncError.set(this.errorMessage(error));
      }
    }
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
        () => void this.refreshMatchData(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'monthly_champions' },
        () => void this.loadMonthlyAwards(),
      )
      .subscribe();
  }

  private subscribeToPlayChanges(): void {
    const channel = this.supabase.client.channel('active-play-live');
    this.playChannel = channel;
    channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'active_play' },
        (payload) => {
          if (this.playChannel === channel) {
            this.applyActivePlay(payload.new as ActivePlayRow);
          }
        },
      )
      .on('system', {}, (payload) => {
        if (this.playChannel !== channel || !this.supabase.companyUser() ||
            payload.extension !== 'postgres_changes') {
          return;
        }
        this.playDatabaseSubscribed = payload.status === 'ok';
        if (this.playDatabaseSubscribed) {
          void this.synchronizePlay();
        } else {
          this.playConnectionEpoch++;
          this.playConnected.set(false);
          this.playSyncError.set('Impossibile attivare la sincronizzazione della partita. Riprova.');
        }
      })
      .subscribe((status) => {
        if (this.playChannel !== channel || !this.supabase.companyUser()) {
          return;
        }
        if (status !== 'SUBSCRIBED') {
          this.playDatabaseSubscribed = false;
          this.playConnectionEpoch++;
          this.playConnected.set(false);
          this.playSyncError.set('Sincronizzazione interrotta. Riconnessione in corso…');
        }
      });
  }

  private assertCompanyUser(): void {
    if (!this.supabase.companyUser()) {
      throw new Error('Questa azione richiede l’account condiviso.');
    }
  }

  private errorMessage(error: unknown): string {
    return error && typeof error === 'object' &&
      'message' in error && typeof error.message === 'string'
      ? error.message
      : 'Impossibile sincronizzare i dati.';
  }
}
