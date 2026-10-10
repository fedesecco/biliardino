import { Component, computed, input } from '@angular/core';
import type { PlayerAvatarMedal } from './models';
import { PlayerInitialsPipe } from './player-initials.pipe';
import type { Badge } from './monthly-badges';

export type PlayerAvatarSize = 'small' | 'medium' | 'large';
const MEDAL_BORDER_COLORS: Record<PlayerAvatarMedal, string> = {
  gold: '#b27a00',
  silver: '#66727e',
  bronze: '#a6532e',
};

@Component({
  selector: 'app-player-avatar',
  imports: [PlayerInitialsPipe],
  template: `
    <span class="initials" aria-hidden="true">
      {{ name() | playerInitials }}
    </span>
    @if (badges().length > 0) {
      <span
        class="badges"
        role="group"
        [attr.aria-label]="badgeSummary()"
      >
        @for (badge of badges(); track badge.kind) {
          <span class="badge" [attr.title]="badge.label">
            <img
              [src]="badge.imageUrl"
              alt=""
              aria-hidden="true"
              width="128"
              height="128"
            />
          </span>
        }
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

    .badges {
      position: absolute;
      top: -0.42rem;
      right: -0.42rem;
      z-index: 1;
      display: flex;
      gap: 0.05rem;
      align-items: center;
    }

    .badge {
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

    :host(.small) .badges {
      top: -0.34rem;
      right: -0.34rem;
    }

    :host(.small) .badge {
      width: 1rem;
      height: 1rem;
    }
  `,
  host: {
    '[class]': 'size()',
    '[class.avatar-medal-gold]': 'medal() === "gold"',
    '[class.avatar-medal-silver]': 'medal() === "silver"',
    '[class.avatar-medal-bronze]': 'medal() === "bronze"',
    '[style.background-color]': 'color()',
    '[style.border-color]': 'medalBorderColor()',
  },
})
export class PlayerAvatar {
  readonly name = input.required<string>();
  readonly color = input.required<string>();
  readonly size = input<PlayerAvatarSize>('medium');
  readonly medal = input<PlayerAvatarMedal | null>(null);
  readonly badges = input<Badge[]>([]);
  protected readonly badgeSummary = computed(() =>
    this.badges()
      .map(({ label }) => label)
      .join(', '),
  );
  protected readonly medalBorderColor = computed(() => {
    const medal = this.medal();
    return medal ? MEDAL_BORDER_COLORS[medal] : null;
  });
}
