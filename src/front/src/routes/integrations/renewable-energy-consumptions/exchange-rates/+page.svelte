<script>
	import { onMount, tick } from 'svelte';

	const selectedRates = ['USD', 'GBP', 'JPY', 'MAD', 'CNY', 'BRL'];
	let chartHost = $state();
	let chartInstance = null;
	let chartReady = $state(false);
	let rows = $state([]);
	let loading = $state(true);
	let error = $state('');
	let fetchedAt = $state('-');
	let chartConfig = $state(null);

	function goBack() {
		if (window.history.length > 1) return window.history.back();
		window.location.href = '/integrations/renewable-energy-consumptions';
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
		if (chartInstance) chartInstance.destroy();
		chartInstance = null;
		chartReady = false;
	}

	async function renderChart(config) {
		destroyChart();
		if (!chartHost || !config) return;
		const module = await import('highcharts');
		const Highcharts = module.default || module;
		chartInstance = Highcharts.chart(chartHost, config);
		chartReady = true;
	}

	$effect(() => {
		if (!chartHost || !chartConfig) return;
		void renderChart(chartConfig);
	});

	async function loadData() {
		loading = true;
		error = '';
		rows = [];
		chartConfig = null;
		destroyChart();

		try {
			const response = await fetch(withCacheBust('https://api.exchangerate-api.com/v4/latest/EUR'));
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const payload = await response.json();
			rows = selectedRates.map((currency) => ({
				currency,
				rate: numberValue(payload?.rates?.[currency]),
				base: payload?.base || 'EUR',
				date: payload?.date || '-'
			}));

			if (rows.length > 0) {
				chartConfig = {
					chart: { type: 'area', backgroundColor: '#fffdf9' },
					title: { text: 'Tipos de cambio respecto al euro' },
					xAxis: { categories: rows.map((row) => row.currency), title: { text: null } },
					yAxis: { min: 0, title: { text: 'Tipo de cambio' } },
					legend: { enabled: false },
					credits: { enabled: false },
					series: [{ name: 'Rate', data: rows.map((row) => row.rate), color: '#5d6f96' }]
				};
				await tick();
			}

			fetchedAt = new Date().toLocaleTimeString('es-ES');
		} catch (err) {
			rows = [];
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
			<h1>Exchange Rates</h1>
			<p>Evolución visual de una selección de tipos de cambio respecto al euro.</p>
		</div>
		<div class="meta-grid">
			<div><span>Origen</span><strong>API no SOS directa</strong></div>
			<div><span>Última carga</span><strong>{fetchedAt}</strong></div>
		</div>
	</header>
	<div class="nav-links"><button type="button" class="back-link" onclick={goBack}>Atrás</button></div>
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
							<th>currency</th>
							<th>rate</th>
							<th>base</th>
							<th>date</th>
						</tr>
					</thead>
					<tbody>
						{#each rows as row, index (`row-${index}`)}
							<tr>
								<td>{row.currency}</td>
								<td>{row.rate}</td>
								<td>{row.base}</td>
								<td>{row.date}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="status">No hay tipos de cambio disponibles.</p>
		{/if}
	</section>
</main>

<style>
.page { max-width: 1100px; margin: 0 auto; padding: 32px 20px 64px; }
	.header, .content { background: #fffdf9; border: 1px solid #d8d0c4; padding: 26px; }
	h1, h2 { margin: 0 0 12px; font-size: 1.85rem; font-weight: 600; }
	p { margin: 0; line-height: 1.6; }
	.meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 18px; }
	.meta-grid div { border-top: 1px solid #ddd4c9; padding-top: 10px; }
	.meta-grid span, .meta-grid strong { display: block; }
	.meta-grid span { color: #5a5148; margin-bottom: 4px; }
	.nav-links { margin: 16px 0; }
	.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 18px; }
	button { background: #4f5d39; color: white; border: 1px solid #4f5d39; padding: 10px 14px; border-radius: 6px; font: inherit; cursor: pointer; }
	button:hover { background: #424f30; }
	.back-link { background: #fffdf9; color: #24201b; border-color: #cfc4b5; }
	.back-link:hover { background: #f0eadf; }
	.status, .error { padding: 14px; border: 1px solid #ddd4c9; background: #faf7f1; }
	.error { color: #7f2f22; background: #fdf2ef; border-color: #ebc7c0; }
	.chart-wrap { min-height: 460px; }
	.chart-wrap.ready { min-height: 0; }
	.table-wrap { overflow-x: auto; margin-top: 18px; }
	table { width: 100%; border-collapse: collapse; font-size: 0.94rem; }
	th, td { padding: 12px 10px; border-bottom: 1px solid #e1dad0; text-align: left; }
	th { background: #f3ede3; font-weight: 600; }
	@media (max-width: 760px) { .meta-grid { grid-template-columns: 1fr; } .toolbar { display: block; } .toolbar button { margin-top: 10px; } }
</style>
