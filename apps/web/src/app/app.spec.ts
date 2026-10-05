import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { AppStore } from './core/app-store.service';

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
    const brandIcon = compiled.querySelector<HTMLImageElement>('.brand-mark');
    expect(brandIcon?.getAttribute('src')).toBe('/favicon.ico');
    expect(brandIcon?.getAttribute('alt')).toBe('');
    expect(compiled.querySelectorAll('.bottom-nav a')).toHaveLength(3);
    expect(
      compiled.querySelector('.bottom-nav a[href="/classifiche"] span')
        ?.textContent,
    ).toBe('Classifiche');
    expect(compiled.querySelector('.config-alert')?.textContent).toContain(
      'Configurazione server mancante.',
    );
    const versionLink =
      compiled.querySelector<HTMLAnchorElement>('.version-link');
    expect(versionLink?.textContent?.trim()).toBe('v1.4.1');
    expect(versionLink?.getAttribute('href')).toBe('/changelog');
    expect(compiled.querySelector('.app-footer')).toBeNull();
  });

  it('dismisses notices automatically after two seconds', () => {
    vi.useFakeTimers();
    try {
      const fixture = TestBed.createComponent(App);
      const store = TestBed.inject(AppStore);
      store.notice.set('Partita registrata. Classifica aggiornata.');
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.toast')).not.toBeNull();

      vi.advanceTimersByTime(1_999);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.toast')).not.toBeNull();

      vi.advanceTimersByTime(1);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.toast')).toBeNull();
      fixture.destroy();
    } finally {
      vi.useRealTimers();
    }
  });
});
