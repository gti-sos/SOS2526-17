<script>
    import { onMount } from 'svelte';
    import { Chart } from 'frappe-charts'; 

    let loading = $state(true);
    let error = $state('');
    let combinedData = $state([]);

    // Coordenadas reales de capitales para el cruce geográfico
    const capitals = {
        "Spain": { lat: 40.41, lon: -3.70 },
        "Denmark": { lat: 55.67, lon: 12.56 },
        "Afghanistan": { lat: 34.52, lon: 69.17 },
        "Albania": { lat: 41.32, lon: 19.81 },
        "Argentina": { lat: -34.60, lon: -58.38 }
    };

    async function loadData() {
        try {
            // 1. Obtención de datos de tu API (G17)
            const resMi = await fetch('/api/v1/water-productivities');
            const miData = await resMi.json();

            // 2. Lógica de Agrupación: Calcular la PRODUCTIVIDAD MEDIA por país
            const statsByCountry = miData.reduce((acc, curr) => {
                if (!acc[curr.country]) {
                    acc[curr.country] = { sum: 0, count: 0 };
                }
                acc[curr.country].sum += curr.waterProductivity;
                acc[curr.country].count += 1;
                return acc;
            }, {});

            const averagedMiData = Object.keys(statsByCountry).map(country => ({
                country: country,
                avgWaterProd: parseFloat((statsByCountry[country].sum / statsByCountry[country].count).toFixed(2))
            }));

            // 3. Consulta a Open-Meteo para obtener el CLIMA REAL (Sin Proxy)
            const weatherPromises = averagedMiData.map(async (item) => {
                const geo = capitals[item.country];
                if (geo) {
                    const url = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&current_weather=true`;
                    const resW = await fetch(url);
                    const wData = await resW.json();
                    
                    return {
                        country: item.country,
                        waterProd: item.avgWaterProd,
                        temp: wData.current_weather.temperature
                    };
                }
                return null;
            });

            const results = await Promise.all(weatherPromises);
            combinedData = results.filter(r => r !== null);

            loading = false;
            setTimeout(renderChart, 100);
        } catch (e) {
            error = "Error al sincronizar datos: " + e.message;
            loading = false;
        }
    }

    function renderChart() {
        new Chart("#chart-weather", {
            title: "Análisis: Clima Real vs. Eficiencia Hídrica Media",
            data: {
                labels: combinedData.map(d => d.country),
                datasets: [
                    { name: "Temperatura (ºC)", chartType: "bar", values: combinedData.map(d => d.temp) },
                    { name: "Productividad Media (USD/m³)", chartType: "line", values: combinedData.map(d => d.waterProd) }
                ]
            },
            type: 'axis-mixed', // Gráfica mixta (Barra + Línea)
            height: 300,
            colors: ['#ff9f43', '#0abde3']
        });
    }

    onMount(loadData);
</script>

<main class="container">
    <header>
        <h1>🌦️ Mashup Ambiental: Clima y Productividad</h1>
        <p class="tagline">Integración directa con <strong>Open-Meteo API</strong></p>
    </header>

    <section class="tech-info">
        <h3>📊 Detalles de la Visualización</h3>
        <p>
            Esta integración utiliza la librería <strong>Frappe Charts</strong> para generar una 
            <strong>gráfica mixta (Axis Mixed)</strong>. Este tipo de visualización nos permite 
            superponer dos unidades de medida distintas en un mismo eje:
        </p>
        <ul>
            <li><strong>Barras (Naranja):</strong> Representan la temperatura actual en tiempo real de las capitales.</li>
            <li><strong>Línea (Azul):</strong> Representa la productividad del agua <strong>media</strong> calculada a partir de los registros de nuestra API.</li>
        </ul>
        <p class="note"><em>* La petición se realiza directamente desde el cliente (sin proxy) y los datos de productividad se promedian automáticamente para países con múltiples registros.</em></p>
    </section>

    {#if loading}
        <div class="status">Sincronizando con estaciones meteorológicas...</div>
    {:else if error}
        <div class="error-msg">{error}</div>
    {:else}
        <div class="chart-container">
            <div id="chart-weather"></div>
        </div>

        <section class="table-container">
            <h3>Tabla de Datos Consolidados</h3>
            <table>
                <thead>
                    <tr>
                        <th>País de Estudio</th>
                        <th>Temperatura Real (ºC)</th>
                        <th>Productividad Media (G17)</th>
                    </tr>
                </thead>
                <tbody>
                    {#each combinedData as d}
                        <tr>
                            <td><strong>{d.country}</strong></td>
                            <td class="temp-val">{d.temp} ºC</td>
                            <td class="prod-val">{d.waterProd} USD/m³</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}

    <div class="footer-actions">
        <button onclick={() => window.location.href = '/integrations'}>Volver a Integraciones</button>
    </div>
</main>

<style>
    .container { max-width: 950px; margin: 40px auto; padding: 20px; font-family: 'Segoe UI', sans-serif; color: #2c3e50; }
    header { text-align: center; border-bottom: 2px solid #0abde3; margin-bottom: 30px; }
    .tagline { color: #7f8c8d; font-style: italic; }

    .tech-info { background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 5px solid #0abde3; margin-bottom: 30px; }
    .tech-info h3 { margin-top: 0; color: #2980b9; }
    .note { font-size: 0.85rem; color: #576574; margin-top: 10px; }

    .chart-container { background: #fff; padding: 25px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); margin-bottom: 40px; }
    
    table { width: 100%; border-collapse: collapse; background: white; }
    th { background: #34495e; color: white; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    
    .temp-val { color: #e67e22; font-weight: bold; }
    .prod-val { color: #2980b9; font-weight: bold; }

    .status { text-align: center; padding: 40px; font-weight: bold; }
    .error-msg { background: #ffeded; color: #c0392b; padding: 20px; border-radius: 6px; text-align: center; }
    .footer-actions { text-align: center; margin-top: 30px; }
    button { background: #34495e; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
</style>