import { Component, input } from '@angular/core';
import { PlayerInitialsPipe } from './player-initials.pipe';
import type { WeeklyBadge } from './weekly-awards';

export type PlayerAvatarSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-player-avatar',
  imports: [PlayerInitialsPipe],
  template: `
    <span class="initials" aria-hidden="true">
      {{ name() | playerInitials }}
    </span>
    @if (badge(); as weeklyBadge) {
      <span
        class="weekly-badge"
        [class.champion]="weeklyBadge.kind === 'weekly-champion'"
        [class.loser]="weeklyBadge.kind === 'weekly-loser'"
        [attr.aria-label]="
          weeklyBadge.label +
          ', ' +
          (weeklyBadge.elo > 0 ? '+' : '') +
          weeklyBadge.elo +
          ' ELO questa settimana'
        "
        [attr.title]="weeklyBadge.label"
      >
        <img
          [src]="
            weeklyBadge.kind === 'weekly-champion'
              ? '/awards/bomboclat.webp'
              : '/awards/scemo.webp'
          "
          alt=""
          aria-hidden="true"
          width="128"
          height="128"
        />
      </span>
    }
  `,
  styles: `
    :host {
      display: grid;
      flex: 0 0 auto;
      color: #20232f;
      font-weight: 950;
      letter-spacing: 0.04em;
      border: 2px solid rgb(255 255 255 / 78%);
      box-shadow: 0 0.2rem 0.6rem rgb(32 35 47 / 14%);
      position: relative;
      isolation: isolate;
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

    .initials {
      line-height: 1;
    }

    .weekly-badge {
      position: absolute;
      top: -0.42rem;
      right: -0.42rem;
      z-index: 1;
      display: grid;
      width: 1.2rem;
      height: 1.2rem;
      overflow: hidden;
      background: white;
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 0.18rem 0.45rem rgb(32 35 47 / 24%);
      place-items: center;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: inherit;
      }

    }

    :host(.small) .weekly-badge {
      top: -0.34rem;
      right: -0.34rem;
      width: 1rem;
      height: 1rem;
    }
  `,
  host: {
    '[class]': 'size()',
    '[style.background-color]': 'color()',
  },
})
export class PlayerAvatar {
  readonly name = input.required<string>();
  readonly color = input.required<string>();
  readonly size = input<PlayerAvatarSize>('medium');
  readonly badge = input<WeeklyBadge | null>(null);
}
