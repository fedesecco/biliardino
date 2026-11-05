import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal, type TemplateRef, viewChild } from '@angular/core';
import { AppStore } from '../../core/app-store.service';
import type {
  SelectionMode,
  TeamColor,
  TeamPickingMode,
} from '../../core/models';
import { PlayerAvatar } from '../../core/player-avatar/player-avatar';
import { SupabaseService } from '../../core/supabase.service';

interface EloPreviewRange {
  min: number;
  max: number;
}

const ELO_K = 28;
const MINIMUM_GOAL_MARGIN = 1;
const MAXIMUM_GOAL_MARGIN = 6;
const MINIMUM_MARGIN_MULTIPLIER =
  1 + 0.15 * Math.log(1 + MINIMUM_GOAL_MARGIN);
const MAXIMUM_MARGIN_MULTIPLIER = Math.min(
  1.3,
  1 + 0.15 * Math.log(1 + MAXIMUM_GOAL_MARGIN),
);


@Component({
  selector: 'app-play-page',
  imports: [DecimalPipe, PlayerAvatar],
  templateUrl: './play-page.html',
  styleUrl: './play-page.scss',
})
export class PlayPage {
  readonly bottomActions = viewChild<TemplateRef<unknown>>('bottomActions');
  protected readonly store = inject(AppStore);
  protected readonly auth = inject(SupabaseService);
  protected readonly selection = this.store.playSelection;
  protected readonly teamPickingMode = this.store.teamPickingMode;
  protected readonly draft = this.store.playDraft;
  protected readonly score = this.store.playScore;
  protected readonly confirming = this.store.playConfirming;
  protected readonly busy = signal(false);
  protected readonly localError = signal<string | null>(null);
  protected readonly canSelect = computed(
    () => this.auth.companyUser() && !this.busy(),
  );
  protected readonly canMutate = computed(
    () =>
      this.canSelect() &&
      this.store.playReady() &&
      this.store.playConnected(),
  );

  protected readonly selectedCount = computed(
    () =>
      [...this.selection().values()].filter((mode) => mode !== 'off').length,
  );
  protected readonly canCreateTeams = computed(
    () => this.canMutate() && this.selectedCount() >= 4,
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
    const redWinBase = ELO_K * (1 - expectedRed);
    const redLossBase = ELO_K * expectedRed;

    return {
      red: {
        win: previewRange(redWinBase),
        loss: previewRange(redLossBase),
      },
      blue: {
        win: previewRange(redLossBase),
        loss: previewRange(redWinBase),
      },
    };
  });

  protected toggleAny(playerId: string): void {
    if (!this.canSelect()) {
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
    if (!this.canSelect()) {
      return;
    }

    const current = this.selection().get(playerId) ?? 'off';
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
      await this.store.startPlay(
        candidates,
        selectedEntries
          .filter(([, mode]) => mode === 'red')
          .map(([playerId]) => playerId),
        selectedEntries
          .filter(([, mode]) => mode === 'blue')
          .map(([playerId]) => playerId),
        this.teamPickingMode(),
      );
    } catch (error: unknown) {
      this.localError.set(this.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  protected async addGoal(team: TeamColor): Promise<void> {
    if (this.confirming() || this.score()[team] >= 6) {
      return;
    }
    await this.changePlay('goal', team);
  }

  protected async removeGoal(team: TeamColor): Promise<void> {
    if (this.score()[team] === 0) {
      return;
    }
    await this.changePlay('undo', team);
  }

  protected async correctScore(): Promise<void> {
    if (!this.confirming()) {
      return;
    }
    await this.changePlay('correct');
  }

  protected async confirmMatch(): Promise<void> {
    const score = this.score();
    if (!this.confirming() || (score.red !== 6 && score.blue !== 6)) {
      return;
    }
    await this.changePlay('finish');
  }

  protected async changePlayers(): Promise<void> {
    await this.changePlay('cancel');
  }

  protected async retryPlaySync(): Promise<void> {
    if (!this.auth.companyUser() || this.busy()) {
      return;
    }

    this.busy.set(true);
    this.localError.set(null);
    try {
      await this.store.retryPlaySync();
    } catch (error: unknown) {
      this.localError.set(this.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  private async changePlay(
    action: 'goal' | 'undo' | 'correct' | 'cancel' | 'finish',
    team?: TeamColor,
  ): Promise<void> {
    if (!this.canMutate() || !this.draft()) {
      return;
    }

    this.busy.set(true);
    this.localError.set(null);
    try {
      await this.store.changePlay(action, team);
    } catch (error: unknown) {
      this.localError.set(this.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
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
    return error !== null &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string'
      ? error.message
      : 'Operazione non riuscita.';
  }
}

function previewRange(base: number): EloPreviewRange {
  return {
    min: roundElo(base * MINIMUM_MARGIN_MULTIPLIER),
    max: roundElo(base * MAXIMUM_MARGIN_MULTIPLIER),
  };
}

function roundElo(value: number): number {
  return (Math.sign(value) * Math.round(Math.abs(value) * 100)) / 100;
}
