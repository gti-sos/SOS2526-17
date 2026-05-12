<script>
	// @ts-nocheck
	import { onMount, tick } from 'svelte';

	const BACK_URL = '/integrations/renewable-energy-consumptions';
	const MY_API_URL =
		'https://renewable-energy-consumptions-api.cloudflare-kpgod.workers.dev/api/v1/renewable-energy-consumptions';
	const EV_API_URL = 'https://sos2526-16-production.up.railway.app/api/v1/global-ev-charging-infrastructures';
	const matchedColumns = [
		{ key: 'country', label: 'country' },
		{ key: 'code', label: 'code' },
		{ key: 'renewableYear', label: 'renewable_year' },
		{ key: 'renewableTotal', label: 'renewable_total' },
		{ key: 'evYear', label: 'ev_year' },
		{ key: 'chargingPoint', label: 'charging_point' },
		{ key: 'totalPower', label: 'total_power_kw' }
	];
	const rankingColumns = [
		{ key: 'rank', label: 'top' },
		{ key: 'renewableCountry', label: 'renewable_country' },
		{ key: 'renewableYear', label: 'renewable_year' },
		{ key: 'renewableTotal', label: 'renewable_total' },
		{ key: 'evCountry', label: 'ev_country' },
		{ key: 'evYear', label: 'ev_year' },
		{ key: 'chargingPoint', label: 'charging_point' }
	];
	const COUNTRY_ALIASES = {
		'czech republic': 'czechia',
		'cape verde': 'cabo verde',
		'ivory coast': "cote d ivoire",
		'russian federation': 'russia',
		'turkiye': 'turkey',
		'turkey': 'turkey',
		'palestinian territories': 'palestine',
		'iran': 'iran islamic republic of',
		'venezuela': 'venezuela bolivarian republic of',
		'syria': 'syrian arab republic',
		'moldova': 'moldova republic of',
		'bolivia': 'bolivia plurinational state of',
		'tanzania': 'tanzania united republic of'
	};

	let chartHost = $state();
	let chartInstance = null;
	let chartReady = $state(false);
	let loading = $state(true);
	let error = $state('');
	let fetchedAt = $state('-');
	let chartConfig = $state(null);
	let chartMode = $state('matched');
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

	function normalizeCountry(value) {
		const normalized = String(value || '')
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]+/g, ' ')
			.trim();
		const aliased = COUNTRY_ALIASES[normalized] || normalized;
		return String(aliased)
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]+/g, ' ')
			.trim();
	}

	function isIso3Code(value) {
		return /^[A-Z]{3}$/.test(String(value || '').toUpperCase());
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

		const hcModule = await import('highcharts');
		const Highcharts = hcModule.default || hcModule;
		const hcmModule = await import('highcharts/highcharts-more');
		const HighchartsMore = hcmModule.default || hcmModule;
		const finalizeMore =
			typeof HighchartsMore === 'function' ? HighchartsMore : HighchartsMore?.default;

		if (typeof finalizeMore === 'function') {
			finalizeMore(Highcharts);
		}

		chartInstance = Highcharts.chart(chartHost, config);
		chartReady = true;
	}

	function latestRenewableByCountry(payload) {
		const map = new Map();

		for (const item of Array.isArray(payload) ? payload : []) {
			if (!isIso3Code(item.code)) continue;

			const normalized = normalizeCountry(item.country);
			const candidate = {
				country: item.country || '-',
				code: String(item.code || '').toUpperCase(),
				renewableYear: numberValue(item.year),
				renewableTotal:
					numberValue(item.wind) +
					numberValue(item.hydro) +
					numberValue(item.solar) +
					numberValue(item.other)
			};

			if (!map.has(normalized) || candidate.renewableYear > map.get(normalized).renewableYear) {
				map.set(normalized, candidate);
			}
		}

		return map;
	}

	function buildMatchedRows(renewableMap, evPayload) {
		return (Array.isArray(evPayload) ? evPayload : [])
			.map((item) => {
				const renewable = renewableMap.get(normalizeCountry(item.country));
				if (!renewable) return null;

				return {
					country: renewable.country,
					code: renewable.code,
					renewableYear: renewable.renewableYear,
					renewableTotal: Number(renewable.renewableTotal.toFixed(3)),
					evYear: numberValue(item.year),
					chargingPoint: numberValue(item.charging_point),
					totalPower: numberValue(item.total_power_kw)
				};
			})
			.filter(Boolean)
			.sort((a, b) => b.chargingPoint - a.chargingPoint);
	}

	function buildRankingRows(renewableMap, evPayload) {
		const renewableRows = Array.from(renewableMap.values())
			.sort((a, b) => b.renewableTotal - a.renewableTotal)
			.slice(0, 6);
		const evRows = (Array.isArray(evPayload) ? evPayload : [])
			.map((item) => ({
				evCountry: item.country || '-',
				evYear: numberValue(item.year),
				chargingPoint: numberValue(item.charging_point),
				totalPower: numberValue(item.total_power_kw)
			}))
			.sort((a, b) => b.chargingPoint - a.chargingPoint)
			.slice(0, 6);

		return Array.from({ length: Math.max(renewableRows.length, evRows.length) }, (_, index) => ({
			rank: index + 1,
			renewableCountry: renewableRows[index]?.country || '-',
			renewableYear: renewableRows[index]?.renewableYear ?? '-',
			renewableTotal: renewableRows[index]
				? Number(renewableRows[index].renewableTotal.toFixed(3))
				: 0,
			evCountry: evRows[index]?.evCountry || '-',
			evYear: evRows[index]?.evYear ?? '-',
			chargingPoint: evRows[index]?.chargingPoint ?? 0,
			totalPower: evRows[index]?.totalPower ?? 0
		}));
	}

	function buildMatchedChartConfig(chartRows) {
		return {
			chart: { type: 'bubble', backgroundColor: '#fffdf9', zooming: { type: 'xy' } },
			title: { text: 'Renovables frente a infraestructura EV' },
			subtitle: { text: 'Cruce directo por país cuando ambas APIs comparten registro.' },
			xAxis: { title: { text: 'Total renovable de mi API' } },
			yAxis: { title: { text: 'Charging points' } },
			legend: { enabled: false },
			credits: { enabled: false },
			plotOptions: {
				bubble: {
					minSize: 12,
					maxSize: 42
				}
			},
			tooltip: {
				useHTML: true,
				pointFormat:
					'<b>{point.name}</b><br/>Mi API: {point.x}<br/>Charging points: {point.y}<br/>Potencia total: {point.z}'
			},
			series: [
				{
					name: 'Cruce por país',
					data: chartRows.map((row) => ({
						name: `${row.country} (${row.renewableYear}/${row.evYear})`,
						x: row.renewableTotal,
						y: row.chargingPoint,
						z: row.totalPower
					})),
					color: '#3f6b43'
				}
			]
		};
	}

	function buildRankingChartConfig(chartRows) {
		return {
			chart: { backgroundColor: '#fffdf9' },
			title: { text: 'Comparativa conjunta de rankings' },
			subtitle: {
				text: 'No hay países coincidentes, así que se comparan los tops de ambas APIs en una misma vista.'
			},
			xAxis: { categories: chartRows.map((row) => `Top ${row.rank}`) },
			yAxis: [
				{
					title: { text: 'Total renovable' },
					labels: { style: { color: '#3f6b43' } }
				},
				{
					title: { text: 'Charging points' },
					labels: { style: { color: '#ad6c31' } },
					opposite: true
				}
			],
			legend: { align: 'center', verticalAlign: 'bottom' },
			credits: { enabled: false },
			series: [
				{
					type: 'column',
					name: 'Mi API',
					data: chartRows.map((row) => row.renewableTotal),
					color: '#3f6b43',
					tooltip: { valueSuffix: ' total renovable' }
				},
				{
					type: 'spline',
					name: 'Global EV Charging Infrastructures',
					data: chartRows.map((row) => row.chargingPoint),
					color: '#ad6c31',
					yAxis: 1,
					tooltip: { valueSuffix: ' charging points' }
				}
			]
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
			const [myResponse, evResponse] = await Promise.all([
				fetch(withCacheBust(MY_API_URL)),
				fetch(withCacheBust(EV_API_URL))
			]);

			if (!myResponse.ok) throw new Error(`Mi API HTTP ${myResponse.status}`);
			if (!evResponse.ok) throw new Error(`EV API HTTP ${evResponse.status}`);

			const renewableMap = latestRenewableByCountry(await myResponse.json());
			const evPayload = await evResponse.json();
			const matchedRows = buildMatchedRows(renewableMap, evPayload);

			if (matchedRows.length > 0) {
				chartMode = 'matched';
				rows = matchedRows;
				note = 'La vista muestra países presentes en ambas APIs.';
				chartConfig = buildMatchedChartConfig(matchedRows);
			} else {
				chartMode = 'ranking';
				rows = buildRankingRows(renewableMap, evPayload);
				note =
					'No hay coincidencias directas por país con los datos actuales, así que la gráfica compara los rankings principales de ambas APIs.';
				chartConfig = buildRankingChartConfig(rows);
			}

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
			<h1>Mi API + Global EV Charging Infrastructures</h1>
			<p>Gráfica conjunta entre el total renovable registrado en mi API y la infraestructura EV.</p>
		</div>
		<div class="meta-grid">
			<div><span>Origen</span><strong>Mi API + SOS externo directo</strong></div>
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
							{#each chartMode === 'matched' ? matchedColumns : rankingColumns as column}
								<th>{column.label}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each rows as row, index (`row-${index}`)}
							<tr>
								{#each chartMode === 'matched' ? matchedColumns : rankingColumns as column}
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
		min-height: 420px;
		border: 1px solid #e0d9cf;
		background: white;
		margin-bottom: 22px;
	}

	.chart-wrap.ready {
		padding: 10px;
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
