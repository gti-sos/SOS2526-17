<script>
	// @ts-nocheck
	import { onMount, tick } from 'svelte';
	import bb, { scatter } from 'billboard.js';
	import 'billboard.js/dist/billboard.css';

	const BACK_URL = '/integrations/renewable-energy-consumptions';
	const MY_API_URL =
		'https://renewable-energy-consumptions-api.cloudflare-kpgod.workers.dev/api/v1/renewable-energy-consumptions';
	const WATER_API_URL = '/api/v1/integrations-proxy/drinking-water-services?limit=200';
	const exactColumns = [
		{ key: 'country', label: 'country' },
		{ key: 'code', label: 'code' },
		{ key: 'year', label: 'year' },
		{ key: 'renewableTotal', label: 'renewable_total' },
		{ key: 'waterCoverage', label: 'water_coverage' }
	];
	const fallbackColumns = [
		{ key: 'country', label: 'country' },
		{ key: 'code', label: 'code' },
		{ key: 'renewableYear', label: 'renewable_year' },
		{ key: 'waterYear', label: 'water_year' },
		{ key: 'renewableTotal', label: 'renewable_total' },
		{ key: 'waterCoverage', label: 'water_coverage' }
	];

	let chartHost = $state();
	let chartInstance = null;
	let chartReady = $state(false);
	let loading = $state(true);
	let error = $state('');
	let fetchedAt = $state('-');
	let chartConfig = $state(null);
	let chartMode = $state('exact');
	let rows = $state([]);
	let note = $state('');

	function goBack() {
		if (window.history.length > 1) {
			window.history.back();
			return;
		}

		window.location.href = BACK_URL;
	}

	function numberValue(value) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}

	function withCacheBust(url) {
		const separator = url.includes('?') ? '&' : '?';
		return `${url}${separator}t=${Date.now()}`;
	}

	function isIso3Code(value) {
		return /^[A-Z]{3}$/.test(String(value || '').toUpperCase());
	}

	async function fetchRenewableRowsForCodes(codes) {
		const uniqueCodes = Array.from(new Set(codes.filter(isIso3Code)));
		const requests = uniqueCodes.map(async (code) => {
			const response = await fetch(withCacheBust(`${MY_API_URL}?code=${encodeURIComponent(code)}`));
			if (!response.ok) {
				throw new Error(`Mi API HTTP ${response.status} para ${code}`);
			}

			const payload = await response.json();
			return Array.isArray(payload) ? payload : [];
		});

		const settled = await Promise.allSettled(requests);
		return settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
	}

	function destroyChart() {
		if (chartInstance) {
			chartInstance.destroy();
			chartInstance = null;
		}

		chartReady = false;
	}

	function resetView() {
		error = '';
		rows = [];
		note = '';
		chartConfig = null;
		destroyChart();
	}

	async function renderChart(config) {
		destroyChart();
		if (!chartHost || !config) return;

		chartInstance = bb.generate({
			...config,
			bindto: chartHost
		});
		chartReady = true;
	}

	function buildRenewableIndexes(payload) {
		const exactMap = new Map();
		const latestByCode = new Map();

		for (const item of Array.isArray(payload) ? payload : []) {
			const code = String(item.code || '').toUpperCase();
			if (!isIso3Code(code)) continue;

			const row = {
				country: item.country || '-',
				code,
				year: numberValue(item.year),
				renewableTotal:
					numberValue(item.wind) +
					numberValue(item.hydro) +
					numberValue(item.solar) +
					numberValue(item.other)
			};

			exactMap.set(`${code}|${row.year}`, row);

			if (!latestByCode.has(code) || row.year > latestByCode.get(code).year) {
				latestByCode.set(code, row);
			}
		}

		return { exactMap, latestByCode };
	}

	function buildWaterIndexes(payload) {
		const exactRows = [];
		const latestByCode = new Map();

		for (const item of Array.isArray(payload) ? payload : []) {
			const code = String(item.code || '').toUpperCase();
			const year = numberValue(item.year);
			if (!isIso3Code(code) || year <= 0) continue;

			const row = {
				country: item.entity || code,
				code,
				year,
				waterCoverage: numberValue(item.wat_bas_pop_residence_urban)
			};

			exactRows.push(row);

			if (!latestByCode.has(code) || row.year > latestByCode.get(code).year) {
				latestByCode.set(code, row);
			}
		}

		return { exactRows, latestByCode };
	}

	function buildExactRows(renewableExactMap, waterRows) {
		return waterRows
			.map((water) => {
				const renewable = renewableExactMap.get(`${water.code}|${water.year}`);
				if (!renewable) return null;

				return {
					country: renewable.country,
					code: renewable.code,
					year: renewable.year,
					renewableTotal: Number(renewable.renewableTotal.toFixed(3)),
					waterCoverage: Number(water.waterCoverage.toFixed(2))
				};
			})
			.filter(Boolean)
			.sort((a, b) => b.waterCoverage - a.waterCoverage);
	}

	function buildFallbackRows(renewableLatestByCode, waterLatestByCode) {
		return Array.from(waterLatestByCode.values())
			.map((water) => {
				const renewable = renewableLatestByCode.get(water.code);
				if (!renewable) return null;

				return {
					country: renewable.country,
					code: renewable.code,
					renewableYear: renewable.year,
					waterYear: water.year,
					renewableTotal: Number(renewable.renewableTotal.toFixed(3)),
					waterCoverage: Number(water.waterCoverage.toFixed(2))
				};
			})
			.filter(Boolean)
			.sort((a, b) => b.waterCoverage - a.waterCoverage);
	}

	function buildChartConfig(chartRows, mode) {
		return {
			data: {
				xs: {
					'Mi API + Drinking Water Services': 'renewable_total'
				},
				columns: [
					['renewable_total', ...chartRows.map((row) => row.renewableTotal)],
					['Mi API + Drinking Water Services', ...chartRows.map((row) => row.waterCoverage)]
				],
				type: scatter(),
				colors: {
					'Mi API + Drinking Water Services': '#356859'
				}
			},
			axis: {
				x: {
					label: 'Total renovable de mi API'
				},
				y: {
					label: 'Cobertura urbana de agua'
				}
			},
			point: {
				r: 5
			},
			legend: {
				show: false
			},
			tooltip: {
				format: {
					title(index) {
						const row = chartRows[index];
						return row ? `${row.country} (${row.code})` : '';
					},
					name() {
						return mode === 'exact' ? 'Año' : 'Años';
					},
					value(value, ratio, id, index) {
						const row = chartRows[index];
						if (!row) return value;
						const years = mode === 'exact' ? `${row.year}` : `${row.renewableYear}/${row.waterYear}`;
						return `${value} | ${years}`;
					}
				}
			},
			title: {
				text: 'Renovables frente a cobertura urbana de agua'
			},
			padding: {
				right: 24
			}
		};
	}

	$effect(() => {
		if (!chartHost || !chartConfig) return;
		void renderChart(chartConfig);
	});

	async function loadData() {
		loading = true;
		resetView();

		try {
			const waterResponse = await fetch(withCacheBust(WATER_API_URL));
			if (!waterResponse.ok) throw new Error(`Water API HTTP ${waterResponse.status}`);

			const waterIndexes = buildWaterIndexes(await waterResponse.json());
			const renewablePayload = await fetchRenewableRowsForCodes(Array.from(waterIndexes.latestByCode.keys()));
			if (renewablePayload.length === 0) {
				throw new Error('No se pudieron recuperar países coincidentes desde mi API.');
			}

			const renewableIndexes = buildRenewableIndexes(renewablePayload);
			const exactRows = buildExactRows(renewableIndexes.exactMap, waterIndexes.exactRows);

			if (exactRows.length > 0) {
				chartMode = 'exact';
				rows = exactRows;
				note = 'La vista usa coincidencias exactas por código y año.';
			} else {
				chartMode = 'fallback';
				rows = buildFallbackRows(renewableIndexes.latestByCode, waterIndexes.latestByCode);
				note =
					'No hubo coincidencias exactas por año; la vista usa el último dato disponible por código.';
			}

			if (rows.length === 0) {
				throw new Error('No se encontraron coincidencias utilizables con Drinking Water Services.');
			}

			chartConfig = buildChartConfig(rows, chartMode);
			await tick();
			fetchedAt = new Date().toLocaleTimeString('es-ES');
		} catch (err) {
			error = String(err?.message || err);
		} finally {
			loading = false;
		}
	}

	onMount(loadData);
</script>

<main class="page">
	<header class="header">
		<div>
			<h1>Mi API + Drinking Water Services</h1>
			<p>Gráfica conjunta SOS entre renovables y cobertura urbana de agua.</p>
		</div>
		<div class="meta-grid">
			<div><span>Origen</span><strong>Mi API + SOS externo con proxy propio</strong></div>
			<div><span>Última carga</span><strong>{fetchedAt}</strong></div>
		</div>
	</header>

	<div class="nav-links">
		<button type="button" class="back-link" onclick={goBack}>Atrás</button>
	</div>

	<section class="content">
		<div class="toolbar">
			<h2>Vista conjunta</h2>
			<button type="button" onclick={loadData}>Recargar</button>
		</div>

		{#if loading}
			<p class="status">Cargando datos cruzados...</p>
		{:else if error}
			<p class="error">Error al cargar la integración: {error}</p>
		{:else}
			<p class="note">{note}</p>

			{#if chartConfig}
				<div class:ready={chartReady} class="chart-wrap" bind:this={chartHost}></div>
			{/if}

			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							{#each chartMode === 'exact' ? exactColumns : fallbackColumns as column}
								<th>{column.label}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each rows as row, index (`row-${index}`)}
							<tr>
								{#each chartMode === 'exact' ? exactColumns : fallbackColumns as column}
									<td>{row[column.key]}</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</main>

<style>
	.page {
		max-width: 1100px;
		margin: 0 auto;
		padding: 32px 20px 64px;
	}

	.header,
	.content {
		background: #fffdf9;
		border: 1px solid #d8d0c4;
		padding: 26px;
	}

	h1,
	h2 {
		margin: 0 0 12px;
		font-size: 1.85rem;
		font-weight: 600;
	}

	p {
		margin: 0;
		line-height: 1.6;
	}

	.meta-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 14px;
		margin-top: 18px;
	}

	.meta-grid div {
		border-top: 1px solid #ddd4c9;
		padding-top: 10px;
	}

	.meta-grid span,
	.meta-grid strong {
		display: block;
	}

	.meta-grid span {
		color: #5a5148;
		margin-bottom: 4px;
	}

	.nav-links {
		margin: 16px 0;
	}

	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		margin-bottom: 18px;
	}

	button {
		background: #4f5d39;
		color: white;
		border: 1px solid #4f5d39;
		padding: 10px 14px;
		border-radius: 6px;
		font: inherit;
		cursor: pointer;
	}

	button:hover {
		background: #424f30;
	}

	.back-link {
		background: #fffdf9;
		color: #24201b;
	}

	.chart-wrap {
		height: 420px;
		border: 1px solid #e0d9cf;
		background: white;
		margin-bottom: 22px;
		position: relative;
	}

	.chart-wrap.ready {
		padding: 10px;
	}

	.chart-wrap canvas {
		display: block;
	}

	.note {
		margin-bottom: 16px;
		padding: 12px 14px;
		background: #f2f6ec;
		border-left: 4px solid #6e8f54;
	}

	.status,
	.error {
		padding: 22px;
		border: 1px solid #ddd5ca;
		background: white;
	}

	.error {
		color: #8f2929;
	}

	.table-wrap {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background: white;
	}

	th,
	td {
		padding: 10px 12px;
		border-bottom: 1px solid #ece5da;
		text-align: left;
	}

	th {
		background: #f5efe6;
	}
</style>
