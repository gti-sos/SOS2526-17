<script>
	import { onMount } from 'svelte';

	const integrationConfig = {
		id: 'renewable-self',
		title: 'Mi API: renewable-energy-consumptions',
		type: 'SOS propia',
		fetchUrl: '/api/v1/renewable-energy-consumptions?limit=5',
		apiUrl: '/api/v1/renewable-energy-consumptions',
		columns: ['country', 'year', 'wind', 'solar', 'hydro']
	};

	let card = $state({
		id: integrationConfig.id,
		title: integrationConfig.title,
		type: integrationConfig.type,
		apiUrl: integrationConfig.apiUrl,
		columns: integrationConfig.columns,
		loading: true,
		error: '',
		rows: [],
		autoLoaded: false,
		fetchedAt: '-'
	});

	function toArrayPayload(payload) {
		if (Array.isArray(payload)) return payload;
		if (payload && Array.isArray(payload.data)) return payload.data;
		return [];
	}

	function normalizeRows(payload) {
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

	async function loadIntegration() {
		card = {
			...card,
			loading: true,
			error: '',
			autoLoaded: false
		};

		try {
			const payload = await fetchJson(withQuery(integrationConfig.fetchUrl, 't', Date.now()));
			const rows = normalizeRows(payload);

			card = {
				...card,
				loading: false,
				error: '',
				rows,
				autoLoaded: false,
				fetchedAt: new Date().toLocaleTimeString('es-ES')
			};
		} catch (error) {
			card = {
				...card,
				loading: false,
				error: String(error?.message || error),
				rows: []
			};
		}
	}

	onMount(loadIntegration);
</script>

<main>
	<header>
		<h1>Integrations - PGG</h1>
		<p>Vista individual de integraciones en la ruta <code>/integrations/pgg</code>.</p>
		<div class="actions">
			<button onclick={loadIntegration}>Recargar integracion</button>
			<a href="/">Volver al inicio</a>
		</div>
	</header>

	<section>
		<article class="card">
			<div class="card-head">
				<h2>{card.title}</h2>
				<p class="type">{card.type}</p>
			</div>

			<p class="meta">
				API: <a href={card.apiUrl} target="_blank" rel="noreferrer">{card.apiUrl}</a>
			</p>
			<p class="meta">Ultima carga: {card.fetchedAt}</p>

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
		max-width: 900px;
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
