<script>
    import { onMount } from 'svelte';
    import { page } from '$app/state';

    const API = '/api/v1/renewable-energy-consumptions';

    let mensaje = $state('');
    let tipoMensaje = $state('');
    let cargando = $state(true);

    let edit = $state({
        country: '',
        code: '',
        year: '',
        wind: '',
        hydro: '',
        solar: '',
        other: ''
    });

    const countryParam = $derived(page.params.country ?? '');
    const yearParam = $derived(page.params.year ?? '');

    function notificar(texto, tipo = 'info') {
        mensaje = texto;
        tipoMensaje = tipo;
        setTimeout(() => {
            if (mensaje === texto) mensaje = '';
        }, 5000);
    }

    function manejarError(status, accion, detalle = '') {
        tipoMensaje = 'error';
        if (status === 400) {
            mensaje = 'Datos incompletos o con formato incorrecto. Revisa los campos numéricos.';
        } else if (status === 404) {
            mensaje = `No existe un registro para ${countryParam} en ${yearParam}.`;
        } else if (status === 409) {
            mensaje = 'Conflicto: ya existe un registro con ese país y año.';
        } else {
            mensaje = `Error ${status} al intentar ${accion}. ${detalle}`.trim();
        }
    }

    async function cargarRegistro() {
        cargando = true;
        try {
            const res = await fetch(`${API}/${encodeURIComponent(countryParam)}/${yearParam}`);
            if (res.ok) {
                const data = await res.json();
                edit = {
                    country: data.country,
                    code: data.code,
                    year: data.year,
                    wind: data.wind,
                    hydro: data.hydro,
                    solar: data.solar,
                    other: data.other
                };
            } else {
                manejarError(res.status, 'cargar el registro');
            }
        } catch (e) {
            notificar('No se puede conectar con el servidor.', 'error');
        } finally {
            cargando = false;
        }
    }

    async function guardarCambios() {
        if (!edit.country.trim() || !edit.code.trim() || !edit.year) {
            notificar('Por favor, completa Código y Año antes de guardar.', 'error');
            return;
        }

        const payload = {
            country: edit.country.trim(),
            code: edit.code.trim(),
            year: parseInt(edit.year),
            wind: parseFloat(edit.wind) || 0,
            hydro: parseFloat(edit.hydro) || 0,
            solar: parseFloat(edit.solar) || 0,
            other: parseFloat(edit.other) || 0
        };

        const res = await fetch(`${API}/${encodeURIComponent(countryParam)}/${yearParam}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            notificar('Cambios guardados con éxito.', 'success');
        } else {
            const detalle = await res.text();
            manejarError(res.status, 'guardar los cambios', detalle);
        }
    }

    onMount(cargarRegistro);
</script>

<main>
    <header>
        <h1>✏️ Editar registro</h1>
        <p>Modifica los valores de consumo para el país y año seleccionados.</p>
    </header>

    <a class="volver" href="/renewable-energy-consumptions">← Volver al listado</a>

    {#if mensaje}
        <div class="alerta {tipoMensaje}" role="alert">{mensaje}</div>
    {/if}

    {#if cargando}
        <div class="cargando">Cargando información del registro...</div>
    {:else}
        <section class="card">
            <h2>Datos del registro</h2>
            <div class="grid">
                <div class="campo">
                    <label for="country">País</label>
                    <input id="country" bind:value={edit.country} disabled />
                </div>
                <div class="campo">
                    <label for="year">Año</label>
                    <input id="year" type="number" bind:value={edit.year} disabled />
                </div>
                <div class="campo">
                    <label for="code">Código país</label>
                    <input id="code" bind:value={edit.code} placeholder="Ej: ESP" />
                </div>
                <div class="campo">
                    <label for="wind">Eólica</label>
                    <input id="wind" type="number" step="0.01" bind:value={edit.wind} />
                </div>
                <div class="campo">
                    <label for="hydro">Hidráulica</label>
                    <input id="hydro" type="number" step="0.01" bind:value={edit.hydro} />
                </div>
                <div class="campo">
                    <label for="solar">Solar</label>
                    <input id="solar" type="number" step="0.01" bind:value={edit.solar} />
                </div>
                <div class="campo">
                    <label for="other">Otras</label>
                    <input id="other" type="number" step="0.01" bind:value={edit.other} />
                </div>
            </div>
            <button class="btn-primario" onclick={guardarCambios}>Guardar cambios</button>
        </section>
    {/if}
</main>

<style>
main {
        max-width: 900px;
        margin: 2.5rem auto;
        padding: 0 1.5rem 3rem;
        font-family: 'Manrope', 'Segoe UI', system-ui, sans-serif;
    }

    header {
        text-align: center;
        margin-bottom: 1.5rem;
    }

    header h1 {
        margin-bottom: 0.3rem;
    }

    header p {
        margin: 0;
        color: #475569;
    }

    .volver {
        display: inline-flex;
        align-items: center;
        margin-bottom: 1rem;
        color: #0f766e;
        font-weight: 600;
        text-decoration: none;
    }

    .alerta {
        padding: 1rem;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        font-weight: 600;
        border: 1px solid transparent;
        text-align: center;
    }

    .alerta.success {
        background: #ecfdf5;
        color: #065f46;
        border-color: #a7f3d0;
    }

    .alerta.error {
        background: #fef2f2;
        color: #991b1b;
        border-color: #fecaca;
    }

    .alerta.info {
        background: #eff6ff;
        color: #1e40af;
        border-color: #bfdbfe;
    }

    .cargando {
        padding: 1.5rem;
        background: white;
        border-radius: 12px;
        text-align: center;
        color: #64748b;
        box-shadow: 0 8px 20px -12px rgba(15, 23, 42, 0.3);
    }

    .card {
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 10px 20px -12px rgba(15, 23, 42, 0.3);
    }

    h2 {
        margin-top: 0;
        margin-bottom: 1rem;
        font-size: 1.2rem;
        color: #1e293b;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 12px;
        margin-bottom: 1rem;
    }

    .campo {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    label {
        font-size: 0.85rem;
        color: #64748b;
        font-weight: 600;
    }

    input {
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 10px 12px;
        font-size: 0.95rem;
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    input:focus {
        outline: none;
        border-color: #2dd4bf;
        box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.2);
    }

    input:disabled {
        background: #f1f5f9;
        color: #64748b;
    }

    button {
        cursor: pointer;
        border: none;
        border-radius: 10px;
        font-weight: 600;
    }

    .btn-primario {
        background: linear-gradient(120deg, #0f766e, #14b8a6);
        color: white;
        padding: 12px 18px;
        width: 100%;
        font-size: 1rem;
    }
</style>
