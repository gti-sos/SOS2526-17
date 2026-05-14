<svelte:head>
	<title>About - SOS2526-17</title>
</svelte:head>

<main>
	<h1>Project Information (SOS2526-17)</h1>

	<section>
		<h2>Team</h2>
		<ul>
			<li>
				<a href="https://github.com/pabgamgar1">Pablo Gamero García</a>
			</li>
			<li>
				<a href="https://github.com/felmormar">Felipe Morgado Martinez</a>
			</li>
			<li>
				<a href="https://github.com/marioraga29">Mario Ramírez García</a>
			</li>
		</ul>
	</section>

	<section>
		<h2>Project Description</h2>
		<p>
			Our project is going to analyse the impact of water and renewable energy on agricultural
			productivity in the countries.
		</p>
	</section>

	<section>
		<h2>Repository</h2>
		<p>
			<a href="https://github.com/gti-sos/SOS2526-17">gti-sos/SOS2526-17</a>
		</p>
	</section>

	<section>
		<h2>URL</h2>
		<p>
			<a href="https://sos2526-17.onrender.com">https://sos2526-17.onrender.com</a>
		</p>
	</section>

	<section>
		<h2>APIs</h2>
		<ul>
			<li>
				<a href="/api/v1/water-productivities">Water Productivities API</a>
				-
				<a href="/api/v1/water-productivities/docs">docs</a>
				(Mario Ramírez García)
			</li>
			<li>
				<a href="/api/v1/renewable-energy-consumptions">Renewable Energy Consumptions API</a>
				-
				<a href="/api/v1/renewable-energy-consumptions/docs">docs</a>
				(Pablo Gamero García)
			</li>
			<li>
				<a href="/api/v1/agriculture-land">Agricultural land API</a>
				-
				<a href="/api/v1/agriculture-land/docs">docs</a>
				(Felipe Morgado Martinez)
			</li>
		</ul>
	</section>

	<section>
		<h2>Vídeos</h2>
		<ul>
			<li>
				<a href="https://youtu.be/wLP9P60hSf0">Vídeo Vídeo Mario Ramírez García (water-productivities)</a>
			</li>
			<li>
				<a href="https://drive.google.com/file/d/1M_LdMkPUBdZYa-dRJPVlcCPEhbcW4YYd/view?usp=sharing"
					>Vídeo Pablo Gamero García (renewable-energy-consumptions)</a
				>
			</li>
			<li>
				<a href="https://www.youtube.com/watch?v=rSqIDwWOqgs"
					>Vídeo Felipe Morgado Martinez (agriculture-land)</a
				>
			</li>
		</ul>
	</section>

	<div class="back-row">
		<a href="/" class="back-home">← Volver al Home</a>
	</div>
</main>

<style>
	main {
		line-height: 1.6;
		max-width: 800px;
		margin: 40px auto;
		padding: 0 20px;
	}

	h1,
	h2 {
		border-bottom: 1px solid #eaecef;
		padding-bottom: 0.3em;
	}

	section {
		margin-bottom: 20px;
	}

	a {
		color: #0366d6;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}

	ul {
		padding-left: 20px;
	}

	.back-row {
		margin-top: 40px;
	}

	.back-home {
		font-weight: 700;
	}
</style>
