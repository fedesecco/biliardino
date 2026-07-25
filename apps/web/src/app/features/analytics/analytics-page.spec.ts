import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppStore } from '../../core/app-store.service';
import type { MatchRecord, PlayerStatistic } from '../../core/models';
import { AnalyticsPage } from './analytics-page';

registerLocaleData(localeIt);

describe('AnalyticsPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyticsPage],
      providers: [
        {
          provide: AppStore,
          useValue: {
            error: signal<string | null>(null),
            loading: signal(false),
            matches: signal(matches),
            statistics: signal(statistics),
          },
        },
      ],
    }).compileComponents();
  });

  it('plots each player ELO against time', () => {
    const fixture = TestBed.createComponent(AnalyticsPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.player-line')).toHaveLength(2);
    expect(element.querySelectorAll('.x-label')).toHaveLength(5);
    expect(element.querySelectorAll('.y-label').length).toBeGreaterThan(1);
    expect(element.querySelector('.history-chart')?.getAttribute('aria-label')).toBe(
      'Andamento ELO dei giocatori nel tempo',
    );
  });

  it('isolates the selected player series', () => {
    const fixture = TestBed.createComponent(AnalyticsPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const firstLegendButton = element.querySelector(
      '.chart-legend button',
    ) as HTMLButtonElement;

    firstLegendButton.click();
    fixture.detectChanges();

    expect(firstLegendButton.getAttribute('aria-pressed')).toBe('true');
    expect(element.querySelectorAll('.player-line.selected')).toHaveLength(1);
    expect(element.querySelectorAll('.player-line.dimmed')).toHaveLength(1);
  });
});

const statistics: PlayerStatistic[] = [
  statistic('player-one', 'Mario Rossi', '#1f9d70', 1032),
  statistic('player-two', 'Luigi Bianchi', '#3279f6', 968),
];

const matches: MatchRecord[] = [
  match('match-one', '2026-07-01T12:00:00.000Z', 1000, 1000, 16),
  match('match-two', '2026-07-03T12:00:00.000Z', 1016, 984, 16),
];

function statistic(
  id: string,
  name: string,
  avatarColor: string,
  currentElo: number,
): PlayerStatistic {
  return {
    id,
    name,
    avatar_color: avatarColor,
    current_elo: currentElo,
    games: 2,
    wins: 1,
    losses: 1,
    goals_for: 10,
    goals_against: 10,
    goal_diff: 0,
    win_rate: 50,
  };
}

function match(
  id: string,
  playedAt: string,
  redElo: number,
  blueElo: number,
  delta: number,
): MatchRecord {
  return {
    id,
    played_at: playedAt,
    red_score: 6,
    blue_score: 4,
    created_at: playedAt,
    created_by: 'user-id',
    edited_at: null,
    edited_by: null,
    participants: [
      {
        player_id: 'player-one',
        team: 'red',
        elo_before: redElo,
        elo_delta: delta,
        player: {
          id: 'player-one',
          name: 'Mario Rossi',
          avatar_color: '#1f9d70',
        },
      },
      {
        player_id: 'player-two',
        team: 'blue',
        elo_before: blueElo,
        elo_delta: -delta,
        player: {
          id: 'player-two',
          name: 'Luigi Bianchi',
          avatar_color: '#3279f6',
        },
      },
    ],
  };
}
