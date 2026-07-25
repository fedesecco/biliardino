import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import type { CanActivateFn } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { SupabaseService } from './supabase.service';

export const companyUserGuard: CanActivateFn = () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);
  if (supabase.authReady()) {
    return supabase.companyUser() ? true : router.createUrlTree(['/accedi']);
  }

  return toObservable(supabase.authReady).pipe(
    filter((ready) => ready),
    take(1),
    map(() =>
      supabase.companyUser() ? true : router.createUrlTree(['/accedi']),
    ),
  );
};
