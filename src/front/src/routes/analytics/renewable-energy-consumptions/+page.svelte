<script>
    import { onMount } from 'svelte';

    let chartReady = $state(false);
    let chartError = $state('');
    let summary = $state({
        records: 0,
        total: 0
    });

    onMount(async () => {
        try {
            const Highcharts = (await import('highcharts')).default;

            const response = await fetch('/api/v1/renewable-energy-consumptions');
            if (!response.ok) {
                chartError = `No se pudo cargar la API (${response.status}).`;
                return;
            }

            const data = await response.json();

            const totals = data.reduce(
                (acc, item) => {
                    acc.wind += Number(item.wind) || 0;
                    acc.hydro += Number(item.hydro) || 0;
                    acc.solar += Number(item.solar) || 0;
                    acc.other += Number(item.other) || 0;
                    return acc;
                },
                { wind: 0, hydro: 0, solar: 0, other: 0 }
            );

            const pieData = [
                ['Eólica', totals.wind],
                ['Hidráulica', totals.hydro],
                ['Solar', totals.solar],
                ['Otras', totals.other]
            ].filter(([, value]) => value > 0);

            summary = {
                records: data.length,
                total: totals.wind + totals.hydro + totals.solar + totals.other
            };

            Highcharts.chart('renewable-energy-chart', {
                chart: {
                    type: 'pie',
                    backgroundColor: 'transparent',
                    style: { fontFamily: "'Inter', sans-serif" }
                },
                title: {
                    text: 'Distribución del consumo renovable',
                    style: { color: '#1f2937', fontWeight: '700' }
                },
                subtitle: {
                    text: 'Acumulado por fuente a partir de los registros de la API',
                    style: { color: '#6b7280' }
                },
                accessibility: {
                    announceNewData: {
                        enabled: true
                    },
                    description:
                        'Gráfico circular que compara el consumo acumulado de energía eólica, hidráulica, solar y otras fuentes renovables.'
                },
                tooltip: {
                    pointFormat: '<b>{point.y:.2f}</b> unidades <b>({point.percentage:.1f}%)</b>'
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: true,
                            format: '<b>{point.name}</b><br>{point.percentage:.1f} %'
                        },
                        showInLegend: true,
                        innerSize: '58%',
                        borderWidth: 0
                    }
                },
                legend: {
                    itemStyle: { color: '#334155', fontWeight: '500' }
                },
                series: [
                    {
                        name: 'Consumo',
                        colorByPoint: true,
                        data: pieData.map(([name, y], index) => ({
                            name,
                            y,
                            color: ['#0ea5e9', '#14b8a6', '#f59e0b', '#8b5cf6'][index]
                        }))
                    }
                ],
                credits: {
                    enabled: false
                }
            });

            chartReady = true;
        } catch (error) {
            chartError = 'No se pudo inicializar Highcharts o cargar los datos.';
            console.error(error);
        }
    });
</script>

<main class="page">
    <section class="hero">
        <div class="hero-copy">
            <p class="eyebrow">Analytics individual</p>
            <h1>Consumo de energías renovables</h1>
            <p class="lead">
                Visualización agregada de eólica, hidráulica, solar y otras fuentes del recurso
                <code>renewable-energy-consumptions</code>.
            </p>
        </div>
        <div class="stats" aria-label="Resumen de datos">
            <article>
                <span>Registros</span>
                <strong>{summary.records}</strong>
            </article>
            <article>
                <span>Consumo total</span>
                <strong>{summary.total.toFixed(2)}</strong>
            </article>
        </div>
    </section>

    <section class="panel" aria-live="polite">
        {#if chartError}
            <p class="error">{chartError}</p>
        {:else}
            <div id="renewable-energy-chart" class:ready={chartReady}></div>
        {/if}
    </section>
</main>

<style>
.page {
        max-width: 1180px;
        margin: 0 auto;
        padding: 40px 20px 56px;
    }

    .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.9fr);
        gap: 24px;
        align-items: end;
        margin-bottom: 24px;
    }

    .eyebrow {
        margin: 0 0 10px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-size: 12px;
        color: #0f766e;
        font-weight: 700;
    }

    h1 {
        margin: 0;
        font-size: clamp(2rem, 4vw, 3.5rem);
        line-height: 1.02;
    }

    .lead {
        margin: 14px 0 0;
        max-width: 62ch;
        color: #475569;
        font-size: 1.03rem;
        line-height: 1.6;
    }

    .lead code {
        background: rgba(15, 23, 42, 0.06);
        padding: 0.15rem 0.4rem;
        border-radius: 0.45rem;
    }

    .stats {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
    }

    .stats article {
        background: rgba(255, 255, 255, 0.82);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 20px;
        padding: 18px 18px 16px;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
    }

    .stats span {
        display: block;
        color: #64748b;
        font-size: 0.9rem;
        margin-bottom: 8px;
    }

    .stats strong {
        font-size: 1.8rem;
        letter-spacing: -0.03em;
    }

    .panel {
        background: rgba(255, 255, 255, 0.88);
        backdrop-filter: blur(14px);
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 28px;
        box-shadow: 0 28px 70px rgba(15, 23, 42, 0.08);
        padding: 24px;
        min-height: 620px;
    }

    #renewable-energy-chart {
        width: 100%;
        height: 560px;
        opacity: 0;
        transition: opacity 0.25s ease;
    }

    #renewable-energy-chart.ready {
        opacity: 1;
    }

    .error {
        margin: 0;
        color: #b91c1c;
        font-weight: 600;
    }

    @media (max-width: 860px) {
        .hero {
            grid-template-columns: 1fr;
        }

        .panel {
            min-height: 520px;
            padding: 16px;
        }

        #renewable-energy-chart {
            height: 460px;
        }
    }
</style>
