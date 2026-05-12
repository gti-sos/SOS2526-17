import { test, expect } from '@playwright/test';

const URL_BASE = 'http://localhost:3000';

test('Indice y subintegraciones de renewable-energy-consumptions', async ({ page }) => {
	test.setTimeout(90000);

	await page.goto(`${URL_BASE}/integrations`, { waitUntil: 'networkidle' });

	await expect(page.getByRole('heading', { name: 'Integraciones del grupo' })).toBeVisible();
	await expect(page.getByRole('link', { name: /Integraciones de Pablo Gamero García/i })).toBeVisible();

	await page.getByRole('link', { name: /Integraciones de Pablo Gamero García/i }).click();
	await expect(page).toHaveURL(`${URL_BASE}/integrations/renewable-energy-consumptions`);

	await expect(
		page.getByRole('heading', { name: 'Integraciones de Pablo Gamero García' })
	).toBeVisible();

	await page.getByRole('link', { name: /Cholera Stats/i }).click();
	await expect(page).toHaveURL(
		`${URL_BASE}/integrations/renewable-energy-consumptions/cholera-stats`
	);
	await expect(page.locator('.ranking-list')).toBeVisible();

	await page.goto(`${URL_BASE}/integrations/renewable-energy-consumptions`, {
		waitUntil: 'networkidle'
	});
	await page.getByRole('link', { name: /Pandemics/i }).click();
	await expect(page).toHaveURL(
		`${URL_BASE}/integrations/renewable-energy-consumptions/pandemics`
	);
	await expect(page.locator('.chart-wrap')).toBeVisible();

	await page.goto(`${URL_BASE}/integrations/renewable-energy-consumptions`, {
		waitUntil: 'networkidle'
	});
	await page.getByRole('link', { name: /Global EV Charging Infrastructures/i }).click();
	await expect(page).toHaveURL(
		`${URL_BASE}/integrations/renewable-energy-consumptions/global-ev-charging-infrastructures`
	);
	await expect(page.locator('.chart-wrap')).toBeVisible();
});
