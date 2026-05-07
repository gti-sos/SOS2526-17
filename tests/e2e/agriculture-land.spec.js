import { test, expect } from '@playwright/test';

//const URL_BASE = 'http://localhost:5173/agriculture-land'; 
const URL_BASE = 'http://localhost:3000/agriculture-land'; 
test.describe('Agriculture Land E2E Tests', () => {

    test.beforeEach(async ({ page, request }) => {
        const resetResponse = await request.get('http://localhost:3000/api/v1/agriculture-land/loadInitialData');
        expect(resetResponse.status()).toBe(201);
        await page.goto(URL_BASE, { waitUntil: 'networkidle' });
    });

    test('should load initial data and then delete all', async ({ page }) => {
        await page.click('.btn-load');
        await expect(page.locator('.alert.success')).toBeVisible({ timeout: 10000 });
        
        page.on('dialog', dialog => dialog.accept()); 
        await page.click('.btn-danger');
        await expect(page.locator('.empty')).toBeVisible({ timeout: 10000 });
    });

    test('should search resources using filters (Argentina Case)', async ({ page }) => {
       
        await page.click('.btn-load');
      
        await page.waitForSelector('table tbody tr:not(.empty)');

        // 2. Buscamos el input de país usando tu placeholder exacto
        const searchInput = page.locator('input[placeholder="País (ej: Spain)"]');
        await searchInput.fill('argentina'); 
        
      
        await Promise.all([
            page.waitForResponse(resp => resp.url().includes('agriculture-land') && resp.status() === 200),
            page.click('.btn-search')
        ]);

      
        const firstRow = page.locator('table tbody tr').first();
        await expect(firstRow).toContainText(/argentina/i, { timeout: 10000 });
    });

    test('should create a new agriculture resource', async ({ page }) => {
        await page.locator('aside input').nth(0).fill('Testland');
        await page.locator('aside input').nth(1).fill('2026');
        await page.locator('aside input').nth(2).fill('TLD');
        await page.locator('aside input').nth(3).fill('45.5');
        await page.click('.btn-add');
        await expect(page.locator('.alert.success')).toBeVisible();
        await expect(page.locator('table tbody')).toContainText('Testland');
    });

 test('should navigate to edit view and update', async ({ page }) => {
        // 1. Cargar datos y esperar a que aparezca el botón
        await page.click('.btn-load');
        await page.waitForSelector('.btn-edit', { state: 'visible', timeout: 10000 });
        
        // 2. Click en el primero
        await page.click('.btn-edit >> nth=0');
        
        // 3. Esperar a que la URL sea la de la vista de edición
        await page.waitForURL(/\/agriculture-land\/.+\/\d+/, { timeout: 10000 });
        
        
        // Esperamos a que el formulario haya cargado datos del recurso (campo readonly)
        const countryReadonlyInput = page.locator('input[readonly]').first();
        await expect(countryReadonlyInput).not.toHaveValue('', { timeout: 10000 });

        // 4.
        const inputEditable = page.locator('input[placeholder="Ej: ESP"]');
        await expect(inputEditable).toBeVisible({ timeout: 10000 });
        await inputEditable.click();
        await inputEditable.fill('VALOR-EDITADO-OK'); 
        
        // 5. Actualizar
        await page.click('.btn-update'); 
        
        // 6. Verificamos éxito
        await expect(page.locator('.alert.success')).toBeVisible({ timeout: 10000 });
        
        // 7. Volver y comprobar que el cambio persiste en la tabla
        await page.waitForURL(/\/agriculture-land$/, { timeout: 10000 });
        await expect(page.locator('table')).toContainText('VALOR-EDITADO-OK');
    });
  test('should delete a specific resource', async ({ page, request }) => {
        const toDelete = {
            country: 'e2e-delete-target',
            year: 2099,
            country_code: 'DEL',
            land_agriculture: 44.4,
            types_land: 1,
            index: 9
        };

        const createRes = await request.post('http://localhost:3000/api/v1/agriculture-land', { data: toDelete });
        expect(createRes.status()).toBe(201);

        await page.reload({ waitUntil: 'networkidle' });

        const searchInput = page.locator('input[placeholder="País (ej: Spain)"]');
        await searchInput.fill(toDelete.country);
        await page.click('.btn-search');

        const targetRow = page.locator('table tbody tr', { hasText: toDelete.country }).first();
        await expect(targetRow).toBeVisible({ timeout: 10000 });

        page.once('dialog', dialog => dialog.accept());
        await targetRow.locator('.btn-del').click();
        await expect(page.locator('table tbody tr', { hasText: toDelete.country })).toHaveCount(0, { timeout: 10000 });

        await searchInput.fill(toDelete.country);
        await page.click('.btn-search');
        await expect(page.locator('table tbody tr', { hasText: toDelete.country })).toHaveCount(0, { timeout: 10000 });
    });

    test('should list all resources correctly after loading', async ({ page }) => {
        // 1. Cargamos 
        await page.click('.btn-load');
        
        // 2. Comprobamos
        await expect(page.locator('.alert.success')).toBeVisible();

        // 3. Verificamos
        const rows = page.locator('table tbody tr:not(.empty)');
        await expect(rows).toHaveCount(await rows.count()); 
        expect(await rows.count()).toBeGreaterThan(0);

        // 4. Comprobamos 
        await expect(page.locator('table thead')).toContainText('País');
        await expect(page.locator('table thead')).toContainText('Año');
    });
});
