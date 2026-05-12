<script>
    import { onMount, tick } from 'svelte';
    import bb, { area } from "billboard.js";
    import "billboard.js/dist/billboard.css";

    let loading = $state(true);
    let error = $state('');
    let yearlyStats = $state([]);

    const PROXY_URL = '/api/v1/integrations-proxy/global-ev-sales';
    const MY_API_URL = '/api/v1/water-productivities';

    async function loadData() {
        loading = true;
        try {
            const [resMi, resEV] = await Promise.all([
                fetch(MY_API_URL),
                fetch(PROXY_URL)
            ]);

            const miData = await resMi.json();
            const evDataRaw = await resEV.json();
            const evData = Array.isArray(evDataRaw) ? evDataRaw : (evDataRaw.data || []);

            // Obtenemos todos los años presentes en ambas APIs para crear una línea de tiempo
            const allYears = [...new Set([
                ...miData.map(d => Number(d.year)),
                ...evData.map(d => Number(d.year))
            ])].sort((a, b) => a - b);

            // Filtramos solo años que tengan sentido (ej. desde 1970 hasta 2024)
            const filteredYears = allYears.filter(y => y >= 1970 && y <= 2025);

            yearlyStats = filteredYears.map(year => {
                const myYearly = miData.filter(d => Number(d.year) === year);
                const evYearly = evData.filter(d => Number(d.year) === year);

                return {
                    year,
                    // Media de productividad de agua en ese año
                    waterProd: myYearly.length > 0 
                        ? (myYearly.reduce((acc, curr) => acc + curr.waterProductivity, 0) / myYearly.length).toFixed(2)
                        : 0,
                    // Media de impacto económico EV en ese año
                    evImpact: evYearly.length > 0 
                        ? (evYearly.reduce((acc, curr) => acc + curr.economic_impact, 0) / evYearly.length).toFixed(2)
                        : 0
                };
            }).filter(d => d.waterProd > 0 || d.evImpact > 0); // Solo mostramos años con algún dato

            loading = false;
            await tick();
            renderChart();
        } catch (e) {
            error = "Error integrando datos temporales: " + e.message;
            loading = false;
        }
    }

    function renderChart() {
        bb.generate({
            data: {
                x: "x",
                columns: [
                    ["x", ...yearlyStats.map(d => d.year)],
                    ["Media Prod. Agua (G17)", ...yearlyStats.map(d => d.waterProd)],
                    ["Media Impacto EV (G16)", ...yearlyStats.map(d => d.evImpact)]
                ],
                type: area(), // Tipo de gráfica: Área
            },
            axis: {
                x: {
                    label: "Evolución Temporal (Años)",
                    tick: { fit: true }
                },
                y: {
                    label: "Valor Promedio"
                }
            },
            bindto: "#areaChart"
        });
    }

    onMount(loadData);
</script>

<main class="container">
    <div class="card">
        <header>
            <h1>Evolución: Agua vs Movilidad Eléctrica</h1>
            <p class="subtitle">Comparativa de tendencias históricas anuales</p>
            
            <div class="info-row">
                <span class="tag"><strong>Librería:</strong> Billboard.js</span>
                <span class="tag"><strong>Gráfica:</strong> Area Chart</span>
                <span class="tag"><strong>Proxy:</strong> global-ev-sales</span>
            </div>
        </header>

        {#if loading}
            <div class="loading">Procesando series temporales...</div>
        {:else if error}
            <div class="msg error">{error}</div>
        {:else}
            <section class="context">
                <h3>Análisis de Tendencias</h3>
                <p>
                    Esta gráfica de <strong>Área</strong> permite visualizar cómo han evolucionado simultáneamente la productividad media del agua (de los datos disponibles) y el impacto económico del sector EV a lo largo de los años. 
                </p>
            </section>

            <div class="chart-container">
                <div id="areaChart"></div>
            </div>

            <section class="table-section">
                <h3>Datos Consolidados por Año (HTML)</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Año</th>
                            <th>Media Prod. Agua (USD/m³)</th>
                            <th>Media Impacto EV (M€)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each yearlyStats as item}
                            <tr>
                                <td><strong>{item.year}</strong></td>
                                <td class="text-blue">{item.waterProd}</td>
                                <td class="text-green">{item.evImpact}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </section>
        {/if}

        <footer class="footer">
            <button onclick={() => window.location.href = '/integrations'}>Volver</button>
        </footer>
    </div>
</main>

<style>
    :global(body) { background: #fdfdfd; font-family: 'Inter', sans-serif; }
    .container { max-width: 900px; margin: 30px auto; padding: 0 20px; }
    .card { background: white; padding: 30px; border-radius: 10px; border: 1px solid #eee; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
    
    header { border-bottom: 2px solid #00b894; margin-bottom: 25px; padding-bottom: 10px; }
    .info-row { display: flex; gap: 15px; margin-top: 10px; }
    .tag { font-size: 0.75rem; background: #f1f2f6; padding: 4px 10px; border-radius: 4px; color: #2d3436; }

    .context { background: #f0fff4; padding: 15px; border-left: 4px solid #00b894; margin-bottom: 20px; font-size: 0.9rem; }

    .chart-container { min-height: 350px; margin: 20px 0; }

    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; background: #2d3436; color: white; padding: 10px; font-size: 0.85rem; }
    td { padding: 10px; border-bottom: 1px solid #f1f2f6; font-size: 0.9rem; }
    
    .text-blue { color: #0984e3; font-weight: bold; }
    .text-green { color: #00b894; font-weight: bold; }

    .loading { text-align: center; padding: 40px; color: #636e72; }
    .footer { text-align: center; margin-top: 30px; }
    button { background: #2d3436; color: white; border: none; padding: 10px 25px; border-radius: 5px; cursor: pointer; }
</style>