import { AVATAR_ASSETS } from './avatar-assets';

describe('avatar assets', () => {
  it('uses the release revision in every served asset URL', () => {
    expect([
      ...Object.values(AVATAR_ASSETS.head),
      ...Object.values(AVATAR_ASSETS.face),
      ...Object.values(AVATAR_ASSETS.hair),
    ]).toEqual([
      '/avatars/head/base.webp?v=1.6.0',
      '/avatars/head/gold.webp?v=1.6.0',
      '/avatars/head/silver.webp?v=1.6.0',
      '/avatars/head/bronze.webp?v=1.6.0',
      '/avatars/face/base.webp?v=1.6.0',
      '/avatars/face/bomboclat.webp?v=1.6.0',
      '/avatars/face/scemo.webp?v=1.6.0',
      '/avatars/hair/base.webp?v=1.6.0',
      '/avatars/hair/winstreak-3.webp?v=1.6.0',
      '/avatars/hair/winstreak-5.webp?v=1.6.0',
      '/avatars/hair/winstreak-10.webp?v=1.6.0',
    ]);
  });
});
