import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { italianMonthLabel } from './rome-calendar';

export type TrophyArtworkSize = 'thumbnail' | 'hero';

interface TrophyImages {
  thumbnail: string;
  hero: string;
}

const TROPHY_IMAGE_BY_MONTH: Record<string, TrophyImages> = {
  '2026-08-01': {
    thumbnail: '/trophies/2026-08-256.webp',
    hero: '/trophies/2026-08-1024.webp',
  },
};

const LEGACY_PAPER_IMAGES: TrophyImages = {
  thumbnail: '/trophies/legacy-paper-256.webp',
  hero: '/trophies/legacy-paper-1024.webp',
};

@Component({
  selector: 'app-trophy-artwork',
  imports: [NgOptimizedImage],
  template: `
    @if (imageUrl(); as source) {
      <img
        [ngSrc]="source"
        [width]="imageDimension()"
        [height]="imageDimension()"
        [alt]="artworkLabel()"
      />
    } @else {
      <svg
        class="fallback-trophy"
        viewBox="0 0 160 160"
        role="img"
        [attr.aria-label]="'Badge esclusivo ' + monthLabel()"
      >
        <defs>
          <linearGradient id="cup-gold" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stop-color="#fff0a8" />
            <stop offset="0.48" stop-color="#eebd3f" />
            <stop offset="1" stop-color="#b77412" />
          </linearGradient>
        </defs>
        <path
          d="M51 25h58v18c0 28-10 46-29 55-19-9-29-27-29-55V25Z"
          fill="url(#cup-gold)"
          stroke="#85500d"
          stroke-width="4"
        />
        <path
          d="M51 38H32c0 25 10 38 30 40M109 38h19c0 25-10 38-30 40"
          fill="none"
          stroke="#c98c1e"
          stroke-linecap="round"
          stroke-width="8"
        />
        <path d="M80 98v22M57 137h46M65 120h30l8 17H57l8-17Z" fill="url(#cup-gold)" stroke="#85500d" stroke-width="4" />
        <path d="m80 43 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2 5-10Z" fill="#fff7ce" />
      </svg>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: grid;
      flex: 0 0 auto;
      overflow: hidden;
      border: 1px solid rgb(163 105 15 / 22%);
      box-shadow: 0 0.6rem 1.6rem rgb(102 66 12 / 18%);
      place-items: center;
      perspective: 700px;
    }

    :host(.exclusive) {
      background:
        radial-gradient(circle at 35% 28%, rgb(255 255 255 / 92%), transparent 24%),
        linear-gradient(145deg, #fff8dd, #f1d276);
    }

    :host(.legacy) {
      background:
        repeating-linear-gradient(
          0deg,
          rgb(123 90 41 / 4%) 0,
          rgb(123 90 41 / 4%) 1px,
          transparent 1px,
          transparent 5px
        ),
        #fffaf0;
      border-color: rgb(108 75 35 / 28%);
      box-shadow:
        0.18rem 0.22rem 0 rgb(126 92 47 / 13%),
        0 0.55rem 1.2rem rgb(70 46 17 / 13%);
      transform: rotate(-1.5deg);
    }

    :host(.thumbnail) {
      width: 3.7rem;
      height: 3.7rem;
      border-radius: 1rem;
    }

    :host(.hero) {
      width: min(15rem, 56vw);
      aspect-ratio: 1;
      border-radius: 2rem;
    }

    :host(.exclusive.hero) {
      overflow: visible;
      background: transparent;
      border: 0;
      border-radius: 0;
      box-shadow: none;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      transform: rotateY(-5deg) rotateX(2deg) scale(1.08);
      transition: transform 300ms ease;
    }


    .fallback-trophy {
      width: 86%;
      height: 86%;
      object-fit: contain;
      filter: drop-shadow(0 0.65rem 0.45rem rgb(85 50 5 / 20%));
      transform: rotateY(-8deg) rotateX(3deg);
      transition: transform 300ms ease;
    }


    :host(:hover) img,
    :host(:hover) .fallback-trophy {
      transform: rotateY(8deg) rotateX(-2deg) translateY(-0.12rem);
    }
  `,
  host: {
    '[class]': 'size() + (isExclusive() ? " exclusive" : " legacy")',
  },
})
export class TrophyArtwork {
  readonly monthStart = input.required<string>();
  readonly size = input<TrophyArtworkSize>('thumbnail');
  protected readonly isExclusive = computed(
    () => this.monthStart() >= '2026-08-01',
  );
  protected readonly imageUrl = computed(() => {
    const images = this.isExclusive()
      ? TROPHY_IMAGE_BY_MONTH[this.monthStart()]
      : LEGACY_PAPER_IMAGES;
    return images?.[this.size()] ?? null;
  });
  protected readonly artworkLabel = computed(() =>
    this.isExclusive()
      ? `Badge esclusivo ${this.monthLabel()}`
      : `Miglior giocatore di ${this.monthLabel()}`,
  );
  protected readonly imageDimension = computed(() =>
    this.size() === 'hero' ? 1024 : 256,
  );
  protected readonly monthLabel = computed(() =>
    italianMonthLabel(this.monthStart()),
  );
}
