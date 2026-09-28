import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppStore } from '../../core/app-store.service';
import type { MonthlyEloRanking, PlayerStatistic } from '../../core/models';
import { PlayerAvatar } from '../../core/player-avatar';
import { italianMonthLabel, romeMonthKey } from '../../core/rome-calendar';
import {
  hasExclusiveTrophyArtwork,
  TrophyArtwork,
} from '../../core/trophy-artwork';

interface AwardStanding {
  elo: number;
  player: PlayerStatistic;
  playerId: string;
  rank: number;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

@Component({
  selector: 'app-analytics-page',
  imports: [DecimalPipe, PlayerAvatar, RouterLink, TrophyArtwork],
  templateUrl: './analytics-page.html',
  styleUrl: './analytics-page.scss',
})
export class AnalyticsPage {
  protected readonly store = inject(AppStore);
  protected readonly globalLeaders = computed(() =>
    this.store.statistics().slice(0, 3),
  );
  protected readonly monthlyRankingOpen = signal(false);
  protected readonly monthStart = computed(
    () =>
      this.store.monthlyRankings()[0]?.month_start ?? romeMonthKey(new Date()),
  );
  protected readonly monthLabel = computed(() =>
    capitalize(italianMonthLabel(this.monthStart())),
  );
  protected readonly hasMonthlyArtwork = computed(() =>
    hasExclusiveTrophyArtwork(this.monthStart()),
  );
  protected readonly monthlyStandings = computed<AwardStanding[]>(() => {
    const players = new Map(
      this.store.statistics().map((player) => [player.id, player]),
    );
    return this.store
      .monthlyRankings()
      .filter((standing) => standing.month_start === this.monthStart())
      .map((standing) => this.toAwardStanding(standing, players))
      .filter((standing): standing is AwardStanding => standing !== null)
      .sort((first, second) => first.rank - second.rank);
  });
  protected readonly monthlyLeaders = computed(() =>
    this.monthlyStandings().filter((standing) => standing.rank === 1),
  );

  protected toggleMonthlyRanking(): void {
    this.monthlyRankingOpen.update((open) => !open);
  }

  private toAwardStanding(
    standing: MonthlyEloRanking,
    players: Map<string, PlayerStatistic>,
  ): AwardStanding | null {
    const player = players.get(standing.player_id);
    return player
      ? {
          elo: standing.elo_gained,
          player,
          playerId: standing.player_id,
          rank: standing.rank,
        }
      : null;
  }
}
