import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { AppStore } from '../../core/app-store.service';
import type { MonthlyChampion, PlayerStatistic } from '../../core/models';
import { PlayerDetailPage } from './player-detail-page';

const player: PlayerStatistic = {
  id: 'player-one',
  name: 'Mario Rossi',
  avatar_color: '#a8e6cf',
  current_elo: 1120,
  games: 12,
  wins: 8,
  losses: 4,
  goals_for: 60,
  goals_against: 42,
  goal_diff: 18,
  win_rate: 66.7,
};

const trophy: MonthlyChampion = {
  month_start: '2026-07-01',
  player_id: player.id,
  elo_gained: 42.5,
  awarded_at: '2026-08-01T03:05:00.000Z',
};

const exclusiveTrophy: MonthlyChampion = {
  month_start: '2026-08-01',
  player_id: player.id,
  elo_gained: 51,
  awarded_at: '2026-09-01T03:05:00.000Z',
};

describe('PlayerDetailPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerDetailPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: new Map([['id', player.id]]) },
          },
        },
        {
          provide: AppStore,
          useValue: {
            loading: signal(false),
            statistics: signal([player]),
            monthlyChampions: signal([exclusiveTrophy, trophy]),
            weeklyBadgeFor: vi.fn().mockReturnValue(null),
          },
        },
      ],
    }).compileComponents();
  });

  it('shows retroactive paper awards and exclusive badges in the bacheca', () => {
    const fixture = TestBed.createComponent(PlayerDetailPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('#player-title')?.textContent?.trim()).toBe(
      player.name,
    );
    expect(element.querySelector('#trophy-title')?.textContent?.trim()).toBe(
      'Bacheca',
    );
    const awardLabels = [
      ...element.querySelectorAll<HTMLButtonElement>('.trophy-grid button'),
    ].map((button) => button.getAttribute('aria-label'));
    expect(awardLabels).toEqual([
      'Apri Badge esclusivo Agosto 2026',
      'Apri Miglior giocatore di luglio 2026',
    ]);
    expect(
      element
        .querySelector<HTMLImageElement>('app-trophy-artwork.legacy img')
        ?.getAttribute('src'),
    ).toBe('/trophies/legacy-paper-256.webp');
  });
});
