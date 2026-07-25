import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/supabase.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly auth = inject(SupabaseService);
  protected readonly busy = signal(false);
  protected readonly localError = signal<string | null>(null);
  protected readonly loginForm = this.formBuilder.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(12)]],
  });

  protected async signIn(): Promise<void> {
    if (this.loginForm.invalid || this.busy()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    this.localError.set(null);
    try {
      await this.auth.signIn(this.loginForm.controls.password.value);
      await this.router.navigateByUrl('/');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      this.localError.set(
        message === 'Invalid login credentials'
          ? 'Password non corretta.'
          : message || 'Accesso non riuscito.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
