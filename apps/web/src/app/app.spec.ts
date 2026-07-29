import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the public navigation when Supabase is not configured', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.brand strong')?.textContent).toBe(
      'Coppa Telenia',
    );
    expect(compiled.querySelectorAll('.bottom-nav a')).toHaveLength(4);
    expect(compiled.querySelector('.config-alert')?.textContent).toContain(
      'Configurazione server mancante.',
    );
    const versionLink =
      compiled.querySelector<HTMLAnchorElement>('.app-footer a');
    expect(versionLink?.textContent?.trim()).toBe('v1.1.0');
    expect(versionLink?.getAttribute('href')).toBe('/changelog');
    expect(versionLink?.getAttribute('target')).toBeNull();
  });
});
