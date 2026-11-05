import { expect, test } from '@playwright/test';

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
  expect(passwordPayload).toMatchObject({
    email: 'biliardino@teleniasoftware.com',
    password: 'password-condivisa-sicura',
  });
});
