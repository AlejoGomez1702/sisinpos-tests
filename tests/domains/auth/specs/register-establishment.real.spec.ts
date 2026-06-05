import { expect, test } from '../../../shared/fixtures/base.fixture';
import { submitRegisterForm } from '../flows/register.flow';
import { submitEstablishmentForm } from '../flows/register-establishment.flow';
import { buildUniqueUser } from '../data/register.data';
import { buildUniqueEstablishment } from '../data/establishment.data';

// NOTA: esta suite crea usuarios y establecimientos reales en la BD.
// Implementa el cleanup según lo que exponga tu backend
// (ej: DELETE /api/auth/users/:id + DELETE /api/onboarding/establishment/:id desde afterAll).

test.describe('Onboarding de Establecimiento Real @real @auth-real', () => {
  // ── Funnel completo ────────────────────────────────────────────────────────

  test('debe completar registro y onboarding y llegar al dashboard', async ({ page }) => {
    const user = buildUniqueUser();
    const establishment = buildUniqueEstablishment();

    // Paso 1: Registro
    await submitRegisterForm(page, user, { goto: true });
    await expect(page).toHaveURL(/\/auth\/register-establishment/);

    // Paso 2: Onboarding
    await submitEstablishmentForm(page, establishment);
    await expect(page).toHaveURL(/\/dashboard/);

    // Verificar que ambos tokens y datos están almacenados
    expect(await page.evaluate(() => localStorage.getItem('x-token'))).toBeTruthy();
    expect(await page.evaluate(() => localStorage.getItem('establishment_data'))).toBeTruthy();
  });

  test('debe almacenar establishment_data en localStorage tras onboarding exitoso', async ({
    page,
  }) => {
    const user = buildUniqueUser();
    const establishment = buildUniqueEstablishment();

    await submitRegisterForm(page, user, { goto: true });
    await expect(page).toHaveURL(/\/auth\/register-establishment/);

    await submitEstablishmentForm(page, establishment);
    await expect(page).toHaveURL(/\/dashboard/);

    const rawEstData = await page.evaluate(() => localStorage.getItem('establishment_data'));
    expect(rawEstData).toBeTruthy();
    const estData = JSON.parse(rawEstData!);
    expect(estData.name).toBeTruthy();
  });

  // ── Guard real ────────────────────────────────────────────────────────────

  test('debe redirigir a register-establishment cuando el usuario registrado intenta acceder a /dashboard sin establecimiento', async ({
    page,
  }) => {
    const user = buildUniqueUser();

    // Registro exitoso: queda en /auth/register-establishment, sin establecimiento
    await submitRegisterForm(page, user, { goto: true });
    await expect(page).toHaveURL(/\/auth\/register-establishment/);

    // Intenta acceder directamente a /dashboard (recarga — authGuard + establishmentGuard)
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/auth\/register-establishment/);
  });
});
