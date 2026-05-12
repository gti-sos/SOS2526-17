<script>
    import { onMount } from 'svelte';
    import { Chart } from 'frappe-charts'; 

    let loading = $state(true);
    let error = $state('');
    let combinedData = $state([]);

    async function loadData() {
        try {
            // 1. Obtener Población Mundial (API REST Countries)
            const resPop = await fetch('https://restcountries.com/v3.1/all?fields=name,population');
            if (!resPop.ok) throw new Error("Error en API de Población");
            const popData = await resPop.json();

            // 2. Obtener tus datos de agua (G17)
            const resMi = await fetch('/api/v1/water-productivities');
            const miData = await resMi.json();

            // 3. Lógica de Promedios por País
            const stats = miData.reduce((acc, curr) => {
                if (!acc[curr.country]) acc[curr.country] = { sum: 0, count: 0 };
                acc[curr.country].sum += curr.waterProductivity;
                acc[curr.country].count += 1;
                return acc;
            }, {});

            combinedData = Object.keys(stats).map(countryName => {
                const avgProd = stats[countryName].sum / stats[countryName].count;
                const countryPop = popData.find(c => 
                    c.name.common === countryName || c.name.official === countryName
                );

                return {
                    country: countryName,
                    avgProd: parseFloat(avgProd.toFixed(2)),
                    population: countryPop ? countryPop.population : 0
                };
            }).filter(d => d.population > 0);

            loading = false;
            setTimeout(renderChart, 100);
        } catch (e) {
            error = e.message;
            loading = false;
        }
    }

    function renderChart() {
        new Chart("#chart-pop", {
            title: "Distribución: Población vs Productividad Hídrica",
            data: {
                labels: combinedData.map(d => d.country),
                datasets: [
                    { 
                        name: "Población (Millones)", 
                        values: combinedData.map(d => parseFloat((d.population / 1000000).toFixed(2))) 
                    },
                    { 
                        name: "Eficiencia (USD/m³)", 
                        values: combinedData.map(d => d.avgProd) 
                    }
                ]
            },
            type: 'bar', // Gráfica de barras agrupadas
            height: 300,
            colors: ['#636e72', '#0984e3'],
            barOptions: { spaceRatio: 0.5 }
        });
    }

    onMount(loadData);
</script>

<main class="container">
    <header>
        <h1>👥 Población y Gestión Hídrica</h1>
        <p class="tagline">Análisis demográfico con <strong>REST Countries API</strong></p>
    </header>

    <div class="tech-badge">
        <strong>Librería:</strong> Frappe Charts | <strong>Tipo:</strong> Agrupada (Multi-Bar)
        <p>Esta integración cruza datos demográficos oficiales con la media de eficiencia de nuestra API.</p>
    </div>

    {#if loading}
        <div class="loading">Cargando datos demográficos...</div>
    {:else if error}
        <div class="error">{error}</div>
    {:else}
        <div class="chart-box">
            <div id="chart-pop"></div>
        </div>

        <section class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>País</th>
                        <th>Población Real</th>
                        <th>Eficiencia Media</th>
                    </tr>
                </thead>
                <tbody>
                    {#each combinedData as d}
                        <tr>
                            <td><strong>{d.country}</strong></td>
                            <td>{d.population.toLocaleString()} hab.</td>
                            <td class="highlight">{d.avgProd} USD/m³</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}
</main>

<style>
    .container { max-width: 900px; margin: auto; padding: 20px; font-family: sans-serif; }
    header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0984e3; padding-bottom: 10px; }
    .tech-badge { background: #f1f2f6; border-left: 5px solid #0984e3; padding: 15px; margin-bottom: 25px; border-radius: 4px; }
    .chart-box { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    
    table { width: 100%; border-collapse: collapse; margin-top: 30px; }
    th { background: #2f3640; color: white; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #dcdde1; }
    .highlight { color: #0984e3; font-weight: bold; }
    .error { color: #d63031; background: #fab1a0; padding: 20px; border-radius: 5px; text-align: center; }
    .loading { text-align: center; padding: 50px; font-style: italic; color: #0984e3; }
</style>