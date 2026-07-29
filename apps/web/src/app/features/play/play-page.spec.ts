import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppStore } from '../../core/app-store.service';
import type {
  Player,
  SelectionMode,
  TeamDraft,
  TeamPickingMode,
} from '../../core/models';
import { SupabaseService } from '../../core/supabase.service';
import { PlayPage } from './play-page';

const players: Player[] = [
  player('p1', 'Player 1', 1100),
  player('p2', 'Player 2', 1050),
  player('p3', 'Player 3', 1000),
  player('p4', 'Player 4', 950),
];
const playSelection = signal(new Map<string, SelectionMode>());
const teamPickingMode = signal<TeamPickingMode>('elo-balanced');
const playDraft = signal<TeamDraft | null>(null);
const playScore = signal({ red: 0, blue: 0 });
const playConfirming = signal(false);
const pickTeams = vi.fn().mockResolvedValue([
  { player_id: 'p1', team: 'red', daily_games: 0 },
  { player_id: 'p4', team: 'red', daily_games: 0 },
  { player_id: 'p2', team: 'blue', daily_games: 0 },
  { player_id: 'p3', team: 'blue', daily_games: 0 },
]);

const store = {
  activePlayers: computed(() => players),
  loading: signal(false),
  error: signal<string | null>(null),
  playSelection,
  teamPickingMode,
  playDraft,
  playScore,
  playConfirming,
  pickTeams,
  recordMatch: vi.fn(),
};

describe('PlayPage', () => {
  beforeEach(async () => {
    playSelection.set(new Map());
    teamPickingMode.set('elo-balanced');
    playDraft.set(null);
    playScore.set({ red: 0, blue: 0 });
    playConfirming.set(false);
    pickTeams.mockClear();

    await TestBed.configureTestingModule({
      imports: [PlayPage],
      providers: [
        provideRouter([]),
        { provide: AppStore, useValue: store },
        {
          provide: SupabaseService,
          useValue: { companyUser: signal(true) },
        },
      ],
    }).compileComponents();
  });

  it('passes the selected team mode and keeps the selection across navigation', async () => {
    let fixture = TestBed.createComponent(PlayPage);
    fixture.detectChanges();

    for (const player of players) {
      const selectButton = fixture.nativeElement.querySelector(
        `[aria-label="Seleziona ${player.name}"]`,
      ) as HTMLButtonElement;
      selectButton.click();
    }
    fixture.detectChanges();

    const createButtons = fixture.nativeElement.querySelectorAll(
      '.team-create-actions .primary-button',
    ) as NodeListOf<HTMLButtonElement>;
    expect(createButtons).toHaveLength(2);
    expect(createButtons[0].textContent).toContain('Random');
    expect(createButtons[0].textContent).toContain('→');
    expect(createButtons[1].textContent).toContain('ELO balanced');
    expect(createButtons[1].textContent).toContain('→');
    createButtons[0].click();
    await fixture.whenStable();

    expect(pickTeams).toHaveBeenCalledExactlyOnceWith(
      ['p1', 'p2', 'p3', 'p4'],
      [],
      [],
      'random',
    );

    fixture.destroy();
    fixture = TestBed.createComponent(PlayPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.match-view')).not.toBeNull();
    expect(teamPickingMode()).toBe('random');
    expect(playSelection().size).toBe(4);
  });

  it('keeps an unfinished score across navigation', () => {
    playDraft.set({
      red: [players[0], players[3]],
      blue: [players[1], players[2]],
      benched: [],
    });

    let fixture = TestBed.createComponent(PlayPage);
    fixture.detectChanges();
    const redGoalButton = fixture.nativeElement.querySelector(
      '[aria-label="Aggiungi goal alla squadra rossa"]',
    ) as HTMLButtonElement;
    redGoalButton.click();
    fixture.destroy();

    fixture = TestBed.createComponent(PlayPage);
    fixture.detectChanges();
    const persistedRedScore = fixture.nativeElement.querySelector(
      '.red-team .score-tap span',
    ) as HTMLElement;

    expect(persistedRedScore.textContent?.trim()).toBe('1');
  });
});

function player(id: string, name: string, currentElo: number): Player {
  return {
    id,
    name,
    avatar_color: '#123456',
    current_elo: currentElo,
    active: true,
    created_at: '2026-07-29T00:00:00.000Z',
    updated_at: '2026-07-29T00:00:00.000Z',
  };
}