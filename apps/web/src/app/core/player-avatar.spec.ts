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

  it('renders consistent initials, color, and size', () => {
    const avatar = fixture.nativeElement as HTMLElement;

    expect(avatar.textContent?.trim()).toBe('MR');
    expect(avatar.classList.contains('large')).toBe(true);
    expect(avatar.style.backgroundColor).toBe('rgb(168, 230, 207)');
    expect(getComputedStyle(avatar).color).toBe('rgb(32, 35, 47)');
  });

  it('exposes all current badges through one accessible label', () => {
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

    const badges = fixture.nativeElement.querySelector(
      '.badges',
    ) as HTMLElement;
    expect(badges.getAttribute('aria-label')).toBe(
      'Bomboclat, Winstreak: 5',
    );
    expect(
      [...badges.querySelectorAll<HTMLImageElement>('img')].map((image) =>
        image.getAttribute('src'),
      ),
    ).toEqual(['/awards/bomboclat.webp', '/awards/winstreak-5.webp']);
  });

  it('uses the global ranking medal only as a colored border', () => {
    fixture.componentRef.setInput('medal', 'gold');
    fixture.detectChanges();

    const avatar = fixture.nativeElement as HTMLElement;
    expect(avatar.classList.contains('avatar-medal-gold')).toBe(true);
    expect(getComputedStyle(avatar).borderTopColor).toBe('rgb(178, 122, 0)');
    expect(getComputedStyle(avatar).backgroundImage).not.toContain(
      'linear-gradient',
    );
    expect(getComputedStyle(avatar).color).toBe('rgb(32, 35, 47)');
  });
});
