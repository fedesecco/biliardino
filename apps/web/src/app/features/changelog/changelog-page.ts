import { Component, resource, ViewEncapsulation } from '@angular/core';
import { marked } from 'marked';

@Component({
  selector: 'app-changelog-page',
  imports: [],
  templateUrl: './changelog-page.html',
  styleUrl: './changelog-page.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ChangelogPage {
  protected readonly changelog = resource({
    loader: async () => {
      const response = await fetch('CHANGELOG.md');
      if (!response.ok) {
        throw new Error(`Impossibile caricare il changelog (${response.status})`);
      }

      return marked.parse(await response.text(), { async: false });
    },
  });
}
