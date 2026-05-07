import { test, expect } from '@playwright/test';

//const URL_BASE = 'http://localhost:5173/agriculture-land'; 
const URL_BASE = 'http://localhost:3000/agriculture-land'; 
test.describe('Agriculture Land E2E Tests', () => {

    test.beforeEach(async ({ page }) => {
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
        
        
        const inputEditable = page.locator('input:not([readonly])').first();
        
        await expect(inputEditable).not.toHaveValue('', { timeout: 10000 });
        // ------------------------------------------------
        
        // 4. 
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
  test('should delete a specific resource', async ({ page }) => {
        // 1. Aseguramos 
        await page.click('.btn-load');
        // Esperamos 
        await page.waitForSelector('table tbody tr:not(.empty)', { timeout: 10000 });
        
        // 2. Contamos 
        const initialRows = await page.locator('table tbody tr:not(.empty)').count();
        
        // 3. IMPORTANTE
        page.on('dialog', dialog => dialog.accept());
        
        // 4. Hacemos
        await page.click('.btn-del >> nth=0');
        
        // 5. Esperamos
        await expect(page.locator('.alert.success')).toBeVisible({ timeout: 10000 });
        
        // 6. 
        await page.waitForFunction((expected) => {
            const currentRows = document.querySelectorAll('table tbody tr:not(.empty)').length;
            return currentRows < expected;
        }, initialRows, { timeout: 20000 });

        // 7. Verificación
        const finalRows = await page.locator('table tbody tr:not(.empty)').count();
        expect(finalRows).toBeLessThan(initialRows);
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
