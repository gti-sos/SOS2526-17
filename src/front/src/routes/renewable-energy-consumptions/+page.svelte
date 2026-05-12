<script>
    import { onMount } from 'svelte';

    const API = '/api/v1/renewable-energy-consumptions';

    const filtrosIniciales = {
        country: '',
        code: '',
        year: '',
        wind: '',
        hydro: '',
        solar: '',
        other: '',
        from: '',
        to: '',
        limit: '',
        offset: '',
        page: ''
    };

    const nuevoInicial = {
        country: '',
        code: '',
        year: '',
        wind: '',
        hydro: '',
        solar: '',
        other: ''
    };

    /** @type {any[]} */
    let data = $state([]);
    let mensaje = $state('');
    let tipoMensaje = $state('');
    let filtros = $state({ ...filtrosIniciales });
    let nuevo = $state({ ...nuevoInicial });
    let estado = $state({
        fetching: false,
        creating: false,
        loadingInitial: false,
        deletingAll: false,
        deletingKey: ''
    });

    /**
     * @param {string} texto
     * @param {'info' | 'success' | 'error'} [tipo='info']
     */
    function notificar(texto, tipo = 'info') {
        mensaje = texto;
        tipoMensaje = tipo;
        setTimeout(() => {
            if (mensaje === texto) mensaje = '';
        }, 5000);
    }

    /**
     * @param {number} status
     * @param {string} accion
     * @param {string} [detalle='']
     */
    function manejarError(status, accion, detalle = '') {
        tipoMensaje = 'error';
        if (status === 400) {
            mensaje = 'Datos incompletos o con formato incorrecto. Revisa los campos numéricos.';
        } else if (status === 401) {
            mensaje = 'No estás autorizado para realizar esta acción.';
        } else if (status === 404) {
            mensaje = 'No se ha encontrado el registro solicitado.';
        } else if (status === 409) {
            mensaje = 'Ya existe un registro con ese país y año.';
        } else if (status === 405) {
            mensaje = 'La operación solicitada no está disponible en esta ruta.';
        } else {
            mensaje = `Error ${status} al intentar ${accion}. ${detalle}`.trim();
        }
    }

    function construirQueryConFiltros() {
        const params = new URLSearchParams();
        if (filtros.country) params.set('country', filtros.country.trim());
        if (filtros.code) params.set('code', filtros.code.trim());
        if (filtros.year) params.set('year', filtros.year);
        if (filtros.wind) params.set('wind', filtros.wind);
        if (filtros.hydro) params.set('hydro', filtros.hydro);
        if (filtros.solar) params.set('solar', filtros.solar);
        if (filtros.other) params.set('other', filtros.other);
        if (filtros.from) params.set('from', filtros.from);
        if (filtros.to) params.set('to', filtros.to);
        if (filtros.limit) params.set('limit', filtros.limit);
        if (filtros.offset) params.set('offset', filtros.offset);
        if (filtros.page) params.set('page', filtros.page);
        return params.toString();
    }

    async function cargarDatos() {
        estado.fetching = true;
        try {
            const query = construirQueryConFiltros();
            const url = query ? `${API}?${query}` : API;
            const res = await fetch(url);
            if (res.ok) {
                data = await res.json();
                if (query) {
                    notificar(
                        data.length > 0
                            ? 'Búsqueda realizada con éxito.'
                            : 'No hay resultados para los filtros aplicados.',
                        'info'
                    );
                }
            } else {
                manejarError(res.status, 'cargar los datos');
            }
        } catch (e) {
            notificar('No se puede conectar con el servidor.', 'error');
        } finally {
            estado.fetching = false;
        }
    }

    function limpiarFiltros() {
        filtros = { ...filtrosIniciales };
        cargarDatos();
    }

    async function crearRegistro() {
        if (!nuevo.country.trim() || !nuevo.code.trim() || !nuevo.year) {
            notificar('Por favor, completa País, Código y Año.', 'error');
            return;
        }

        estado.creating = true;
        try {
            const payload = {
                country: nuevo.country.trim(),
                code: nuevo.code.trim(),
                year: parseInt(nuevo.year),
                wind: parseFloat(nuevo.wind) || 0,
                hydro: parseFloat(nuevo.hydro) || 0,
                solar: parseFloat(nuevo.solar) || 0,
                other: parseFloat(nuevo.other) || 0
            };

            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.status === 201) {
                notificar('Registro creado con éxito.', 'success');
                nuevo = { ...nuevoInicial };
                await cargarDatos();
            } else {
                const detalle = await res.text();
                manejarError(res.status, 'crear el registro', detalle);
            }
        } catch (e) {
            notificar('No se puede conectar con el servidor.', 'error');
        } finally {
            estado.creating = false;
        }
    }

    /**
     * @param {string} country
     * @param {number | string} year
     */
    async function borrarRegistro(country, year) {
        if (!confirm(`¿Eliminar el registro de ${country} en ${year}?`)) return;

        const key = `${country}__${year}`;
        estado.deletingKey = key;
        try {
            const res = await fetch(`${API}/${encodeURIComponent(country)}/${year}`, { method: 'DELETE' });
            if (res.ok) {
                notificar('Registro eliminado.', 'success');
                await cargarDatos();
            } else {
                manejarError(res.status, 'eliminar el registro');
            }
        } catch (e) {
            notificar('No se puede conectar con el servidor.', 'error');
        } finally {
            if (estado.deletingKey === key) estado.deletingKey = '';
        }
    }

    async function borrarTodo() {
        if (!confirm('¿Seguro que quieres borrar todos los datos? Esta acción es irreversible.')) return;

        estado.deletingAll = true;
        try {
            const res = await fetch(`${API}?admin=true`, { method: 'DELETE' });
            if (res.ok) {
                notificar('Todos los registros han sido eliminados.', 'success');
                data = [];
            } else {
                manejarError(res.status, 'borrar todos los datos');
            }
        } catch (e) {
            notificar('No se puede conectar con el servidor.', 'error');
        } finally {
            estado.deletingAll = false;
        }
    }

    async function cargarDatosIniciales() {
        estado.loadingInitial = true;
        try {
            const res = await fetch(`${API}/loadInitialData`);
            if (res.ok) {
                notificar('Datos iniciales cargados con éxito.', 'success');
                await cargarDatos();
            } else if (res.status === 400) {
                notificar('No se han cargado datos iniciales porque ya existen registros.', 'info');
            } else {
                manejarError(res.status, 'cargar los datos iniciales');
            }
        } catch (e) {
            notificar('No se puede conectar con el servidor.', 'error');
        } finally {
            estado.loadingInitial = false;
        }
    }

    onMount(cargarDatos);
</script>

<main class="page">
    <header class="page-header">
        <h1>Consumo de energías renovables</h1>
        <p>Interfaz para consultar y gestionar registros de eólica, hidráulica, solar y otras fuentes.</p>
    </header>

    {#if mensaje}
        <div class="alerta {tipoMensaje}" role="alert">{mensaje}</div>
    {/if}

    <section class="panel">
        <div class="panel-header">
            <h2>Nuevo registro</h2>
        </div>
        <form class="form-grid" onsubmit={(event) => { event.preventDefault(); crearRegistro(); }}>
            <div class="campo">
                <label for="country">País *</label>
                <input id="country" bind:value={nuevo.country} placeholder="Ej: Spain" required />
            </div>
            <div class="campo">
                <label for="code">Código país *</label>
                <input id="code" bind:value={nuevo.code} placeholder="Ej: ESP" required />
            </div>
            <div class="campo">
                <label for="year">Año *</label>
                <input id="year" type="number" bind:value={nuevo.year} placeholder="2024" required />
            </div>
            <div class="campo">
                <label for="wind">Eólica</label>
                <input id="wind" type="number" step="0.01" bind:value={nuevo.wind} placeholder="0.00" />
            </div>
            <div class="campo">
                <label for="hydro">Hidráulica</label>
                <input id="hydro" type="number" step="0.01" bind:value={nuevo.hydro} placeholder="0.00" />
            </div>
            <div class="campo">
                <label for="solar">Solar</label>
                <input id="solar" type="number" step="0.01" bind:value={nuevo.solar} placeholder="0.00" />
            </div>
            <div class="campo">
                <label for="other">Otras</label>
                <input id="other" type="number" step="0.01" bind:value={nuevo.other} placeholder="0.00" />
            </div>
            <div class="panel-actions form-actions">
                <button class="btn btn-primary" type="submit" disabled={estado.creating}>
                    {estado.creating ? 'Guardando...' : 'Guardar registro'}
                </button>
            </div>
        </form>
    </section>

    <section class="panel">
        <div class="panel-header">
            <h2>Filtros</h2>
            <a class="btn btn-neutral" href={`${API}/docs`} target="_blank" rel="noreferrer">Ver documentación</a>
        </div>
        <form class="form-grid" onsubmit={(event) => { event.preventDefault(); cargarDatos(); }}>
            <div class="campo">
                <label for="filter-country">País</label>
                <input id="filter-country" bind:value={filtros.country} placeholder="Ej: Spain" />
            </div>
            <div class="campo">
                <label for="filter-code">Código país</label>
                <input id="filter-code" bind:value={filtros.code} placeholder="Ej: ESP" />
            </div>
            <div class="campo">
                <label for="filter-year">Año exacto</label>
                <input id="filter-year" type="number" bind:value={filtros.year} />
            </div>
            <div class="campo">
                <label for="filter-from">Año desde</label>
                <input id="filter-from" type="number" bind:value={filtros.from} />
            </div>
            <div class="campo">
                <label for="filter-to">Año hasta</label>
                <input id="filter-to" type="number" bind:value={filtros.to} />
            </div>
            <div class="campo">
                <label for="filter-wind">Eólica exacta</label>
                <input id="filter-wind" type="number" step="0.01" bind:value={filtros.wind} />
            </div>
            <div class="campo">
                <label for="filter-hydro">Hidráulica exacta</label>
                <input id="filter-hydro" type="number" step="0.01" bind:value={filtros.hydro} />
            </div>
            <div class="campo">
                <label for="filter-solar">Solar exacta</label>
                <input id="filter-solar" type="number" step="0.01" bind:value={filtros.solar} />
            </div>
            <div class="campo">
                <label for="filter-other">Otras exactas</label>
                <input id="filter-other" type="number" step="0.01" bind:value={filtros.other} />
            </div>
            <div class="campo">
                <label for="filter-limit">Cantidad (limit)</label>
                <input id="filter-limit" type="number" min="1" bind:value={filtros.limit} />
            </div>
            <div class="campo">
                <label for="filter-offset">Desplazamiento (offset)</label>
                <input id="filter-offset" type="number" min="0" bind:value={filtros.offset} />
            </div>
            <div class="campo">
                <label for="filter-page">Página (page)</label>
                <input id="filter-page" type="number" min="1" bind:value={filtros.page} />
            </div>
            <div class="panel-actions form-actions">
                <button class="btn btn-primary" type="submit" disabled={estado.fetching}>
                    {estado.fetching ? 'Aplicando...' : 'Aplicar filtros'}
                </button>
                <button class="btn btn-neutral" type="button" onclick={limpiarFiltros} disabled={estado.fetching}>
                    Limpiar
                </button>
            </div>
        </form>
    </section>

    <section class="panel">
        <div class="panel-header">
            <h2>Listado de registros</h2>
            <div class="panel-actions">
                <button class="btn btn-secondary" onclick={cargarDatosIniciales} disabled={estado.loadingInitial}>
                    {estado.loadingInitial ? 'Cargando...' : 'Cargar datos iniciales'}
                </button>
                <button class="btn btn-danger" onclick={borrarTodo} disabled={estado.deletingAll}>
                    {estado.deletingAll ? 'Borrando...' : 'Borrar todo'}
                </button>
            </div>
        </div>
        <div class="tabla">
            <table>
                <thead>
                    <tr>
                        <th>País</th>
                        <th>Código</th>
                        <th>Año</th>
                        <th>Eólica</th>
                        <th>Hidráulica</th>
                        <th>Solar</th>
                        <th>Otras</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {#each data as d (`${d.country}-${d.year}`)}
                        <tr>
                            <td class="country">{d.country}</td>
                            <td class="code">{d.code}</td>
                            <td>{d.year}</td>
                            <td>{d.wind}</td>
                            <td>{d.hydro}</td>
                            <td>{d.solar}</td>
                            <td>{d.other}</td>
                            <td>
                                <div class="acciones">
                                    <a class="btn btn-neutral" href={`/renewable-energy-consumptions/${encodeURIComponent(d.country)}/${d.year}`}>Editar</a>
                                    <button
                                        class="btn btn-danger-soft"
                                        onclick={() => borrarRegistro(d.country, d.year)}
                                        disabled={estado.deletingKey === `${d.country}__${d.year}`}
                                    >
                                        {estado.deletingKey === `${d.country}__${d.year}` ? 'Eliminando...' : 'Eliminar'}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    {:else}
                        <tr>
                            <td colspan="8" class="vacio">
                                {estado.fetching ? 'Cargando registros...' : 'No hay datos disponibles.'}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </section>
</main>

<style>
.page {
        max-width: 1120px;
        margin: 0 auto;
        padding: 24px 16px 36px;
    }

    .page-header {
        margin-bottom: 20px;
    }

    .page-header h1 {
        margin: 0 0 6px;
        font-size: 1.65rem;
        font-weight: 700;
    }

    .page-header p {
        margin: 0;
        color: #5f6670;
    }

    .alerta {
        margin-bottom: 16px;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid transparent;
        font-size: 0.95rem;
        font-weight: 600;
    }

    .alerta.success {
        background: #edf7ef;
        border-color: #b9d8bf;
        color: #2f5d39;
    }

    .alerta.error {
        background: #faeded;
        border-color: #e1b9b9;
        color: #7a2c2c;
    }

    .alerta.info {
        background: #efefeb;
        border-color: #d3d6cf;
        color: #3c434d;
    }

    .panel {
        background: #ffffff;
        border: 1px solid #d7ddd4;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
    }

    .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
    }

    .panel-header h2 {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 700;
    }

    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
    }

    .campo {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .campo label {
        font-size: 0.84rem;
        font-weight: 600;
        color: #4c5560;
    }

    .campo input {
        min-height: 38px;
        padding: 8px 10px;
        border: 1px solid #c4ccd3;
        border-radius: 6px;
        background: #fff;
        font-size: 0.94rem;
        color: #1f2328;
    }

    .campo input:focus {
        outline: none;
        border-color: #4f6b63;
        box-shadow: 0 0 0 3px rgba(79, 107, 99, 0.18);
    }

    .panel-actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
    }

    .form-actions {
        grid-column: 1 / -1;
        margin-top: 2px;
    }

    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 36px;
        padding: 8px 12px;
        border: 1px solid;
        border-radius: 6px;
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 600;
        line-height: 1;
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    }

    .btn:disabled {
        cursor: not-allowed;
        opacity: 0.65;
    }

    .btn-primary {
        border-color: #2f5d50;
        background: #2f5d50;
        color: #ffffff;
    }

    .btn-primary:not(:disabled):hover {
        border-color: #274d42;
        background: #274d42;
    }

    .btn-secondary {
        border-color: #3f4f5a;
        background: #3f4f5a;
        color: #ffffff;
    }

    .btn-secondary:not(:disabled):hover {
        border-color: #34414a;
        background: #34414a;
    }

    .btn-neutral {
        border-color: #c4ccd3;
        background: #f5f6f3;
        color: #303740;
    }

    .btn-neutral:not(:disabled):hover {
        border-color: #b8c0c8;
        background: #ebeeea;
    }

    .btn-danger {
        border-color: #7a2c2c;
        background: #7a2c2c;
        color: #ffffff;
    }

    .btn-danger:not(:disabled):hover {
        border-color: #652323;
        background: #652323;
    }

    .btn-danger-soft {
        border-color: #e1b9b9;
        background: #faeded;
        color: #7a2c2c;
    }

    .btn-danger-soft:not(:disabled):hover {
        border-color: #d7a8a8;
        background: #f6e2e2;
    }

    .tabla {
        overflow-x: auto;
        border: 1px solid #d7ddd4;
        border-radius: 8px;
    }

    table {
        width: 100%;
        min-width: 860px;
        border-collapse: collapse;
        background: #ffffff;
    }

    th {
        padding: 10px 12px;
        text-align: left;
        border-bottom: 1px solid #d7ddd4;
        background: #f1f2ef;
        color: #4b535d;
        font-size: 0.77rem;
        font-weight: 700;
        letter-spacing: 0.03em;
        text-transform: uppercase;
    }

    td {
        padding: 10px 12px;
        border-bottom: 1px solid #ebefea;
        font-size: 0.94rem;
    }

    tbody tr:last-child td {
        border-bottom: none;
    }

    tbody tr:hover {
        background: #fafbf9;
    }

    .country {
        font-weight: 700;
    }

    .code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
        font-size: 0.85rem;
        color: #4c5560;
    }

    .acciones {
        display: flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
    }

    .vacio {
        text-align: center;
        padding: 18px;
        color: #6d747d;
    }

    @media (max-width: 760px) {
        .page {
            padding: 16px 12px 28px;
        }

        .panel-header {
            flex-direction: column;
            align-items: flex-start;
        }

        .panel-actions {
            width: 100%;
        }
    }
</style>
