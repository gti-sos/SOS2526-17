<svelte:head>
    <script src="https://www.gstatic.com/charts/loader.js"></script>
</svelte:head>

<script>
    import { onMount } from 'svelte';

    let loading = $state(true);
    let error = $state('');
    let combinedData = $state([]);

    const PROXY_URL = '/api/v1/integrations-proxy/world-bank-gdp';
    const MY_API_URL = '/api/v1/water-productivities';

    async function loadData() {
        try {
            const [resMi, resWB] = await Promise.all([
                fetch(MY_API_URL),
                fetch(PROXY_URL)
            ]);

            if (!resWB.ok) throw new Error("Error al acceder al Proxy del Banco Mundial");

            const miData = await resMi.json();
            const wbDataRaw = await resWB.json();
            const wbData = wbDataRaw[1] || [];

            // Lógica de Limpieza: Evitamos duplicados para no romper el TreeMap
            const tempMap = new Map();

            miData.forEach(mi => {
                const countryName = mi.country;
                const ext = wbData.find(e => e.country.value.toLowerCase() === countryName.toLowerCase());
                
                if (ext && ext.value && !tempMap.has(countryName)) {
                    tempMap.set(countryName, {
                        country: countryName,
                        waterProd: mi.waterProductivity,
                        gdp: ext.value
                    });
                }
            });

            combinedData = Array.from(tempMap.values());

            if (combinedData.length === 0) throw new Error("No se encontraron coincidencias de países entre las APIs");

            loading = false;
            
            // Cargar Google Charts
            if (typeof google !== 'undefined') {
                google.charts.load('current', {'packages':['treemap']});
                google.charts.setOnLoadCallback(drawChart);
            } else {
                throw new Error("La librería de Google Charts no se cargó correctamente");
            }

        } catch (e) {
            error = e.message;
            loading = false;
        }
    }

    function drawChart() {
        const dataArray = [
            ['País', 'Parent', 'PIB (Tamaño)', 'Productividad Agua (Color)'],
            ['Global', null, 0, 0]
        ];

        combinedData.forEach(d => {
            dataArray.push([d.country, 'Global', d.gdp, d.waterProd]);
        });

        const data = google.visualization.arrayToDataTable(dataArray);
        const container = document.getElementById('chart_div');
        const chart = new google.visualization.TreeMap(container);

        chart.draw(data, {
            minColor: '#ff7675', // Rojo: Baja eficiencia
            midColor: '#ffeaa7', // Amarillo: Eficiencia media
            maxColor: '#55efc4', // Verde: Alta eficiencia
            headerHeight: 15,
            fontColor: 'black',
            showScale: true,
            generateTooltip: (row, size, value) => {
                return '<div style="background:#fff; padding:10px; border:1px solid #ccc">' +
                       '<strong>' + data.getValue(row, 0) + '</strong><br>' +
                       'PIB: ' + size.toLocaleString() + ' USD<br>' +
                       'Prod. Agua: ' + value + ' USD/m³</div>';
            }
        });
    }

    onMount(loadData);
</script>

<main class="container">
    <div class="card">
        <header>
            <h1>🌍 Mashup Económico-Hídrico</h1>
            <p class="subtitle">Integración con la API del Banco Mundial (World Bank)</p>
        </header>

        <section class="explanation-box">
            <h3>¿Cómo interpretar esta gráfica?</h3>
            <p>
                Este <strong>TreeMap</strong> permite comparar la riqueza total de una nación frente a su eficiencia en el uso del agua dulce:
            </p>
            <ul>
                <li><strong>Tamaño del recuadro:</strong> Representa el <strong>PIB Total</strong>. Cuanto más grande, mayor es la potencia económica del país.</li>
                <li><strong>Color del recuadro:</strong> Representa la <strong>Productividad del Agua</strong>. El paso del rojo al verde indica una transición de baja a alta eficiencia hídrica.</li>
            </ul>
        </section>

        {#if loading}
            <div class="loader">Sincronizando datos macroeconómicos...</div>
        {:else if error}
            <div class="error-msg">⚠️ {error}</div>
        {:else}
            <div id="chart_div" class="chart-frame"></div>

            <section class="table-container">
                <h3>Resumen de Datos Consolidados</h3>
                <table>
                    <thead>
                        <tr>
                            <th>País</th>
                            <th>PIB (Datos Banco Mundial)</th>
                            <th>Eficiencia Hídrica (Mi API)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each combinedData as d}
                            <tr>
                                <td><strong>{d.country}</strong></td>
                                <td class="number">{d.gdp.toLocaleString()} $</td>
                                <td class="number">{d.waterProd} USD/m³</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </section>
        {/if}

        <footer>
            <button class="btn-back" onclick={() => window.location.href = '/integrations'}>Volver a Integraciones</button>
        </footer>
    </div>
</main>

<style>
.container { max-width: 1000px; margin: 40px auto; padding: 0 20px; }
    .card { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
    
    header { border-bottom: 3px solid #55efc4; margin-bottom: 25px; padding-bottom: 10px; }
    h1 { color: #2d3436; margin: 0; }
    .subtitle { color: #636e72; font-style: italic; }

    .explanation-box { background: #e1f5fe; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 5px solid #03a9f4; }
    .explanation-box h3 { margin-top: 0; color: #01579b; }
    .explanation-box ul { font-size: 0.95rem; color: #2d3436; }

    .chart-frame { height: 450px; border: 1px solid #dfe6e9; border-radius: 8px; overflow: hidden; background: #fff; }

    .table-container { margin-top: 40px; }
    table { width: 100%; border-collapse: collapse; background: white; }
    th { background: #2d3436; color: white; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #dfe6e9; }
    .number { font-family: 'Courier New', Courier, monospace; font-weight: bold; }

    .loader { padding: 50px; text-align: center; color: #0984e3; font-weight: bold; }
    .error-msg { background: #ff7675; color: white; padding: 15px; border-radius: 8px; text-align: center; }
    
    footer { margin-top: 30px; text-align: center; }
    .btn-back { background: #2d3436; color: white; border: none; padding: 10px 25px; border-radius: 5px; cursor: pointer; transition: 0.3s; }
    .btn-back:hover { background: #000; }
</style>