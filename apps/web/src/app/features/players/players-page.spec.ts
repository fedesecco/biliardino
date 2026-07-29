import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppStore } from '../../core/app-store.service';
import type { Player } from '../../core/models';
import { PlayersPage } from './players-page';

const players = signal<Player[]>([
  player('player-one', 'Player One', '#a8e6cf'),
  player('player-two', 'Player Two', '#ffd3a5'),
]);

const store = {
  players,
  createPlayer: vi.fn(),
  updatePlayer: vi.fn(),
};

describe('PlayersPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayersPage],
      providers: [{ provide: AppStore, useValue: store }],
    }).compileComponents();
  });

  it('offers twenty pastel colors and selects the first unused one', () => {
    const fixture = TestBed.createComponent(PlayersPage);
    fixture.detectChanges();
    const addButton = fixture.nativeElement.querySelector(
      '.add-button',
    ) as HTMLButtonElement;
    addButton.click();
    fixture.detectChanges();

    const colorButtons = fixture.nativeElement.querySelectorAll(
      '.color-choice',
    ) as NodeListOf<HTMLButtonElement>;
    const activeColor = fixture.nativeElement.querySelector(
      '.color-choice.active',
    ) as HTMLButtonElement;

    expect(colorButtons).toHaveLength(20);
    expect([...colorButtons].filter((button) => button.disabled)).toHaveLength(
      2,
    );
    expect(activeColor.getAttribute('aria-label')).toBe(
      'Scegli colore #c7ceea',
    );
  });
});

function player(id: string, name: string, avatarColor: string): Player {
  return {
    id,
    name,
    avatar_color: avatarColor,
    current_elo: 1000,
    active: true,
    created_at: '2026-07-29T00:00:00.000Z',
    updated_at: '2026-07-29T00:00:00.000Z',
  };
}