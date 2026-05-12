<script>
	// @ts-nocheck
	const links = [
		{ label: 'Front-end del recurso', href: '/water-productivities' },
		{ label: 'Analytics individual', href: '/analytics/water-productivities' }
	];

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
		<h2>Enlaces disponibles</h2>
		<ul class="link-list">
			{#each links as link}
				<li><a href={link.href}>{link.label}</a></li>
			{/each}
		</ul>
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #f3f0ea;
		color: #25211b;
		font-family: Georgia, 'Times New Roman', serif;
	}

	.page {
		max-width: 860px;
		margin: 0 auto;
		padding: 32px 20px 56px;
	}

	.header,
	.section {
		background: #fffdf8;
		border: 1px solid #ddd2c4;
		padding: 24px;
	}

	.section {
		margin-top: 18px;
	}

	h1,
	h2 {
		margin: 0 0 12px;
		font-size: 1.7rem;
	}

	p {
		margin: 0;
		line-height: 1.6;
	}

	code {
		background: #efe6d8;
		padding: 0.1rem 0.35rem;
	}

	.link-list {
		margin: 0;
		padding-left: 20px;
	}

	.link-list li + li {
		margin-top: 10px;
	}

	a {
		color: #6e3d1c;
	}

	.back-link {
		margin-top: 18px;
		padding: 9px 14px;
		border: 1px solid #a58f79;
		background: #fffdf8;
		color: #25211b;
		font: inherit;
		cursor: pointer;
	}
</style>
