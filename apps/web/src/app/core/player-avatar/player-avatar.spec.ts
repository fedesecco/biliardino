import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Badge, BadgeKind } from '../monthly-badges/monthly-badges';
import {
  AVATAR_SETS,
  type AvatarComposition,
} from '../avatar-assets/avatar-assets';
import { PlayerAvatar } from './player-avatar';

const BADGE_ARTWORK: Record<BadgeKind, string> = {
  'monthly-champion': AVATAR_SETS.male.face.bomboclat.imageUrl,
  'monthly-last': AVATAR_SETS.male.face.scemo.imageUrl,
  'win-streak-3': AVATAR_SETS.male.hair['winstreak-3'].imageUrl,
  'win-streak-5': AVATAR_SETS.male.hair['winstreak-5'].imageUrl,
  'win-streak-10': AVATAR_SETS.male.hair['winstreak-10'].imageUrl,
};

describe('PlayerAvatar', () => {
  let fixture: ComponentFixture<PlayerAvatar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerAvatar],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerAvatar);
    fixture.componentRef.setInput('name', 'Mario Rossi');
    fixture.componentRef.setInput('color', '#a8e6cf');
    fixture.componentRef.setInput('size', 'large');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders the three base avatar layers by default', () => {
    const avatar = fixture.nativeElement as HTMLElement;

    expect(avatar.textContent?.trim()).toBe('');
    expect(avatar.classList.contains('large')).toBe(true);
    expect(getComputedStyle(avatar).borderRadius).toBe('50%');
    expect(avatar.style.backgroundColor).toBe('rgb(168, 230, 207)');
    expect(getComputedStyle(avatar).color).toBe('rgb(32, 35, 47)');
    const layers = [
      ...avatar.querySelectorAll<HTMLImageElement>('.avatar-layer'),
    ];
    expect(layers.map((layer) => layer.getAttribute('src'))).toEqual([
      AVATAR_SETS.male.head.base.imageUrl,
      AVATAR_SETS.male.face.base.imageUrl,
      AVATAR_SETS.male.hair.base.imageUrl,
    ]);
    expect(
      layers.every(
        (layer) =>
          layer.getAttribute('width') === '512' &&
          layer.getAttribute('height') === '512',
      ),
    ).toBe(true);
    expect(avatar.querySelector('.initials')).toBeNull();
    expect(avatar.querySelector('.avatar-layers')?.getAttribute('role')).toBe(
      'img',
    );
    expect(avatar.querySelector('.avatar-layers')?.getAttribute('aria-label')).toBe(
      'Avatar di Mario Rossi',
    );
  });

  it('uses the female base face and hair for female avatars', () => {
    fixture.componentRef.setInput('type', 'female');
    fixture.detectChanges();

    const layers = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLImageElement>(
        '.avatar-layer',
      ),
    ];

    expect(layers.map((layer) => layer.getAttribute('src'))).toEqual([
      AVATAR_SETS.female.head.base.imageUrl,
      AVATAR_SETS.female.face.base.imageUrl,
      AVATAR_SETS.female.hair.base.imageUrl,
    ]);
  });

  it('keeps hero avatars on the canonical artwork canvas', () => {
    fixture.componentRef.setInput('size', 'hero');
    fixture.detectChanges();

    const avatar = fixture.nativeElement as HTMLElement;
    const layers = [
      ...avatar.querySelectorAll<HTMLImageElement>('.avatar-layer'),
    ];

    expect(avatar.classList.contains('hero')).toBe(true);
    expect(
      layers.every(
        (layer) =>
          layer.getAttribute('width') === '512' &&
          layer.getAttribute('height') === '512',
      ),
    ).toBe(true);
  });

  it('composes ranking, monthly and winstreak status in separate layers', () => {
    fixture.componentRef.setInput('medal', 'gold');
    fixture.componentRef.setInput('badges', [
      badge('monthly-champion', 'Bomboclat'),
      badge('win-streak-5', 'Winstreak: 5', '5 vittorie consecutive'),
    ]);
    fixture.detectChanges();

    const avatar = fixture.nativeElement as HTMLElement;
    expect(
      avatar.querySelector<HTMLImageElement>('.avatar-layer-head')?.getAttribute(
        'src',
      ),
    ).toBe(AVATAR_SETS.male.head.gold.imageUrl);
    expect(
      avatar.querySelector<HTMLImageElement>('.avatar-layer-face')?.getAttribute(
        'src',
      ),
    ).toBe(AVATAR_SETS.male.face.bomboclat.imageUrl);
    expect(
      avatar.querySelector<HTMLImageElement>('.avatar-layer-hair')?.getAttribute(
        'src',
      ),
    ).toBe(AVATAR_SETS.male.hair['winstreak-5'].imageUrl);
    expect(avatar.querySelector('.avatar-content')).toBeNull();
    expect(avatar.querySelector('.streak-effect')).toBeNull();
    expect(avatar.querySelector('.avatar-layers')?.getAttribute('aria-label')).toBe(
      'Avatar di Mario Rossi: Oro in classifica, Bomboclat, 5 vittorie consecutive',
    );
  });

  it('keeps the streak tier while switching between complete avatar types', () => {
    const tiers = [
      ['win-streak-3', 'winstreak-3'],
      ['win-streak-5', 'winstreak-5'],
      ['win-streak-10', 'winstreak-10'],
    ] as const;

    for (const [kind, hairVariant] of tiers) {
      fixture.componentRef.setInput('badges', [badge(kind, kind)]);
      for (const type of ['male', 'female'] as const) {
        fixture.componentRef.setInput('type', type);
        fixture.detectChanges();

        const hair = (fixture.nativeElement as HTMLElement)
          .querySelector<HTMLImageElement>('.avatar-layer-hair');
        expect(hair?.getAttribute('src')).toBe(
          AVATAR_SETS[type].hair[hairVariant].imageUrl,
        );
      }
    }
  });

  it('restores the selected type’s base hair after a winstreak ends', () => {
    fixture.componentRef.setInput('type', 'female');
    fixture.componentRef.setInput('badges', [
      badge('win-streak-5', 'Winstreak: 5'),
    ]);
    fixture.detectChanges();

    const hair = (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLImageElement>('.avatar-layer-hair');
    expect(hair?.getAttribute('src')).toBe(
      AVATAR_SETS.female.hair['winstreak-5'].imageUrl,
    );

    fixture.componentRef.setInput('badges', []);
    fixture.detectChanges();
    expect(hair?.getAttribute('src')).toBe(AVATAR_SETS.female.hair.base.imageUrl);

    fixture.componentRef.setInput('type', 'male');
    fixture.detectChanges();
    expect(hair?.getAttribute('src')).toBe(AVATAR_SETS.male.hair.base.imageUrl);
  });

  it('lets manual parts override status and restores status when cleared', () => {
    fixture.componentRef.setInput('medal', 'gold');
    fixture.componentRef.setInput('badges', [
      badge('monthly-champion', 'Bomboclat'),
      badge('win-streak-5', 'Winstreak: 5'),
    ]);
    fixture.detectChanges();

    const avatar = fixture.nativeElement as HTMLElement;
    const sources = () => [
      ...avatar.querySelectorAll<HTMLImageElement>('.avatar-layer'),
    ].map((image) => image.getAttribute('src'));
    const automaticSources = sources();

    fixture.componentRef.setInput('composition', {
      head: { type: 'female', variant: 'silver' },
      face: { type: 'male', variant: 'base' },
      hair: { type: 'female', variant: 'base' },
    } satisfies AvatarComposition);
    fixture.detectChanges();

    expect(sources()).toEqual([
      AVATAR_SETS.female.head.silver.imageUrl,
      AVATAR_SETS.male.face.base.imageUrl,
      AVATAR_SETS.female.hair.base.imageUrl,
    ]);
    expect(avatar.classList.contains('avatar-medal-silver')).toBe(true);
    expect(avatar.classList.contains('avatar-medal-gold')).toBe(false);

    fixture.componentRef.setInput('composition', null);
    fixture.detectChanges();

    expect(sources()).toEqual(automaticSources);
    expect(avatar.classList.contains('avatar-medal-gold')).toBe(true);
    expect(avatar.classList.contains('avatar-medal-silver')).toBe(false);
  });

  it('changes the face for the monthly last-place status', () => {
    fixture.componentRef.setInput('medal', 'bronze');
    fixture.componentRef.setInput('badges', [
      badge('monthly-last', 'Scemo del Villaggio'),
    ]);
    fixture.detectChanges();

    const avatar = fixture.nativeElement as HTMLElement;
    expect(
      avatar.querySelector<HTMLImageElement>('.avatar-layer-head')?.getAttribute(
        'src',
      ),
    ).toBe(AVATAR_SETS.male.head.bronze.imageUrl);
    expect(
      avatar.querySelector<HTMLImageElement>('.avatar-layer-face')?.getAttribute(
        'src',
      ),
    ).toBe(AVATAR_SETS.male.face.scemo.imageUrl);
    expect(
      avatar.querySelector<HTMLImageElement>('.avatar-layer-hair')?.getAttribute(
        'src',
      ),
    ).toBe(AVATAR_SETS.male.hair.base.imageUrl);
  });
});

function badge(
  kind: BadgeKind,
  label: string,
  description?: string,
): Badge {
  return {
    kind,
    label,
    description,
    elo: null,
    imageUrl: BADGE_ARTWORK[kind],
  };
}
