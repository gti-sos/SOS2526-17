<script>
	// @ts-nocheck
	import { onMount, tick } from 'svelte';

	const BACK_URL = '/integrations/renewable-energy-consumptions';
	const MY_API_URL =
		'https://renewable-energy-consumptions-api.cloudflare-kpgod.workers.dev/api/v1/renewable-energy-consumptions';
	const REST_COUNTRIES_URL =
		'https://restcountries.com/v3.1/all?fields=name,cca2,cca3,population,area,region';
	const tableColumns = [
		{ key: 'country', label: 'country' },
		{ key: 'code', label: 'code' },
		{ key: 'region', label: 'region' },
		{ key: 'renewableYear', label: 'renewable_year' },
		{ key: 'renewableTotal', label: 'renewable_total' },
		{ key: 'population', label: 'population' },
		{ key: 'area', label: 'area' }
	];
	const NAME_LOOKUP_LIMIT = 24;
	const COUNTRY_ALIASES = {
		'czech republic': 'czechia',
		'cape verde': 'cabo verde',
		'ivory coast': "cote d ivoire",
		'cote d ivoire': "cote d'ivoire",
		'south korea': 'korea',
		'north korea': "korea democratic people's republic of",
		'russian federation': 'russia',
		'turkiye': 'turkey',
		'turkey': 'turkey',
		'lao pdr': "lao people's democratic republic",
		'palestinian territories': 'palestine',
		'iran': 'iran islamic republic of',
		'venezuela': 'venezuela bolivarian republic of',
		'syria': 'syrian arab republic',
		'micronesia': 'micronesia federated states of',
		'moldova': 'moldova republic of',
		'bolivia': 'bolivia plurinational state of',
		'tanzania': 'tanzania united republic of',
		'brunei': 'brunei darussalam'
	};

	let chartHost = $state();
	let chartInstance = null;
	let chartReady = $state(false);
	let loading = $state(true);
	let error = $state('');
	let fetchedAt = $state('-');
	let rows = $state([]);
	let chartConfig = $state(null);

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

	function buildCountryIndexes(payload) {
		const byCode = new Map();
		const byName = new Map();

		for (const item of Array.isArray(payload) ? payload : []) {
			const code = String(item.cca3 || '').toUpperCase();
			const names = [item.name?.common, item.name?.official]
				.map((name) => normalizeCountry(name))
				.filter(Boolean);

			if (isIso3Code(code)) {
				byCode.set(code, item);
			}

			for (const name of names) {
				if (!byName.has(name)) byName.set(name, item);
			}
		}

		return { byCode, byName };
	}

	function latestRenewableCountries(payload) {
		const byCode = new Map();

		for (const item of Array.isArray(payload) ? payload : []) {
			const code = String(item.code || '').toUpperCase();
			if (!isIso3Code(code)) continue;

			const candidate = {
				country: item.country || '-',
				code,
				renewableYear: numberValue(item.year),
				renewableTotal:
					numberValue(item.wind) +
					numberValue(item.hydro) +
					numberValue(item.solar) +
					numberValue(item.other)
			};

			if (!byCode.has(code) || candidate.renewableYear > byCode.get(code).renewableYear) {
				byCode.set(code, candidate);
			}
		}

		return Array.from(byCode.values()).sort((a, b) => b.renewableTotal - a.renewableTotal);
	}

	function buildRow(renewable, countryData) {
		return {
			country: renewable.country,
			code: renewable.code,
			region: countryData?.region || '-',
			renewableYear: renewable.renewableYear,
			renewableTotal: Number(renewable.renewableTotal.toFixed(3)),
			population: numberValue(countryData?.population),
			area: numberValue(countryData?.area)
		};
	}

	function mergeRows(renewableCountries, countriesByCode, countriesByName) {
		const rows = [];
		const seenCodes = new Set();

		for (const renewable of renewableCountries) {
			const matchedCountry =
				countriesByCode.get(renewable.code) || countriesByName.get(normalizeCountry(renewable.country));

			if (!matchedCountry || seenCodes.has(renewable.code)) continue;

			seenCodes.add(renewable.code);
			rows.push(buildRow(renewable, matchedCountry));
		}

		return rows.sort((a, b) => b.renewableTotal - a.renewableTotal);
	}

	async function fetchCountriesByNameFallback(renewableCountries) {
		const candidates = renewableCountries.slice(0, NAME_LOOKUP_LIMIT);
		const requests = candidates.map(async (renewable) => {
			const response = await fetch(
				withCacheBust(
					`https://restcountries.com/v3.1/name/${encodeURIComponent(renewable.country)}?fields=name,cca2,cca3,population,area,region`
				)
			);
			if (!response.ok) return null;

			const payload = await response.json();
			const matchedCountry = (Array.isArray(payload) ? payload : []).find(
				(item) =>
					normalizeCountry(item.name?.common) === normalizeCountry(renewable.country) ||
					normalizeCountry(item.name?.official) === normalizeCountry(renewable.country) ||
					String(item.cca3 || '').toUpperCase() === renewable.code
			);

			return matchedCountry ? buildRow(renewable, matchedCountry) : null;
		});

		const resolved = await Promise.allSettled(requests);
		return resolved
			.map((item) => (item.status === 'fulfilled' ? item.value : null))
			.filter(Boolean)
			.sort((a, b) => b.renewableTotal - a.renewableTotal);
	}

	function buildChartConfig(chartRows) {
		return {
			chart: { type: 'bubble', backgroundColor: '#fffdf9', zooming: { type: 'xy' } },
			title: { text: 'Total renovable frente a población y superficie' },
			subtitle: { text: 'Cruce entre mi API y REST Countries por código ISO-3.' },
			xAxis: { title: { text: 'Población' } },
			yAxis: { title: { text: 'Total renovable de mi API' } },
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
					'<b>{point.name}</b><br/>Población: {point.x}<br/>Total renovable: {point.y}<br/>Superficie: {point.z}'
			},
			series: [
				{
					name: 'Mi API + REST Countries',
					data: chartRows.map((row) => ({
						name: `${row.country} (${row.region})`,
						x: row.population,
						y: row.renewableTotal,
						z: row.area
					})),
					color: '#2f5b8a'
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
			const [myResponse, countriesResponse] = await Promise.all([
				fetch(withCacheBust(MY_API_URL)),
				fetch(withCacheBust(REST_COUNTRIES_URL))
			]);

			if (!myResponse.ok) throw new Error(`Mi API HTTP ${myResponse.status}`);
			if (!countriesResponse.ok) throw new Error(`REST Countries HTTP ${countriesResponse.status}`);

			const renewableCountries = latestRenewableCountries(await myResponse.json());
			const { byCode, byName } = buildCountryIndexes(await countriesResponse.json());
			rows = mergeRows(renewableCountries, byCode, byName);

			if (rows.length === 0) {
				rows = await fetchCountriesByNameFallback(renewableCountries);
			}

			if (rows.length === 0) {
				throw new Error('REST Countries no devolvió coincidencias utilizables para esta carga.');
			}

			chartConfig = buildChartConfig(rows);
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
			<h1>Mi API + REST Countries</h1>
			<p>Gráfica conjunta entre el total renovable de mi API y la información demográfica.</p>
		</div>
		<div class="meta-grid">
			<div><span>Origen</span><strong>Mi API + API no SOS directa</strong></div>
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
		{:else if rows.length > 0}
			{#if chartConfig}
				<div class:ready={chartReady} class="chart-wrap" bind:this={chartHost}></div>
			{/if}

			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							{#each tableColumns as column}
								<th>{column.label}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each rows as row, index (`row-${index}`)}
							<tr>
								{#each tableColumns as column}
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
