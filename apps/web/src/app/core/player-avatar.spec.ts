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
});
