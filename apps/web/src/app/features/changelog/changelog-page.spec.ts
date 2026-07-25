import { TestBed } from '@angular/core/testing';
import { ChangelogPage } from './changelog-page';

describe('ChangelogPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the changelog Markdown as headings and a list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          '# Changelog\n\n## [1.0.1]\n\n### Aggiunto\n\n- Anteprima ELO',
        ),
      ),
    );
    await TestBed.configureTestingModule({
      imports: [ChangelogPage],
    }).compileComponents();

    const fixture = TestBed.createComponent(ChangelogPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toBe('Changelog');
    expect(compiled.querySelector('h2')?.textContent).toBe('[1.0.1]');
    expect(compiled.querySelector('li')?.textContent).toBe('Anteprima ELO');
  });
});
