import { DatePipe, DecimalPipe } from '@angular/common';
import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppStore } from '../../core/app-store.service';
import type {
  MatchParticipant,
  MatchRecord,
  MonthlyChampion,
  PlayerRivalry,
  TeamColor,
} from '../../core/models';
import type { Badge } from '../../core/monthly-badges';
import { PlayerAvatar } from '../../core/player-avatar';
import { italianMonthLabel } from '../../core/rome-calendar';
import { TrophyArtwork } from '../../core/trophy-artwork';
import {
  GLOBAL_MEDAL_ARTWORK,
  type GlobalMedalArtwork,
} from '../../core/recognitions';

interface PlayerAward extends MonthlyChampion {
  exclusive: boolean;
  monthLabel: string;
  title: string;
}


type SelectedAward =
  | { type: 'trophy'; value: PlayerAward }
  | { type: 'badge'; value: Badge };

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const RECENT_MATCH_LIMIT = 5;

@Component({
  selector: 'app-player-detail-page',
  imports: [DatePipe, DecimalPipe, PlayerAvatar, RouterLink, TrophyArtwork],
  templateUrl: './player-detail-page.html',
  styleUrl: './player-detail-page.scss',
})
export class PlayerDetailPage {
  private readonly route = inject(ActivatedRoute);
  protected readonly store = inject(AppStore);
  private readonly routeParamMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  protected readonly playerId = computed(
    () => this.routeParamMap().get('id') ?? '',
  );
  protected readonly statistic = computed(
    () =>
      this.store
        .statistics()
        .find((statistic) => statistic.id === this.playerId()) ?? null,
  );
  protected readonly globalMedalArtwork = computed<GlobalMedalArtwork | null>(
    () => {
      const player = this.statistic();
      const medal = player ? this.store.globalMedalFor(player.id) : null;
      return medal ? GLOBAL_MEDAL_ARTWORK[medal] : null;
    },
  );
  protected readonly playerBadges = computed(() =>
    this.store.badgesFor(this.playerId()),
  );
  protected readonly recentMatches = signal<MatchRecord[]>([]);
  protected readonly recentMatchesLoading = signal(true);
  protected readonly recentMatchesError = signal<string | null>(null);
  protected readonly rivalry = signal<PlayerRivalry | null>(null);
  protected readonly rivalryLoading = signal(true);
  protected readonly rivalryError = signal<string | null>(null);
  protected readonly trophies = computed<PlayerAward[]>(() =>
    this.store
      .monthlyChampions()
      .filter((champion) => champion.player_id === this.playerId())
      .map((champion) => {
        const monthLabel = italianMonthLabel(champion.month_start);
        const exclusive = champion.month_start >= '2026-08-01';
        return {
          ...champion,
          exclusive,
          monthLabel,
          title: exclusive
            ? `Premio esclusivo ${capitalize(monthLabel)}`
            : `Miglior giocatore di ${monthLabel}`,
        };
      }),
  );
  protected readonly selectedAward = signal<SelectedAward | null>(null);
  private readonly awardDialog =
    viewChild<ElementRef<HTMLDialogElement>>('awardDialog');
  private loadRequestVersion = 0;

  constructor() {
    effect(() => {
      const playerId = this.playerId();
      this.resetPlayerData();
      void this.loadRecentMatches(playerId, this.loadRequestVersion);
      void this.loadRivalry(playerId, this.loadRequestVersion);
    });
    effect(() => {
      const dialog = this.awardDialog()?.nativeElement;
      if (dialog && this.selectedAward() && !dialog.open) {
        dialog.showModal?.();
      }
    });
  }

  private resetPlayerData(): void {
    this.loadRequestVersion += 1;
    this.recentMatches.set([]);
    this.recentMatchesError.set(null);
    this.recentMatchesLoading.set(Boolean(this.playerId()));
    this.rivalry.set(null);
    this.rivalryError.set(null);
    this.rivalryLoading.set(Boolean(this.playerId()));
  }

  private async loadRecentMatches(
    playerId: string,
    requestVersion: number,
  ): Promise<void> {
    if (!playerId) {
      this.recentMatchesLoading.set(false);
      return;
    }

    try {
      const recentMatches = await this.store.loadPlayerRecentMatches(
        playerId,
        RECENT_MATCH_LIMIT,
      );
      if (requestVersion === this.loadRequestVersion) {
        this.recentMatches.set(recentMatches);
      }
    } catch (error: unknown) {
      if (requestVersion === this.loadRequestVersion) {
        this.recentMatchesError.set(
          error instanceof Error
            ? error.message
            : 'Impossibile caricare gli ultimi risultati.',
        );
      }
    } finally {
      if (requestVersion === this.loadRequestVersion) {
        this.recentMatchesLoading.set(false);
      }
    }
  }

  private async loadRivalry(
    playerId: string,
    requestVersion: number,
  ): Promise<void> {
    if (!playerId) {
      this.rivalryLoading.set(false);
      return;
    }

    try {
      const rivalry = await this.store.loadPlayerRivalry(playerId);
      if (requestVersion === this.loadRequestVersion) {
        this.rivalry.set(rivalry);
      }
    } catch (error: unknown) {
      if (requestVersion === this.loadRequestVersion) {
        this.rivalryError.set(
          error instanceof Error
            ? error.message
            : 'Impossibile caricare i confronti.',
        );
      }
    } finally {
      if (requestVersion === this.loadRequestVersion) {
        this.rivalryLoading.set(false);
      }
    }
  }

  protected participants(
    match: MatchRecord,
    team: TeamColor,
  ): MatchParticipant[] {
    return match.participants.filter(
      (participant) => participant.team === team,
    );
  }

  protected playerTeam(match: MatchRecord): TeamColor | null {
    return (
      match.participants.find(
        (participant) => participant.player_id === this.playerId(),
      )?.team ?? null
    );
  }

  protected teamDelta(match: MatchRecord, team: TeamColor): number {
    return (
      match.participants.find((participant) => participant.team === team)
        ?.elo_delta ?? 0
    );
  }

  protected openTrophy(trophy: PlayerAward): void {
    this.selectedAward.set({ type: 'trophy', value: trophy });
  }

  protected openBadge(badge: Badge): void {
    this.selectedAward.set({ type: 'badge', value: badge });
  }

  protected closeAward(): void {
    const dialog = this.awardDialog()?.nativeElement;
    if (dialog?.open) {
      dialog.close();
    }
    this.selectedAward.set(null);
  }

  protected closeFromBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeAward();
    }
  }
}
