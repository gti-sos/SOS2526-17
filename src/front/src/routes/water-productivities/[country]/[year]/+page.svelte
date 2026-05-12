<script>
    import { onMount } from 'svelte';
    import { page } from '$app/state';

    let country = page.params.country;
    let year = page.params.year;
    let API = `/api/v1/water-productivities/${country}/${year}`;

    let entry = $state({
        country: "",
        year: "",
        countryCode: "",
        waterProductivity: "",
        waterStress: "",
        annualFreshwater: ""
    });

    let message = $state("");
    let messageType = $state("");

    // Cargar el recurso específico al entrar
    async function getEntry() {
        const res = await fetch(API);
        if (res.ok) {
            entry = await res.json();
        } else {
            message = "No se ha podido recuperar el recurso.";
            messageType = "error";
        }
    }

    // Actualizar el recurso (PUT)
    async function updateEntry() {
        const res = await fetch(API, {
            method: "PUT",
            body: JSON.stringify(entry),
            headers: { "Content-Type": "application/json" }
        });

        if (res.ok) {
            message = "Actualizado!";
            messageType = "success";

        } else {
            const status = res.status;
            if (status === 400) message = "Error: Datos inconsistentes o mal formados.";
            else message = "Error al actualizar el recurso.";
            messageType = "error";
        }
    }

    onMount(async () => {
        await getEntry();
    });
</script>

<main>
    <header>
        <h1>Detalle del Recurso</h1>
        <h3>{country} - {year}</h3>
    </header>

    {#if message}
        <div class="alert {messageType}">{message}</div>
    {/if}

    <section class="card shadow">
        <div class="grid">
            <label>País: <input bind:value={entry.country} readonly /></label>
            <label>Año: <input type="number" bind:value={entry.year} readonly /></label>
            <label>Código: <input bind:value={entry.countryCode} /></label>
            <label>Productividad: <input type="number" step="0.01" bind:value={entry.waterProductivity} /></label>
            <label>Estrés: <input type="number" step="0.01" bind:value={entry.waterStress} /></label>
            <label>Agua Dulce: <input type="number" step="0.01" bind:value={entry.annualFreshwater} /></label>
        </div>
        
        <div class="actions">
            <button class="btn-update" onclick={updateEntry}>Actualizar Datos</button>
            <a href="/water-productivities" class="btn-back">← Volver Atrás</a>
        </div>
    </section>
</main>

<style>
    :global(body) { background-color: #f8fafc; margin: 0; }
    main { max-width: 800px; margin: 3rem auto; font-family: 'Segoe UI', system-ui, sans-serif; padding: 0 1rem; color: #334155; }
    
    header { border-bottom: 2px solid #e2e8f0; margin-bottom: 2rem; padding-bottom: 1rem; }
    h1 { color: #1e293b; margin: 0; font-size: 1.8rem; }
    h3 { color: #64748b; margin: 5px 0 0 0; font-weight: 500; }

    /* Alertas (Iguales a las principales) */
    .alert { padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem; font-weight: 600; border: 1px solid; }
    .success { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }
    .error { background: #fef2f2; color: #991b1b; border-color: #fecaca; }

    .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }

    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 2rem; }
    
    label { display: flex; flex-direction: column; gap: 8px; font-weight: 600; color: #475569; font-size: 0.9rem; }
    
    input { 
        padding: 12px; 
        border: 1px solid #e2e8f0; 
        border-radius: 8px; 
        font-size: 1rem; 
        color: #1e293b;
        transition: 0.2s; 
    }
    input:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
    
    /* Inputs bloqueados (País y Año) */
    input[readonly] { background-color: #f1f5f9; color: #94a3b8; cursor: not-allowed; border-style: dashed; }

    .actions { 
        display: flex; 
        align-items: center; 
        justify-content: space-between; 
        border-top: 1px solid #f1f5f9; 
        margin-top: 1rem; 
        padding-top: 1.5rem; /* <-- Corregido aquí */
    }

    .btn-update { 
        background: #3b82f6; 
        color: white; 
        border: none; 
        padding: 12px 24px; 
        border-radius: 8px; 
        font-weight: bold; 
        cursor: pointer; 
        font-size: 1rem;
        transition: 0.2s;
    }
    .btn-update:hover { background: #2563eb; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3); }

    .btn-back { 
        color: #64748b; 
        text-decoration: none; 
        font-weight: 600; 
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 5px;
    }
    .btn-back:hover { color: #1e293b; }
</style>
