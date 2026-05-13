<script>
    import { onMount } from 'svelte';
    import { page } from '$app/state';

    // Obtenemos los parámetros de la URL dinámica
    let countryParam = page.params.country;
    let yearParam = page.params.year;
    
    // Ruta de la API limpiando posibles espacios del parámetro
    let API = `/api/v1/agriculture-land/${countryParam.trim()}/${yearParam}`;

    let entry = $state({
        country: countryParam.trim(),
        year: parseInt(yearParam),
        country_code: "",
        land_agriculture: 0,
        types_land: 0,
        index: 0
    });

    let message = $state("");
    let messageType = $state("");

    // --- OBTENER DATOS ACTUALES (GET) ---
    async function getEntry() {
        try {
            const res = await fetch(API);
            if (res.ok) {
                const data = await res.json();
                // Adaptamos si el JSON viene con "country " o "country"
                entry = {
                    country: (data["country "] || data.country || countryParam).trim(),
                    year: data.year || yearParam,
                    country_code: data.country_code || "",
                    land_agriculture: data.land_agriculture || 0,
                    types_land: data.types_land || 0,
                    index: data.index || 0
                };
            } else {
                message = "❌ Error: No se ha podido recuperar el registro.";
                messageType = "error";
            }
        } catch (e) {
            message = "❌ Error de conexión con el servidor.";
            messageType = "error";
        }
    }

    // --- ACTUALIZAR RECURSO (PUT) ---
    async function updateEntry() {
        try {
            // Creamos una copia limpia para enviar al servidor
            const updatedEntry = {
                country: entry.country.trim(),
                year: parseInt(entry.year),
                country_code: entry.country_code,
                land_agriculture: parseFloat(entry.land_agriculture),
                types_land: parseInt(entry.types_land),
                index: parseInt(entry.index)
            };

            const res = await fetch(API, {
                method: "PUT",
                body: JSON.stringify(updatedEntry),
                headers: { "Content-Type": "application/json" }
            });

            if (res.ok) {
                message = "✅ ¡Recurso actualizado con éxito!";
                messageType = "success";
                // Redirigir tras 2 segundos
                setTimeout(() => window.location.href = "/agriculture-land", 2000);
            } else {
                const status = res.status;
                if (status === 400) message = "⚠️ Error: Los datos son incorrectos o el ID no coincide.";
                else if (status === 404) message = "⚠️ Error: El recurso no existe en el servidor.";
                else message = "❌ Error interno del servidor al actualizar.";
                messageType = "error";
            }
        } catch (e) {
            message = "❌ Error al conectar con la API.";
            messageType = "error";
        }
    }

    onMount(async () => {
        await getEntry();
    });
</script>

<main>
    <header>
        <h1>✏️ Panel de Edición</h1>
        <p>Editando datos de <strong>{countryParam}</strong> ({yearParam})</p>
    </header>

    {#if message}
        <div class="alert {messageType}">
            {message}
        </div>
    {/if}

    <section class="card shadow">
        <div class="grid">
            <div class="field">
                <label for="country">País (Identificador)</label>
                <input id="country" bind:value={entry.country} readonly class="readonly" />
            </div>
            <div class="field">
                <label for="year">Año (Identificador)</label>
                <input id="year" type="number" bind:value={entry.year} readonly class="readonly" />
            </div>
            <div class="field">
                <label for="country-code">Código de País</label>
                <input id="country-code" bind:value={entry.country_code} placeholder="Ej: ESP" />
            </div>
            <div class="field">
                <label for="land-agriculture">Superficie Agrícola (%)</label>
                <input id="land-agriculture" type="number" step="0.01" bind:value={entry.land_agriculture} />
            </div>
            <div class="field">
                <label for="types-land">Tipo de Tierra</label>
                <input id="types-land" type="number" bind:value={entry.types_land} />
            </div>
            <div class="field">
                <label for="index">Índice</label>
                <input id="index" type="number" bind:value={entry.index} />
            </div>
        </div>

        <div class="actions">
            <button class="btn-update" onclick={updateEntry}>
                Actualizar Registro
            </button>
            <a href="/agriculture-land" class="btn-back">
                Cancelar y Volver
            </a>
        </div>
    </section>
</main>

<style>
main { 
        max-width: 750px; 
        margin: 4rem auto; 
        padding: 0 1.5rem; 
    }

    header { 
        text-align: center;
        margin-bottom: 2rem; 
    }

    h1 { color: #f8fafc; margin: 0; font-size: 2.2rem; }
    p { color: #94a3b8; margin-top: 10px; }

    .alert { 
        padding: 1rem; 
        border-radius: 8px; 
        margin-bottom: 2rem; 
        text-align: center;
        font-weight: 700;
        border: 1px solid;
    }
    .success { background: rgba(34, 197, 94, 0.15); color: #86efac; border-color: #166534; }
    .error { background: rgba(239, 68, 68, 0.15); color: #fca5a5; border-color: #991b1b; }

    .card { 
        background: #1e293b; 
        padding: 2.5rem; 
        border-radius: 12px; 
        border: 1px solid #334155;
    }

    .shadow { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }

    .grid { 
        display: grid; 
        grid-template-columns: 1fr 1fr; 
        gap: 20px; 
        margin-bottom: 2rem; 
    }

    .field { display: flex; flex-direction: column; gap: 8px; }
    
    label { font-weight: 600; color: #cbd5e1; font-size: 0.85rem; }
    
    input { 
        padding: 12px; 
        border: 1px solid #475569; 
        border-radius: 8px; 
        background: #0f172a;
        color: white;
        font-size: 1rem; 
    }

    input:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3); }
    
    .readonly { background-color: #1e293b; color: #64748b; border-style: dashed; cursor: not-allowed; }

    .actions { 
        display: flex; 
        justify-content: space-between; 
        align-items: center;
        border-top: 1px solid #334155;
        padding-top: 2rem;
    }

    .btn-update { 
        background: #3b82f6; 
        color: white; 
        padding: 12px 30px; 
        border-radius: 8px; 
        font-weight: 800; 
        border: none;
        cursor: pointer;
        transition: 0.2s;
    }

    .btn-update:hover { background: #2563eb; transform: translateY(-2px); }

    .btn-back { color: #94a3b8; text-decoration: none; font-weight: 600; font-size: 0.9rem; }
    .btn-back:hover { color: #f8fafc; }

    @media (max-width: 600px) {
        .grid { grid-template-columns: 1fr; }
    }
</style>
