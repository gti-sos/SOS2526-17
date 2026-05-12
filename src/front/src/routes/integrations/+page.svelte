<script>
	// @ts-nocheck
	const integrationMembers = [
		{
			slug: 'water-productivities',
			name: 'Mario Ramírez García',
			description: 'Integraciones del recurso water-productivities.'
		},
		{
			slug: 'agriculture-land',
			name: 'Felipe Morgado Martinez',
			description: 'Integraciones del recurso agriculture-land.'
		},
		{
			slug: 'renewable-energy-consumptions',
			name: 'Pablo Gamero García',
			description: 'Integraciones del recurso renewable-energy-consumptions.'
		}
	];

	function goBack() {
		if (window.history.length > 1) {
			window.history.back();
			return;
		}

		window.location.href = '/';
	}
</script>

<main class="page">
	<header class="header">
		<h1>Integraciones del grupo</h1>
		<p>
			Selecciona la página individual de integraciones de cada integrante. Cada entrada está
			dentro de <code>/integrations</code> para mantener separadas las prácticas del grupo.
		</p>
		<button type="button" class="back-link" onclick={goBack}>Atrás</button>
	</header>

	<section class="section">
		<h2>Índice por integrante</h2>
		<ul class="member-list">
			{#each integrationMembers as member}
				<li>
					<a class="member-link" href={`/integrations/${member.slug}`}>
						<span class="member-name">Integraciones de {member.name}</span>
						<span class="member-description">{member.description}</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
</main>

<style>
.page {
		max-width: 980px;
		margin: 0 auto;
		padding: 32px 20px 64px;
	}

	.header,
	.section {
		background: #fffdf9;
		border: 1px solid #ddd4c7;
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
		background: #f0e6d7;
		padding: 0.1rem 0.35rem;
	}

	.member-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.member-list li + li {
		margin-top: 14px;
	}

	.member-link {
		display: block;
		padding: 18px 20px;
		border: 1px solid #d8cebf;
		text-decoration: none;
		color: inherit;
		background: #fcfaf6;
	}

	.member-link:hover {
		background: #f4ede2;
	}

	.back-link {
		margin-top: 18px;
		padding: 9px 14px;
		border: 1px solid #8a7d6d;
		background: #fffdf9;
		color: #241f19;
		font: inherit;
		cursor: pointer;
	}

	.back-link:hover {
		background: #f4ede2;
	}

	.member-name,
	.member-description {
		display: block;
	}

	.member-name {
		font-size: 1.05rem;
		font-weight: 600;
		margin-bottom: 6px;
	}

	.member-description {
		color: #5a5148;
		line-height: 1.5;
	}
</style>
