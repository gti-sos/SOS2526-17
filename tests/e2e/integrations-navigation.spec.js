import { test, expect } from '@playwright/test';

const URL_BASE = 'http://localhost:3000';

test('Indice y subintegraciones de renewable-energy-consumptions', async ({ page }) => {
	test.setTimeout(90000);

	await page.route('https://soporte-sos.onrender.com/api/v1/cholera-stats?*', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify([
				{ country: 'Kenya', year: 2022, reportedCases: 1200, fatalityRate: 1.8 },
				{ country: 'Uganda', year: 2021, reportedCases: 950, fatalityRate: 1.2 }
			])
		});
	});

	await page.route('https://sos2526-10.onrender.com/api/v2/pandemics?*', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify([
				{
					entity: 'Spain',
					year: 2020,
					cholera: 10,
					malaria: 20,
					hiv_aids: 30,
					tuberculosis: 40,
					rabies: 5
				},
				{
					entity: 'Portugal',
					year: 2021,
					cholera: 5,
					malaria: 15,
					hiv_aids: 25,
					tuberculosis: 35,
					rabies: 2
				}
			])
		});
	});

	await page.route(
		'https://sos2526-16-production.up.railway.app/api/v1/global-ev-charging-infrastructures?*',
		async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([
					{ country: 'Spain', year: 2023, charging_point: 1200, total_power_kw: 5400 },
					{ country: 'Portugal', year: 2023, charging_point: 800, total_power_kw: 3200 }
				])
			});
		}
	);

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
