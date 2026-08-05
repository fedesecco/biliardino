import { DecimalPipe } from '@angular/common';
import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppStore } from '../../core/app-store.service';
import type { MonthlyChampion } from '../../core/models';
import { PlayerAvatar } from '../../core/player-avatar';
import { italianMonthLabel } from '../../core/rome-calendar';
import { TrophyArtwork } from '../../core/trophy-artwork';

interface PlayerAward extends MonthlyChampion {
  exclusive: boolean;
  monthLabel: string;
  title: string;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

@Component({
  selector: 'app-player-detail-page',
  imports: [DecimalPipe, PlayerAvatar, RouterLink, TrophyArtwork],
  templateUrl: './player-detail-page.html',
  styleUrl: './player-detail-page.scss',
})
export class PlayerDetailPage {
  private readonly route = inject(ActivatedRoute);
  protected readonly store = inject(AppStore);
  protected readonly playerId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly statistic = computed(
    () =>
      this.store
        .statistics()
        .find((statistic) => statistic.id === this.playerId) ?? null,
  );
  protected readonly trophies = computed<PlayerAward[]>(() =>
    this.store
      .monthlyChampions()
      .filter((champion) => champion.player_id === this.playerId)
      .map((champion) => {
        const monthLabel = italianMonthLabel(champion.month_start);
        const exclusive = champion.month_start >= '2026-08-01';
        return {
          ...champion,
          exclusive,
          monthLabel,
          title: exclusive
            ? `Badge esclusivo ${capitalize(monthLabel)}`
            : `Miglior giocatore di ${monthLabel}`,
        };
      }),
  );
  protected readonly selectedTrophy = signal<PlayerAward | null>(null);
  private readonly trophyDialog =
    viewChild<ElementRef<HTMLDialogElement>>('trophyDialog');

  constructor() {
    effect(() => {
      const dialog = this.trophyDialog()?.nativeElement;
      if (dialog && this.selectedTrophy() && !dialog.open) {
        dialog.showModal();
      }
    });
  }

  protected openTrophy(trophy: PlayerAward): void {
    this.selectedTrophy.set(trophy);
  }

  protected closeTrophy(): void {
    const dialog = this.trophyDialog()?.nativeElement;
    if (dialog?.open) {
      dialog.close();
    }
    this.selectedTrophy.set(null);
  }

  protected closeFromBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeTrophy();
    }
  }
}
