import type { Route } from '@angular/router';
import { companyUserGuard } from './core/company-user.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    title: 'Nuova partita · Biliardino',
    loadComponent: () =>
      import('./features/play/play-page').then((module) => module.PlayPage),
  },
  {
    path: 'classifica',
    title: 'Classifica · Biliardino',
    loadComponent: () =>
      import('./features/ranking/ranking-page').then(
        (module) => module.RankingPage,
      ),
  },
  {
    path: 'statistiche',
    title: 'Statistiche · Biliardino',
    loadComponent: () =>
      import('./features/analytics/analytics-page').then(
        (module) => module.AnalyticsPage,
      ),
  },
  {
    path: 'storico',
    title: 'Storico · Biliardino',
    loadComponent: () =>
      import('./features/history/history-page').then(
        (module) => module.HistoryPage,
      ),
  },
  {
    path: 'giocatori',
    title: 'Giocatori · Biliardino',
    canActivate: [companyUserGuard],
    loadComponent: () =>
      import('./features/players/players-page').then(
        (module) => module.PlayersPage,
      ),
  },
  {
    path: 'accedi',
    title: 'Accedi · Biliardino',
    loadComponent: () =>
      import('./features/auth/login-page').then((module) => module.LoginPage),
  },
  { path: '**', redirectTo: '' },
];
