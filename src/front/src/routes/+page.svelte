<script>
	const team = [
		{
			name: 'Mario Ramírez García',
			resource: 'water-productivities',
			frontend: '/water-productivities',
			api: '/api/v1/water-productivities',
			postman: 'https://sos2526-17.onrender.com/api/v1/water-productivities/docs'
		},
		{
			name: 'Felipe Morgado Martinez',
			resource: 'agriculture-land',
			frontend: '/agriculture-land',
			api: '/api/v1/agriculture-land',
			postman: 'https://sos2526-17.onrender.com/api/v1/agriculture-land/docs'
		},
		{
			name: 'Pablo Gamero García',
			resource: 'renewable-energy-consumptions',
			frontend: '/renewable-energy-consumptions',
			api: '/api/v1/renewable-energy-consumptions',
			postman: 'https://sos2526-17.onrender.com/api/v1/renewable-energy-consumptions/docs'
		}
	];

	const githubRepo = 'https://github.com/gti-sos/SOS2526-17';
</script>

<main>
	<header>
		<h1>SOS2526-17 - Gestión de Recursos</h1>
		<p>Proyecto de la asignatura Sistemas de Operación y Servicios (SOS)</p>
	</header>

	<section class="team-section">
		<h2>Componentes del Equipo y Fuentes de Datos</h2>

		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>Integrante</th>
						<th>Fuente de Datos (Recurso)</th>
						<th>Enlaces</th>
					</tr>
				</thead>
				<tbody>
					{#each team as member}
						<tr>
							<td class="member-name">{member.name}</td>
							<td class="resource-cell"><code>{member.resource}</code></td>
							<td class="actions-cell">
								<a href={member.frontend} class="btn btn-frontend">Front-end</a>
								<a href={member.api} target="_blank" class="btn btn-api">API (v1)</a>
								<a href={member.postman} target="_blank" class="btn btn-postman">Postman</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="global-links">
		<h2>Enlaces Globales del Proyecto</h2>
		<div class="links-row">
			<a href="/integrations" class="btn-github">
				<span class="icon">🔗</span> Integrations
			</a>
			<a href={githubRepo} target="_blank" class="btn-github">
				<span class="icon">📦</span> Repositorio de GitHub
			</a>
		</div>
	</section>
</main>

<style>
main {
		max-width: 1000px;
		margin: 0 auto;
		padding: 40px 20px;
	}

	header {
		text-align: center;
		margin-bottom: 50px;
		border-bottom: 2px solid #ddd;
		padding-bottom: 20px;
	}
	h1 {
		color: #2c3e50;
		font-size: 2.5rem;
		margin-bottom: 5px;
	}

	section {
		margin-bottom: 40px;
	}
	h2 {
		color: #2c3e50;
		border-left: 5px solid #34495e;
		padding-left: 15px;
		margin-bottom: 25px;
	}

	.table-container {
		background: white;
		padding: 10px;
		border-radius: 8px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
		border: 1px solid #e0e0e0;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background: white;
	}
	th,
	td {
		border: 1px solid #eee;
		padding: 15px;
		text-align: left;
	}

	th {
		background-color: #34495e;
		color: white;
		text-transform: uppercase;
		font-size: 0.85rem;
		letter-spacing: 1px;
	}

	tr:nth-child(even) { background-color: #f8f9fa; }
	tr:hover { background-color: #eaeaea; }

	.member-name {
		font-weight: bold;
		color: #2c3e50;
	}
	.resource-cell code {
		background-color: #ecf0f1;
		padding: 4px 8px;
		border-radius: 4px;
		color: #c0392b;
		font-size: 0.9rem;
	}
	.actions-cell {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.btn {
		padding: 8px 12px;
		border-radius: 4px;
		text-decoration: none;
		font-size: 0.85rem;
		font-weight: bold;
		transition: background-color 0.2s;
		border: none;
		cursor: pointer;
	}

	.btn-frontend { background-color: #27ae60; color: white; }
	.btn-frontend:hover { background-color: #219150; }

	.btn-api { background-color: #2980b9; color: white; }
	.btn-api:hover { background-color: #216a9a; }

	.btn-postman { background-color: #ef5b25; color: white; }
	.btn-postman:hover { background-color: #d35400; }

	.links-row {
		display: flex;
		justify-content: center;
		margin-top: 20px;
	}
	.btn-github {
		display: inline-block;
		padding: 12px 24px;
		color: #34495e;
		text-decoration: none;
		font-weight: bold;
		border: 2px solid #34495e;
		border-radius: 8px;
		font-size: 1.1rem;
		transition: 0.3s;
	}
	.btn-github:hover { background: #34495e; color: white; }
	.btn-github .icon { margin-right: 8px; }
</style>
