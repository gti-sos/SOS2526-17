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
		<h1>Integraciones de Pablo Gamero García</h1>
		<p>
			Este índice reúne los usos individuales del recurso
			<code>renewable-energy-consumptions</code>.
		</p>
		<button type="button" class="back-link" onclick={goBack}>Atrás</button>
	</header>

	<section class="section">
		<h2>Subintegraciones disponibles</h2>
		<ul class="integration-list">
			<li>
				<a class="integration-link" href="/integrations/renewable-energy-consumptions/cholera-stats">
					<span class="integration-title">Cholera Stats</span>
					<span class="integration-meta">SOS externo directo</span>
					<span class="integration-description">Ranking textual de países con más casos reportados de cólera.</span>
				</a>
			</li>
			<li>
				<a class="integration-link" href="/integrations/renewable-energy-consumptions/drinking-water-services">
					<span class="integration-title">Drinking Water Services</span>
					<span class="integration-meta">SOS externo con proxy propio</span>
					<span class="integration-description">Comparativa visual de cobertura urbana con datos obtenidos a través del proxy propio.</span>
				</a>
			</li>
			<li>
				<a class="integration-link" href="/integrations/renewable-energy-consumptions/pandemics">
					<span class="integration-title">Pandemics</span>
					<span class="integration-meta">SOS externo directo</span>
					<span class="integration-description">Comparativa agregada del impacto total de varias enfermedades por país en Highcharts.</span>
				</a>
			</li>
			<li>
				<a class="integration-link" href="/integrations/renewable-energy-consumptions/wool-stats">
					<span class="integration-title">Wool Stats</span>
					<span class="integration-meta">SOS externo directo</span>
					<span class="integration-description">Evolución comparada de cantidad y valor comercial en una visualización de áreas.</span>
				</a>
			</li>
			<li>
				<a class="integration-link" href="/integrations/renewable-energy-consumptions/global-ev-charging-infrastructures">
					<span class="integration-title">Global EV Charging Infrastructures</span>
					<span class="integration-meta">SOS externo directo</span>
					<span class="integration-description">Relación entre puntos de carga y potencia total en un gráfico de dispersión.</span>
				</a>
			</li>
			<li>
				<a class="integration-link" href="/integrations/renewable-energy-consumptions/restcountries">
					<span class="integration-title">REST Countries</span>
					<span class="integration-meta">API no SOS directa</span>
					<span class="integration-description">Reparto de población de los países europeos más poblados en un gráfico circular.</span>
				</a>
			</li>
			<li>
				<a class="integration-link" href="/integrations/renewable-energy-consumptions/open-meteo">
					<span class="integration-title">Open-Meteo</span>
					<span class="integration-meta">API no SOS directa</span>
					<span class="integration-description">Ficha textual con el tiempo actual en Madrid.</span>
				</a>
			</li>
			<li>
				<a class="integration-link" href="/integrations/renewable-energy-consumptions/exchange-rates">
					<span class="integration-title">Exchange Rates</span>
					<span class="integration-meta">API no SOS directa</span>
					<span class="integration-description">Evolución visual de una selección de tipos de cambio respecto al euro.</span>
				</a>
			</li>
		</ul>
	</section>
</main>

<style>
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
