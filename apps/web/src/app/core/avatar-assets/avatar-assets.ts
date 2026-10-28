import { APP_VERSION } from '../../app-version';
import type { AvatarType } from '../models';

export interface AvatarVariants {
  head: 'base' | 'gold' | 'silver' | 'bronze';
  face: 'base' | 'bomboclat' | 'scemo';
  hair: 'base' | 'winstreak-3' | 'winstreak-5' | 'winstreak-10';
}

export interface AvatarLayerLayout {
  scaleX: number;
  scaleY: number;
  offsetX: string;
  offsetY: string;
}

export interface AvatarArtwork {
  imageUrl: string;
  layout: AvatarLayerLayout;
}

export interface AvatarSet {
  label: string;
  head: Record<AvatarVariants['head'], AvatarArtwork>;
  face: Record<AvatarVariants['face'], AvatarArtwork>;
  hair: Record<AvatarVariants['hair'], AvatarArtwork>;
}

export type AvatarComposition = {
  [Layer in keyof AvatarVariants]: {
    type: AvatarType;
    variant: AvatarVariants[Layer];
  };
};

const avatarArtwork = (
  path: string,
  layout: AvatarLayerLayout,
): AvatarArtwork => ({
  imageUrl: `${path}?v=${APP_VERSION}`,
  layout,
});

const HEAD_LAYOUT: AvatarLayerLayout = {
  scaleX: 1,
  scaleY: 1,
  offsetX: '0%',
  offsetY: '0%',
};

const BASE_FACE_LAYOUT: AvatarLayerLayout = {
  scaleX: 0.86,
  scaleY: 0.86,
  offsetX: '0%',
  offsetY: '-6.6%',
};

const MONTHLY_FACE_LAYOUT: AvatarLayerLayout = {
  ...BASE_FACE_LAYOUT,
  offsetY: '-2.7%',
};

const SHARED_HEADS: AvatarSet['head'] = {
  base: avatarArtwork('/avatars/shared/head/base.webp', HEAD_LAYOUT),
  gold: avatarArtwork('/avatars/shared/head/gold.webp', HEAD_LAYOUT),
  silver: avatarArtwork('/avatars/shared/head/silver.webp', HEAD_LAYOUT),
  bronze: avatarArtwork('/avatars/shared/head/bronze.webp', HEAD_LAYOUT),
};

const SHARED_MONTHLY_FACES = {
  bomboclat: avatarArtwork(
    '/avatars/shared/face/bomboclat.webp',
    MONTHLY_FACE_LAYOUT,
  ),
  scemo: avatarArtwork('/avatars/shared/face/scemo.webp', MONTHLY_FACE_LAYOUT),
};

export const AVATAR_SETS: Record<AvatarType, AvatarSet> = {
  male: {
    label: 'Maschio',
    head: SHARED_HEADS,
    face: {
      base: avatarArtwork('/avatars/male/face/base.webp', BASE_FACE_LAYOUT),
      ...SHARED_MONTHLY_FACES,
    },
    hair: {
      base: avatarArtwork('/avatars/male/hair/base.webp', {
        scaleX: 0.74,
        scaleY: 0.74,
        offsetX: '-0.5%',
        offsetY: '-28%',
      }),
      'winstreak-3': avatarArtwork('/avatars/male/hair/winstreak-3.webp', {
        scaleX: 0.92,
        scaleY: 0.92,
        offsetX: '-1.5%',
        offsetY: '-30%',
      }),
      'winstreak-5': avatarArtwork('/avatars/male/hair/winstreak-5.webp', {
        scaleX: 0.98,
        scaleY: 0.98,
        offsetX: '-1.5%',
        offsetY: '-34%',
      }),
      'winstreak-10': avatarArtwork('/avatars/male/hair/winstreak-10.webp', {
        scaleX: 1.02,
        scaleY: 1.02,
        offsetX: '-1.5%',
        offsetY: '-30%',
      }),
    },
  },
  female: {
    label: 'Femmina',
    head: SHARED_HEADS,
    face: {
      base: avatarArtwork('/avatars/female/face/base.png', BASE_FACE_LAYOUT),
      ...SHARED_MONTHLY_FACES,
    },
    hair: {
      base: avatarArtwork('/avatars/female/hair/base.png', {
        scaleX: 1.14,
        scaleY: 1.14,
        offsetX: '0%',
        offsetY: '0.5%',
      }),
      'winstreak-3': avatarArtwork('/avatars/female/hair/winstreak-3.webp', {
        scaleX: 1.14,
        scaleY: 1.14,
        offsetX: '0%',
        offsetY: '0%',
      }),
      'winstreak-5': avatarArtwork('/avatars/female/hair/winstreak-5.webp', {
        scaleX: 1.1,
        scaleY: 1.1,
        offsetX: '0%',
        offsetY: '-2%',
      }),
      'winstreak-10': avatarArtwork('/avatars/female/hair/winstreak-10.webp', {
        scaleX: 1.1,
        scaleY: 1.1,
        offsetX: '0%',
        offsetY: '-7%',
      }),
    },
  },
};

export const AVATAR_ARTWORK_SIZE = 512;
