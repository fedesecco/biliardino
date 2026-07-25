# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: example.spec.ts >> signs in with the fixed shared account and password
- Location: src\example.spec.ts:139:5

# Error details

```
Error: expect(locator).toBeDisabled() failed

Locator:  getByRole('button', { name: 'Accedi' })
Expected: disabled
Received: enabled
Timeout:  5000ms

Call log:
  - Expect "toBeDisabled" with timeout 5000ms
  - waiting for getByRole('button', { name: 'Accedi' })
    14 × locator resolved to <button type="submit" class="primary-button" _ngcontent-ng-c1398454889=""> Accedi </button>
       - unexpected value "enabled"

```

```yaml
- button "Accedi"
```

# Test source

```ts
  107 |     });
  108 |   });
  109 | 
  110 |   await page.goto('/');
  111 |   await expect(page.getByRole('button', { name: 'Connesso' })).toBeVisible();
  112 |   await expect(page.locator('.player-card')).toHaveCount(5);
  113 | 
  114 |   for (const name of players.map(([name]) => name)) {
  115 |     await page.getByRole('button', { name: `Seleziona ${name}` }).click();
  116 |   }
  117 |   await expect(page.locator('.counter strong')).toHaveText('5');
  118 | 
  119 |   await page.getByRole('button', { name: 'Crea squadre' }).click();
  120 |   await expect(page.locator('.team-panel')).toHaveCount(2);
  121 |   await expect(page.locator('.bench')).toContainText('Andrea');
  122 | 
  123 |   const redGoal = page.getByRole('button', {
  124 |     name: 'Aggiungi goal alla squadra rossa',
  125 |   });
  126 |   for (let goal = 0; goal < 6; goal += 1) {
  127 |     await redGoal.click();
  128 |   }
  129 | 
  130 |   const dialog = page.getByRole('dialog');
  131 |   await expect(dialog).toContainText('6 — 0');
  132 |   await dialog.getByRole('button', { name: 'Conferma partita' }).click();
  133 |   await expect(
  134 |     page.getByText('Partita registrata. Classifica aggiornata.'),
  135 |   ).toBeVisible();
  136 |   await expect(page.locator('.red-team .score-tap span')).toHaveText('0');
  137 | });
  138 | 
  139 | test('signs in with the fixed shared account and password', async ({
  140 |   page,
  141 | }) => {
  142 |   let passwordPayload: unknown = null;
  143 |   const userId = '11111111-1111-1111-1111-111111111111';
  144 |   const email = 'biliardino@teleniasoftware.com';
  145 |   const encode = (value: object) =>
  146 |     Buffer.from(JSON.stringify(value)).toString('base64url');
  147 |   const now = Math.floor(Date.now() / 1000);
  148 |   const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
  149 |     aud: 'authenticated',
  150 |     exp: now + 3600,
  151 |     iat: now,
  152 |     sub: userId,
  153 |     email,
  154 |     role: 'authenticated',
  155 |     session_id: 'test-session',
  156 |   })}.signature`;
  157 | 
  158 |   await page.route('**/env.js', (route) =>
  159 |     route.fulfill({
  160 |       contentType: 'text/javascript',
  161 |       body: `window.__BILIARDINO_ENV__ = ${JSON.stringify({
  162 |         supabaseUrl: 'https://test.supabase.co',
  163 |         supabasePublishableKey: 'test-publishable-key',
  164 |       })};`,
  165 |     }),
  166 |   );
  167 |   await page.route('https://test.supabase.co/**', (route) => {
  168 |     if (
  169 |       route.request().url().includes('/auth/v1/token') &&
  170 |       route.request().url().includes('grant_type=password')
  171 |     ) {
  172 |       passwordPayload = route.request().postDataJSON();
  173 |       return route.fulfill({
  174 |         status: 200,
  175 |         contentType: 'application/json',
  176 |         body: JSON.stringify({
  177 |           access_token: token,
  178 |           refresh_token: 'test-refresh-token',
  179 |           expires_in: 3600,
  180 |           token_type: 'bearer',
  181 |           user: {
  182 |             id: userId,
  183 |             aud: 'authenticated',
  184 |             role: 'authenticated',
  185 |             email,
  186 |             created_at: '2026-07-23T08:00:00Z',
  187 |             app_metadata: { provider: 'email', providers: ['email'] },
  188 |             user_metadata: {},
  189 |             identities: [],
  190 |           },
  191 |         }),
  192 |       });
  193 |     }
  194 | 
  195 |     return route.fulfill({
  196 |       status: 200,
  197 |       contentType: 'application/json',
  198 |       body: '[]',
  199 |     });
  200 |   });
  201 | 
  202 |   await page.goto('/accedi');
  203 |   const password = page.getByLabel('Password condivisa');
  204 |   const submit = page.getByRole('button', { name: 'Accedi' });
  205 | 
  206 |   await password.fill('troppo-corta');
> 207 |   await expect(submit).toBeDisabled();
      |                        ^ Error: expect(locator).toBeDisabled() failed
  208 | 
  209 |   await password.fill('password-condivisa-sicura');
  210 |   await expect(submit).toBeEnabled();
  211 |   await submit.click();
  212 | 
  213 |   await expect(page.getByText('Accesso condiviso attivo')).toBeVisible();
  214 |   expect(passwordPayload).toEqual({
  215 |     email: 'biliardino@teleniasoftware.com',
  216 |     password: 'password-condivisa-sicura',
  217 |     gotrue_meta_security: {},
  218 |   });
  219 | });
  220 | 
```