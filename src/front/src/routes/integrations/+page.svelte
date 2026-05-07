<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		goto('/integrations/pgg', { replaceState: true });
	});
</script>

<main>
	<p>Redirigiendo a la vista individual de integraciones...</p>
	<p><a href="/integrations/pgg">Ir a /integrations/pgg</a></p>
</main>
