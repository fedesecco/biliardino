import { DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppStore } from '../../core/app-store.service';
import { PlayerAvatar } from '../../core/player-avatar';
import type {
  PlayerAvatarMedal,
  PlayerStatistic,
} from '../../core/models';

const MINIMUM_GAMES_FOR_RANKING = 10;

interface RankingRow {
  gamesToRank: number | null;
  rank: number | null;
  medal: PlayerAvatarMedal | null;
  stat: PlayerStatistic;
}


@Component({
  selector: 'app-ranking-page',
  imports: [DecimalPipe, PlayerAvatar, RouterLink],
  templateUrl: './ranking-page.html',
  styleUrl: './ranking-page.scss',
})
export class RankingPage {
  protected readonly store = inject(AppStore);
  protected readonly rankingRows = computed<RankingRow[]>(() => {
    let rank = 0;
    return this.store.statistics().map((stat) => {
      const gamesToRank =
        stat.games < MINIMUM_GAMES_FOR_RANKING
          ? MINIMUM_GAMES_FOR_RANKING - stat.games
          : null;
      const playerRank = gamesToRank === null ? ++rank : null;
      return {
        gamesToRank,
        rank: playerRank,
        medal: this.store.globalMedalFor(stat.id),
        stat,
      };
    });
  });
}
