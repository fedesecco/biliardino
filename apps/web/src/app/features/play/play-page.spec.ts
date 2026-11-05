import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppStore } from '../../core/app-store.service';
import { AVATAR_SETS } from '../../core/avatar-assets/avatar-assets';
import type {
  Player,
  SelectionMode,
  TeamDraft,
  TeamPickingMode,
} from '../../core/models';
import { SupabaseService } from '../../core/supabase.service';
import { PlayPage } from './play-page';

@Component({
  imports: [NgTemplateOutlet, PlayPage],
  template: `
    <app-play-page #page />
    <ng-container [ngTemplateOutlet]="page.bottomActions() ?? null" />
  `,
})
class PlayPageHost {}

const players: Player[] = [
  player('p1', 'Player 1', 1100),
  player('p2', 'Player 2', 1050),
  player('p3', 'Player 3', 1000),
  player('p4', 'Player 4', 950),
  player('p5', 'Player 5', 900),
];
const playSelection = signal(new Map<string, SelectionMode>());
const teamPickingMode = signal<TeamPickingMode>('elo-balanced');
const playDraft = signal<TeamDraft | null>(null);
const playScore = signal({ red: 0, blue: 0 });
const playConfirming = signal(false);
const playReady = signal(true);
const playConnected = signal(true);
const playSyncError = signal<string | null>(null);
const companyUser = signal(true);

const store = {
  activePlayers: computed(() => players),
  loading: signal(false),
  error: signal<string | null>(null),
  badgesFor: vi.fn().mockReturnValue([]),
  globalMedalFor: vi.fn().mockReturnValue(null),
  playSelection,
  teamPickingMode,
  playDraft: playDraft.asReadonly(),
  playScore: playScore.asReadonly(),
  playConfirming: playConfirming.asReadonly(),
  playReady: playReady.asReadonly(),
  playConnected: playConnected.asReadonly(),
  playSyncError: playSyncError.asReadonly(),
  startPlay: vi.fn<() => Promise<void>>(),
  changePlay: vi.fn<() => Promise<void>>(),
  retryPlaySync: vi.fn<() => Promise<void>>(),
};

function setGame(): void {
  playDraft.set({
    red: [players[0], players[3]],
    blue: [players[1], players[2]],
    benched: [players[4]],
  });
}

describe('PlayPage', () => {
  beforeEach(async () => {
    playSelection.set(new Map());
    teamPickingMode.set('elo-balanced');
    playDraft.set(null);
    playScore.set({ red: 0, blue: 0 });
    playConfirming.set(false);
    playReady.set(true);
    playConnected.set(true);
    playSyncError.set(null);
    companyUser.set(true);
    store.loading.set(false);
    store.error.set(null);
    store.badgesFor.mockReset().mockReturnValue([]);
    store.startPlay.mockReset().mockResolvedValue(undefined);
    store.changePlay.mockReset().mockResolvedValue(undefined);

    store.retryPlaySync.mockReset().mockResolvedValue(undefined);
    await TestBed.configureTestingModule({
      imports: [PlayPageHost],
      providers: [
        provideRouter([]),
        { provide: AppStore, useValue: store },
        { provide: SupabaseService, useValue: { companyUser } },
      ],
    }).compileComponents();
  });

  it('renders winstreak hair without clipping the player card', () => {
    store.badgesFor.mockImplementation((playerId: string) =>
      playerId === 'p1'
        ? [
            {
              kind: 'win-streak-5',
              label: 'Winstreak: 5',
              description: '5 vittorie consecutive',
              elo: null,
              imageUrl: AVATAR_SETS.male.hair['winstreak-5'].imageUrl,
            },
          ]
        : [],
    );

    const fixture = createPlayFixture();
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector(
      '.player-card',
    ) as HTMLElement;
    expect(card.querySelector('.avatar-layer-hair')).not.toBeNull();
    expect(getComputedStyle(card).overflow).toBe('visible');
  });

  it('shows editable player selection while the shared snapshot loads, then opens an active game', () => {
    playReady.set(false);
    playConnected.set(false);
    const fixture = createPlayFixture();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.selection-view')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.sync-banner')).toBeNull();
    const select = fixture.nativeElement.querySelector('[aria-label="Seleziona Player 1"]') as HTMLButtonElement;
    expect(select.disabled).toBe(false);
    select.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.counter strong').textContent).toBe('1');
    expect(fixture.nativeElement.querySelector('.team-create-actions button').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.match-view')).toBeNull();

    playSyncError.set('Impossibile sincronizzare la partita.');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Impossibile sincronizzare la partita.',
    );
    expect(fixture.nativeElement.querySelector('.selection-view')).not.toBeNull();

    setGame();
    playReady.set(true);
    playConnected.set(true);
    playSyncError.set(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.match-view')).not.toBeNull();
  });

  it('renders shared game, score, correction and cancellation state from the store', () => {
    const fixture = createPlayFixture();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.selection-view')).not.toBeNull();

    setGame();
    playScore.set({ red: 6, blue: 4 });
    playConfirming.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.red-team .lineup').textContent).toContain(
      'Player 1',
    );
    expect(fixture.nativeElement.querySelector('.bench').textContent).toContain('Player 5');
    expect(fixture.nativeElement.querySelector('.red-team .score-tap span').textContent).toBe('6');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();

    playConfirming.set(false);
    playScore.set({ red: 5, blue: 4 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.red-team .score-tap span').textContent).toBe('5');

    playDraft.set(null);
    playScore.set({ red: 0, blue: 0 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.match-view')).toBeNull();
    expect(fixture.nativeElement.querySelector('.selection-view')).not.toBeNull();
  });

  it.each([false, true])('keeps an ongoing game read-only while disconnected (confirming=%s)', (confirming) => {
    setGame();
    playScore.set({ red: confirming ? 6 : 3, blue: 2 });
    playConfirming.set(confirming);
    playConnected.set(false);
    const fixture = createPlayFixture();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.match-view')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.blue-team .score-tap span').textContent).toBe('2');
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    expect(buttons.every((button) => button.disabled)).toBe(true);
    expect(fixture.nativeElement.querySelector('.sync-banner')).not.toBeNull();
  });

  it('keeps local selection editable offline but disables team creation until reconnected', () => {
    playSelection.set(new Map(players.map((entry) => [entry.id, 'any' as const])));
    playConnected.set(false);
    const fixture = createPlayFixture();
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('[aria-label="Seleziona Player 1"]') as HTMLButtonElement;
    expect(select.disabled).toBe(false);
    select.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.counter strong').textContent).toBe('4');
    expect(fixture.nativeElement.querySelector('.team-create-actions button').disabled).toBe(true);

    playConnected.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.team-create-actions button').disabled).toBe(false);
    expect(fixture.nativeElement.querySelector('.sync-banner')).toBeNull();
  });

  it('keeps pre-start selections local across navigation', () => {
    let fixture = createPlayFixture();
    fixture.detectChanges();
    for (const entry of players.slice(0, 3)) {
      (fixture.nativeElement.querySelector(
        `[aria-label="Assegna ${entry.name} ai rossi"]`,
      ) as HTMLButtonElement).click();
    }
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.counter strong').textContent).toBe('3');
    expect(fixture.nativeElement.querySelector('.team-create-actions button').disabled).toBe(true);
    fixture.destroy();

    fixture = createPlayFixture();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.selected-red')).toHaveLength(3);
    (fixture.nativeElement.querySelector('[aria-label="Seleziona Player 4"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.counter strong').textContent).toBe('4');
    expect(fixture.nativeElement.querySelector('.team-create-actions button').disabled).toBe(false);
  });

  it('does not change the score optimistically while a command is pending', async () => {
    setGame();
    playScore.set({ red: 2, blue: 1 });
    const fixture = createPlayFixture();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('[aria-label="Aggiungi goal alla squadra rossa"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.red-team .score-tap span').textContent).toBe('2');
    expect(([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).every(
      (button) => button.disabled,
    )).toBe(true);

    playScore.set({ red: 3, blue: 1 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.red-team .score-tap span').textContent).toBe('3');
    expect(fixture.nativeElement.querySelector('.match-toolbar button').disabled).toBe(false);
  });

  it('lets signed-in players retry a failed snapshot without hiding player selection', async () => {
    playReady.set(false);
    playConnected.set(false);
    playSyncError.set('Sincronizzazione non riuscita.');
    const fixture = createPlayFixture();
    fixture.detectChanges();

    const retry = fixture.nativeElement.querySelector('.sync-retry button') as HTMLButtonElement;
    expect(retry.disabled).toBe(false);
    retry.click();
    fixture.detectChanges();
    expect(retry.disabled).toBe(true);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(retry.disabled).toBe(false);
    expect(fixture.nativeElement.querySelector('.selection-view')).not.toBeNull();

    setGame();
    playReady.set(true);
    playConnected.set(true);
    playSyncError.set(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.match-view')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.sync-retry')).toBeNull();
  });

  it.each([false, true])('shows only player selection after logout (confirming=%s)', (confirming) => {
    setGame();
    playConfirming.set(confirming);
    companyUser.set(false);
    const fixture = createPlayFixture();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.selection-view')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.match-view')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.sync-retry')).toBeNull();
    expect(fixture.nativeElement.querySelector('.sync-banner')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Seleziona Player 1"]').disabled).toBe(true);
  });

  it('keeps the final shared score visible when confirmation fails', async () => {
    setGame();
    playScore.set({ red: 6, blue: 4 });
    playConfirming.set(true);
    store.changePlay.mockRejectedValue({ message: 'La partita è stata aggiornata.' });
    const fixture = createPlayFixture();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.confirm-card .primary-button') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.querySelector('[role="alert"]')?.textContent).toContain('La partita è stata aggiornata.');
    expect(dialog.querySelector('h2')?.textContent).toContain('6');
    expect(fixture.nativeElement.querySelector('.blue-team .score-tap span').textContent).toBe('4');
    expect(dialog.querySelector('button')?.disabled).toBe(false);
  });

  it('keeps the shared game visible when cancellation fails', async () => {
    setGame();
    playScore.set({ red: 3, blue: 2 });
    store.changePlay.mockRejectedValue(new Error('Connessione non disponibile.'));
    const fixture = createPlayFixture();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.match-toolbar button') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.selection-view')).toBeNull();
    expect(fixture.nativeElement.querySelector('.red-team .score-tap span').textContent).toBe('3');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Connessione non disponibile.');
  });

  it('shows start errors without discarding the local selection', async () => {
    playSelection.set(new Map(players.map((entry) => [entry.id, 'any' as const])));
    store.startPlay.mockRejectedValue(new Error('La partita è già iniziata.'));
    const fixture = createPlayFixture();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.team-create-actions button') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.counter strong').textContent).toBe('5');
    expect(fixture.nativeElement.querySelectorAll('.selected-any')).toHaveLength(5);
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('La partita è già iniziata.');
    expect(fixture.nativeElement.querySelector('.team-create-actions button').disabled).toBe(false);
  });

  it.each([
    { red: [0, 3], blue: [1, 2], expected: ['+15/18', '-15/18', '+15/18', '-15/18'] },
    { red: [0, 1], blue: [2, 3], expected: ['+11/13', '-20/23', '+20/23', '-11/13'] },
  ])('rounds ELO preview bounds to whole numbers for $red versus $blue', ({ red, blue, expected }) => {
    playDraft.set({
      red: red.map((index) => players[index]),
      blue: blue.map((index) => players[index]),
      benched: [],
    });

    const fixture = createPlayFixture();
    fixture.detectChanges();

    expect(
      [...fixture.nativeElement.querySelectorAll('.elo-preview strong')].map(
        (value) => value.textContent?.trim(),
      ),
    ).toEqual(expected);
  });

  it('keeps the server score across navigation without resetting it', () => {
    setGame();
    playScore.set({ red: 3, blue: 2 });
    let fixture = createPlayFixture();
    fixture.detectChanges();
    fixture.destroy();

    playScore.set({ red: 4, blue: 2 });
    fixture = createPlayFixture();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.red-team .score-tap span').textContent).toBe('4');
    expect(fixture.nativeElement.querySelector('.blue-team .score-tap span').textContent).toBe('2');
  });
});

function createPlayFixture() {
  const fixture = TestBed.createComponent(PlayPageHost);
  fixture.detectChanges(false);
  return fixture;
}

function player(id: string, name: string, currentElo: number): Player {
  return {
    id,
    name,
    avatar_color: '#123456',
    type: 'male',
    current_elo: currentElo,
    current_win_streak: 0,
    active: true,
    created_at: '2026-07-29T00:00:00.000Z',
    updated_at: '2026-07-29T00:00:00.000Z',
  };
}
