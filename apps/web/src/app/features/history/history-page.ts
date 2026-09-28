import { DatePipe, DecimalPipe } from '@angular/common';
import {
  afterEveryRender,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppStore } from '../../core/app-store.service';
import { PlayerAvatar } from '../../core/player-avatar';
import type {
  MatchParticipant,
  MatchRecord,
  TeamColor,
} from '../../core/models';
import { SupabaseService } from '../../core/supabase.service';

@Component({
  selector: 'app-history-page',
  imports: [DatePipe, DecimalPipe, PlayerAvatar, RouterLink],
  templateUrl: './history-page.html',
  styleUrl: './history-page.scss',
})
export class HistoryPage {
  private readonly deletionWindowMs = 10 * 60 * 1000;
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute, { optional: true });
  protected readonly store = inject(AppStore);
  protected readonly auth = inject(SupabaseService);
  protected readonly confirmingDeleteId = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly localError = signal<string | null>(null);
  protected readonly now = signal(Date.now());
  protected readonly selectedPlayerId = signal<string | null>(
    this.route?.snapshot.queryParamMap.get('giocatore') ?? null,
  );
  private readonly loadMoreSentinel =
    viewChild<ElementRef<HTMLElement>>('loadMoreSentinel');
  private historyObserver: IntersectionObserver | null = null;

  constructor() {
    const playerId = this.selectedPlayerId();
    const historyLoad = playerId
      ? this.store.loadHistoryForPlayer(playerId)
      : this.store.loadInitialHistory();
    void historyLoad.finally(() => {
      this.changeDetector.detectChanges();
      this.observeHistorySentinel();
    });
    afterEveryRender(() => this.observeHistorySentinel());
    const timer = window.setInterval(() => this.now.set(Date.now()), 15_000);
    this.destroyRef.onDestroy(() => {
      window.clearInterval(timer);
      this.historyObserver?.disconnect();
    });
  }

  private observeHistorySentinel(): void {
    const sentinel = this.loadMoreSentinel()?.nativeElement;
    if (
      sentinel === undefined ||
      this.historyObserver !== null ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }

    this.historyObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.loadMoreHistory();
        }
      },
      { rootMargin: '192px 0px' },
    );
    this.historyObserver.observe(sentinel);
  }

  protected changePlayerFilter(event: Event): void {
    const playerId = (event.target as HTMLSelectElement).value || null;
    this.selectedPlayerId.set(playerId);
    this.localError.set(null);
    void this.store.loadHistoryForPlayer(playerId).finally(() => {
      this.changeDetector.detectChanges();
      this.observeHistorySentinel();
    });
  }

  protected participants(
    match: MatchRecord,
    team: TeamColor,
  ): MatchParticipant[] {
    return match.participants.filter(
      (participant) => participant.team === team,
    );
  }

  protected teamDelta(match: MatchRecord, team: TeamColor): number {
    return (
      match.participants.find((participant) => participant.team === team)
        ?.elo_delta ?? 0
    );
  }

  protected canDelete(match: MatchRecord): boolean {
    const age = this.now() - new Date(match.created_at).getTime();
    return this.auth.companyUser() && age >= 0 && age < this.deletionWindowMs;
  }

  protected deletionMinutesLeft(match: MatchRecord): number {
    const remaining =
      this.deletionWindowMs -
      (this.now() - new Date(match.created_at).getTime());
    return Math.max(1, Math.ceil(remaining / 60_000));
  }

  protected requestDelete(matchId: string): void {
    this.localError.set(null);
    this.confirmingDeleteId.set(matchId);
  }

  protected cancelDelete(): void {
    this.confirmingDeleteId.set(null);
  }

  protected loadMoreHistory(): void {
    void this.store
      .loadMoreHistory()
      .finally(() => this.changeDetector.detectChanges());
  }

  protected async deleteMatch(matchId: string): Promise<void> {
    if (this.busy()) {
      return;
    }

    this.busy.set(true);
    this.localError.set(null);
    try {
      await this.store.deleteMatch(matchId);
      this.confirmingDeleteId.set(null);
    } catch (error: unknown) {
      this.localError.set(
        error instanceof Error ? error.message : 'Eliminazione non riuscita.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
