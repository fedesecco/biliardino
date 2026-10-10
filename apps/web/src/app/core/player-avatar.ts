import { Component, computed, input } from '@angular/core';
import type { PlayerAvatarMedal } from './models';
import { PlayerInitialsPipe } from './player-initials.pipe';
import type { Badge } from './monthly-badges';
import { GLOBAL_MEDAL_ARTWORK } from './recognitions';


export type PlayerAvatarSize = 'small' | 'medium' | 'large';

type StreakEffect = {
  imageUrl: string;
  translateY: string;
};

const WIN_STREAK_EFFECTS: Partial<Record<Badge['kind'], StreakEffect>> = {
  'win-streak-3': {
    imageUrl: '/effects/winstreak-3.png',
    translateY: '-63.5%',
  },
  'win-streak-5': {
    imageUrl: '/effects/winstreak-5.png',
    translateY: '-61.3%',
  },
  'win-streak-10': {
    imageUrl: '/effects/winstreak-10.png',
    translateY: '-65.2%',
  },
};

const MEDAL_BORDER_COLORS: Record<PlayerAvatarMedal, string> = {
  gold: '#b27a00',
  silver: '#66727e',
  bronze: '#a6532e',
};


@Component({
  selector: 'app-player-avatar',
  imports: [PlayerInitialsPipe],
  template: `
    @if (streakEffectUrl(); as effectUrl) {
      <span
        class="streak-effect"
        role="img"
        [attr.aria-label]="streakLabel()"
      >
        <img
          [src]="effectUrl"
          [style.transform]="streakEffectTransform()"
          alt=""
          aria-hidden="true"
          width="1254"
          height="1254"
        />
      </span>
    }
    @if (avatarContent(); as content) {
      <img
        class="avatar-content"
        [class.global-medal-content]="content.kind === 'global-medal'"
        [src]="content.imageUrl"
        [alt]="content.label"
        width="128"
        height="128"
      />
    } @else {
      <span class="initials" aria-hidden="true">
        {{ name() | playerInitials }}
      </span>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: grid;
      flex: 0 0 auto;
      overflow: visible;
      color: #20232f;
      font-weight: 950;
      letter-spacing: 0.04em;
      border: 2px solid rgb(255 255 255 / 78%);
      border-radius: 50%;
      box-shadow: 0 0.2rem 0.6rem rgb(32 35 47 / 14%);
      isolation: isolate;
      place-items: center;
    }

    :host(.small) {
      width: 1.55rem;
      height: 1.55rem;
      font-size: 0.47rem;
    }

    :host(.medium) {
      width: 2.15rem;
      height: 2.15rem;
      font-size: 0.62rem;
    }

    :host(.large) {
      width: 2.7rem;
      height: 2.7rem;
      font-size: 0.72rem;
    }

    .streak-effect {
      position: absolute;
      z-index: 0;
      inset: -20%;
      display: block;
      pointer-events: none;
    }

    .streak-effect img {
      position: absolute;
      top: 50%;
      left: 50%;
      display: block;
      width: 140%;
      height: auto;
      object-fit: contain;
      transform: translate(-50%, -50%);
    }

    .avatar-content {
      position: absolute;
      top: 50%;
      left: 50%;
      z-index: 1;
      display: block;
      width: calc(100% + 4px);
      height: auto;
      object-fit: contain;
      pointer-events: none;
      transform: translate(-50%, -50%);
    }

    .avatar-content.global-medal-content {
      width: calc(140% + 5.6px);
    }

    .initials {
      position: relative;
      z-index: 2;
      line-height: 1;
    }

  `,
  host: {
    '[class]': 'size()',
    '[class.avatar-medal-gold]': 'medal() === "gold"',
    '[class.avatar-medal-silver]': 'medal() === "silver"',
    '[class.avatar-medal-bronze]': 'medal() === "bronze"',
    '[style.background-color]': 'color()',
    '[style.border-color]': 'medalBorderColor()',
  },
})
export class PlayerAvatar {
  readonly name = input.required<string>();
  readonly color = input.required<string>();
  readonly size = input<PlayerAvatarSize>('medium');
  readonly medal = input<PlayerAvatarMedal | null>(null);
  readonly badges = input<Badge[]>([]);

  protected readonly avatarContent = computed(() => {
    const badges = this.badges();
    const monthlyChampion = badges.find(
      ({ kind }) => kind === 'monthly-champion',
    );
    const monthlyLast = badges.find(({ kind }) => kind === 'monthly-last');
    const monthlyBadge = monthlyChampion ?? monthlyLast;

    if (monthlyBadge) {
      return {
        imageUrl: monthlyBadge.imageUrl,
        label: monthlyBadge.label,
        kind: 'monthly-badge' as const,
      };
    }

    const medal = this.medal();
    if (!medal) {
      return null;
    }

    return {
      imageUrl: GLOBAL_MEDAL_ARTWORK[medal].imageUrl,
      label: GLOBAL_MEDAL_ARTWORK[medal].label,
      kind: 'global-medal' as const,
    };
  });
  protected readonly streakBadge = computed(
    () =>
      this.badges().find(({ kind }) => Boolean(WIN_STREAK_EFFECTS[kind])) ?? null,
  );
  protected readonly streakEffect = computed(() => {
    const kind = this.streakBadge()?.kind;
    return kind ? WIN_STREAK_EFFECTS[kind] ?? null : null;
  });
  protected readonly streakEffectUrl = computed(
    () => this.streakEffect()?.imageUrl ?? null,
  );
  protected readonly streakEffectTransform = computed(() => {
    const translateY = this.streakEffect()?.translateY ?? '-50%';
    return `translate(-50%, ${translateY})`;
  });
  protected readonly streakLabel = computed(
    () => this.streakBadge()?.description ?? this.streakBadge()?.label ?? null,
  );
  protected readonly medalBorderColor = computed(() => {
    const medal = this.medal();
    return medal ? MEDAL_BORDER_COLORS[medal] : null;
  });
}
