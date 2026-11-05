import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AppStore } from '../../core/app-store.service';
import type { MonthlyEloRanking, PlayerStatistic } from '../../core/models';
import { AnalyticsPage } from './analytics-page';

registerLocaleData(localeIt);

const monthlyRankingsSignal = signal<MonthlyEloRanking[]>([]);

describe('AnalyticsPage', () => {
  beforeEach(async () => {
    monthlyRankingsSignal.set(monthlyRankings);
    await TestBed.configureTestingModule({
      imports: [AnalyticsPage],
      providers: [
        provideRouter([]),
        {
          provide: AppStore,
          useValue: {
            error: signal<string | null>(null),
            loading: signal(false),
            statistics: signal(statistics),
            monthlyRankings: monthlyRankingsSignal,
            badgesFor: vi.fn().mockReturnValue([]),
            globalMedalFor: vi.fn().mockReturnValue(null),
          },
        },
      ],
    }).compileComponents();
  });

  it('shows both ranking cards collapsed initially', () => {
    const fixture = TestBed.createComponent(AnalyticsPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.awards-grid > *')).toHaveLength(2);
    expect(element.querySelector('.global-card .award-trigger')?.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelector('.monthly-award .award-trigger')?.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelector('#global-ranking')?.closest('.ranking-collapse')?.getAttribute('aria-hidden')).toBe('true');
    expect(element.querySelector('#monthly-ranking')?.closest('.ranking-collapse')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the registered hero artwork for November 2026', () => {
    monthlyRankingsSignal.set(
      monthlyRankings.map((standing) => ({
        ...standing,
        month_start: '2026-11-01',
      })),
    );
    const fixture = TestBed.createComponent(AnalyticsPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('#monthly-award-title')?.textContent?.trim()).toBe(
      'Premio esclusivo Novembre 2026',
    );
    expect(
      element
        .querySelector<HTMLImageElement>('app-trophy-artwork.hero img')
        ?.getAttribute('src'),
    ).toBe('/trophies/2026-11-1024.webp');
  });
  it('shows a pending message when the current month has no prize artwork', () => {
    monthlyRankingsSignal.set(
      monthlyRankings.map((standing) => ({
        ...standing,
        month_start: '2026-12-01',
      })),
    );
    const fixture = TestBed.createComponent(AnalyticsPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('#monthly-award-title')?.textContent?.trim(),
    ).toBe("Non c'è ancora un premio per questo mese");
    expect(
      element
        .querySelector('.fallback-trophy')
        ?.getAttribute('aria-label'),
    ).toBe('Nessun premio disponibile per dicembre 2026');
  });

  it('previews the first three monthly standings rather than the global ELO order', () => {
    TestBed.inject(AppStore).statistics.set([
      statistic('player-four', 'Paolo Neri', '#7b61ff', 1800),
      statistic('player-three', 'Anna Verdi', '#d98d1d', 1500),
      ...statistics,
    ]);
    monthlyRankingsSignal.set([
      { month_start: '2026-08-01', player_id: 'player-two', elo_gained: -24, rank: 3 },
      { month_start: '2026-08-01', player_id: 'player-four', elo_gained: -30, rank: 4 },
      { month_start: '2026-08-01', player_id: 'player-one', elo_gained: 24, rank: 1 },
      { month_start: '2026-08-01', player_id: 'player-three', elo_gained: 12.4, rank: 2 },
      { month_start: '2026-07-01', player_id: 'player-one', elo_gained: 99, rank: 1 },
    ]);
    const fixture = TestBed.createComponent(AnalyticsPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const rows = [...element.querySelectorAll('.monthly-award .ranking-preview-row')];
    expect(rows.map((row) => [
      row.querySelector('.ranking-preview-rank')?.textContent?.trim(),
      row.querySelector('strong')?.textContent?.trim(),
      row.querySelector('b')?.textContent?.trim(),
    ])).toEqual([
      ['1', 'Mario Rossi', '+24'],
      ['2', 'Anna Verdi', '+12'],
      ['3', 'Luigi Bianchi', '-24'],
    ]);
  });

  it('opens and closes the complete global ranking without navigating', () => {
    const fixture = TestBed.createComponent(AnalyticsPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const trigger = element.querySelector<HTMLButtonElement>('.global-card .award-trigger');
    const initialUrl = TestBed.inject(Router).url;
    expect(element.querySelector('.global-card .ranking-preview')).not.toBeNull();
    trigger?.click();
    fixture.detectChanges();
    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    expect(element.querySelector('#global-ranking')?.closest('.ranking-collapse')?.getAttribute('aria-hidden')).toBe('false');
    expect(element.querySelector('#global-ranking .ranking-row')?.getAttribute('href')).toBe('/giocatore/player-one');
    expect(TestBed.inject(Router).url).toBe(initialUrl);
    expect(element.querySelector('.global-card .ranking-preview')).toBeNull();
    expect(element.querySelector('.monthly-award .ranking-preview')).not.toBeNull();
    trigger?.click();
    fixture.detectChanges();
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelector('#global-ranking')?.closest('.ranking-collapse')?.getAttribute('aria-hidden')).toBe('true');
    expect(element.querySelector('.global-card .ranking-preview')).not.toBeNull();
  });

  it('opens and closes the monthly ranking without navigating', () => {
    const fixture = TestBed.createComponent(AnalyticsPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const trigger = element.querySelector<HTMLButtonElement>('.monthly-award .award-trigger');
    const initialUrl = TestBed.inject(Router).url;
    expect(element.querySelector('.monthly-award .ranking-preview')).not.toBeNull();

    trigger?.click();
    fixture.detectChanges();

    expect(element.querySelectorAll('#monthly-ranking a')).toHaveLength(2);
    expect(
      element
        .querySelector<HTMLAnchorElement>('#monthly-ranking a')
        ?.getAttribute('href'),
    ).toBe('/giocatore/player-one');
    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    expect(TestBed.inject(Router).url).toBe(initialUrl);
    expect(element.querySelector('.monthly-award .ranking-preview')).toBeNull();
    expect(element.querySelector('.global-card .ranking-preview')).not.toBeNull();
    trigger?.click();
    fixture.detectChanges();
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelector('#monthly-ranking')?.closest('.ranking-collapse')?.getAttribute('aria-hidden')).toBe('true');
    expect(element.querySelector('.monthly-award .ranking-preview')).not.toBeNull();
  });
});

const statistics: PlayerStatistic[] = [
  statistic('player-one', 'Mario Rossi', '#1f9d70', 1032),
  statistic('player-two', 'Luigi Bianchi', '#3279f6', 968),
];

const monthlyRankings: MonthlyEloRanking[] = [
  {
    month_start: '2026-08-01',
    player_id: 'player-one',
    elo_gained: 24,
    rank: 1,
  },
  {
    month_start: '2026-08-01',
    player_id: 'player-two',
    elo_gained: -24,
    rank: 2,
  },
  {
    month_start: '2026-07-01',
    player_id: 'player-one',
    elo_gained: 99,
    rank: 1,
  },
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
    type: 'male',
    current_elo: currentElo,
    current_win_streak: 0,
    games: 2,
    wins: 1,
    losses: 1,
    goals_for: 10,
    goals_against: 10,
    goal_diff: 0,
    win_rate: 50,
  };
}
