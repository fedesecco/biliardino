import { APP_VERSION } from '../../app-version';

const avatarAsset = (path: string): string => `${path}?v=${APP_VERSION}`;

export const AVATAR_ASSETS = {
  head: {
    base: avatarAsset('/avatars/head/base.webp'),
    gold: avatarAsset('/avatars/head/gold.webp'),
    silver: avatarAsset('/avatars/head/silver.webp'),
    bronze: avatarAsset('/avatars/head/bronze.webp'),
  },
  face: {
    base: avatarAsset('/avatars/face/base.webp'),
    bomboclat: avatarAsset('/avatars/face/bomboclat.webp'),
    scemo: avatarAsset('/avatars/face/scemo.webp'),
  },
  hair: {
    base: avatarAsset('/avatars/hair/base.webp'),
    'winstreak-3': avatarAsset('/avatars/hair/winstreak-3.webp'),
    'winstreak-5': avatarAsset('/avatars/hair/winstreak-5.webp'),
    'winstreak-10': avatarAsset('/avatars/hair/winstreak-10.webp'),
  },
} as const;

export const AVATAR_ARTWORK_SIZE = 512;
