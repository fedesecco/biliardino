import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppStore } from '../../core/app-store.service';
import type { MatchRecord } from '../../core/models';
import { SupabaseService } from '../../core/supabase.service';
import { HistoryPage } from './history-page';

registerLocaleData(localeIt);

describe('HistoryPage', () => {
  const recentMatch = matchCreatedMinutesAgo('recent', 5);
  const expiredMatch = matchCreatedMinutesAgo('expired', 11);
  const deleteMatch = vi.fn().mockResolvedValue(undefined);
  const loadInitialHistory = vi.fn().mockResolvedValue(undefined);
  const loadHistoryForPlayer = vi.fn().mockResolvedValue(undefined);
  const loadMoreHistory = vi.fn().mockResolvedValue(undefined);

  beforeEach(async () => {
    deleteMatch.mockClear();
    loadInitialHistory.mockClear();
    loadHistoryForPlayer.mockClear();

    await TestBed.configureTestingModule({
      imports: [HistoryPage],
      providers: [
        {
          provide: AppStore,
          useValue: {
            error: signal<string | null>(null),
            players: signal([{ id: 'player-id', name: 'Mario Rossi' }]),
            loading: signal(false),
            historyMatches: signal([recentMatch, expiredMatch]),
            historyLoading: signal(false),
            historyError: signal<string | null>(null),
            historyHasMore: signal(false),
            loadInitialHistory,
            loadHistoryForPlayer,
            loadMoreHistory,
            deleteMatch,
          },
        },
        {
          provide: SupabaseService,
          useValue: { companyUser: signal(true) },
        },
      ],
    }).compileComponents();
  });

  it('offers deletion only during the first ten minutes', () => {
    const fixture = TestBed.createComponent(HistoryPage);
    fixture.detectChanges();

    const deleteButtons = fixture.nativeElement.querySelectorAll(
      '.delete-button',
    ) as NodeListOf<HTMLButtonElement>;

    expect(deleteButtons).toHaveLength(1);
    expect(deleteButtons[0].getAttribute('aria-label')).toContain(
      '5 minuti disponibili',
    );

    fixture.destroy();
  });

  it('filters the history by the selected player', () => {
    const fixture = TestBed.createComponent(HistoryPage);
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector(
      '#history-player-filter',
    ) as HTMLSelectElement;

    select.value = 'player-id';
    select.dispatchEvent(new Event('change'));

    expect(loadHistoryForPlayer).toHaveBeenCalledWith('player-id');
    expect(select.value).toBe('player-id');
    fixture.destroy();
  });

  it('requires confirmation before deleting a match', async () => {
    const fixture = TestBed.createComponent(HistoryPage);
    fixture.detectChanges();

    const deleteButton = fixture.nativeElement.querySelector(
      '.delete-button',
    ) as HTMLButtonElement;
    deleteButton.click();
    fixture.detectChanges();

    const confirmButton = fixture.nativeElement.querySelector(
      '.delete-confirmation .danger-button',
    ) as HTMLButtonElement;
    confirmButton.click();
    await fixture.whenStable();

    expect(deleteMatch).toHaveBeenCalledExactlyOnceWith('recent');

    fixture.destroy();
  });
});

function matchCreatedMinutesAgo(id: string, minutes: number): MatchRecord {
  const createdAt = new Date(Date.now() - minutes * 60_000).toISOString();

  return {
    id,
    played_at: createdAt,
    red_score: 6,
    blue_score: 4,
    created_at: createdAt,
    created_by: 'user-id',
    edited_at: null,
    edited_by: null,
    participants: [],
  };
}
