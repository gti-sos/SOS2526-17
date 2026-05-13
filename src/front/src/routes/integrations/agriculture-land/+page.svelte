
<script>
	import { onMount } from 'svelte';

	const integrations = [
		// 1. MI API PROPIA
		{
			id: 'agriculture-self',
			title: 'Mi API: Agriculture Land',
			type: 'SOS G17',
			fetchUrl: '/api/v1/agriculture-land?limit=5',
			apiUrl: '/api/v1/agriculture-land',
			columns: ['country', 'year', 'land_agriculture', 'index'],
			accent: '#84a59d'
		},
		// 2. SOS G23
		{
			id: 'g23-stock',
			title: 'API G23: Stock Market',
			type: 'Externa SOS',
			fetchUrl: 'https://sos2526-23.onrender.com/api/v1/daily-global-stock-market-indicators?limit=5',
			apiUrl: 'https://sos2526-23.onrender.com/api/v1/daily-global-stock-market-indicators',
			columns: ['region', 'date', 'open', 'high'], 
			accent: '#6c5ce7'
		},
		// 3. SOS G25
		{
			id: 'g25-tourists',
			title: 'API G25: Tourist Arrivals',
			type: 'Externa SOS',
			fetchUrl: 'https://sos2526-25.onrender.com/api/v1/international-tourist-arrivals?limit=5',
			apiUrl: 'https://sos2526-25.onrender.com/api/v1/international-tourist-arrivals',
			columns: ['country', 'year', 'air_arrival', 'water_arrival'],
			accent: '#d4a373'
		},
		// 4. POKEMON (PROXY)
		// Busca el objeto de Pokémon y cámbialo por este:
// ... en tu array integrations ...
{
    id: 'ext-pokemon',
    title: 'PokeAPI (Directa - Prueba)',
    type: 'Prueba sin proxy',
    fetchUrl: 'https://pokeapi.co/api/v2/pokemon?limit=5', 
    apiUrl: 'https://pokeapi.co/api/v2/pokemon',
    columns: ['name', 'url'],
    accent: '#ff7675'
},

		// 5. PAÍSES
		{
			id: 'ext-paises',
			title: 'Datos de Países',
			type: 'Externa No SOS',
			fetchUrl: 'https://restcountries.com/v3.1/all?fields=name,capital,region',
			apiUrl: 'https://restcountries.com/v3.1/all',
			columns: ['name', 'capital', 'region'],
			accent: '#fdcb6e'
		},
		// 6. UNIVERSIDADES
		{
			id: 'ext-universities',
			title: 'Universidades España',
			type: 'Externa No SOS',
			fetchUrl: 'http://universities.hipolabs.com/search?country=Spain&limit=5',
			apiUrl: 'http://universities.hipolabs.com/search?country=Spain',
			columns: ['name', 'domains'], 
			accent: '#55efc4'
		}
	];

	let cards = $state(integrations.map(config => ({
		...config,
		loading: true,
		error: '',
		rows: [],
		fetchedAt: '-'
	})));

	async function loadAll() {
		cards = cards.map(c => ({ ...c, loading: true, error: '' }));
		
		const fetchWithRetry = async (url, retries = 4, delay = 3000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url);
            if (res.ok) return await res.json();
            
            // Si la ruta no existe (404), lanzamos error directo
            if (res.status === 404) throw new Error("Error 404: La ruta del proxy no existe en el backend");
            if (res.status >= 500) throw new Error("Servidor arrancando...");
            
        } catch (e) {
            if (e.message.includes("404") || i === retries - 1) throw e;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

		for (let i = 0; i < cards.length; i++) {
			try {
				const data = await fetchWithRetry(cards[i].fetchUrl);
				
				let finalRows = [];
				if (Array.isArray(data)) {
					finalRows = data;
				} else if (data && data.results && Array.isArray(data.results)) {
					finalRows = data.results; 
				} else if (data && data.data && Array.isArray(data.data)) {
					finalRows = data.data; 
				}

				cards[i] = {
					...cards[i],
					loading: false,
					rows: finalRows.slice(0, 5),
					fetchedAt: new Date().toLocaleTimeString('es-ES'),
					error: finalRows.length === 0 ? 'Sin datos en la API' : ''
				};
			} catch (e) {
				cards[i] = { 
					...cards[i], 
					loading: false, 
					error: 'El servidor tardó demasiado en responder.' 
				};
			}
		}
	}

	onMount(loadAll);
</script>

<main>
	<header class="main-header">
		<div class="header-content">
			<h1>Data Hub <span class="group-tag">Grupo 17</span></h1>
			<p>Panel de integración y monitorización de APIs externas</p>
		</div>
		<div class="nav-buttons">
			<button class="refresh-btn" onclick={loadAll}>
				<span class="icon">🔄</span> Actualizar Todo
			</button>
			<a href="/" class="home-link">Volver</a>
		</div>
	</header>

	<section class="grid-layout">
		{#each cards as card}
			<article class="glass-card" style="--accent: {card.accent}">
				<div class="card-header">
					<span class="badge">{card.type}</span>
					<h2>{card.title}</h2>
				</div>

				<div class="card-body">
					<p class="api-path"><code>{card.apiUrl}</code></p>
					
					{#if card.loading}
						<div class="loader">Cargando...</div>
					{:else if card.error}
						<div class="error-box">{card.error}</div>
					{:else}
						<div class="table-container">
							<table>
								<thead>
									<tr>
										{#each card.columns as col}
											<th>{col.replace('_', ' ')}</th>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each card.rows as row}
										<tr>
											{#each card.columns as col}
												<td>
													{#if col === 'name' && typeof row[col] === 'object' && row[col] !== null}
														{row[col].common || 'N/A'}
													{:else if col === 'domains' && Array.isArray(row[col])}
														{row[col][0] || 'N/A'}
													{:else}
														{row[col] ?? '-'}
													{/if}
												</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
				
				<div class="card-footer">
					<span>Sincronizado: {card.fetchedAt}</span>
				</div>
			</article>
		{/each}
	</section>
</main>

<style>
main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 40px 20px;
	}

	.main-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 40px;
	}

	h1 {
		font-size: 2rem;
		margin: 0;
		color: #1f2a24;
	}

	.main-header p {
		color: #5b665f;
		margin-top: 8px;
	}

	.group-tag {
		font-size: 0.9rem;
		background: #e7efe9;
		color: #35594a;
		padding: 4px 12px;
		border-radius: 6px;
		vertical-align: middle;
		margin-left: 10px;
		box-shadow: none;
	}

	.nav-buttons {
		display: flex;
		gap: 15px;
		align-items: center;
	}

	.refresh-btn {
		background: #35594a;
		color: white;
		border: 1px solid #35594a;
		padding: 10px 20px;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 600;
		transition: background-color 0.2s ease, border-color 0.2s ease;
		box-shadow: none;
	}

	.refresh-btn:hover { 
		background: #294639;
	}

	.home-link {
		text-decoration: none;
		color: #35594a;
		font-weight: 600;
		transition: color 0.2s ease;
	}

	.home-link:hover {
		color: #294639;
	}

	.grid-layout {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 25px;
	}

	.glass-card {
		background: #ffffff;
		backdrop-filter: none;
		border-radius: 14px;
		border: 1px solid #d6dcd3;
		padding: 25px;
		box-shadow: 0 10px 24px rgba(31, 42, 36, 0.08);
		display: flex;
		flex-direction: column;
		border-top: 5px solid var(--accent);
		transition: box-shadow 0.2s ease;
	}

	.glass-card:hover {
		box-shadow: 0 14px 28px rgba(31, 42, 36, 0.12);
	}

	.badge {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		color: #35594a;
		letter-spacing: 0.04em;
		text-shadow: none;
	}

	h2 {
		margin: 5px 0 15px;
		font-size: 1.2rem;
		color: #1f2a24;
	}

	.api-path {
		font-size: 0.75rem;
		background: #f7f7f3;
		padding: 8px;
		border-radius: 8px;
		margin-bottom: 20px;
		color: #44504a;
		word-break: break-all;
		border: 1px solid #d6dcd3;
	}

	.table-container {
		overflow-x: auto;
		border-radius: 12px;
		background: #ffffff;
		border: 1px solid #d6dcd3;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.84rem;
	}

	th {
		background: #f7f7f3;
		padding: 12px;
		text-align: left;
		color: #35594a;
		border-bottom: 1px solid #d6dcd3;
	}

	td {
		padding: 10px 12px;
		border-bottom: 1px solid #e6ebe3;
		color: #1f2a24;
	}

	tr:last-child td {
		border-bottom: none;
	}

	.card-footer {
		margin-top: auto;
		padding-top: 20px;
		font-size: 0.75rem;
		color: #5b665f;
		text-align: right;
	}

	.error-box {
		color: #8a3e3e;
		background: #f8eded;
		border: 1px solid #e4c6c6;
		padding: 15px;
		border-radius: 10px;
		font-size: 0.85rem;
	}

	.loader {
		text-align: center;
		padding: 20px;
		color: #5b665f;
		background: #f7f7f3;
		border: 1px solid #d6dcd3;
		border-radius: 10px;
	}
</style>
