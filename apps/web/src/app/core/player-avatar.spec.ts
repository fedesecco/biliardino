import { ComponentFixture, TestBed } from '@angular/core/testing';
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

  it('renders a circular avatar with initials by default', () => {
    const avatar = fixture.nativeElement as HTMLElement;

    expect(avatar.textContent?.trim()).toBe('MR');
    expect(avatar.classList.contains('large')).toBe(true);
    expect(getComputedStyle(avatar).borderRadius).toBe('50%');
    expect(avatar.style.backgroundColor).toBe('rgb(168, 230, 207)');
    expect(getComputedStyle(avatar).color).toBe('rgb(32, 35, 47)');
  });

  it('renders the Bomboclat badge icon before the global medal icon', () => {
    fixture.componentRef.setInput('medal', 'gold');
    fixture.componentRef.setInput('badges', [
      {
        kind: 'monthly-champion',
        label: 'Bomboclat',
        elo: 12.5,
        imageUrl: '/awards/bomboclat.webp',
      },
      {
        kind: 'win-streak-5',
        label: 'Winstreak: 5',
        description: '5 vittorie consecutive',
        elo: null,
        imageUrl: '/awards/winstreak-5.webp',
      },
    ]);
    fixture.detectChanges();

    const avatar = fixture.nativeElement as HTMLElement;
    expect(avatar.querySelector('.badges')).toBeNull();
    expect(avatar.querySelector('.initials')).toBeNull();
    expect(avatar.classList.contains('avatar-medal-gold')).toBe(true);
    expect(
      avatar.querySelector<HTMLImageElement>('.avatar-content')?.src,
    ).toContain('/awards/bomboclat.webp');
    expect(
      avatar.querySelector('.avatar-content')?.classList,
    ).not.toContain('global-medal-content');
    expect(
      avatar.querySelector<HTMLImageElement>('.avatar-content')?.alt,
    ).toBe('Bomboclat');
    const flame = avatar.querySelector<HTMLElement>('.streak-effect');
    const flameImage = avatar.querySelector<HTMLImageElement>('.streak-effect img');
    expect(flame).not.toBeNull();
    expect(flameImage).not.toBeNull();
    if (!flame || !flameImage) {
      throw new Error('Expected the winstreak frame to render');
    }
    expect(flameImage.src).toContain('/effects/winstreak-5.png');
    expect(flameImage.style.transform).toBe('translate(-50%, -61.3%)');
    expect(getComputedStyle(flame).position).toBe('absolute');
    expect(getComputedStyle(flameImage).position).toBe('absolute');
    expect(getComputedStyle(flameImage).height).toBe('auto');
    expect(getComputedStyle(flameImage).transform).toContain('translate');
    expect(flame.getAttribute('aria-label')).toBe('5 vittorie consecutive');
  });

  it('centers every winstreak frame with its optical correction', () => {
    const effects = [
      {
        kind: 'win-streak-3',
        src: '/effects/winstreak-3.png',
        transform: 'translate(-50%, -63.5%)',
      },
      {
        kind: 'win-streak-5',
        src: '/effects/winstreak-5.png',
        transform: 'translate(-50%, -61.3%)',
      },
      {
        kind: 'win-streak-10',
        src: '/effects/winstreak-10.png',
        transform: 'translate(-50%, -65.2%)',
      },
    ] as const;

    for (const effect of effects) {
      fixture.componentRef.setInput('badges', [
        {
          kind: effect.kind,
          label: `Winstreak: ${effect.kind.slice(-2)}`,
          elo: null,
          imageUrl: effect.src.replace('/effects/', '/awards/').replace('.png', '.webp'),
        },
      ]);
      fixture.detectChanges();

      const avatar = fixture.nativeElement as HTMLElement;
      const image = avatar.querySelector<HTMLImageElement>('.streak-effect img');
      expect(image?.src).toContain(effect.src);
      expect(image?.style.transform).toBe(effect.transform);
    }
  });

  it('renders the Scemo del Villaggio badge icon before the global medal icon', () => {
    fixture.componentRef.setInput('medal', 'bronze');
    fixture.componentRef.setInput('badges', [
      {
        kind: 'monthly-last',
        label: 'Scemo del Villaggio',
        elo: null,
        imageUrl: '/awards/scemo.webp',
      },
    ]);
    fixture.detectChanges();

    const avatar = fixture.nativeElement as HTMLElement;
    expect(avatar.querySelector('.initials')).toBeNull();
    expect(avatar.classList.contains('avatar-medal-bronze')).toBe(true);
    expect(
      avatar.querySelector<HTMLImageElement>('.avatar-content')?.src,
    ).toContain('/awards/scemo.webp');
    expect(
      avatar.querySelector('.avatar-content')?.classList,
    ).not.toContain('global-medal-content');
    expect(
      avatar.querySelector<HTMLImageElement>('.avatar-content')?.alt,
    ).toBe('Scemo del Villaggio');
    expect(avatar.querySelector('.character-face')).toBeNull();
  });

  it('renders the global ranking medal icon when no monthly badge wins', () => {
    fixture.componentRef.setInput('medal', 'gold');
    fixture.detectChanges();

    const avatar = fixture.nativeElement as HTMLElement;
    expect(avatar.classList.contains('avatar-medal-gold')).toBe(true);
    expect(
      avatar.querySelector<HTMLImageElement>('.avatar-content')?.src,
    ).toContain('/awards/oro.webp');
    expect(
      avatar.querySelector('.avatar-content')?.classList,
    ).toContain('global-medal-content');
    expect(
      avatar.querySelector<HTMLImageElement>('.avatar-content')?.alt,
    ).toBe('Oro in classifica');
    expect(avatar.querySelector('.initials')).toBeNull();
    expect(getComputedStyle(avatar).borderTopColor).toBe('rgb(178, 122, 0)');
    expect(getComputedStyle(avatar).backgroundImage).not.toContain(
      'linear-gradient',
    );
    expect(getComputedStyle(avatar).color).toBe('rgb(32, 35, 47)');
  });

});
