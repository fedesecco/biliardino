import { Component, input } from '@angular/core';
import { PlayerInitialsPipe } from './player-initials.pipe';

export type PlayerAvatarSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-player-avatar',
  imports: [PlayerInitialsPipe],
  template: `{{ name() | playerInitials }}`,
  styles: `
    :host {
      display: grid;
      flex: 0 0 auto;
      color: #20232f;
      font-weight: 950;
      letter-spacing: 0.04em;
      border: 2px solid rgb(255 255 255 / 78%);
      box-shadow: 0 0.2rem 0.6rem rgb(32 35 47 / 14%);
      place-items: center;
    }

    :host(.small) {
      width: 1.55rem;
      height: 1.55rem;
      font-size: 0.47rem;
      border-radius: 0.45rem;
    }

    :host(.medium) {
      width: 2.15rem;
      height: 2.15rem;
      font-size: 0.62rem;
      border-radius: 0.7rem;
    }

    :host(.large) {
      width: 2.7rem;
      height: 2.7rem;
      font-size: 0.72rem;
      border-radius: 0.85rem;
    }
  `,
  host: {
    'aria-hidden': 'true',
    '[class]': 'size()',
    '[style.background-color]': 'color()',
  },
})
export class PlayerAvatar {
  readonly name = input.required<string>();
  readonly color = input.required<string>();
  readonly size = input<PlayerAvatarSize>('medium');
}
