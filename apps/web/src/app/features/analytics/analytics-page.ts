import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AppStore } from '../../core/app-store.service';
import type { MatchRecord, PlayerStatistic } from '../../core/models';
import { PlayerAvatar } from '../../core/player-avatar';

interface EloChartPoint {
  x: number;
  y: number;
}

interface EloChartSeries {
  id: string;
  name: string;
  color: string;
  currentElo: number;
  path: string;
  lastPoint: EloChartPoint;
}

interface EloAxisTick {
  value: number;
  position: number;
}

interface TimeAxisTick {
  date: Date;
  position: number;
}

@Component({
  selector: 'app-analytics-page',
  imports: [DatePipe, DecimalPipe, PlayerAvatar],
  templateUrl: './analytics-page.html',
  styleUrl: './analytics-page.scss',
})
export class AnalyticsPage {
  private readonly chartWidth = 920;
  private readonly chartHeight = 430;
  private readonly plotLeft = 64;
  private readonly plotRight = 24;
  private readonly plotTop = 24;
  private readonly plotBottom = 54;

  protected readonly store = inject(AppStore);
  protected readonly selectedPlayerId = signal<string | null>(null);

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

  protected readonly eloChart = computed(() =>
    this.buildEloChart(this.store.matches(), this.store.statistics()),
  );

  protected togglePlayer(playerId: string): void {
    this.selectedPlayerId.update((selected) =>
      selected === playerId ? null : playerId,
    );
  }

  private buildEloChart(matches: MatchRecord[], statistics: PlayerStatistic[]) {
    if (matches.length === 0 || statistics.length === 0) {
      return null;
    }

    const chronologicalMatches = [...matches].sort(
      (first, second) =>
        new Date(first.played_at).getTime() -
        new Date(second.played_at).getTime(),
    );
    const startTimestamp = new Date(
      chronologicalMatches[0].played_at,
    ).getTime();
    const endTimestamp = new Date(
      chronologicalMatches[chronologicalMatches.length - 1].played_at,
    ).getTime();
    const timeRange = Math.max(1, endTimestamp - startTimestamp);
    const plotWidth = this.chartWidth - this.plotLeft - this.plotRight;
    const plotHeight = this.chartHeight - this.plotTop - this.plotBottom;
    const historyByPlayer = new Map<
      string,
      Array<{ timestamp: number; elo: number }>
    >();
    const allRatings: number[] = [];

    for (const match of chronologicalMatches) {
      const timestamp = new Date(match.played_at).getTime();
      for (const participant of match.participants) {
        const history = historyByPlayer.get(participant.player_id) ?? [];
        if (history.length === 0) {
          history.push({ timestamp, elo: participant.elo_before });
          allRatings.push(participant.elo_before);
        }

        const eloAfter = participant.elo_before + participant.elo_delta;
        history.push({ timestamp, elo: eloAfter });
        allRatings.push(eloAfter);
        historyByPlayer.set(participant.player_id, history);
      }
    }

    if (allRatings.length === 0) {
      return null;
    }

    const rawMinimum = Math.min(...allRatings);
    const rawMaximum = Math.max(...allRatings);
    const step = this.niceStep(Math.max(1, rawMaximum - rawMinimum) / 5);
    const minimumElo = Math.floor((rawMinimum - step * 0.25) / step) * step;
    const maximumElo = Math.ceil((rawMaximum + step * 0.25) / step) * step;
    const eloRange = Math.max(1, maximumElo - minimumElo);
    const xPosition = (timestamp: number) =>
      this.plotLeft + ((timestamp - startTimestamp) / timeRange) * plotWidth;
    const yPosition = (elo: number) =>
      this.plotTop + ((maximumElo - elo) / eloRange) * plotHeight;
    const statisticsById = new Map(
      statistics.map((statistic) => [statistic.id, statistic]),
    );

    const series = [...historyByPlayer.entries()]
      .map(([playerId, history]): EloChartSeries | null => {
        const statistic = statisticsById.get(playerId);
        if (!statistic) {
          return null;
        }

        const points = history.map(({ timestamp, elo }) => ({
          x: xPosition(timestamp),
          y: yPosition(elo),
        }));
        const lastPoint = points[points.length - 1];
        return {
          id: playerId,
          name: statistic.name,
          color: statistic.avatar_color,
          currentElo: statistic.current_elo,
          path: points
            .map(
              (point, index) =>
                `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
            )
            .join(' '),
          lastPoint,
        };
      })
      .filter((series): series is EloChartSeries => series !== null)
      .sort((first, second) => second.currentElo - first.currentElo);

    const yTicks: EloAxisTick[] = [];
    for (let value = minimumElo; value <= maximumElo; value += step) {
      yTicks.push({ value, position: yPosition(value) });
    }

    const xTicks: TimeAxisTick[] = Array.from({ length: 5 }, (_, index) => {
      const ratio = index / 4;
      return {
        date: new Date(startTimestamp + ratio * timeRange),
        position: this.plotLeft + ratio * plotWidth,
      };
    });

    return {
      width: this.chartWidth,
      height: this.chartHeight,
      plotLeft: this.plotLeft,
      plotRight: this.chartWidth - this.plotRight,
      plotTop: this.plotTop,
      plotBottom: this.chartHeight - this.plotBottom,
      startDate: new Date(startTimestamp),
      endDate: new Date(endTimestamp),
      yTicks,
      xTicks,
      series,
    };
  }

  private niceStep(value: number): number {
    const magnitude = 10 ** Math.floor(Math.log10(value));
    const normalized = value / magnitude;
    const factor =
      normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return factor * magnitude;
  }
}
