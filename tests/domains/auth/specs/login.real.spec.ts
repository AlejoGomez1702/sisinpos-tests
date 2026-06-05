import { expect, test } from '../../../shared/fixtures/base.fixture';
import { loginWithCredentials } from '../flows/login.flow';

const realIdentifier = process.env.AUTH_REAL_IDENTIFIER;
const realPassword = process.env.AUTH_REAL_PASSWORD;

test.describe('Auth Domain - Login Real @real @auth-real', () => {
  test('debe autenticar contra backend real', async ({ page }) => {
    test.skip(
      !realIdentifier || !realPassword,
      'Define AUTH_REAL_IDENTIFIER y AUTH_REAL_PASSWORD para ejecutar la suite real.'
    );

    await loginWithCredentials(page, realIdentifier!, realPassword!);
    await expect(page).not.toHaveURL(/\/auth\/login$/);
  });
});
