<script>
	// @ts-nocheck
	function goBack() {
		if (window.history.length > 1) {
			window.history.back();
			return;
		}

		window.location.href = '/integrations';
	}
</script>

<main class="page">
	<header class="header">
		<h1>Integraciones de Mario Ramírez García</h1>
		<p>
			Esta entrada sirve como acceso dentro de <code>/integrations</code> al trabajo asociado al
			recurso <code>water-productivities</code>.
		</p>
		<button type="button" class="back-link" onclick={goBack}>Atrás</button>
	</header>

	<section class="section">
		<h2>Enlaces de Integración - Water Productivities</h2>
		<ul class="integration-list">
			
			<li>
				<a class="integration-link" href="/integrations/water-productivities/birth-death-growth-rates">
					<span class="integration-title">Birth death growth rates</span>
					<span class="integration-meta">SOS externo (G12) con proxy</span>
					<span class="integration-description">Análisis del crecimiento demográfico comparado con la productividad del agua.</span>
				</a>
			</li>

			<li>
				<a class="integration-link" href="/integrations/water-productivities/global-ev-sales">
					<span class="integration-title">Global EV Sales</span>
					<span class="integration-meta">SOS externo (G16) con proxy</span>
					<span class="integration-description">Relación entre la eficiencia hídrica por país y la adopción de vehículos eléctricos.</span>
				</a>
			</li>

			<li>
				<a class="integration-link" href="/integrations/water-productivities/spice-stats">
					<span class="integration-title">Spice Stats</span>
					<span class="integration-meta">SOS externo (G20) con proxy</span>
					<span class="integration-description">Mashup visual entre el valor económico del agua y las estadísticas de consumo de especias.</span>
				</a>
			</li>

			<li>
				<a class="integration-link" href="/integrations/water-productivities/daily-global-stock-market-indicators">
					<span class="integration-title">Daily Global Stock Market Indicators</span>
					<span class="integration-meta">SOS externo (G23) con proxy</span>
					<span class="integration-description">Comparativa de indicadores bursátiles mundiales frente a la productividad hídrica regional.</span>
				</a>
			</li>
			<li>
				<a class="integration-link" href="/integrations/water-productivities/world-bank-gdp">
					<span class="integration-title">World bank gdp</span>
					<span class="integration-meta">Api no SOS con proxy</span>
					<span class="integration-description">Datos económicos internacionales (PIB)</span>
				</a>
			</li>
			<li>
				<a class="integration-link" href="/integrations/water-productivities/weather-stats">
					<span class="integration-title">Weather stats</span>
					<span class="integration-meta">Api no SOS directa</span>
					<span class="integration-description">Análisis Meteorológico con Open-Meteo vs productividad agua</span>
				</a>
			</li>
			<li>
				<a class="integration-link" href="/integrations/water-productivities/rest-countries">
					<span class="integration-title">Rest Countries</span>
					<span class="integration-meta">Api no SOS directa</span>
					<span class="integration-description">Población Mundial vs. Sostenibilidad Hídrica</span>
				</a>
			</li>

		</ul>
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #f3f5f0;
		color: #1f2a1e;
		font-family: Georgia, 'Times New Roman', serif;
	}

	.page {
		max-width: 1040px;
		margin: 0 auto;
		padding: 32px 20px 64px;
	}

	.header,
	.section {
		background: #fbfcf8;
		border: 1px solid #d5ddd1;
		padding: 28px;
	}

	.section {
		margin-top: 18px;
	}

	h1,
	h2 {
		margin: 0 0 14px;
		font-size: 1.95rem;
		font-weight: 600;
	}

	p {
		margin: 0;
		line-height: 1.6;
	}

	code {
		background: #e5eadf;
		padding: 0.1rem 0.35rem;
	}

	.back-link {
		margin-top: 18px;
		padding: 9px 14px;
		border: 1px solid #8ca088;
		background: #fbfcf8;
		color: #1f2a1e;
		font: inherit;
		cursor: pointer;
	}

	.integration-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.integration-list li + li {
		margin-top: 12px;
	}

	.integration-link {
		display: block;
		padding: 16px 18px;
		background: #ffffff;
		border: 1px solid #d7dfd2;
		text-decoration: none;
		color: inherit;
	}

	.integration-link:hover {
		background: #f0f4eb;
	}

	.integration-title,
	.integration-meta,
	.integration-description {
		display: block;
	}

	.integration-title {
		font-size: 1.05rem;
		font-weight: 600;
		margin-bottom: 4px;
	}

	.integration-meta {
		color: #466347;
		margin-bottom: 6px;
	}

	.integration-description {
		color: #4a5647;
		line-height: 1.5;
	}
</style>

