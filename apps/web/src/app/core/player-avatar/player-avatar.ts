import { Component, computed, input } from '@angular/core';
import type { PlayerAvatarMedal } from '../models';
import type { Badge } from '../monthly-badges/monthly-badges';
import { AVATAR_ARTWORK_SIZE, AVATAR_ASSETS } from '../avatar-assets/avatar-assets';
import { GLOBAL_MEDAL_ARTWORK } from '../recognitions/recognitions';

export type PlayerAvatarSize = 'small' | 'medium' | 'large' | 'hero';

type AvatarLayer = 'head' | 'face' | 'hair';

interface AvatarLayerLayout {
  scaleX: number;
  scaleY: number;
  offsetX: string;
  offsetY: string;
}

const MONTHLY_FACE_ASSETS: Partial<Record<Badge['kind'], string>> = {
  'monthly-champion': AVATAR_ASSETS.face.bomboclat,
  'monthly-last': AVATAR_ASSETS.face.scemo,
};

const WIN_STREAK_HAIR_ASSETS: Partial<Record<Badge['kind'], string>> = {
  'win-streak-3': AVATAR_ASSETS.hair['winstreak-3'],
  'win-streak-5': AVATAR_ASSETS.hair['winstreak-5'],
  'win-streak-10': AVATAR_ASSETS.hair['winstreak-10'],
};

const BASE_HEAD_LAYER_LAYOUT: AvatarLayerLayout = {
  scaleX: 1,
  scaleY: 1,
  offsetX: '0%',
  offsetY: '0%',
};

const BASE_FACE_LAYER_LAYOUT: AvatarLayerLayout = {
  scaleX: 0.86,
  scaleY: 0.86,
  offsetX: '0%',
  offsetY: '-6.6%',
};

const FACE_LAYER_LAYOUTS: Partial<
  Record<Badge['kind'], AvatarLayerLayout>
> = {
  'monthly-champion': {
    ...BASE_FACE_LAYER_LAYOUT,
    offsetY: '-2.7%',
  },
  'monthly-last': {
    ...BASE_FACE_LAYER_LAYOUT,
    offsetY: '-2.7%',
  },
};

const BASE_HAIR_LAYER_LAYOUT: AvatarLayerLayout = {
  scaleX: 0.74,
  scaleY: 0.74,
  offsetX: '-0.5%',
  offsetY: '-28%',
};

const WIN_STREAK_HAIR_LAYER_LAYOUTS: Partial<
  Record<Badge['kind'], AvatarLayerLayout>
> = {
  'win-streak-3': {
    scaleX: 0.92,
    scaleY: 0.92,
    offsetX: '-1.5%',
    offsetY: '-30%',
  },
  'win-streak-5': {
    scaleX: 0.98,
    scaleY: 0.98,
    offsetX: '-1.5%',
    offsetY: '-34%',
  },
  'win-streak-10': {
    scaleX: 1.02,
    scaleY: 1.02,
    offsetX: '-1.5%',
    offsetY: '-30%',
  },
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

  protected readonly avatarArtworkSize = AVATAR_ARTWORK_SIZE;
  protected readonly monthlyBadge = computed(
    () =>
      this.badges().find(
        ({ kind }) => kind === 'monthly-champion' || kind === 'monthly-last',
      ) ?? null,
  );
  protected readonly streakBadge = computed(
    () =>
      this.badges().find(({ kind }) => Boolean(WIN_STREAK_HAIR_ASSETS[kind])) ??
      null,
  );
  protected readonly avatarLayers = computed(() => {
    const medal = this.medal();
    const monthlyBadge = this.monthlyBadge();
    const streakBadge = this.streakBadge();

    return [
      {
        kind: 'head' as const satisfies AvatarLayer,
        imageUrl: medal ? AVATAR_ASSETS.head[medal] : AVATAR_ASSETS.head.base,
        layout: BASE_HEAD_LAYER_LAYOUT,
      },
      {
        kind: 'face' as const satisfies AvatarLayer,
        imageUrl: monthlyBadge
          ? MONTHLY_FACE_ASSETS[monthlyBadge.kind] ?? AVATAR_ASSETS.face.base
          : AVATAR_ASSETS.face.base,
        layout: monthlyBadge
          ? FACE_LAYER_LAYOUTS[monthlyBadge.kind] ?? BASE_FACE_LAYER_LAYOUT
          : BASE_FACE_LAYER_LAYOUT,
      },
      {
        kind: 'hair' as const satisfies AvatarLayer,
        imageUrl: streakBadge
          ? WIN_STREAK_HAIR_ASSETS[streakBadge.kind] ?? AVATAR_ASSETS.hair.base
          : AVATAR_ASSETS.hair.base,
        layout: streakBadge
          ? WIN_STREAK_HAIR_LAYER_LAYOUTS[streakBadge.kind] ?? BASE_HAIR_LAYER_LAYOUT
          : BASE_HAIR_LAYER_LAYOUT,
      },
    ];
  });
  protected readonly avatarLabel = computed(() => {
    const medal = this.medal();
    const monthlyBadge = this.monthlyBadge();
    const streakBadge = this.streakBadge();
    const details = [
      medal ? GLOBAL_MEDAL_ARTWORK[medal].label : null,
      monthlyBadge?.label ?? null,
      streakBadge?.description ?? streakBadge?.label ?? null,
    ].filter((detail): detail is string => Boolean(detail));

    return details.length > 0
      ? `Avatar di ${this.name()}: ${details.join(', ')}`
      : `Avatar di ${this.name()}`;
  });
  protected readonly medalBorderColor = computed(() => {
    const medal = this.medal();
    return medal ? MEDAL_BORDER_COLORS[medal] : null;
  });
}
