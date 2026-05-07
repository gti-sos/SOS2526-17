<script>
	import { onMount } from 'svelte';

	const integrationsConfig = [
		{
			id: 'renewable-self',
			title: 'Mi API: renewable-energy-consumptions',
			type: 'SOS propia',
			fetchUrl: '/api/v1/renewable-energy-consumptions?limit=5',
			apiUrl: '/api/v1/renewable-energy-consumptions',
			columns: ['country', 'year', 'wind', 'solar', 'hydro']
		},
		{
			id: 'ev-charging-proxy',
			title: 'SOS 16: global-ev-charging-infrastructures',
			type: 'SOS externa (via proxy propio)',
			fetchUrl: '/api/v1/integrations-proxy/global-ev-charging-infrastructures?limit=5',
			loadUrl: '/api/v1/integrations-proxy/global-ev-charging-infrastructures/loadInitialData',
			apiUrl: 'https://sos2526-16-production.up.railway.app/api/v1/global-ev-charging-infrastructures',
			columns: ['country', 'year', 'charging_point', 'ac_slow', 'dc_fast']
		},
		{
			id: 'wool-stats',
			title: 'SOS 20: wool-stats',
			type: 'SOS externa',
			fetchUrl: '/api/v1/integrations-proxy/wool-stats?limit=5',
			loadUrl: '/api/v1/integrations-proxy/wool-stats/loadInitialData',
			apiUrl: 'https://sos2526-20-stable.onrender.com/api/v2/wool-stats',
			columns: ['period', 'reporterdesc', 'flowdesc', 'qtyunitabbr', 'qty']
		},
		{
			id: 'cholera-stats',
			title: 'SOS soporte: cholera-stats',
			type: 'SOS externa',
			fetchUrl: '/api/v1/integrations-proxy/cholera-stats?limit=5',
			loadUrl: '/api/v1/integrations-proxy/cholera-stats/loadInitialData',
			apiUrl: 'https://soporte-sos.onrender.com/api/v1/cholera-stats',
			columns: ['country', 'year', 'reportedCases', 'reportedDeaths', 'fatalityRate']
		},
		{
			id: 'drinking-water-services',
			title: 'SOS 27: drinking-water-services',
			type: 'SOS externa',
			fetchUrl: '/api/v1/integrations-proxy/drinking-water-services?limit=5',
			loadUrl: '/api/v1/integrations-proxy/drinking-water-services/loadInitialData',
			apiUrl: 'https://sos2526-27.onrender.com/api/v1/drinking-water-services',
			columns: ['entity', 'code', 'year', 'wat_bas_pop_residence_urban']
		},
		{
			id: 'restcountries',
			title: 'REST Countries API',
			type: 'No SOS',
			fetchUrl: '/api/v1/integrations-proxy/restcountries-europe',
			apiUrl: 'https://restcountries.com/v3.1/region/europe?fields=name,cca2,population,area',
			columns: ['country', 'cca2', 'population', 'area_km2']
		},
		{
			id: 'open-meteo',
			title: 'Open-Meteo API (Madrid)',
			type: 'No SOS',
			fetchUrl: '/api/v1/integrations-proxy/open-meteo-madrid',
			apiUrl:
				'https://api.open-meteo.com/v1/forecast?latitude=40.4168&longitude=-3.7038&current=temperature_2m,wind_speed_10m',
			columns: ['time', 'temperature_2m', 'wind_speed_10m', 'timezone']
		},
		{
			id: 'exchange-rates',
			title: 'ExchangeRate-API (base EUR)',
			type: 'No SOS',
			fetchUrl: '/api/v1/integrations-proxy/exchange-rates-eur',
			apiUrl: 'https://api.exchangerate-api.com/v4/latest/EUR',
			columns: ['date', 'base', 'USD', 'GBP', 'JPY']
		}
	];

	let cards = $state([]);
	let summary = $state({
		totalApis: integrationsConfig.length,
		sosApis: 0,
		nonSosApis: 0,
		proxyApis: 0
	});

	function toArrayPayload(payload) {
		if (Array.isArray(payload)) return payload;
		if (payload && Array.isArray(payload.data)) return payload.data;
		return [];
	}

	function normalizeRows(config, payload) {
		if (config.id === 'restcountries') {
			const rows = Array.isArray(payload) ? payload : [];
			return rows.slice(0, 5).map((r) => ({
				country: r?.name?.common ?? '-',
				cca2: r?.cca2 ?? '-',
				population: r?.population ?? '-',
				area_km2: r?.area ?? '-'
			}));
		}

		if (config.id === 'open-meteo') {
			if (!payload?.current) return [];
			return [
				{
					time: payload.current.time,
					temperature_2m: payload.current.temperature_2m,
					wind_speed_10m: payload.current.wind_speed_10m,
					timezone: payload.timezone
				}
			];
		}

		if (config.id === 'exchange-rates') {
			if (!payload?.rates) return [];
			return [
				{
					date: payload.date ?? '-',
					base: payload.base ?? '-',
					USD: payload.rates.USD ?? '-',
					GBP: payload.rates.GBP ?? '-',
					JPY: payload.rates.JPY ?? '-'
				}
			];
		}

		return toArrayPayload(payload).slice(0, 5);
	}

	function withQuery(url, key, value) {
		const separator = url.includes('?') ? '&' : '?';
		return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
	}

	async function fetchJson(url) {
		const res = await fetch(url);
		if (!res.ok) {
			throw new Error(`HTTP ${res.status}`);
		}
		return res.json();
	}

	function updateCard(cardId, patch) {
		cards = cards.map((card) => (card.id === cardId ? { ...card, ...patch } : card));
	}

	async function loadCard(config) {
		updateCard(config.id, { loading: true, error: '', autoLoaded: false });

		try {
			let payload = await fetchJson(withQuery(config.fetchUrl, 't', Date.now()));
			let rows = normalizeRows(config, payload);
			let autoLoaded = false;

			if (rows.length === 0 && config.loadUrl) {
				autoLoaded = true;
				await fetchJson(withQuery(config.loadUrl, 't', Date.now()));
				payload = await fetchJson(withQuery(config.fetchUrl, 't', Date.now()));
				rows = normalizeRows(config, payload);
			}

			updateCard(config.id, {
				loading: false,
				error: '',
				rows,
				autoLoaded,
				fetchedAt: new Date().toLocaleTimeString('es-ES')
			});
		} catch (error) {
			updateCard(config.id, {
				loading: false,
				error: String(error?.message || error),
				rows: []
			});
		}
	}

	async function loadAll() {
		cards = integrationsConfig.map((config) => ({
			id: config.id,
			title: config.title,
			type: config.type,
			apiUrl: config.apiUrl,
			columns: config.columns,
			loading: true,
			error: '',
			rows: [],
			autoLoaded: false,
			fetchedAt: '-'
		}));

		summary = {
			totalApis: integrationsConfig.length,
			sosApis: integrationsConfig.filter((x) => x.type.startsWith('SOS') || x.type === 'SOS propia').length,
			nonSosApis: integrationsConfig.filter((x) => x.type === 'No SOS').length,
			proxyApis: integrationsConfig.filter((x) => x.fetchUrl.includes('/api/v1/integrations-proxy/')).length
		};

		await Promise.all(integrationsConfig.map((config) => loadCard(config)));
	}

	onMount(loadAll);
</script>

<main>
	<header>
		<h1>Integrations</h1>
		<p>
			Vista unica de usos e integraciones por fetch JSON. Incluye APIs SOS y APIs no SOS, con uso de
			proxy propio.
		</p>
		<div class="summary">
			<span>Total APIs: <strong>{summary.totalApis}</strong></span>
			<span>SOS: <strong>{summary.sosApis}</strong></span>
			<span>No SOS: <strong>{summary.nonSosApis}</strong></span>
			<span>Via proxy propio: <strong>{summary.proxyApis}</strong></span>
		</div>
		<div class="actions">
			<button onclick={loadAll}>Recargar integraciones</button>
			<a href="/">Volver al inicio</a>
		</div>
	</header>

	<section class="grid">
		{#each cards as card (card.id)}
			<article class="card">
				<div class="card-head">
					<h2>{card.title}</h2>
					<p class="type">{card.type}</p>
				</div>

				<p class="meta">
					API: <a href={card.apiUrl} target="_blank" rel="noreferrer">{card.apiUrl}</a>
				</p>
				<p class="meta">Ultima carga: {card.fetchedAt}</p>
				{#if card.autoLoaded}
					<p class="autoload">Se detecto vacio y se lanzo loadInitialData automaticamente.</p>
				{/if}

				{#if card.loading}
					<p class="status">Cargando datos...</p>
				{:else if card.error}
					<p class="error">Error: {card.error}</p>
				{:else if card.rows.length === 0}
					<p class="status">Sin datos en este momento.</p>
				{:else}
					<div class="table-wrap">
						<table>
							<thead>
								<tr>
									{#each card.columns as column}
										<th>{column}</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each card.rows as row, idx (`${card.id}-${idx}`)}
									<tr>
										{#each card.columns as column}
											<td>{row[column] ?? '-'}</td>
										{/each}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</article>
		{/each}
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #f4f6f8;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		color: #1f2937;
	}

	main {
		max-width: 1250px;
		margin: 0 auto;
		padding: 30px 18px 60px;
	}

	header {
		background: white;
		padding: 20px;
		border-radius: 10px;
		border: 1px solid #e5e7eb;
		margin-bottom: 18px;
	}

	h1 {
		margin: 0;
		font-size: 1.8rem;
	}

	header p {
		margin: 8px 0 0;
		color: #4b5563;
	}

	.summary {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		margin-top: 14px;
	}

	.summary span {
		background: #eef2ff;
		color: #1e3a8a;
		padding: 6px 10px;
		border-radius: 999px;
		font-size: 0.9rem;
	}

	.actions {
		display: flex;
		gap: 10px;
		align-items: center;
		margin-top: 14px;
	}

	button {
		background: #0f766e;
		color: white;
		border: none;
		border-radius: 8px;
		padding: 9px 14px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	button:hover {
		background: #0d645d;
	}

	.actions a {
		color: #0f766e;
		font-weight: 600;
		text-decoration: none;
	}

	.actions a:hover {
		text-decoration: underline;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 14px;
	}

	.card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 10px;
		padding: 14px;
	}

	.card-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 10px;
	}

	h2 {
		margin: 0;
		font-size: 1.02rem;
	}

	.type {
		margin: 0;
		font-size: 0.8rem;
		background: #f3f4f6;
		color: #374151;
		padding: 4px 8px;
		border-radius: 999px;
	}

	.meta {
		font-size: 0.82rem;
		color: #4b5563;
		margin: 8px 0;
		word-break: break-word;
	}

	.meta a {
		color: #2563eb;
	}

	.autoload {
		font-size: 0.78rem;
		color: #9a3412;
		background: #fff7ed;
		border: 1px solid #fed7aa;
		padding: 7px;
		border-radius: 7px;
		margin: 8px 0;
	}

	.status {
		font-size: 0.9rem;
		color: #374151;
	}

	.error {
		font-size: 0.9rem;
		color: #991b1b;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		padding: 8px;
	}

	.table-wrap {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.83rem;
	}

	th,
	td {
		border: 1px solid #e5e7eb;
		padding: 6px;
		text-align: left;
	}

	th {
		background: #111827;
		color: white;
	}

	tr:nth-child(even) {
		background: #f9fafb;
	}

	@media (max-width: 720px) {
		main {
			padding: 16px 10px 40px;
		}

		header {
			padding: 14px;
		}

		h1 {
			font-size: 1.45rem;
		}
	}
</style>
