<script>
    import { onMount, onDestroy } from 'svelte';

    let chartRef;
    let loading = $state(true);
    let error = $state('');

    onMount(async () => {
        try {
            const HC_Module = await import('highcharts');
            const Highcharts = HC_Module.default || HC_Module;

            const TM_Module = await import('highcharts/modules/treemap');
            const TreemapModule = TM_Module.default || TM_Module;

            if (typeof TreemapModule === 'function') {
                TreemapModule(Highcharts);
            }

            const res = await fetch('/api/v1/renewable-energy-consumptions');
            if (!res.ok) {
                throw new Error(`No se pudo obtener la API (${res.status})`);
            }

            const raw = await res.json();
            const parsed = raw
                .map((d) => {
                    const wind = Number(d.wind) || 0;
                    const hydro = Number(d.hydro) || 0;
                    const solar = Number(d.solar) || 0;
                    const other = Number(d.other) || 0;
                    const total = wind + hydro + solar + other;

                    return {
                        country: d.country,
                        year: d.year,
                        wind,
                        hydro,
                        solar,
                        other,
                        total
                    };
                })
                .filter((d) => d.total > 0)
                .sort((a, b) => b.total - a.total)
                .slice(0, 25);

            if (parsed.length === 0) {
                throw new Error('No hay datos con consumo renovable mayor que 0 para representar.');
            }

            chartRef = Highcharts.chart('renewable-energy-treemap', {
                chart: {
                    type: 'treemap',
                    backgroundColor: 'transparent',
                    style: { fontFamily: "'Segoe UI', Tahoma, sans-serif" }
                },
                title: {
                    text: 'Top 25 registros por consumo renovable total'
                },
                subtitle: {
                    text: 'API: /api/v1/renewable-energy-consumptions | Tipo: treemap'
                },
                colorAxis: {
                    minColor: '#d9f99d',
                    maxColor: '#14532d'
                },
                tooltip: {
                    useHTML: true,
                    pointFormat:
                        '<b>{point.country}</b> ({point.year})<br/>' +
                        'Total: <b>{point.value:.3f}</b><br/>' +
                        'Wind: {point.wind:.3f}<br/>' +
                        'Hydro: {point.hydro:.3f}<br/>' +
                        'Solar: {point.solar:.3f}<br/>' +
                        'Other: {point.other:.3f}'
                },
                series: [
                    {
                        type: 'treemap',
                        layoutAlgorithm: 'squarified',
                        alternateStartingDirection: true,
                        dataLabels: {
                            enabled: true,
                            style: {
                                textOutline: 'none',
                                color: '#0b1324',
                                fontSize: '11px'
                            },
                            formatter() {
                                return `${this.point.country} (${this.point.year})`;
                            }
                        },
                        data: parsed.map((d, index) => ({
                            name: `${d.country} (${d.year})`,
                            value: d.total,
                            colorValue: d.total,
                            country: d.country,
                            year: d.year,
                            wind: d.wind,
                            hydro: d.hydro,
                            solar: d.solar,
                            other: d.other,
                            sortIndex: index
                        }))
                    }
                ],
                credits: { enabled: false }
            });
        } catch (e) {
            error = e instanceof Error ? e.message : 'Error no controlado al generar la visualización.';
        } finally {
            loading = false;
        }
    });

    onDestroy(() => {
        if (chartRef) chartRef.destroy();
    });
</script>

<main class="page">
    <section class="card">
        <h1>Visualización individual - Renewable Energy Consumption</h1>
        <p>
            Widget Highcharts individual de tipo <strong>treemap</strong>, distinto de
            <code>line</code> y diferente de las visualizaciones <code>column</code> (grupal)
            y <code>bubble</code> (otra individual del proyecto).
        </p>

        {#if loading}
            <p class="status">Cargando datos...</p>
        {:else if error}
            <p class="status error">{error}</p>
        {/if}

        <div id="renewable-energy-treemap" class:hide={loading || error}></div>
    </section>
</main>

<style>
.page {
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 24px;
        box-sizing: border-box;
    }

    .card {
        width: min(1100px, 100%);
        background: #ffffff;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
    }

    h1 {
        margin: 0 0 8px;
        color: #0f172a;
    }

    p {
        margin: 0 0 16px;
        color: #334155;
        line-height: 1.5;
    }

    code {
        background: #e2e8f0;
        padding: 1px 6px;
        border-radius: 4px;
    }

    .status {
        margin: 8px 0 16px;
        font-weight: 600;
        color: #1d4ed8;
    }

    .status.error {
        color: #b91c1c;
    }

    #renewable-energy-treemap {
        width: 100%;
        height: 620px;
    }

    .hide {
        display: none;
    }
</style>
