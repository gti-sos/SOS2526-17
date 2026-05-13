<script>
    import { onMount, tick } from 'svelte';
    import bb, { donut } from "billboard.js";
    import "billboard.js/dist/billboard.css";

    let loading = $state(true);
    let error = $state('');
    let stats = $state({ myTotal: 0, extTotal: 0, countMy: 0, countExt: 0 });

    const PROXY_URL = '/api/v1/integrations-proxy/spice-stats';
    const MY_API_URL = '/api/v1/water-productivities';

    async function loadData() {
        loading = true;
        try {
            const [resMi, resExt] = await Promise.all([
                fetch(MY_API_URL),
                fetch(PROXY_URL)
            ]);

            const miData = await resMi.json();
            const extDataRaw = await resExt.json();
            const extData = Array.isArray(extDataRaw) ? extDataRaw : (extDataRaw.data || []);

            stats = {
                myTotal: Math.round(miData.reduce((acc, curr) => acc + (Number(curr.waterProductivity) || 0), 0)),
                extTotal: Math.round(extData.reduce((acc, curr) => acc + (Number(curr.consumption) || 0), 0)),
                countMy: miData.length,
                countExt: extData.length
            };

            loading = false;
            await tick();
            renderChart();
        } catch (e) {
            error = "Error: " + e.message;
            loading = false;
        }
    }

    function renderChart() {
        bb.generate({
            data: {
                columns: [
                    ["Productividad Agua (G17)", stats.myTotal],
                    ["Consumo Especias (G20)", stats.extTotal]
                ],
                type: donut()
            },
            donut: {
                title: "Mashup G17-G20",
                width: 60
            },
            bindto: "#donutChart"
        });
    }

    onMount(loadData);
</script>

<main class="container">
    <div class="card">
        <header>
            <h1>Integración G17 & G20</h1>
            <p class="subtitle">Análisis comparativo de volúmenes de datos integrados</p>
            
            <div class="info-badge">
                <p><strong>Librería:</strong> Billboard.js</p>
                <p><strong>Tipo de Gráfica:</strong> Donut Chart (Circular)</p>
                <p><strong>Método:</strong> Petición vía Proxy Propio</p>
            </div>
        </header>

        {#if loading}
            <div class="msg">Cargando integración y normalizando datos...</div>
        {:else if error}
            <div class="msg error">{error}</div>
        {:else}
            <div class="chart-container">
                <div id="donutChart"></div>
            </div>

            <section class="table-section">
                <h3>Resumen de Integración</h3>
                <p class="description">
                    Esta tabla muestra la suma total de los valores de <strong>Productividad del Agua</strong> 
                    (procedentes de la API local G17) frente al <strong>Consumo de Especias</strong> 
                    (obtenidos mediante el proxy de la API externa G20).
                </p>
                <table>
                    <thead>
                        <tr>
                            <th>Fuente de Datos</th>
                            <th>Nº Registros</th>
                            <th>Suma Acumulada</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Mi API:</strong> Water Productivities</td>
                            <td>{stats.countMy}</td>
                            <td><span class="val">{stats.myTotal}</span> USD/m³</td>
                        </tr>
                        <tr>
                            <td><strong>Proxy:</strong> Spice Stats (G20)</td>
                            <td>{stats.countExt}</td>
                            <td><span class="val">{stats.extTotal}</span> Toneladas</td>
                        </tr>
                    </tbody>
                </table>
            </section>
        {/if}

        <div class="actions">
            <button onclick={() => window.location.href = '/integrations'}>
                &larr; Volver a Integraciones
            </button>
        </div>
    </div>
</main>

<style>
.container { max-width: 850px; margin: 40px auto; padding: 0 20px; }
    .card { background: white; border-radius: 12px; border: 1px solid #dcdde1; padding: 35px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    
    header { border-bottom: 2px solid #2f3640; margin-bottom: 25px; padding-bottom: 15px; }
    h1 { margin: 0; color: #2f3640; font-size: 1.8rem; }
    .subtitle { color: #7f8c8d; margin: 5px 0 15px 0; font-style: italic; }

    /* Estilo para los metadatos */
    .info-badge { 
        background: #f1f2f6; 
        padding: 10px 15px; 
        border-radius: 6px; 
        display: flex; 
        gap: 20px; 
        font-size: 0.85rem;
        color: #2f3640;
        border-left: 4px solid #4f5d39;
    }
    .info-badge p { margin: 0; }

    .chart-container { 
        position: relative;
        min-height: 350px; 
        margin: 30px 0;
        padding: 20px;
        border-radius: 8px;
        background: #ffffff;
        border: 1px dashed #ccc;
    }

    .description { font-size: 0.95rem; color: #576574; line-height: 1.5; margin-bottom: 15px; }
    
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 14px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8f9fa; color: #2f3640; font-weight: 600; }
    .val { font-weight: bold; color: #4f5d39; }

    .msg { padding: 30px; text-align: center; font-weight: bold; color: #2980b9; }
    .error { color: #e84118; background: #fdecea; }
    
    .actions { margin-top: 40px; text-align: center; }
    button { background: #4f5d39; color: white; border: none; padding: 12px 30px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: background 0.3s; }
    button:hover { background: #3d4a2b; }
</style>