import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Badge, BadgeKind } from '../monthly-badges/monthly-badges';
import { AVATAR_ASSETS } from '../avatar-assets/avatar-assets';
import { PlayerAvatar } from './player-avatar';

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
      AVATAR_ASSETS.head.base,
      AVATAR_ASSETS.face.base,
      AVATAR_ASSETS.hair.base,
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
    ).toBe(AVATAR_ASSETS.head.gold);
    expect(
      avatar.querySelector<HTMLImageElement>('.avatar-layer-face')?.getAttribute(
        'src',
      ),
    ).toBe(AVATAR_ASSETS.face.bomboclat);
    expect(
      avatar.querySelector<HTMLImageElement>('.avatar-layer-hair')?.getAttribute(
        'src',
      ),
    ).toBe(AVATAR_ASSETS.hair['winstreak-5']);
    const faceLayer = avatar.querySelector<HTMLImageElement>(
      '.avatar-layer-face',
    );
    const hairLayer = avatar.querySelector<HTMLImageElement>(
      '.avatar-layer-hair',
    );
    expect(faceLayer?.style.getPropertyValue('--avatar-layer-scale-x')).toBe(
      '0.86',
    );
    expect(faceLayer?.style.getPropertyValue('--avatar-layer-offset-y')).toBe(
      '-2.7%',
    );
    expect(hairLayer?.style.getPropertyValue('--avatar-layer-scale-x')).toBe(
      '0.98',
    );
    expect(hairLayer?.style.getPropertyValue('--avatar-layer-scale-y')).toBe(
      '0.98',
    );
    expect(hairLayer?.style.getPropertyValue('--avatar-layer-offset-x')).toBe(
      '-1.5%',
    );
    expect(hairLayer?.style.getPropertyValue('--avatar-layer-offset-y')).toBe(
      '-34%',
    );
    expect(avatar.querySelector('.avatar-content')).toBeNull();
    expect(avatar.querySelector('.streak-effect')).toBeNull();
    expect(avatar.querySelector('.avatar-layers')?.getAttribute('aria-label')).toBe(
      'Avatar di Mario Rossi: Oro in classifica, Bomboclat, 5 vittorie consecutive',
    );
  });

  it('uses the highest available winstreak hair tier', () => {
    const tiers = [
      ['win-streak-3', AVATAR_ASSETS.hair['winstreak-3']],
      ['win-streak-5', AVATAR_ASSETS.hair['winstreak-5']],
      ['win-streak-10', AVATAR_ASSETS.hair['winstreak-10']],
    ] as const;
    for (const [kind, expectedSrc] of tiers) {
      fixture.componentRef.setInput('badges', [badge(kind, kind)]);
      fixture.detectChanges();

      const hair = (
        fixture.nativeElement as HTMLElement
      ).querySelector<HTMLImageElement>('.avatar-layer-hair');

      expect(hair?.getAttribute('src')).toBe(expectedSrc);
      expect(hair?.getAttribute('width')).toBe('512');
      expect(hair?.getAttribute('height')).toBe('512');
    }

  });

  it('keeps aspect-preserving hair layouts for every status', () => {
    const kinds = [
      null,
      'win-streak-3',
      'win-streak-5',
      'win-streak-10',
    ] as const;

    for (const kind of kinds) {
      fixture.componentRef.setInput(
        'badges',
        kind ? [badge(kind, kind)] : [],
      );
      fixture.detectChanges();

      const hair = (
        fixture.nativeElement as HTMLElement
      ).querySelector<HTMLImageElement>('.avatar-layer-hair');

      const expectedLayouts = {
        base: {
          scale: '0.74',
          offsetX: '-0.5%',
          offsetY: '-28%',
        },
        'win-streak-3': {
          scale: '0.92',
          offsetX: '-1.5%',
          offsetY: '-30%',
        },
        'win-streak-5': {
          scale: '0.98',
          offsetX: '-1.5%',
          offsetY: '-34%',
        },
        'win-streak-10': {
          scale: '1.02',
          offsetX: '-1.5%',
          offsetY: '-30%',
        },
      } as const;
      const expected = expectedLayouts[kind ?? 'base'];
      expect({
        scaleX: hair?.style.getPropertyValue('--avatar-layer-scale-x'),
        scaleY: hair?.style.getPropertyValue('--avatar-layer-scale-y'),
        offsetX: hair?.style.getPropertyValue('--avatar-layer-offset-x'),
        offsetY: hair?.style.getPropertyValue('--avatar-layer-offset-y'),
      }).toEqual({
        scaleX: expected.scale,
        scaleY: expected.scale,
        offsetX: expected.offsetX,
        offsetY: expected.offsetY,
      });
    }
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
    ).toBe(AVATAR_ASSETS.head.bronze);
    expect(
      avatar.querySelector<HTMLImageElement>('.avatar-layer-face')?.getAttribute(
        'src',
      ),
    ).toBe(AVATAR_ASSETS.face.scemo);
    expect(
      avatar.querySelector<HTMLImageElement>('.avatar-layer-hair')?.getAttribute(
        'src',
      ),
    ).toBe(AVATAR_ASSETS.hair.base);
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
    imageUrl: `/avatars/${
      kind.startsWith('monthly-') ? 'face' : 'hair'
    }/${kind}.webp`,
  };
}
