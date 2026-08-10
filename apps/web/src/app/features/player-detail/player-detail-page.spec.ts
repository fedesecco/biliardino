import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import type { ParamMap } from '@angular/router';
import { AppStore } from '../../core/app-store.service';
import type {
  MatchRecord,
  MonthlyChampion,
  PlayerRivalry,
  PlayerStatistic,
} from '../../core/models';
import { PlayerDetailPage } from './player-detail-page';

registerLocaleData(localeIt);

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
const secondPlayer: PlayerStatistic = {
  ...player,
  id: 'player-two',
  name: 'Luigi Bianchi',
  current_elo: 1080,
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

const recentMatch: MatchRecord = {
  id: 'match-one',
  played_at: '2026-08-09T18:30:00.000Z',
  red_score: 6,
  blue_score: 4,
  created_at: '2026-08-09T18:30:00.000Z',
  created_by: 'user-one',
  edited_at: null,
  edited_by: null,
  participants: [
    {
      player_id: player.id,
      team: 'red',
      elo_before: player.current_elo,
      elo_delta: 12,
      player: {
        id: player.id,
        name: player.name,
        avatar_color: player.avatar_color,
      },
    },
    {
      player_id: 'player-two',
      team: 'blue',
      elo_before: 1080,
      elo_delta: -12,
      player: {
        id: 'player-two',
        name: 'Luigi Bianchi',
        avatar_color: '#3279f6',
      },
    },
  ],
};

const rivalry: PlayerRivalry = {
  player_id: player.id,
  best_friend_id: 'player-two',
  best_friend_name: 'Luigi Bianchi',
  best_friend_elo_net: 42.5,
  worst_friend_id: 'player-three',
  worst_friend_name: 'Anna Verdi',
  worst_friend_elo_net: -17.25,
  best_enemy_id: 'player-five',
  best_enemy_name: 'Carlo Blu',
  best_enemy_elo_net: 25,
  worst_enemy_id: 'player-four',
  worst_enemy_name: 'Giulia Neri',
  worst_enemy_elo_net: -30,
};
const loadPlayerRecentMatches =
  vi.fn<(playerId: string, limit?: number) => Promise<MatchRecord[]>>();
const loadPlayerRivalry =
  vi.fn<(playerId: string) => Promise<PlayerRivalry | null>>();

describe('PlayerDetailPage', () => {
  let routeParamMap: BehaviorSubject<ParamMap>;
  beforeEach(async () => {
    routeParamMap = new BehaviorSubject(convertToParamMap({ id: player.id }));
    loadPlayerRecentMatches.mockReset().mockResolvedValue([recentMatch]);
    loadPlayerRivalry.mockReset().mockResolvedValue(rivalry);
    await TestBed.configureTestingModule({
      imports: [PlayerDetailPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: routeParamMap.asObservable(),
            snapshot: { paramMap: routeParamMap.value },
          },
        },
        {
          provide: AppStore,
          useValue: {
            loading: signal(false),
            statistics: signal([player, secondPlayer]),
            monthlyChampions: signal([exclusiveTrophy, trophy]),
            weeklyBadgeFor: vi.fn().mockReturnValue(null),
            loadPlayerRecentMatches,
            loadPlayerRivalry,
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

  it('shows the latest personal results with a link to the filtered history', async () => {
    const fixture = TestBed.createComponent(PlayerDetailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('#recent-results-title')?.textContent?.trim(),
    ).toBe('Ultimi 5 risultati');
    expect(element.querySelector('.recent-score')?.textContent).toContain('6');
    expect(element.querySelector('.recent-score')?.textContent).toContain('4');
    expect(element.querySelectorAll('.recent-elo:not([hidden])')).toHaveLength(
      1,
    );
    expect(
      element.querySelector('.recent-team-red .recent-elo')?.textContent,
    ).toContain('+12 ELO');
    expect(
      element
        .querySelector('.recent-team-blue .recent-elo')
        ?.hasAttribute('hidden'),
    ).toBe(true);
    expect(
      element.querySelector('.recent-team-red .recent-elo')?.nextElementSibling
        ?.className,
    ).toBe('recent-names');
    expect(
      element
        .querySelector<HTMLAnchorElement>('.recent-results-link')
        ?.getAttribute('href'),
    ).toBe('/storico?giocatore=player-one');
    fixture.destroy();
  });

  it('shows ELO-based friends and enemies from the server-side view', async () => {
    const fixture = TestBed.createComponent(PlayerDetailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('#rivalry-title')?.textContent?.trim()).toBe(
      'Amici e nemici',
    );
    expect(
      element
        .querySelector('.best-friend .rivalry-player')
        ?.textContent?.trim(),
    ).toBe('Luigi Bianchi');
    expect(
      element.querySelector('.best-friend strong')?.textContent?.trim(),
    ).toContain('42.5 ELO vinto assieme');
    expect(
      element
        .querySelector('.worst-friend .rivalry-player')
        ?.textContent?.trim(),
    ).toBe('Anna Verdi');
    expect(
      element.querySelector('.worst-friend strong')?.textContent?.trim(),
    ).toContain('-17.25 ELO quando in squadra assieme. Sarà colpa sua o tua?');
    expect(
      element.querySelector('.best-enemy .rivalry-player')?.textContent?.trim(),
    ).toBe('Carlo Blu');
    expect(
      element.querySelector('.best-enemy strong')?.textContent?.trim(),
    ).toContain('Ti ha regalato +25 ELO');
    expect(
      element
        .querySelector('.worst-enemy .rivalry-player')
        ?.textContent?.trim(),
    ).toBe('Giulia Neri');
    expect(
      element.querySelector('.worst-enemy strong')?.textContent?.trim(),
    ).toContain('-30 ELO contro di lui');
    fixture.destroy();
  });
  it('reloads the selected player when the route id changes', async () => {
    const fixture = TestBed.createComponent(PlayerDetailPage);
    fixture.detectChanges();
    await fixture.whenStable();

    routeParamMap.next(convertToParamMap({ id: secondPlayer.id }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('#player-title')?.textContent?.trim()).toBe(
      secondPlayer.name,
    );
    expect(loadPlayerRecentMatches).toHaveBeenLastCalledWith(
      secondPlayer.id,
      5,
    );
    expect(loadPlayerRivalry).toHaveBeenLastCalledWith(secondPlayer.id);
    fixture.destroy();
  });
});
