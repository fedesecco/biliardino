import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import {
  AVATAR_SETS,
  type AvatarArtwork,
  type AvatarComposition,
  type AvatarVariants,
} from '../../core/avatar-assets/avatar-assets';
import { PlayerAvatar } from '../../core/player-avatar/player-avatar';

type AvatarLayer = keyof AvatarVariants;
type AvatarType = AvatarComposition['head']['type'];

interface AvatarOption<Layer extends AvatarLayer> {
  id: string;
  label: string;
  artwork: AvatarArtwork;
  selection: { type: AvatarType; variant: AvatarVariants[Layer] };
}

interface AvatarControl<Layer extends AvatarLayer = AvatarLayer> {
  layer: Layer;
  label: string;
  options: AvatarOption<Layer>[];
}

const HEAD_LABELS: Record<AvatarVariants['head'], string> = {
  base: 'Normale',
  gold: 'Oro',
  silver: 'Argento',
  bronze: 'Bronzo',
};

const FACE_LABELS: Record<AvatarVariants['face'], string> = {
  base: 'Normale',
  bomboclat: 'Bomboclat',
  scemo: 'Scemo del Villaggio',
};

const HAIR_LABELS: Record<AvatarVariants['hair'], string> = {
  base: 'Normali',
  'winstreak-3': 'Winstreak 3',
  'winstreak-5': 'Winstreak 5',
  'winstreak-10': 'Winstreak 10',
};

function avatarOptions<Layer extends AvatarLayer>(
  layer: Layer,
  labels: Record<AvatarVariants[Layer], string>,
): AvatarOption<Layer>[] {
  const options = new Map<AvatarArtwork, AvatarOption<Layer>>();

  for (const type of Object.keys(AVATAR_SETS) as AvatarType[]) {
    const set = AVATAR_SETS[type];
    const variants = Object.entries(set[layer]) as [
      AvatarVariants[Layer],
      AvatarArtwork,
    ][];

    for (const [variant, artwork] of variants) {
      const shared = options.get(artwork);
      if (shared) {
        if (shared.selection.type !== type) {
          shared.label = `Comune · ${labels[shared.selection.variant]}`;
        }
        continue;
      }

      options.set(artwork, {
        id: `avatar-${layer}-${type}-${variant}`,
        label: `${set.label} · ${labels[variant]}`,
        artwork,
        selection: { type, variant },
      });
    }
  }

  return [...options.values()];
}

@Component({
  selector: 'app-avatar-lab-page',
  imports: [PlayerAvatar],
  templateUrl: './avatar-lab-page.html',
  styleUrl: './avatar-lab-page.scss',
})
export class AvatarLabPage {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly controls: AvatarControl[] = [
    { layer: 'head', label: 'Base', options: avatarOptions('head', HEAD_LABELS) },
    {
      layer: 'face',
      label: 'Occhi / viso',
      options: avatarOptions('face', FACE_LABELS),
    },
    {
      layer: 'hair',
      label: 'Capelli',
      options: avatarOptions('hair', HAIR_LABELS),
    },
  ];
  protected readonly composition = signal<AvatarComposition>({
    head: { type: 'male', variant: 'base' },
    face: { type: 'male', variant: 'base' },
    hair: { type: 'female', variant: 'base' },
  });
  protected readonly openLayer = signal<AvatarLayer | null>(null);
  protected readonly activeIndex = signal(0);
  protected readonly openAbove = signal(false);
  protected readonly dropdownSpace = signal(0);

  protected selectedIndex(control: AvatarControl): number {
    const selection = this.composition()[control.layer];
    const variants = AVATAR_SETS[selection.type][control.layer] as Record<
      AvatarVariants[AvatarLayer],
      AvatarArtwork
    >;
    return control.options.findIndex(
      (option) => option.artwork === variants[selection.variant],
    );
  }

  protected selectedOption(control: AvatarControl): AvatarOption<AvatarLayer> {
    return control.options[this.selectedIndex(control)];
  }

  protected toggle(control: AvatarControl): void {
    if (this.openLayer() === control.layer) {
      this.close(control);
      return;
    }
    this.positionDropdown(control);
    this.openLayer.set(control.layer);
    this.activeIndex.set(this.selectedIndex(control));
    this.scrollActiveOptionIntoView();
  }

  protected close(control: AvatarControl): void {
    if (this.openLayer() === control.layer) {
      this.openLayer.set(null);
    }
  }

  protected choose<Layer extends AvatarLayer>(
    control: AvatarControl<Layer>,
    index: number,
    trigger: HTMLButtonElement,
  ): void {
    const option = control.options[index];
    this.composition.update((current) => ({
      ...current,
      [control.layer]: option.selection,
    }));
    this.close(control);
    trigger.focus({ preventScroll: true });
  }

  protected onKeydown(
    event: KeyboardEvent,
    control: AvatarControl,
    trigger: HTMLButtonElement,
  ): void {
    if (event.key === 'Tab') {
      this.close(control);
      return;
    }
    if (event.key === 'Escape') {
      if (this.openLayer() === control.layer) {
        event.preventDefault();
        event.stopPropagation();
        this.close(control);
        trigger.focus({ preventScroll: true });
      }
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (this.openLayer() === control.layer) {
        this.choose(control, this.activeIndex(), trigger);
      } else {
        this.toggle(control);
      }
      return;
    }
    if (
      event.key !== 'ArrowDown' &&
      event.key !== 'ArrowUp' &&
      event.key !== 'Home' &&
      event.key !== 'End'
    ) {
      return;
    }

    event.preventDefault();
    const wasOpen = this.openLayer() === control.layer;
    let index = wasOpen ? this.activeIndex() : this.selectedIndex(control);
    if (event.key === 'Home') {
      index = 0;
    } else if (event.key === 'End') {
      index = control.options.length - 1;
    } else if (wasOpen) {
      index += event.key === 'ArrowDown' ? 1 : -1;
    }
    if (!wasOpen) {
      this.positionDropdown(control);
    }
    this.openLayer.set(control.layer);
    this.activeIndex.set(Math.max(0, Math.min(control.options.length - 1, index)));
    this.scrollActiveOptionIntoView();
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onOutsidePointerDown(event: PointerEvent): void {
    const layer = this.openLayer();
    if (!layer) {
      return;
    }
    const dropdown = this.element.nativeElement.querySelector(
      `[data-avatar-dropdown="${layer}"]`,
    );
    if (!event.composedPath().includes(dropdown as EventTarget)) {
      this.openLayer.set(null);
    }
  }

  private positionDropdown(control: AvatarControl): void {
    const trigger = this.element.nativeElement.querySelector<HTMLElement>(
      `#avatar-${control.layer}-trigger`,
    );
    if (!trigger) {
      return;
    }
    const bounds = trigger.getBoundingClientRect();
    const above = Math.max(0, bounds.top - 8);
    const below = Math.max(0, window.innerHeight - bounds.bottom - 8);
    const openAbove = below < window.innerHeight * 0.45 && above > below;
    this.openAbove.set(openAbove);
    this.dropdownSpace.set(openAbove ? above : below);
  }

  private scrollActiveOptionIntoView(): void {
    setTimeout(() => {
      const layer = this.openLayer();
      if (!layer) {
        return;
      }
      const list = this.element.nativeElement.querySelector<HTMLElement>(
        `#avatar-${layer}-listbox`,
      );
      const option = this.element.nativeElement.querySelector<HTMLElement>(
        `#avatar-${layer}-option-${this.activeIndex()}`,
      );
      if (!list || !option) {
        return;
      }
      if (option.offsetTop < list.scrollTop) {
        list.scrollTop = option.offsetTop;
      } else if (
        option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight
      ) {
        list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
      }
    });
  }
}
