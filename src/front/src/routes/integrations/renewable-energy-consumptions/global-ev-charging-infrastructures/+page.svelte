<script>
	// @ts-nocheck
	import { onMount, tick } from 'svelte';

	const BACK_URL = '/integrations/renewable-energy-consumptions';
	const API_URL =
		'https://sos2526-16-production.up.railway.app/api/v1/global-ev-charging-infrastructures?limit=20';
	const tableColumns = [
		{ key: 'country', label: 'country' },
		{ key: 'year', label: 'year' },
		{ key: 'chargingPoint', label: 'charging_point' },
		{ key: 'totalPower', label: 'total_power_kw' }
	];

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
			return window.history.back();
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

		const module = await import('highcharts');
		const Highcharts = module.default || module;
		chartInstance = Highcharts.chart(chartHost, config);
		chartReady = true;
	}

	function buildRows(payload) {
		return (Array.isArray(payload) ? payload : [])
			.sort((a, b) => numberValue(b.charging_point) - numberValue(a.charging_point))
			.slice(0, 10)
			.map((row) => ({
				country: row.country,
				year: row.year,
				chargingPoint: numberValue(row.charging_point),
				totalPower: numberValue(row.total_power_kw)
			}));
	}

	function buildChartConfig(chartRows) {
		return {
			chart: { type: 'scatter', backgroundColor: '#fffdf9', zooming: { type: 'xy' } },
			title: { text: 'Puntos de carga frente a potencia total' },
			xAxis: { title: { text: 'Charging points' } },
			yAxis: { title: { text: 'Total power kW' } },
			legend: { enabled: false },
			credits: { enabled: false },
			tooltip: {
				useHTML: true,
				pointFormat:
					'<b>{point.name}</b><br/>Puntos de carga: {point.x}<br/>Potencia total: {point.y}'
			},
			series: [
				{
					name: 'Infraestructura EV',
					data: chartRows.map((row) => ({
						name: `${row.country} ${row.year}`,
						x: row.chargingPoint,
						y: row.totalPower
					})),
					color: '#3f6b43'
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
			const response = await fetch(withCacheBust(API_URL));
			if (!response.ok) throw new Error(`HTTP ${response.status}`);

			rows = buildRows(await response.json());
			if (rows.length > 0) {
				chartConfig = buildChartConfig(rows);
				await tick();
			}

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
			<h1>Global EV Charging Infrastructures</h1>
			<p>Relación entre puntos de carga y potencia total en la infraestructura EV.</p>
		</div>
		<div class="meta-grid">
			<div><span>Origen</span><strong>SOS externo directo</strong></div>
			<div><span>Última carga</span><strong>{fetchedAt}</strong></div>
		</div>
	</header>

	<div class="nav-links">
		<button type="button" class="back-link" onclick={goBack}>Atrás</button>
	</div>

	<section class="content">
		<div class="toolbar">
			<h2>Vista</h2>
			<button type="button" onclick={loadData}>Recargar</button>
		</div>

		{#if loading}
			<p class="status">Cargando datos...</p>
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
		{:else}
			<p class="status">No hay datos de infraestructura EV para comparar.</p>
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
		border-color: #cfc4b5;
	}

	.back-link:hover {
		background: #f0eadf;
	}

	.status,
	.error {
		padding: 14px;
		border: 1px solid #ddd4c9;
		background: #faf7f1;
	}

	.error {
		color: #7f2f22;
		background: #fdf2ef;
		border-color: #ebc7c0;
	}

	.chart-wrap {
		min-height: 460px;
	}

	.chart-wrap.ready {
		min-height: 0;
	}

	.table-wrap {
		overflow-x: auto;
		margin-top: 18px;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.94rem;
	}

	th,
	td {
		padding: 12px 10px;
		border-bottom: 1px solid #e1dad0;
		text-align: left;
	}

	th {
		background: #f3ede3;
		font-weight: 600;
	}

	@media (max-width: 760px) {
		.meta-grid {
			grid-template-columns: 1fr;
		}

		.toolbar {
			display: block;
		}

		.toolbar button {
			margin-top: 10px;
		}
	}
</style>
