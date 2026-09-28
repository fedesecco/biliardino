import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
            monthlyBadgesFor: vi.fn().mockReturnValue([]),
          },
        },
      ],
    }).compileComponents();
  });

  it('shows the classifications landing page with the monthly ranking card', () => {
    const fixture = TestBed.createComponent(AnalyticsPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const globalCard = element.querySelector<HTMLAnchorElement>('.global-card');

    expect(element.querySelector('#classifications-title')?.textContent).toBe(
      'Classifiche',
    );
    expect(element.querySelectorAll('.awards-grid > *')).toHaveLength(2);
    expect(globalCard?.textContent).toContain('Classifica globale');
    expect(globalCard?.getAttribute('href')).toBe('/classifiche/globale');
    expect(element.querySelector('.monthly-badge-rules')).toBeNull();
    expect(element.textContent).not.toContain('Vittorie per colore');
  });

  it('renders the registered hero artwork for October 2026', () => {
    monthlyRankingsSignal.set(
      monthlyRankings.map((standing) => ({
        ...standing,
        month_start: '2026-10-01',
      })),
    );
    const fixture = TestBed.createComponent(AnalyticsPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('#monthly-award-title')?.textContent?.trim()).toBe(
      'Premio esclusivo Ottobre 2026',
    );
    expect(
      element
        .querySelector<HTMLImageElement>('app-trophy-artwork.hero img')
        ?.getAttribute('src'),
    ).toBe('/trophies/2026-10-1024.webp');
  });
  it('shows a pending message when the current month has no prize artwork', () => {
    monthlyRankingsSignal.set(
      monthlyRankings.map((standing) => ({
        ...standing,
        month_start: '2026-11-01',
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
    ).toBe('Nessun premio disponibile per novembre 2026');
  });

  it('opens the monthly award ranking', () => {
    const fixture = TestBed.createComponent(AnalyticsPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const trigger = element.querySelector<HTMLButtonElement>('.award-trigger');

    trigger?.click();
    fixture.detectChanges();

    expect(element.querySelectorAll('#monthly-ranking a')).toHaveLength(2);
    expect(
      element
        .querySelector<HTMLAnchorElement>('#monthly-ranking a')
        ?.getAttribute('href'),
    ).toBe('/giocatore/player-one');
    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
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
