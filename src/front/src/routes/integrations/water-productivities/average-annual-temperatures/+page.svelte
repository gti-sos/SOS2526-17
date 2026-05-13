<script>
    import { onMount } from 'svelte';
    import * as echarts from 'echarts';

    let loading = $state(true);
    let combinedData = $state([]);

    const API_TEMP = "https://sos2526-25.onrender.com/api/v2/average-annual-temperatures";
    const MY_API = "/api/v1/water-productivities";

    async function loadData() {
        try {
            const [resTemp, resMi] = await Promise.all([fetch(API_TEMP), fetch(MY_API)]);
            const tempData = await resTemp.json();
            const miData = await resMi.json();

            // 1. Promediar Datos Externos (Temperatura y CO2)
            const statsTemp = tempData.reduce((acc, curr) => {
                if (!acc[curr.country]) acc[curr.country] = { co2: 0, temp: 0, count: 0 };
                acc[curr.country].co2 += curr.co2_emission;
                acc[curr.country].temp += curr.temperature;
                acc[curr.country].count += 1;
                return acc;
            }, {});

            // 2. Promediar Mis Datos (Water Productivity)
            const statsMi = miData.reduce((acc, curr) => {
                if (!acc[curr.country]) acc[curr.country] = { prod: 0, count: 0 };
                acc[curr.country].prod += curr.waterProductivity;
                acc[curr.country].count += 1;
                return acc;
            }, {});

            // 3. Cruzar datos por país
            combinedData = Object.keys(statsTemp)
                .filter(country => statsMi[country]) // Solo si está en ambos
                .map(country => ({
                    name: country,
                    co2: statsTemp[country].co2 / statsTemp[country].count,
                    temp: statsTemp[country].temp / statsTemp[country].count,
                    prod: statsMi[country].prod / statsMi[country].count
                })).slice(0, 6); // Limitamos a 6 para que el radar sea legible

            loading = false;
            setTimeout(renderChart, 100);
        } catch (e) {
            console.error(e);
            loading = false;
        }
    }

    function renderChart() {
        const chartDom = document.getElementById('radar-chart');
        const myChart = echarts.init(chartDom);
        
        const option = {
            title: { text: 'Análisis Multivariable: Agua vs Clima' },
            legend: { data: combinedData.map(d => d.name), bottom: 0 },
            radar: {
                indicator: [
                    { name: 'CO2 (Promedio)', max: 1000 },
                    { name: 'Temperatura (ºC)', max: 30 },
                    { name: 'Eficiencia Agua (USD/m³)', max: 150 }
                ]
            },
            series: [{
                name: 'Datos por País',
                type: 'radar',
                data: combinedData.map(d => ({
                    value: [d.co2.toFixed(2), d.temp.toFixed(2), d.prod.toFixed(2)],
                    name: d.name
                }))
            }]
        };
        myChart.setOption(option);
    }

    onMount(loadData);
</script>

<main class="container">
    <h1>🌍 Sostenibilidad y Emisiones (API SOS v2)</h1>
    
    <section class="info">
        <p><strong>Librería:</strong> ECharts | <strong>Tipo:</strong> Radar Chart</p>
        <p>Integración directa con la API de Temperaturas de SOS (Grupo 25) para analizar la huella de CO2 frente a la productividad del agua.</p>
    </section>

    {#if loading}
        <p>Cargando indicadores ambientales...</p>
    {:else}
        <div id="radar-chart" style="width: 100%; height: 500px;"></div>

        <table>
            <thead>
                <tr>
                    <th>País</th>
                    <th>Media CO2</th>
                    <th>Media Temp.</th>
                    <th>Prod. Agua Media</th>
                </tr>
            </thead>
            <tbody>
                {#each combinedData as d}
                    <tr>
                        <td>{d.name}</td>
                        <td>{d.co2.toFixed(2)}</td>
                        <td>{d.temp.toFixed(2)} ºC</td>
                        <td>{d.prod.toFixed(2)} USD/m³</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</main>

<style>
    .container { max-width: 1000px; margin: auto; padding: 20px; }
    .info { background: #f4f4f4; padding: 15px; border-left: 5px solid #2ecc71; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #2ecc71; color: white; }
</style>