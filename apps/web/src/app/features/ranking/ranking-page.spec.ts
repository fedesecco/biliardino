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
  games: 12,
  wins: 8,
  losses: 4,
  goals_for: 60,
  goals_against: 42,
  goal_diff: 18,
  win_rate: 66.7,
};


describe('RankingPage', () => {
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
            weeklyBadgeFor: vi.fn().mockReturnValue(null),
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
