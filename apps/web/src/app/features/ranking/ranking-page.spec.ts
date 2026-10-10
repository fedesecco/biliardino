import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppStore } from '../../core/app-store.service';
import type { PlayerStatistic } from '../../core/models';
import { RankingPage } from './ranking-page';

const statistic: PlayerStatistic = {
  id: 'leader-id',
  name: 'Mario Rossi',
  avatar_color: '#a8e6cf',
  current_elo: 1120,
  current_win_streak: 0,
  games: 12,
  wins: 8,
  losses: 4,
  goals_for: 60,
  goals_against: 42,
  goal_diff: 18,
  win_rate: 66.7,
};

const statistics: PlayerStatistic[] = [
  statistic,
  {
    ...statistic,
    id: 'newcomer-id',
    name: 'Luigi Bianchi',
    current_elo: 1100,
    games: 9,
  },
  {
    ...statistic,
    id: 'qualified-id',
    name: 'Anna Verdi',
    current_elo: 1080,
    games: 10,
  },
];

const globalMedalFor = vi.fn((playerId: string) => {
  if (playerId === 'leader-id') {
    return 'gold';
  }
  if (playerId === 'qualified-id') {
    return 'silver';
  }
  return null;
});

describe('RankingPage', () => {
  it('keeps ELO order but numbers only classified players', async () => {
    await TestBed.configureTestingModule({
      imports: [RankingPage],
      providers: [
        provideRouter([]),
        {
          provide: AppStore,
          useValue: {
            error: signal<string | null>(null),
            loading: signal(false),
            statistics: signal(statistics),
            badgesFor: vi.fn().mockReturnValue([]),
            globalMedalFor,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const rows = element.querySelectorAll('.ranking-row');

    expect(
      [...rows].map((row) =>
        row.querySelector('.player-name strong')?.textContent?.trim(),
      ),
    ).toEqual(['Mario Rossi', 'Luigi Bianchi', 'Anna Verdi']);
    expect(rows[0].querySelector('.rank')?.textContent?.trim()).toBe('1');
    expect(rows[1].classList).toContain('unranked');
    expect(rows[1].querySelector('.rank')?.textContent?.trim()).toBe('—');
    expect(
      rows[1].querySelector('.classification-progress')?.textContent,
    ).toMatch(/Manca\s+1\s+partita/);
    expect(rows[2].querySelector('.rank')?.textContent?.trim()).toBe('2');
    expect(
      rows[0].querySelector('app-player-avatar')?.classList,
    ).toContain('avatar-medal-gold');
    expect(
      rows[1].querySelector('app-player-avatar')?.classList,
    ).not.toContain('avatar-medal-gold');
    expect(
      rows[2].querySelector('app-player-avatar')?.classList,
    ).toContain('avatar-medal-silver');
    expect(
      rows[0]
        .querySelector<HTMLImageElement>('.avatar-content')
        ?.getAttribute('src'),
    ).toBe('/awards/oro.webp');
    expect(
      rows[2]
        .querySelector<HTMLImageElement>('.avatar-content')
        ?.getAttribute('src'),
    ).toBe('/awards/argento.webp');
    expect(
      rows[0].querySelector('.player-name strong')?.classList,
    ).toContain('medal-name-gold');
    expect(
      rows[1].querySelector('.player-name strong')?.classList,
    ).not.toContain('medal-name-gold');
    expect(
      rows[2].querySelector('.player-name strong')?.classList,
    ).toContain('medal-name-silver');
  });

  it('links every ranking row to the player detail', async () => {
    await TestBed.configureTestingModule({
      imports: [RankingPage],
      providers: [
        provideRouter([]),
        {
          provide: AppStore,
          useValue: {
            error: signal<string | null>(null),
            loading: signal(false),
            statistics: signal([statistic]),
            badgesFor: vi.fn().mockReturnValue([]),
            globalMedalFor,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const playerLink = element.querySelector(
      '.ranking-row',
    ) as HTMLAnchorElement;

    expect(playerLink.textContent).toContain(statistic.name);
    expect(playerLink.getAttribute('href')).toBe('/giocatore/leader-id');
    expect(element.querySelector('.monthly-cup')).toBeNull();
  });
});
