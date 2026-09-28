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

  it('exposes all current monthly badges through one accessible label', () => {
    fixture.componentRef.setInput('badges', [
      {
        kind: 'monthly-champion',
        label: 'Bomboclat',
        elo: 12.5,
        imageUrl: '/awards/bomboclat.webp',
      },
      {
        kind: 'global-gold',
        label: "Medaglia d'oro",
        elo: 12.5,
        imageUrl: '/awards/oro.webp',
      },
    ]);
    fixture.detectChanges();

    const badges = fixture.nativeElement.querySelector(
      '.monthly-badges',
    ) as HTMLElement;
    expect(badges.getAttribute('aria-label')).toBe(
      "Bomboclat, Medaglia d'oro",
    );
    expect(
      [...badges.querySelectorAll<HTMLImageElement>('img')].map((image) =>
        image.getAttribute('src'),
      ),
    ).toEqual(['/awards/bomboclat.webp', '/awards/oro.webp']);
  });
});
