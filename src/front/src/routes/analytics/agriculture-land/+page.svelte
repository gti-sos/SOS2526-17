<script>
    import { onMount } from 'svelte';

    onMount(async () => {
        // 1. Cargamos Highcharts y el módulo extra con el truco de compatibilidad
        const HC_Module = await import('highcharts');
        const Highcharts = HC_Module.default || HC_Module;
        
        const HCM_Module = await import('highcharts/highcharts-more');
        const HighchartsMore = HCM_Module.default || HCM_Module;
        
        const finalizeMore = (typeof HighchartsMore === 'function') 
            ? HighchartsMore 
            : HighchartsMore.default;

        if (typeof finalizeMore === 'function') {
            finalizeMore(Highcharts);
        }

        // 2. FETCH CORREGIDO A V1 ⚠️
        const res = await fetch('/api/v1/agriculture-land'); 
        
        if (res.ok) {
            const data = await res.json();
            
            Highcharts.chart('grafica-circular-rara', {
                chart: {
                    polar: true,
                    type: 'bubble',
                    backgroundColor: '#1a1a1a', 
                    style: { fontFamily: 'Inter, sans-serif' }
                },
                title: { 
                    text: '🌐 Análisis Multivariable Agrícola (V1)',
                    style: { color: '#ffffff', fontWeight: 'bold' }
                },
                subtitle: {
                    text: 'Burbuja: Tamaño=Índice | Distancia=Tierra | Posición=País',
                    style: { color: '#aaaaaa' }
                },
                legend: {
                    enabled: true,
                    itemStyle: { color: '#ffffff' }
                },
                xAxis: {
                    categories: data.slice(0, 15).map(d => d.country),
                    labels: { style: { color: '#cccccc' } },
                    gridLineColor: '#333333'
                },
                yAxis: { 
                    gridLineInterpolation: 'polygon',
                    gridLineColor: '#333333',
                    labels: { style: { color: '#888888' } }
                },
                tooltip: {
                    useHTML: true,
                    backgroundColor: '#262626',
                    style: { color: '#ffffff' },
                    headerFormat: '<small style="color:#2ecc71">{point.key}</small><table>',
                    pointFormat: '<tr><td style="color: #aaa">Año: </td><td><b>{point.year}</b></td></tr>' +
                                 '<tr><td style="color: #aaa">Tierra: </td><td><b>{point.y}%</b></td></tr>' +
                                 '<tr><td style="color: #aaa">Índice: </td><td><b>{point.z}</b></td></tr>',
                    footerFormat: '</table>'
                },
                plotOptions: {
                    bubble: {
                        minSize: 15,
                        maxSize: 60
                    }
                },
                series: [{
                    name: 'Datos del Recurso Agriculture-Land',
                    data: data.slice(0, 15).map((d, index) => ({
                        x: index,
                        y: parseFloat(d.land_agriculture || 0),
                        z: parseFloat(d.index || 1),
                        country: d.country,
                        year: d.year
                    })),
                    colorByPoint: true,
                    opacity: 0.8
                }]
            });
        } else {
            console.error("Error al acceder a la API V1. Status:", res.status);
        }
    });
</script>

<main>
    <div class="dark-card">
        <div id="grafica-circular-rara"></div>
    </div>
</main>

<style>
main { 
        display: flex; 
        justify-content: center; 
        padding: 40px; 
        min-height: 100vh;
        align-items: center;
    }
    .dark-card {
        background: #1a1a1a;
        padding: 30px;
        border-radius: 25px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        border: 1px solid #333;
        width: 100%;
        max-width: 900px;
    }
    #grafica-circular-rara { width: 100%; height: 600px; }
</style>