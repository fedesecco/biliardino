import { Component, computed, input } from '@angular/core';
import type { AvatarType, PlayerAvatarMedal } from '../models';
import type { Badge } from '../monthly-badges/monthly-badges';
import {
  AVATAR_ARTWORK_SIZE,
  AVATAR_SETS,
  type AvatarComposition,
  type AvatarVariants,
} from '../avatar-assets/avatar-assets';
import { GLOBAL_MEDAL_DETAILS } from '../recognitions/recognitions';

export type PlayerAvatarSize = 'small' | 'medium' | 'large' | 'hero';

type AvatarLayer = keyof AvatarVariants;

const MONTHLY_FACE_PARTS: Partial<
  Record<Badge['kind'], AvatarVariants['face']>
> = {
  'monthly-champion': 'bomboclat',
  'monthly-last': 'scemo',
};

const WIN_STREAK_HAIR_PARTS: Partial<
  Record<Badge['kind'], AvatarVariants['hair']>
> = {
  'win-streak-3': 'winstreak-3',
  'win-streak-5': 'winstreak-5',
  'win-streak-10': 'winstreak-10',
};

const MEDAL_BORDER_COLORS: Record<PlayerAvatarMedal, string> = {
  gold: '#b27a00',
  silver: '#66727e',
  bronze: '#a6532e',
};

@Component({
  selector: 'app-player-avatar',
  template: `
    <span
      class="avatar-layers"
      role="img"
      [attr.aria-label]="avatarLabel()"
    >
      @for (layer of avatarLayers(); track layer.kind) {
        <img
          class="avatar-layer"
          [class.avatar-layer-head]="layer.kind === 'head'"
          [class.avatar-layer-face]="layer.kind === 'face'"
          [class.avatar-layer-hair]="layer.kind === 'hair'"
          [src]="layer.imageUrl"
          alt=""
          aria-hidden="true"
          [width]="avatarArtworkSize"
          [height]="avatarArtworkSize"
          [style.--avatar-layer-scale-x]="layer.layout.scaleX"
          [style.--avatar-layer-scale-y]="layer.layout.scaleY"
          [style.--avatar-layer-offset-x]="layer.layout.offsetX"
          [style.--avatar-layer-offset-y]="layer.layout.offsetY"
        />
      }
    </span>
  `,
  styleUrl: './player-avatar.scss',
  host: {
    '[class]': 'size()',
    '[class.avatar-medal-gold]': 'headPart().variant === "gold"',
    '[class.avatar-medal-silver]': 'headPart().variant === "silver"',
    '[class.avatar-medal-bronze]': 'headPart().variant === "bronze"',
    '[style.background-color]': 'color()',
    '[style.border-color]': 'medalBorderColor()',
  },
})
export class PlayerAvatar {
  readonly name = input.required<string>();
  readonly color = input.required<string>();
  readonly type = input<AvatarType>('male');
  readonly size = input<PlayerAvatarSize>('medium');
  readonly medal = input<PlayerAvatarMedal | null>(null);
  readonly badges = input<Badge[]>([]);
  readonly composition = input<AvatarComposition | null>(null);
  protected readonly avatarArtworkSize = AVATAR_ARTWORK_SIZE;
  protected readonly headPart = computed<AvatarComposition['head']>(
    () => this.composition()?.head ?? {
      type: this.type(),
      variant: this.medal() ?? 'base',
    },
  );
  protected readonly monthlyBadge = computed(
    () =>
      this.badges().find(
        ({ kind }) => kind === 'monthly-champion' || kind === 'monthly-last',
      ) ?? null,
  );
  protected readonly streakBadge = computed(
    () =>
      this.badges().find(({ kind }) => Boolean(WIN_STREAK_HAIR_PARTS[kind])) ??
      null,
  );
  protected readonly avatarLayers = computed(() => {
    const avatarSet = AVATAR_SETS[this.type()];
    const composition = this.composition();
    const headPart = this.headPart();
    const monthlyBadge = this.monthlyBadge();
    const streakBadge = this.streakBadge();
    const head = AVATAR_SETS[headPart.type].head[headPart.variant];
    const face = composition
      ? AVATAR_SETS[composition.face.type].face[composition.face.variant]
      : avatarSet.face[
          monthlyBadge ? MONTHLY_FACE_PARTS[monthlyBadge.kind] ?? 'base' : 'base'
        ];
    const hair = composition
      ? AVATAR_SETS[composition.hair.type].hair[composition.hair.variant]
      : avatarSet.hair[
          streakBadge ? WIN_STREAK_HAIR_PARTS[streakBadge.kind] ?? 'base' : 'base'
        ];

    return [
      {
        kind: 'head' as const satisfies AvatarLayer,
        imageUrl: head.imageUrl,
        layout: head.layout,
      },
      {
        kind: 'face' as const satisfies AvatarLayer,
        imageUrl: face.imageUrl,
        layout: face.layout,
      },
      {
        kind: 'hair' as const satisfies AvatarLayer,
        imageUrl: hair.imageUrl,
        layout: hair.layout,
      },
    ];
  });
  protected readonly avatarLabel = computed(() => {
    if (this.composition()) {
      return `Avatar di ${this.name()}`;
    }
    const medal = this.medal();
    const monthlyBadge = this.monthlyBadge();
    const streakBadge = this.streakBadge();
    const details = [
      medal ? GLOBAL_MEDAL_DETAILS[medal].label : null,
      monthlyBadge?.label ?? null,
      streakBadge?.description ?? streakBadge?.label ?? null,
    ].filter((detail): detail is string => Boolean(detail));

    return details.length > 0
      ? `Avatar di ${this.name()}: ${details.join(', ')}`
      : `Avatar di ${this.name()}`;
  });
  protected readonly medalBorderColor = computed(() => {
    const head = this.headPart().variant;
    return head === 'base' ? null : MEDAL_BORDER_COLORS[head];
  });
}
