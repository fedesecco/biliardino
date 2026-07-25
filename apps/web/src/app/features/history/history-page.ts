import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { AppStore } from '../../core/app-store.service';
import type {
  MatchParticipant,
  MatchRecord,
  TeamColor,
} from '../../core/models';
import { SupabaseService } from '../../core/supabase.service';

@Component({
  selector: 'app-history-page',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './history-page.html',
  styleUrl: './history-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryPage {
  private readonly deletionWindowMs = 10 * 60 * 1000;
  private readonly destroyRef = inject(DestroyRef);
  protected readonly store = inject(AppStore);
  protected readonly auth = inject(SupabaseService);
  protected readonly confirmingDeleteId = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly localError = signal<string | null>(null);
  protected readonly now = signal(Date.now());

  constructor() {
    const timer = window.setInterval(() => this.now.set(Date.now()), 15_000);
    this.destroyRef.onDestroy(() => window.clearInterval(timer));
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
    return (
      this.auth.companyUser() &&
      age >= 0 &&
      age < this.deletionWindowMs
    );
  }

  protected deletionMinutesLeft(match: MatchRecord): number {
    const remaining =
      this.deletionWindowMs - (this.now() - new Date(match.created_at).getTime());
    return Math.max(1, Math.ceil(remaining / 60_000));
  }

  protected requestDelete(matchId: string): void {
    this.localError.set(null);
    this.confirmingDeleteId.set(matchId);
  }

  protected cancelDelete(): void {
    this.confirmingDeleteId.set(null);
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
