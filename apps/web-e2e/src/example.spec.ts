import { expect, test } from '@playwright/test';

const players = [
  ['Federico', '#3279f6', 1048],
  ['Marta', '#e84a5f', 1022],
  ['Luca', '#1f9d70', 1008],
  ['Giulia', '#d98d1d', 995],
  ['Andrea', '#7b61ff', 983],
] as const;

const playerRows = players.map(([name, avatarColor, currentElo], index) => ({
  id: `00000000-0000-0000-0000-00000000000${index + 1}`,
  name,
  avatar_color: avatarColor,
  current_elo: currentElo,
  active: true,
  created_at: '2026-07-01T08:00:00Z',
  updated_at: '2026-07-21T08:00:00Z',
}));

test('creates teams and records a first-to-six match', async ({ page }) => {
  const userId = '11111111-1111-1111-1111-111111111111';
  await page.addInitScript(
    ({ id }) => {
      const encode = (value: object) =>
        btoa(JSON.stringify(value))
          .replaceAll('+', '-')
          .replaceAll('/', '_')
          .replaceAll('=', '');
      const now = Math.floor(Date.now() / 1000);
      const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
        aud: 'authenticated',
        exp: now + 3600,
        iat: now,
        sub: id,
        email: 'biliardino@teleniasoftware.com',
        role: 'authenticated',
        session_id: 'test-session',
      })}.signature`;

      localStorage.setItem(
        'sb-test-auth-token',
        JSON.stringify({
          access_token: token,
          refresh_token: 'test-refresh-token',
          expires_at: now + 3600,
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id,
            aud: 'authenticated',
            role: 'authenticated',
            email: 'biliardino@teleniasoftware.com',
            created_at: '2026-07-21T08:00:00Z',
            app_metadata: { provider: 'email', providers: ['email'] },
            user_metadata: {},
            identities: [],
          },
        }),
      );
    },
    { id: userId },
  );

  await page.route('**/env.js', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `window.__BILIARDINO_ENV__ = ${JSON.stringify({
        supabaseUrl: 'https://test.supabase.co',
        supabasePublishableKey: 'test-publishable-key',
      })};`,
    }),
  );

  await page.route('https://test.supabase.co/**', (route) => {
    const url = route.request().url();
    let body: unknown = {};

    if (url.includes('/rest/v1/player_statistics')) {
      body = [];
    } else if (url.includes('/rest/v1/match_players')) {
      body = [];
    } else if (url.includes('/rest/v1/matches')) {
      body = [];
    } else if (url.includes('/rest/v1/players')) {
      body = playerRows;
    } else if (url.includes('/rest/v1/rpc/pick_teams')) {
      body = [
        { player_id: playerRows[0].id, team: 'red', daily_games: 0 },
        { player_id: playerRows[2].id, team: 'red', daily_games: 0 },
        { player_id: playerRows[1].id, team: 'blue', daily_games: 0 },
        { player_id: playerRows[3].id, team: 'blue', daily_games: 0 },
      ];
    } else if (url.includes('/rest/v1/rpc/record_match')) {
      body = '22222222-2222-2222-2222-222222222222';
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': '*',
        'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
      },
      body: JSON.stringify(body),
    });
  });

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Connesso' })).toBeVisible();
  await expect(page.locator('.player-card')).toHaveCount(5);

  for (const name of players.map(([name]) => name)) {
    await page.getByRole('button', { name: `Seleziona ${name}` }).click();
  }
  await expect(page.locator('.counter strong')).toHaveText('5');

  await page.getByRole('button', { name: 'Crea squadre' }).click();
  await expect(page.locator('.team-panel')).toHaveCount(2);
  await expect(page.locator('.bench')).toContainText('Andrea');

  const redGoal = page.getByRole('button', {
    name: 'Aggiungi goal alla squadra rossa',
  });
  for (let goal = 0; goal < 6; goal += 1) {
    await redGoal.click();
  }

  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('6 — 0');
  await dialog.getByRole('button', { name: 'Conferma partita' }).click();
  await expect(
    page.getByText('Partita registrata. Classifica aggiornata.'),
  ).toBeVisible();
  await expect(page.locator('.red-team .score-tap span')).toHaveText('0');
});

test('signs in with the fixed shared account and password', async ({
  page,
}) => {
  let passwordPayload: unknown = null;
  const userId = '11111111-1111-1111-1111-111111111111';
  const email = 'biliardino@teleniasoftware.com';
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
    aud: 'authenticated',
    exp: now + 3600,
    iat: now,
    sub: userId,
    email,
    role: 'authenticated',
    session_id: 'test-session',
  })}.signature`;

  await page.route('**/env.js', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `window.__BILIARDINO_ENV__ = ${JSON.stringify({
        supabaseUrl: 'https://test.supabase.co',
        supabasePublishableKey: 'test-publishable-key',
      })};`,
    }),
  );
  await page.route('https://test.supabase.co/**', (route) => {
    if (
      route.request().url().includes('/auth/v1/token') &&
      route.request().url().includes('grant_type=password')
    ) {
      passwordPayload = route.request().postDataJSON();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: token,
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: userId,
            aud: 'authenticated',
            role: 'authenticated',
            email,
            created_at: '2026-07-23T08:00:00Z',
            app_metadata: { provider: 'email', providers: ['email'] },
            user_metadata: {},
            identities: [],
          },
        }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    });
  });

  await page.goto('/accedi');
  const password = page.getByLabel('Password');
  const submit = page.getByRole('button', { name: 'Accedi' });

  await password.fill('troppo-cort');
  await expect(submit).toBeDisabled();

  await password.fill('password-condivisa-sicura');
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page.getByRole('button', { name: 'Connesso' })).toBeVisible();
  expect(passwordPayload).toEqual({
    email: 'biliardino@teleniasoftware.com',
    password: 'password-condivisa-sicura',
    gotrue_meta_security: {},
  });
});
