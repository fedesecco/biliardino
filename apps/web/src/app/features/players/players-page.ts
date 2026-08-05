import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppStore } from '../../core/app-store.service';
import type { Player } from '../../core/models';
import { PlayerAvatar } from '../../core/player-avatar';

@Component({
  selector: 'app-players-page',
  imports: [PlayerAvatar, ReactiveFormsModule, RouterLink],
  templateUrl: './players-page.html',
  styleUrl: './players-page.scss',
})
export class PlayersPage {
  private readonly formBuilder = inject(FormBuilder);
  protected readonly store = inject(AppStore);
  protected readonly editingId = signal<string | null>(null);
  protected readonly formVisible = signal(false);
  protected readonly busy = signal(false);
  protected readonly localError = signal<string | null>(null);
  protected readonly colors = [
    '#a8e6cf',
    '#ffd3a5',
    '#c7ceea',
    '#ffb7ce',
    '#b5ead7',
    '#e2f0cb',
    '#ffdac1',
    '#d5aaff',
    '#bde0fe',
    '#fde2e4',
    '#fff1a8',
    '#cde7be',
    '#f1c0e8',
    '#a9def9',
    '#e4c1f9',
    '#fbc4ab',
    '#b9fbc0',
    '#cfbaf0',
    '#f6d6ad',
    '#b8e0d2',
  ] as const;
  protected readonly playerForm = this.formBuilder.nonNullable.group({
    name: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(40)],
    ],
    avatarColor: [
      '#a8e6cf',
      [Validators.required, Validators.pattern(/^#[0-9a-fA-F]{6}$/)],
    ],
    active: true,
  });

  protected createNew(): void {
    const avatarColor =
      this.colors.find((color) => !this.colorUsedByAnother(color)) ??
      this.colors[0];
    this.editingId.set(null);
    this.formVisible.set(true);
    this.localError.set(null);
    this.playerForm.reset({
      name: '',
      avatarColor,
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
    if (!this.colorUsedByAnother(color)) {
      this.playerForm.controls.avatarColor.setValue(color);
    }
  }

  protected colorUsedByAnother(color: string): boolean {
    const editingId = this.editingId();
    return this.store
      .players()
      .some(
        (player) =>
          player.id !== editingId &&
          player.avatar_color.toLowerCase() === color.toLowerCase(),
      );
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
    if (this.colorUsedByAnother(this.playerForm.controls.avatarColor.value)) {
      this.localError.set(
        'Questo colore è già assegnato a un altro giocatore.',
      );
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
