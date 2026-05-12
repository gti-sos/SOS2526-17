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
{
    id: 'ext-pokemon',
    title: 'PokeAPI (Vía Proxy)',
    type: 'Proxy Propio / No SOS',
    fetchUrl: '/api/v1/proxy-pokemon', // <--- AHORA SÍ PASARÁ AL BACKEND
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
	@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap');

	:global(body) {
		margin: 0;
		/* Gradiente oscuro en tonos morados profundos */
		background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
		font-family: 'Inter', sans-serif;
		color: #e2e8f0; 
		min-height: 100vh;
	}

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
		color: #ffffff;
	}

	.main-header p {
		color: #a29bfe; /* Morado claro */
		margin-top: 8px;
	}

	.group-tag {
		font-size: 0.9rem;
		background: #6c5ce7;
		color: white;
		padding: 4px 12px;
		border-radius: 20px;
		vertical-align: middle;
		margin-left: 10px;
		box-shadow: 0 0 12px rgba(108, 92, 231, 0.4);
	}

	.nav-buttons {
		display: flex;
		gap: 15px;
		align-items: center;
	}

	.refresh-btn {
		background: #6c5ce7;
		color: white;
		border: none;
		padding: 10px 20px;
		border-radius: 12px;
		cursor: pointer;
		font-weight: 600;
		transition: 0.3s;
		box-shadow: 0 4px 15px rgba(108, 92, 231, 0.3);
	}

	.refresh-btn:hover { 
		background: #a29bfe; 
		transform: translateY(-2px); 
		box-shadow: 0 6px 20px rgba(108, 92, 231, 0.5);
	}

	.home-link {
		text-decoration: none;
		color: #a29bfe;
		font-weight: 600;
		transition: 0.3s;
	}

	.home-link:hover {
		color: #ffffff;
	}

	.grid-layout {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 25px;
	}

	.glass-card {
		/* Fondo semi-transparente muy oscuro para contraste */
		background: rgba(20, 15, 40, 0.6);
		backdrop-filter: blur(12px);
		border-radius: 24px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		padding: 25px;
		box-shadow: 0 15px 35px rgba(0,0,0,0.4);
		display: flex;
		flex-direction: column;
		border-top: 5px solid var(--accent);
		transition: transform 0.3s ease;
	}

	.glass-card:hover {
		transform: translateY(-5px);
	}

	.badge {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--accent);
		letter-spacing: 1px;
		text-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
	}

	h2 {
		margin: 5px 0 15px;
		font-size: 1.2rem;
		color: #ffffff;
	}

	.api-path {
		font-size: 0.75rem;
		background: rgba(0, 0, 0, 0.4);
		padding: 8px;
		border-radius: 8px;
		margin-bottom: 20px;
		color: #a29bfe;
		word-break: break-all;
	}

	.table-container {
		overflow-x: auto;
		border-radius: 12px;
		background: rgba(0, 0, 0, 0.25);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8rem;
	}

	th {
		background: rgba(255, 255, 255, 0.05);
		padding: 12px;
		text-align: left;
		color: #a29bfe;
		border-bottom: 2px solid rgba(255, 255, 255, 0.1);
	}

	td {
		padding: 10px 12px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		color: #dcdde1;
	}

	tr:last-child td {
		border-bottom: none;
	}

	.card-footer {
		margin-top: auto;
		padding-top: 20px;
		font-size: 0.75rem;
		color: #718093;
		text-align: right;
	}

	.error-box {
		color: #ff7675;
		background: rgba(214, 48, 49, 0.15);
		border: 1px solid rgba(214, 48, 49, 0.3);
		padding: 15px;
		border-radius: 12px;
		font-size: 0.85rem;
	}

	.loader {
		text-align: center;
		padding: 20px;
		color: #a29bfe;
	}
</style>