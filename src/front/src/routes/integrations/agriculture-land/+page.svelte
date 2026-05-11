<script>
	import { onMount } from 'svelte';

	// Configuración de las 3 APIs para el Grupo 17
	const integrations = [
		{
			id: 'agriculture-self',
			title: 'Mi API: Agriculture Land',
			type: 'SOS G17',
			fetchUrl: 'https://sos2526-17.onrender.com/api/v1/agriculture-land?limit=5',
			apiUrl: 'https://sos2526-17.onrender.com/api/v1/agriculture-land',
			columns: ['country', 'year', 'land_agriculture', 'index'],
			accent: '#84a59d'
		},
		{
    		id: 'g23-stock',
    	title: 'API G23: Stock Market Indicators',
   		 type: 'Externa G23',
   		 fetchUrl: 'https://sos2526-23.onrender.com/api/v1/daily-global-stock-market-indicators?limit=5',
   		 apiUrl: 'https://sos2526-23.onrender.com/api/v1/daily-global-stock-market-indicators',
    
    	columns: ['region', 'date', 'index', 'open', 'high', 'low'],
    	accent: '#6c5ce7' // Un color lila elegante para diferenciarlo
	},
		{
   		 id: 'g25-tourists',
   		 title: 'API G25: Tourist Arrivals',
   		 type: 'Externa G25',
   		 fetchUrl: 'https://sos2526-25.onrender.com/api/v1/international-tourist-arrivals?limit=5',
   		 apiUrl: 'https://sos2526-25.onrender.com/api/v1/international-tourist-arrivals',
   		 // Cambiamos los nombres de las columnas a los que salen en tu captura:
   		 columns: ['country', 'year', 'air_arrival', 'water_arrival', 'land_arrival'],
    	accent: '#d4a373'
		},
		{
			id: 'renewable-self',
			title: 'API: Renewable Energy Consumptions',
			type: 'SOS Propia',
			fetchUrl: 'https://sos2526-17.onrender.com/api/v1/renewable-energy-consumptions?limit=5',
			apiUrl: 'https://sos2526-17.onrender.com//api/v1/renewable-energy-consumptions',
			columns: ['country', 'year', 'wind', 'solar', 'hydro'],
			accent: '#74b9ff' 
		},
		{
			id: 'water-productivity',
			title: 'API: Water Productivities',
			type: 'SOS Propia',
			fetchUrl: 'https://sos2526-17.onrender.com/api/v1/water-productivities?limit=5',
			apiUrl: 'https://sos2526-17.onrender.com/api/v1/water-productivities',
			columns: ['country', 'year', 'countryCode', 'waterProductivity', 'waterStress'],
			accent: '#e17055' 
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
		
		const fetchWithRetry = async (url, retries = 3, delay = 2000) => {
			for (let i = 0; i < retries; i++) {
				try {
					const res = await fetch(url);
					if (res.ok) return await res.json();
				} catch (e) {
					if (i === retries - 1) throw e;
					// Esperamos un poco antes de reintentar
					await new Promise(resolve => setTimeout(resolve, delay));
				}
			}
		};

		for (let i = 0; i < cards.length; i++) {
			try {
				const data = await fetchWithRetry(cards[i].fetchUrl);
				
				cards[i] = {
					...cards[i],
					loading: false,
					rows: Array.isArray(data) ? data.slice(0, 5) : (data.data || []),
					fetchedAt: new Date().toLocaleTimeString('es-ES')
				};
			} catch (e) {
				cards[i] = { 
                    ...cards[i], 
                    loading: false, 
                    error: 'Render despertando... pulsa actualizar en 30s' 
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
												<td>{row[col] ?? 'N/A'}</td>
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
		background: radial-gradient(circle at top right, #fdfcfb 0%, #e2d1c3 100%);
		font-family: 'Inter', sans-serif;
		color: #2d3436;
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
		color: #2c3e50;
	}

	.group-tag {
		font-size: 0.9rem;
		background: #2c3e50;
		color: white;
		padding: 4px 12px;
		border-radius: 20px;
		vertical-align: middle;
		margin-left: 10px;
	}

	.nav-buttons {
		display: flex;
		gap: 15px;
	}

	.refresh-btn {
		background: #2c3e50;
		color: white;
		border: none;
		padding: 10px 20px;
		border-radius: 12px;
		cursor: pointer;
		font-weight: 600;
		transition: 0.3s;
	}

	.refresh-btn:hover { background: #1a252f; transform: translateY(-2px); }

	.home-link {
		text-decoration: none;
		color: #2c3e50;
		line-height: 40px;
		font-weight: 600;
	}

	.grid-layout {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 25px;
	}

	.glass-card {
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(10px);
		border-radius: 24px;
		border: 1px solid rgba(255, 255, 255, 0.4);
		padding: 25px;
		box-shadow: 0 15px 35px rgba(0,0,0,0.05);
		display: flex;
		flex-direction: column;
		border-top: 5px solid var(--accent);
	}

	.badge {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--accent);
		letter-spacing: 1px;
	}

	h2 {
		margin: 5px 0 15px;
		font-size: 1.2rem;
		color: #2c3e50;
	}

	.api-path {
		font-size: 0.75rem;
		background: rgba(0,0,0,0.05);
		padding: 8px;
		border-radius: 8px;
		margin-bottom: 20px;
	}

	.table-container {
		overflow-x: auto;
		border-radius: 12px;
		background: white;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8rem;
	}

	th {
		background: #f8f9fa;
		padding: 12px;
		text-align: left;
		color: #636e72;
		border-bottom: 2px solid #eee;
	}

	td {
		padding: 10px 12px;
		border-bottom: 1px solid #f1f1f1;
	}

	.card-footer {
		margin-top: auto;
		padding-top: 20px;
		font-size: 0.75rem;
		color: #b2bec3;
		text-align: right;
	}

	.error-box {
		color: #d63031;
		background: #fab1a033;
		padding: 15px;
		border-radius: 12px;
		font-size: 0.85rem;
	}

	.loader {
		text-align: center;
		padding: 20px;
		color: #636e72;
	}
</style>