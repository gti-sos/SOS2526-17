<script>
    import { onMount } from 'svelte';

    onMount(async () => {
        const Highcharts = (await import('highcharts')).default;

        // --- 1. CARGA DE LAS 3 APIs DEL GRUPO 17 ---
        
        // MIEMBRO 1: (Water Productivities)
        const res1 = await fetch('/api/v1/water-productivities');
        const data1 = res1.ok ? await res1.json() : [];

        // MIEMBRO 2: (Renewable Energy Consumptions)
        const res2 = await fetch('/api/v1/renewable-energy-consumptions');
        const data2 = res2.ok ? await res2.json() : [];

        // MIEMBRO 3: (Agriculture Land)
        const res3 = await fetch('/api/v1/agriculture-land');
        const data3 = res3.ok ? await res3.json() : [];

        // --- 2. PROCESAMIENTO ---
        const normalizeCountry = (value) => (value || '').trim();
        const matchCountry = (data, country) =>
            data.find(item => normalizeCountry(item.country).toLowerCase() === country.toLowerCase());
        const renewableTotal = (item) =>
            ['wind', 'hydro', 'solar', 'other'].reduce(
                (sum, key) => sum + (parseFloat(item?.[key]) || 0),
                0
            );
        const normalizeSeries = (values) => {
            const max = Math.max(...values, 0);
            return values.map(value => (max > 0 ? Number(((value / max) * 100).toFixed(2)) : 0));
        };

        const categories = Array.from(
            new Set([
                ...data1.map(d => normalizeCountry(d.country)),
                ...data2.map(d => normalizeCountry(d.country)),
                ...data3.map(d => normalizeCountry(d.country))
            ])
        )
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, 'es'))
            .slice(0, 12);

        const waterProductivityValues = categories.map(country => {
            const d = matchCountry(data1, country);
            return d ? parseFloat(d.waterProductivity || 0) : 0;
        });

        const renewableValues = categories.map(country => {
            const d = matchCountry(data2, country);
            return d ? renewableTotal(d) : 0;
        });

        const agricultureValues = categories.map(country => {
            const d = matchCountry(data3, country);
            return d ? parseFloat(d.land_agriculture || 0) : 0;
        });

        Highcharts.chart('grafica-grupal-17', {
            chart: {
                type: 'column',
                backgroundColor: 'transparent',
                style: { fontFamily: "'Inter', sans-serif" }
            },
            title: {
                text: 'Dashboard de Análisis Integrado',
                style: { color: '#2c3e50', fontWeight: '600', fontSize: '24px' }
            },
            subtitle: {
                text: 'Comparativa normalizada entre agua, energías renovables y tierra agrícola',
                style: { color: '#7f8c8d' }
            },
            xAxis: {
                categories: categories,
                labels: { style: { color: '#7f8c8d', fontSize: '11px' } },
                lineColor: '#dcdde1'
            },
            yAxis: {
                title: { text: 'Índice normalizado (0-100)', style: { color: '#95a5a6' } },
                gridLineColor: '#f0f2f5',
                labels: { style: { color: '#95a5a6' } }
            },
            legend: {
                itemStyle: { color: '#34495e', fontWeight: '500' }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                borderRadius: 12,
                shared: true,
                useHTML: true,
                headerFormat: '<span style="font-size:12px; font-weight:bold; color:#2c3e50">{point.key}</span><br/>',
                borderWidth: 1,
                valueDecimals: 2,
                borderColor: '#eee'
            },
            plotOptions: {
                column: {
                    borderRadius: 6,
                    borderWidth: 0,
                    dataLabels: {
                        enabled: false
                    }
                }
            },
            series: [
                {
                    name: 'Productividad del Agua',
                    data: normalizeSeries(waterProductivityValues),
                    color: '#4895ef'
                },
                {
                    name: 'Consumo de Energía Renovable',
                    data: normalizeSeries(renewableValues),
                    color: '#f59e0b'
                },
                {
                    name: 'Superficie Agrícola (Tierra)', 
                    data: normalizeSeries(agricultureValues),
                    color: '#84a59d' // Verde Salvia
                }
            ]
        });
    });
</script>

<main>
    <div class="container">
        <div class="glass-card">
            <div id="grafica-grupal-17"></div>
            <div class="analytics-links">
                <a class="analytics-link" href="/analytics/water-productivities">Productividad del agua</a>
                <a class="analytics-link" href="/analytics/agriculture-land">Tierra agrícola</a>
                <a class="analytics-link" href="/analytics/renewable-energy-consumptions">Energías renovables</a>
            </div>
            <div class="footer-note">
                <span class="badge">Grupo 17</span>
                <p>Visualización Conjunta - Datos Sincronizados</p>
            </div>
        </div>
    </div>
</main>

<style>
.container {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 40px 20px;
    }

    .glass-card {
        background: rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(15px);
        padding: 40px;
        border-radius: 35px;
        box-shadow: 0 25px 50px rgba(0,0,0,0.06);
        width: 100%;
        max-width: 1100px;
        border: 1px solid rgba(255,255,255,0.4);
    }

    #grafica-grupal-17 {
        width: 100%;
        height: 550px;
    }

    .footer-note {
        margin-top: 35px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }

    .badge {
        background: #4a5568;
        color: white;
        padding: 5px 15px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.2px;
    }

    .footer-note p {
        color: #a0aec0;
        font-size: 13px;
        margin: 0;
    }

    .analytics-links {
        display: flex;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 20px;
    }

    .analytics-link {
        text-decoration: none;
        color: #2c3e50;
        background: #f7f9fb;
        border: 1px solid #e6edf3;
        padding: 10px 14px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 600;
        transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    }

    .analytics-link:hover {
        transform: translateY(-1px);
        box-shadow: 0 10px 20px rgba(44, 62, 80, 0.08);
        background: #ffffff;
    }
</style>
