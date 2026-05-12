<script>
	import { onMount } from 'svelte';

	let rows = $state([]);
	let loading = $state(true);
	let error = $state('');
	let fetchedAt = $state('-');

	function goBack() {
		if (window.history.length > 1) {
			window.history.back();
			return;
		}

		window.location.href = '/integrations/renewable-energy-consumptions';
	}

	function numberValue(value) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}

	function formatNumber(value, digits = 0) {
		return new Intl.NumberFormat('es-ES', {
			maximumFractionDigits: digits,
			minimumFractionDigits: digits
		}).format(numberValue(value));
	}

	function withCacheBust(url) {
		const separator = url.includes('?') ? '&' : '?';
		return `${url}${separator}t=${Date.now()}`;
	}

	function buildRankingRows(input) {
		const filtered = input
			.map((row) => ({
				label: `${row.country} (${row.year})`,
				value: numberValue(row.reportedCases),
				aux: `Fatalidad: ${formatNumber(row.fatalityRate, 2)}%`
			}))
			.filter((row) => row.value > 0)
			.sort((a, b) => b.value - a.value)
			.slice(0, 8);

		const max = filtered[0]?.value || 1;
		return filtered.map((row) => ({
			...row,
			width: `${Math.max(16, Math.round((row.value / max) * 100))}%`
		}));
	}

	async function loadData() {
		loading = true;
		error = '';

		try {
			const response = await fetch(
				withCacheBust('https://soporte-sos.onrender.com/api/v1/cholera-stats?limit=24')
			);
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const payload = await response.json();
			rows = buildRankingRows(Array.isArray(payload) ? payload : []);
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
			<h1>Cholera Stats</h1>
			<p>Ranking textual de países con más casos reportados de cólera.</p>
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
			<ul class="ranking-list">
				{#each rows as row}
					<li>
						<div class="ranking-copy">
							<strong>{row.label}</strong>
							<span>{row.aux}</span>
						</div>
						<div class="ranking-meter"><div class="ranking-fill" style={`width: ${row.width}`}></div></div>
						<div class="ranking-value">{formatNumber(row.value)}</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="status">No hay casos de cólera disponibles para el ranking.</p>
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
	.ranking-list { list-style: none; margin: 0; padding: 0; }
	.ranking-list li + li { margin-top: 14px; }
	.ranking-list li { display: grid; grid-template-columns: minmax(220px, 2fr) minmax(160px, 3fr) auto; gap: 14px; align-items: center; }
	.ranking-copy strong, .ranking-copy span { display: block; }
	.ranking-copy span { color: #655b4f; margin-top: 4px; }
	.ranking-meter { height: 12px; background: #ece5da; }
	.ranking-fill { height: 100%; background: #8b6241; }
	.ranking-value { font-variant-numeric: tabular-nums; }
	@media (max-width: 760px) { .meta-grid { grid-template-columns: 1fr; } .toolbar, .ranking-list li { display: block; } .toolbar button, .ranking-meter, .ranking-value { margin-top: 10px; } }
</style>
