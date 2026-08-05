import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppStore } from '../../core/app-store.service';
import type {
  Player,
  SelectionMode,
  TeamColor,
  TeamPickingMode,
} from '../../core/models';
import { PlayerAvatar } from '../../core/player-avatar';
import { SupabaseService } from '../../core/supabase.service';

@Component({
  selector: 'app-play-page',
  imports: [DecimalPipe, PlayerAvatar, RouterLink],
  templateUrl: './play-page.html',
  styleUrl: './play-page.scss',
})
export class PlayPage {
  protected readonly store = inject(AppStore);
  protected readonly auth = inject(SupabaseService);
  protected readonly selection = this.store.playSelection;
  protected readonly teamPickingMode = this.store.teamPickingMode;
  protected readonly draft = this.store.playDraft;
  protected readonly score = this.store.playScore;
  protected readonly confirming = this.store.playConfirming;
  protected readonly busy = signal(false);
  protected readonly localError = signal<string | null>(null);

  protected readonly selectedCount = computed(
    () =>
      [...this.selection().values()].filter((mode) => mode !== 'off').length,
  );
  protected readonly redPreferenceCount = computed(
    () =>
      [...this.selection().values()].filter((mode) => mode === 'red').length,
  );
  protected readonly bluePreferenceCount = computed(
    () =>
      [...this.selection().values()].filter((mode) => mode === 'blue').length,
  );
  protected readonly canCreateTeams = computed(
    () =>
      this.auth.companyUser() &&
      this.selectedCount() >= 4 &&
      !this.busy() &&
      this.redPreferenceCount() <= 2 &&
      this.bluePreferenceCount() <= 2,
  );
  protected readonly eloPreview = computed(() => {
    const teams = this.draft();
    if (!teams?.red.length || !teams.blue.length) {
      return null;
    }

    const redRating =
      teams.red.reduce((total, player) => total + player.current_elo, 0) /
      teams.red.length;
    const blueRating =
      teams.blue.reduce((total, player) => total + player.current_elo, 0) /
      teams.blue.length;
    const expectedRed = 1 / (1 + 10 ** ((blueRating - redRating) / 400));
    const redWin = roundElo(32 * (1 - expectedRed));
    const redLoss = roundElo(-32 * expectedRed);

    return {
      red: { win: redWin, loss: redLoss },
      blue: { win: -redLoss, loss: -redWin },
    };
  });

  protected toggleAny(playerId: string): void {
    if (!this.auth.companyUser()) {
      return;
    }

    const current = this.selection().get(playerId) ?? 'off';
    this.updateSelection(playerId, current === 'off' ? 'any' : 'off');
  }

  protected chooseMode(
    event: Event,
    playerId: string,
    mode: Exclude<SelectionMode, 'off'>,
  ): void {
    event.stopPropagation();
    if (!this.auth.companyUser()) {
      return;
    }

    const current = this.selection().get(playerId) ?? 'off';
    if (mode === 'red' && current !== 'red' && this.redPreferenceCount() >= 2) {
      this.localError.set('La squadra rossa ha già due posti assegnati.');
      return;
    }
    if (
      mode === 'blue' &&
      current !== 'blue' &&
      this.bluePreferenceCount() >= 2
    ) {
      this.localError.set('La squadra blu ha già due posti assegnati.');
      return;
    }

    this.updateSelection(playerId, current === mode ? 'off' : mode);
  }

  protected async createTeams(
    mode: TeamPickingMode = this.teamPickingMode(),
  ): Promise<void> {
    if (!this.canCreateTeams()) {
      return;
    }
    this.teamPickingMode.set(mode);

    this.busy.set(true);
    this.localError.set(null);
    try {
      const selectedEntries = [...this.selection().entries()].filter(
        ([, mode]) => mode !== 'off',
      );
      const candidates = selectedEntries.map(([playerId]) => playerId);
      const picked = await this.store.pickTeams(
        candidates,
        selectedEntries
          .filter(([, mode]) => mode === 'red')
          .map(([playerId]) => playerId),
        selectedEntries
          .filter(([, mode]) => mode === 'blue')
          .map(([playerId]) => playerId),
        this.teamPickingMode(),
      );
      const playersById = new Map(
        this.store
          .activePlayers()
          .map((player) => [player.id, player] as const),
      );
      const pickedIds = new Set(picked.map((entry) => entry.player_id));
      const redPlayers = picked
        .filter((entry) => entry.team === 'red')
        .map((entry) => playersById.get(entry.player_id))
        .filter((player): player is Player => player !== undefined);
      const bluePlayers = picked
        .filter((entry) => entry.team === 'blue')
        .map((entry) => playersById.get(entry.player_id))
        .filter((player): player is Player => player !== undefined);

      this.draft.set({
        red: redPlayers,
        blue: bluePlayers,
        benched: candidates
          .filter((playerId) => !pickedIds.has(playerId))
          .map((playerId) => playersById.get(playerId))
          .filter((player): player is Player => player !== undefined),
      });
      this.score.set({ red: 0, blue: 0 });
      this.confirming.set(false);
    } catch (error: unknown) {
      this.localError.set(this.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  protected addGoal(team: TeamColor): void {
    if (this.confirming() || this.busy()) {
      return;
    }

    const current = this.score();
    const nextValue = Math.min(6, current[team] + 1);
    this.score.set({ ...current, [team]: nextValue });
    if (nextValue === 6) {
      this.confirming.set(true);
    }
  }

  protected removeGoal(team: TeamColor): void {
    const current = this.score();
    this.score.set({ ...current, [team]: Math.max(0, current[team] - 1) });
  }

  protected correctScore(): void {
    this.confirming.set(false);
  }

  protected async confirmMatch(): Promise<void> {
    const draft = this.draft();
    const score = this.score();
    if (!draft || !this.confirming() || (score.red !== 6 && score.blue !== 6)) {
      return;
    }

    this.busy.set(true);
    this.localError.set(null);
    try {
      await this.store.recordMatch(
        draft.red.map((player) => player.id),
        draft.blue.map((player) => player.id),
        score.red,
        score.blue,
      );
      this.draft.set(null);
      this.busy.set(false);
      await this.createTeams();
    } catch (error: unknown) {
      this.localError.set(this.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  protected changePlayers(): void {
    this.draft.set(null);
    this.score.set({ red: 0, blue: 0 });
    this.confirming.set(false);
  }

  private updateSelection(playerId: string, mode: SelectionMode): void {
    this.localError.set(null);
    this.selection.update((selection) => {
      const next = new Map(selection);
      if (mode === 'off') {
        next.delete(playerId);
      } else {
        next.set(playerId, mode);
      }
      return next;
    });
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Operazione non riuscita.';
  }
}

function roundElo(value: number): number {
  return (Math.sign(value) * Math.round(Math.abs(value) * 100)) / 100;
}
