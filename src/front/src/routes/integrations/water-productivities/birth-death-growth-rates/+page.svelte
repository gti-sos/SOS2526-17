<script>
    import { onMount, tick } from 'svelte';
    import bb, { spline } from "billboard.js";
    import "billboard.js/dist/billboard.css";

    let loading = $state(true);
    let error = $state('');
    let chartData = $state([]);

    // Rutas de las APIs
    const PROXY_URL = '/api/v1/integrations-proxy/birth-death-growth-rates';
    const MY_API_URL = '/api/v1/water-productivities';

    async function loadData() {
        loading = true;
        error = '';
        try {
            const [resMi, resDemo] = await Promise.all([
                fetch(MY_API_URL),
                fetch(PROXY_URL) // Asegúrate que PROXY_URL sea '/api/v1/integrations-proxy/birth-death-growth-rates'
            ]);

            if (!resDemo.ok) {
                throw new Error(`La API externa respondió con error ${resDemo.status}. Verifica el proxy en tu index.js`);
            }

            const miData = await resMi.json();
            const demoDataRaw = await resDemo.json();
            
            // LOG DE CONTROL: Mira la consola del navegador (F12) para ver qué llega exactamente
            console.log("Datos mi API:", miData);
            console.log("Datos API externa:", demoDataRaw);

            // IMPORTANTE: Algunas APIs devuelven un objeto con una propiedad 'data'
            const demoData = Array.isArray(demoDataRaw) ? demoDataRaw : (demoDataRaw.data || []);

            if (demoData.length === 0) {
                error = "La API externa no tiene datos cargados (está vacía).";
            }

            const years = [...new Set([
                ...miData.map(d => Number(d.year)),
                ...demoData.map(d => Number(d.year))
            ])].sort((a, b) => a - b);

            chartData = years.map(yr => {
                const myYear = miData.filter(d => Number(d.year) === yr);
                const demoYear = demoData.filter(d => Number(d.year) === yr);

                return {
                    year: yr,
                    waterProd: myYear.length > 0 ? (myYear.reduce((acc, curr) => acc + curr.waterProductivity, 0) / myYear.length) : 0,
                    growthRate: demoYear.length > 0 ? (demoYear.reduce((acc, curr) => acc + (curr.growth_rate || 0), 0) / demoYear.length) : 0
                };
            }).filter(d => d.waterProd > 0 || d.growthRate !== 0);

            loading = false;
            await tick();
            renderChart();
        } catch (e) {
            console.error(e);
            error = e.message;
            loading = false;
        }
    }

    function renderChart() {
        bb.generate({
            data: {
                x: "x",
                columns: [
                    ["x", ...chartData.map(d => d.year)],
                    ["Eficiencia Agua (USD/m3)", ...chartData.map(d => d.waterProd)],
                    ["Tasa Crecimiento (%)", ...chartData.map(d => d.growthRate)]
                ],
                type: spline(), // Gráfica de líneas suavizadas (Spline)
            },
            axis: {
                x: { label: "Evolución por Años" },
                y: { label: "Indicadores" }
            },
            bindto: "#splineChart"
        });
    }

    onMount(loadData);
</script>

<main class="container">
    <div class="card">
        <header>
            <h1>Water Efficiency & Demographics</h1>
            <p class="subtitle">Análisis de sostenibilidad hídrica frente al crecimiento poblacional</p>
            
            <div class="meta-info">
                <span><strong>Librería:</strong> Billboard.js</span>
                <span><strong>Gráfica:</strong> Spline Chart (Líneas suavizadas)</span>
                <span><strong>Integración:</strong> Birth-Death-Growth Stats</span>
            </div>
        </header>

        {#if loading}
            <div class="status">Sincronizando series demográficas e hídricas...</div>
        {:else if error}
            <div class="status error">{error}</div>
        {:else}
            <section class="description-box">
                <h3>Descripción de la Integración</h3>
                <p>
                    Esta vista analiza la relación entre el <strong>crecimiento demográfico</strong> (tasa de crecimiento anual) y la <strong>eficiencia en el uso del agua</strong>. 
                    El objetivo es observar si los periodos de mayor expansión poblacional coinciden con mejoras en la productividad del agua (USD generados por m³), 
                    lo cual indicaría una adaptación tecnológica y económica ante el aumento de la demanda hídrica.
                </p>
            </section>

            <div class="chart-area">
                <div id="splineChart"></div>
            </div>

            <section class="table-area">
                <h3>Uso Textual: Promedios Anuales Consolidados</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Año</th>
                            <th>Prod. Agua Media (G17)</th>
                            <th>Tasa Crecimiento Media (Externo)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each chartData as item}
                            <tr>
                                <td><strong>{item.year}</strong></td>
                                <td class="text-blue">{item.waterProd || "N/A"} USD/m³</td>
                                <td class="text-purple">{item.growthRate || "N/A"} %</td>
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
.container { max-width: 900px; margin: 40px auto; padding: 0 20px; }
    .card { background: white; padding: 35px; border-radius: 12px; box-shadow: 0 4px 25px rgba(0,0,0,0.06); }
    
    header { border-bottom: 2px solid #6c5ce7; padding-bottom: 20px; margin-bottom: 30px; }
    h1 { margin: 0; color: #2d3436; font-size: 1.7rem; }
    .subtitle { color: #636e72; margin: 5px 0 15px; }

    .meta-info { display: flex; gap: 20px; font-size: 0.8rem; background: #f1f2f6; padding: 10px; border-radius: 6px; }

    .description-box { background: #f8faff; padding: 20px; border-left: 5px solid #6c5ce7; margin-bottom: 30px; line-height: 1.6; }
    .description-box h3 { margin: 0 0 10px; color: #6c5ce7; font-size: 1.1rem; }

    .chart-area { min-height: 400px; background: #fff; padding: 15px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 30px; }

    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; background: #2d3436; color: white; padding: 12px; font-size: 0.85rem; }
    td { padding: 12px; border-bottom: 1px solid #f1f2f6; }
    
    .text-blue { color: #0984e3; font-weight: bold; }
    .text-purple { color: #6c5ce7; font-weight: bold; }

    .status { text-align: center; padding: 40px; font-weight: bold; }
    .error { color: #d63031; background: #fab1a0; border-radius: 8px; }
    
    .footer { text-align: center; margin-top: 30px; }
    button { background: #2d3436; color: white; border: none; padding: 12px 35px; border-radius: 6px; cursor: pointer; transition: 0.3s; }
    button:hover { background: #000; }
</style>