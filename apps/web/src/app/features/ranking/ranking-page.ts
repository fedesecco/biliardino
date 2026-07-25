import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AppStore } from '../../core/app-store.service';
import { PlayerInitialsPipe } from '../../core/player-initials.pipe';

@Component({
  selector: 'app-ranking-page',
  imports: [DecimalPipe, PlayerInitialsPipe],
  templateUrl: './ranking-page.html',
  styleUrl: './ranking-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankingPage {
  protected readonly store = inject(AppStore);
}
