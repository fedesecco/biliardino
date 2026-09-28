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

const octoberTrophy: MonthlyChampion = {
  month_start: '2026-10-01',
  player_id: player.id,
  elo_gained: 51,
  awarded_at: '2026-11-01T03:05:00.000Z',
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
const profileBadges = [
  {
    kind: 'monthly-champion' as const,
    label: 'Bomboclat',
    elo: 24,
    imageUrl: '/awards/bomboclat.webp',
  },
  {
    kind: 'global-gold' as const,
    label: "Medaglia d'oro",
    elo: null,
    imageUrl: '/awards/oro.webp',
  },
];
const monthlyBadgesFor = vi.fn().mockReturnValue(profileBadges);

describe('PlayerDetailPage', () => {
  let routeParamMap: BehaviorSubject<ParamMap>;
  beforeEach(async () => {
    routeParamMap = new BehaviorSubject(convertToParamMap({ id: player.id }));
    loadPlayerRecentMatches.mockReset().mockResolvedValue([recentMatch]);
    loadPlayerRivalry.mockReset().mockResolvedValue(rivalry);
    monthlyBadgesFor.mockClear().mockReturnValue(profileBadges);
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
            monthlyChampions: signal([octoberTrophy, exclusiveTrophy, trophy]),
            monthlyBadgesFor,
            loadPlayerRecentMatches,
            loadPlayerRivalry,
          },
        },
      ],
    }).compileComponents();
  });

  it('shows retroactive paper awards and exclusive prizes in the bacheca', () => {
    const fixture = TestBed.createComponent(PlayerDetailPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('#player-title')?.textContent?.trim()).toBe(
      player.name,
    );
    expect(element.querySelector('#trophy-title')?.textContent?.trim()).toBe(
      'Bacheca',
    );

    expect(element.querySelector('.trophy-cabinet header span')).toBeNull();
    expect(element.querySelector('.recent-results-heading span')).toBeNull();
    expect(element.querySelector('.rivalry-heading span')).toBeNull();
    const awardLabels = [
      ...element.querySelectorAll<HTMLButtonElement>('.trophy-grid button'),
    ].map((button) => button.getAttribute('aria-label'));
    expect(awardLabels).toEqual([
      'Apri Premio esclusivo Ottobre 2026',
      'Apri Premio esclusivo Agosto 2026',
      'Apri Miglior giocatore di luglio 2026',
    ]);
    expect(
      [...element.querySelectorAll<HTMLImageElement>('app-trophy-artwork.exclusive img')].map(
        (image) => image.getAttribute('src'),
      ),
    ).toEqual([
      '/trophies/2026-10-256.webp',
      '/trophies/2026-08-256.webp',
    ]);
    expect(
      element
        .querySelector<HTMLImageElement>('app-trophy-artwork.legacy img')
        ?.getAttribute('src'),
    ).toBe('/trophies/legacy-paper-256.webp');
  });

  it('renders current badges larger beside the profile instead of on the avatar', () => {
    const fixture = TestBed.createComponent(PlayerDetailPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('.player-hero app-player-avatar .monthly-badges'),
    ).toBeNull();
    expect(
      [...element.querySelectorAll<HTMLImageElement>('.profile-badge img')].map(
        (image) => ({
          src: image.getAttribute('src'),
          width: image.getAttribute('width'),
        }),
      ),
    ).toEqual([
      { src: '/awards/bomboclat.webp', width: '128' },
      { src: '/awards/oro.webp', width: '128' },
    ]);
    expect(
      [...element.querySelectorAll('.profile-badge span')].map((label) =>
        label.textContent?.trim(),
      ),
    ).toEqual(['Bomboclat', "Medaglia d'oro"]);
    expect(element.querySelector('.player-hero > div > small')).toBeNull();

    fixture.destroy();
  });

  it('opens a current badge in the shared award dialog', async () => {
    const fixture = TestBed.createComponent(PlayerDetailPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const badgeButton = element.querySelector<HTMLButtonElement>(
      '.profile-badge-button',
    );
    badgeButton?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector(
      '.award-dialog',
    ) as HTMLElement | null;
    expect(dialog).not.toBeNull();
    expect(
      dialog?.querySelector<HTMLImageElement>('.badge-dialog-image')?.getAttribute(
        'src',
      ),
    ).toBe('/awards/bomboclat.webp');
    expect(dialog?.querySelector('h2')?.textContent?.trim()).toBe('Bomboclat');
    expect(dialog?.querySelector('p')?.textContent).toContain(
      '+24 ELO questo mese',
    );

    fixture.destroy();
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
