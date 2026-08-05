import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { APP_VERSION } from './app-version';
import { AppStore } from './core/app-store.service';
import { SupabaseService } from './core/supabase.service';

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

  protected signOut(): void {
    void this.auth.signOut();
  }
}
