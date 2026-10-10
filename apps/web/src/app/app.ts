import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { APP_VERSION } from './app-version';
import { AppStore } from './core/app-store.service';
import { recognitionDialogTitle } from './core/recognitions';
import { SupabaseService } from './core/supabase.service';

const RECOGNITION_DEMO_ENABLED = true; // TEMPORANEO: rimuovere dopo l'approvazione visuale.

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly auth = inject(SupabaseService);
  protected readonly store = inject(AppStore);
  protected readonly appVersion = APP_VERSION;
  protected readonly recognitionDialogTitle = recognitionDialogTitle;
  private readonly recognitionDialog =
    viewChild<ElementRef<HTMLDialogElement>>('recognitionDialog');
  constructor() {
    if (RECOGNITION_DEMO_ENABLED) {
      this.store.showDemoRecognition();
    }
    effect(() => {
      const dialog = this.recognitionDialog()?.nativeElement;
      const recognition = this.store.currentRecognition();
      if (!dialog) {
        return;
      }

      if (recognition && !dialog.open) {
        dialog.showModal?.();
      } else if (!recognition && dialog.open) {
        dialog.close();
      }
    });
    effect((onCleanup) => {
      const notice = this.store.notice();

      untracked(() => {
        if (!notice) {
          return;
        }

        const timeout = setTimeout(
          () => this.store.dismissNotice(),
          2000,
        );

        onCleanup(() => clearTimeout(timeout));
      });
    });
  }

  protected signOut(): void {
    void this.auth.signOut();
  }
}
