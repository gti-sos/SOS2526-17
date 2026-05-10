<script>
	import { onMount, tick } from 'svelte';

	let chartHost = $state();
	let chartInstance = null;
	let chartReady = $state(false);
	let loading = $state(true);
	let error = $state('');
	let fetchedAt = $state('-');
	let rows = $state([]);
	let chartConfig = $state(null);

	function goBack() {
		if (window.history.length > 1) return window.history.back();
		window.location.href = '/integrations/renewable-energy-consumptions';
	}

	function numberValue(value) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}

	function quantityValue(item) {
		return Math.max(numberValue(item.qty), numberValue(item.netwgt), numberValue(item.grosswgt));
	}

	function commercialValue(item) {
		return Math.max(numberValue(item.primaryvalue), numberValue(item.cifvalue), numberValue(item.fobvalue));
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
			const response = await fetch('https://sos2526-20-stable.onrender.com/api/v2/wool-stats?limit=30');
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const payload = await response.json();
			const sourceRows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

			rows = sourceRows
				.map((item) => ({
					label: `${item.reporterdesc} ${item.period}`,
					quantity: quantityValue(item),
					value: commercialValue(item)
				}))
				.filter((item) => item.quantity > 0 && item.value > 0)
				.sort((a, b) => b.value - a.value)
				.slice(0, 10);

			if (rows.length > 0) {
				chartConfig = {
					chart: { type: 'areaspline', backgroundColor: '#fffdf9' },
					title: { text: 'Valor comercial y cantidad en wool-stats' },
					xAxis: { categories: rows.map((row) => row.label), title: { text: null } },
					yAxis: [
						{ title: { text: 'Valor comercial' } },
						{ title: { text: 'Cantidad' }, opposite: true }
					],
					credits: { enabled: false },
					tooltip: {
						useHTML: true,
						shared: true
					},
					series: [
						{ name: 'Valor comercial', data: rows.map((row) => row.value), color: '#8a6d3b', yAxis: 0 },
						{ name: 'Cantidad', data: rows.map((row) => row.quantity), color: '#51643b', yAxis: 1 }
					]
				};
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
			<h1>Wool Stats</h1>
			<p>Comparativa entre cantidad comercializada y valor comercial con datos reales de comercio de lana.</p>
		</div>
		<div class="meta-grid">
			<div><span>Origen</span><strong>SOS externo directo</strong></div>
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
							<th>registro</th>
							<th>cantidad</th>
							<th>valor</th>
						</tr>
					</thead>
					<tbody>
						{#each rows as row, index (`row-${index}`)}
							<tr>
								<td>{row.label}</td>
								<td>{row.quantity}</td>
								<td>{row.value}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="status">La API de lana respondió, pero no devolvió registros con cantidad y valor positivos.</p>
		{/if}
	</section>
</main>

<style>
	:global(body) { margin: 0; background: #f4f2ec; color: #24201b; font-family: Georgia, 'Times New Roman', serif; }
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
