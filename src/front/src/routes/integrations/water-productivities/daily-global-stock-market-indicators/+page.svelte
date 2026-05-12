<script>
    import { onMount, tick } from 'svelte';
    import bb, { radar } from "billboard.js";
    import "billboard.js/dist/billboard.css";

    let loading = $state(true);
    let error = $state('');
    let regionalData = $state([]);

    const PROXY_URL = '/api/v1/integrations-proxy/daily-global-stock-market-indicators';
    const MY_API_URL = '/api/v1/water-productivities';

    async function loadData() {
        loading = true;
        try {
            const [resMi, resStock] = await Promise.all([
                fetch(MY_API_URL),
                fetch(PROXY_URL)
            ]);

            const miData = await resMi.json();
            const stockDataRaw = await resStock.json();
            const stockData = Array.isArray(stockDataRaw) ? stockDataRaw : (stockDataRaw.data || []);

            // Definimos las regiones basadas en AMBAS APIs
            const regions = ["Asia", "North America", "Europe", "Africa", "South America", "Middle East"];
            
            regionalData = regions.map(reg => {
                // 1. Filtrar Bolsa (G10)
                const stocksInReg = stockData.filter(s => s.region === reg);
                const avgStockChange = stocksInReg.length > 0 
                    ? stocksInReg.reduce((acc, curr) => acc + curr.daily_change_percent, 0) / stocksInReg.length 
                    : 0;

                // 2. Filtrar Tu API (G17) con tus países exactos
                const mapping = {
                    "Asia": ["Afghanistan"],
                    "North America": [], // Tu lista actual no tiene NA, pero la dejamos por estructura
                    "Europe": ["Albania", "Spain", "Denmark"],
                    "Africa": ["Angola"],
                    "South America": ["Argentina"],
                    "Middle East": ["United Arab Emirates", "Barbados"] // Agrupamos islas/emiratos
                };

                const myProductivities = miData.filter(d => mapping[reg]?.includes(d.country));
                const avgWaterProd = myProductivities.length > 0
                    ? myProductivities.reduce((acc, curr) => acc + curr.waterProductivity, 0) / myProductivities.length
                    : 0;

                return {
                    region: reg,
                    stockChange: Number(avgStockChange).toFixed(2),
                    waterProd: Number(avgWaterProd).toFixed(2)
                };
            });

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
                x: "x",
                columns: [
                    ["x", ...regionalData.map(d => d.region)],
                    ["Eficiencia Agua (USD/m3)", ...regionalData.map(d => d.waterProd)],
                    ["Rendimiento Bolsa (%)", ...regionalData.map(d => d.stockChange)]
                ],
                type: radar(),
                labels: true
            },
            radar: {
                axis: { max: 150 } // Ajustado porque UAE y Dinamarca tienen valores altos (>100)
            },
            bindto: "#radarChart"
        });
    }

    onMount(loadData);
</script>

<main class="container">
    <div class="card">
        <header>
            <h1>Water Efficiency & Market Performance</h1>
            <p class="subtitle">Comparativa Multiregional (Datos Reales G17)</p>
            
            <div class="badge-row">
                <span class="badge"><strong>Librería:</strong> Billboard.js</span>
                <span class="badge"><strong>Gráfica:</strong> Radar (Spider)</span>
                <span class="badge"><strong>Integración:</strong> Stock Market Proxy</span>
            </div>
        </header>

        {#if loading}
            <div class="loading-state">Calculando promedios por región...</div>
        {:else if error}
            <div class="msg error">{error}</div>
        {:else}
            <section class="description">
                <h3>Interpretación del Radar</h3>
                <p>
                    Esta gráfica compara la <strong>Productividad Hídrica</strong> de los países (España, Dinamarca, Angola, etc.) 
                    agrupados por regiones, frente al <strong>Cambio Diario</strong> de los principales índices bursátiles. 
                </p>
            </section>

            <div class="chart-area">
                <div id="radarChart"></div>
            </div>

            <section class="table-area">
                <h3>Uso Textual: Datos por Región</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Región</th>
                            <th>Países G17 Incluidos</th>
                            <th>Media Agua (USD/m³)</th>
                            <th>Media Bolsa (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each regionalData as item}
                            <tr>
                                <td><strong>{item.region}</strong></td>
                                <td class="small-text">
                                    {item.region === "Asia" ? "Afghanistan" : 
                                     item.region === "Europe" ? "Spain, Albania, Denmark" :
                                     item.region === "Africa" ? "Angola" :
                                     item.region === "South America" ? "Argentina" :
                                     item.region === "Middle East" ? "UAE, Barbados" : "N/A"}
                                </td>
                                <td class="bold-blue">{item.waterProd}</td>
                                <td class={item.stockChange >= 0 ? "bold-green" : "bold-red"}>
                                    {item.stockChange}%
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </section>
        {/if}

        <footer class="footer">
            <button class="btn-back" onclick={() => window.location.href = '/integrations'}>
                Volver al listado
            </button>
        </footer>
    </div>
</main>

<style>
    :global(body) { background: #f5f6fa; color: #2f3640; font-family: 'Segoe UI', sans-serif; }
    .container { max-width: 950px; margin: 30px auto; padding: 0 15px; }
    .card { background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
    
    header { border-bottom: 2px solid #dcdde1; padding-bottom: 15px; margin-bottom: 20px; }
    h1 { margin: 0; color: #2f3640; }
    .subtitle { color: #7f8c8d; margin: 5px 0 15px 0; }
    
    .badge-row { display: flex; gap: 15px; }
    .badge { background: #f1f2f6; padding: 5px 12px; border-radius: 4px; font-size: 0.8rem; border: 1px solid #dcdde1; }

    .description { background: #e8f4fd; padding: 15px; border-radius: 6px; border-left: 5px solid #3498db; margin-bottom: 20px; }
    .description h3 { margin: 0 0 5px 0; font-size: 1rem; color: #2980b9; }
    .description p { margin: 0; font-size: 0.9rem; }

    .chart-area { min-height: 400px; padding: 10px; border: 1px solid #f1f2f6; border-radius: 8px; margin-bottom: 30px; }

    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; background: #2f3640; color: white; padding: 12px; font-size: 0.85rem; }
    td { padding: 12px; border-bottom: 1px solid #f1f2f6; font-size: 0.9rem; }
    
    .small-text { font-size: 0.75rem; color: #7f8c8d; }
    .bold-blue { color: #3498db; font-weight: bold; }
    .bold-green { color: #2ecc71; font-weight: bold; }
    .bold-red { color: #e74c3c; font-weight: bold; }

    .loading-state { text-align: center; padding: 40px; font-style: italic; }
    .footer { text-align: center; margin-top: 30px; }
    .btn-back { background: #2f3640; color: white; border: none; padding: 10px 25px; border-radius: 5px; cursor: pointer; }
</style>