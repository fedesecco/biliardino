import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AppStore } from '../../core/app-store.service';
import { PlayerAvatar } from '../../core/player-avatar';

@Component({
  selector: 'app-ranking-page',
  imports: [DecimalPipe, PlayerAvatar],
  templateUrl: './ranking-page.html',
  styleUrl: './ranking-page.scss',
})
export class RankingPage {
  protected readonly store = inject(AppStore);
}
