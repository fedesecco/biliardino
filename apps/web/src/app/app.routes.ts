import type { Route } from '@angular/router';
import { companyUserGuard } from './core/company-user.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    title: 'Nuova partita · Coppa Telenia',
    loadComponent: () =>
      import('./features/play/play-page').then((module) => module.PlayPage),
  },
  {
    path: 'changelog',
    title: 'Changelog · Coppa Telenia',
    loadComponent: () =>
      import('./features/changelog/changelog-page').then(
        (module) => module.ChangelogPage,
      ),
  },
  {
    path: 'classifica',
    title: 'Classifica · Coppa Telenia',
    loadComponent: () =>
      import('./features/ranking/ranking-page').then(
        (module) => module.RankingPage,
      ),
  },
  {
    path: 'statistiche',
    title: 'Statistiche · Coppa Telenia',
    loadComponent: () =>
      import('./features/analytics/analytics-page').then(
        (module) => module.AnalyticsPage,
      ),
  },
  {
    path: 'storico',
    title: 'Storico · Coppa Telenia',
    loadComponent: () =>
      import('./features/history/history-page').then(
        (module) => module.HistoryPage,
      ),
  },
  {
    path: 'giocatori',
    title: 'Giocatori · Coppa Telenia',
    canActivate: [companyUserGuard],
    loadComponent: () =>
      import('./features/players/players-page').then(
        (module) => module.PlayersPage,
      ),
  },
  {
    path: 'accedi',
    title: 'Accedi · Coppa Telenia',
    loadComponent: () =>
      import('./features/auth/login-page').then((module) => module.LoginPage),
  },
  { path: '**', redirectTo: '' },
];
