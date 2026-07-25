import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppStore } from '../../core/app-store.service';
import type { Player } from '../../core/models';
import { PlayerInitialsPipe } from '../../core/player-initials.pipe';

@Component({
  selector: 'app-players-page',
  imports: [PlayerInitialsPipe, ReactiveFormsModule],
  templateUrl: './players-page.html',
  styleUrl: './players-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayersPage {
  private readonly formBuilder = inject(FormBuilder);
  protected readonly store = inject(AppStore);
  protected readonly editingId = signal<string | null>(null);
  protected readonly formVisible = signal(false);
  protected readonly busy = signal(false);
  protected readonly localError = signal<string | null>(null);
  protected readonly colors = [
    '#1f9d70',
    '#d98d1d',
    '#7b61ff',
    '#d754b0',
    '#227c83',
    '#4f596b',
  ];
  protected readonly playerForm = this.formBuilder.nonNullable.group({
    name: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(40)],
    ],
    avatarColor: [
      '#1f9d70',
      [Validators.required, Validators.pattern(/^#[0-9a-fA-F]{6}$/)],
    ],
    active: true,
  });

  protected createNew(): void {
    this.editingId.set(null);
    this.formVisible.set(true);
    this.localError.set(null);
    this.playerForm.reset({
      name: '',
      avatarColor: '#1f9d70',
      active: true,
    });
  }

  protected editPlayer(player: Player): void {
    this.editingId.set(player.id);
    this.formVisible.set(true);
    this.localError.set(null);
    this.playerForm.setValue({
      name: player.name,
      avatarColor: player.avatar_color,
      active: player.active,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected chooseColor(color: string): void {
    this.playerForm.controls.avatarColor.setValue(color);
  }

  protected closeForm(): void {
    this.formVisible.set(false);
    this.localError.set(null);
  }

  protected async savePlayer(): Promise<void> {
    if (this.playerForm.invalid || this.busy()) {
      this.playerForm.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    this.localError.set(null);
    try {
      const value = this.playerForm.getRawValue();
      const editingId = this.editingId();
      if (editingId) {
        await this.store.updatePlayer(editingId, {
          name: value.name,
          avatar_color: value.avatarColor,
          active: value.active,
        });
      } else {
        await this.store.createPlayer(value.name, value.avatarColor);
      }
      this.formVisible.set(false);
    } catch (error: unknown) {
      this.localError.set(
        error instanceof Error ? error.message : 'Salvataggio non riuscito.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
