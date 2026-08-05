import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppStore } from '../../core/app-store.service';
import type { MonthlyEloRanking, PlayerStatistic } from '../../core/models';
import { PlayerAvatar } from '../../core/player-avatar';
import { italianMonthLabel, romeMonthKey } from '../../core/rome-calendar';
import { TrophyArtwork } from '../../core/trophy-artwork';

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
  protected readonly monthlyRankingOpen = signal(false);
  protected readonly weeklyRankingOpen = signal(false);
  protected readonly monthStart = computed(
    () => this.store.monthlyRankings()[0]?.month_start ?? romeMonthKey(new Date()),
  );
  protected readonly monthLabel = computed(() =>
    capitalize(italianMonthLabel(this.monthStart())),
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
  protected readonly weeklyStandings = computed<AwardStanding[]>(() => {
    const players = new Map(
      this.store.statistics().map((player) => [player.id, player]),
    );
    let previousElo: number | null = null;
    let rank = 0;
    return this.store
      .weeklyStandings()
      .map((standing, index): AwardStanding | null => {
        const player = players.get(standing.playerId);
        if (!player) {
          return null;
        }
        if (previousElo === null || standing.elo !== previousElo) {
          rank = index + 1;
          previousElo = standing.elo;
        }
        return {
          elo: standing.elo,
          player,
          playerId: standing.playerId,
          rank,
        };
      })
      .filter((standing): standing is AwardStanding => standing !== null);
  });
  protected readonly weeklyChampions = computed(() =>
    this.weeklyStandings().filter(
      ({ playerId }) =>
        this.store.weeklyBadgeFor(playerId)?.kind === 'weekly-champion',
    ),
  );
  protected readonly weeklyLosers = computed(() =>
    this.weeklyStandings().filter(
      ({ playerId }) =>
        this.store.weeklyBadgeFor(playerId)?.kind === 'weekly-loser',
    ),
  );

  protected readonly teamPerformance = computed(() => {
    let blueWins = 0;
    let redWins = 0;

    for (const match of this.store.matches()) {
      if (match.blue_score > match.red_score) {
        blueWins += 1;
      } else {
        redWins += 1;
      }
    }

    const total = blueWins + redWins;
    return {
      total,
      blueWins,
      redWins,
      blueRate: total === 0 ? 0 : (blueWins / total) * 100,
      redRate: total === 0 ? 0 : (redWins / total) * 100,
    };
  });


  protected toggleMonthlyRanking(): void {
    this.monthlyRankingOpen.update((open) => !open);
  }

  protected toggleWeeklyRanking(): void {
    this.weeklyRankingOpen.update((open) => !open);
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
