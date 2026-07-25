import { computed, Injectable, signal } from '@angular/core';
import {
  createClient,
  type Session,
  type SupabaseClient,
} from '@supabase/supabase-js';
import type { Database } from './database.types';
import { isSharedAccount, SHARED_ACCOUNT_EMAIL } from './company-access';
import { readRuntimeEnvironment } from './runtime-env';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly environment = readRuntimeEnvironment();
  private readonly supabaseClient: SupabaseClient<Database> | null = this
    .environment
    ? createClient<Database>(
        this.environment.supabaseUrl,
        this.environment.supabasePublishableKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        },
      )
    : null;

  readonly configured = signal(this.supabaseClient !== null);
  readonly session = signal<Session | null>(null);
  readonly authReady = signal(false);
  readonly companyUser = computed(() =>
    isSharedAccount(this.session()?.user.email),
  );

  constructor() {
    if (!this.supabaseClient) {
      this.authReady.set(true);
      return;
    }

    void this.initializeAuth();
    this.supabaseClient.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
      this.authReady.set(true);
    });
  }

  get client(): SupabaseClient<Database> {
    if (!this.supabaseClient) {
      throw new Error('Configurazione server mancante.');
    }

    return this.supabaseClient;
  }

  async signIn(password: string): Promise<void> {
    const { error } = await this.client.auth.signInWithPassword({
      email: SHARED_ACCOUNT_EMAIL,
      password,
    });

    if (error) {
      throw error;
    }
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) {
      throw error;
    }
  }

  private async initializeAuth(): Promise<void> {
    const { data, error } = await this.client.auth.getSession();
    if (error) {
      this.authReady.set(true);
      throw error;
    }

    this.session.set(data.session);
    this.authReady.set(true);
  }
}
