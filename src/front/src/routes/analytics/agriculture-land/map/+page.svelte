<script>
    import { onMount } from 'svelte';

    let mapElement;

    // Diccionario ampliado con los países de tu tabla
    const coords = {
        "afghanistan": [33.9391, 67.7100],
        "albania": [41.1533, 20.1683],
        "angola": [-11.2027, 17.8739],
        "argentina": [-38.4161, -63.6167],
        "australia": [-25.2744, 133.7751],
        "bahamas": [25.0343, -77.3963],
        "bermuda": [32.3078, -64.7505],
        "bolivia": [-16.2902, -63.5887],
        "españa": [40.4637, -3.7492],
        "spain": [40.4637, -3.7492],
        "france": [46.2276, 2.2137],
        "germany": [51.1657, 10.4515]
    };

    onMount(async () => {
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        const L = (await import('leaflet')).default;
        const map = L.map(mapElement).setView([20, 0], 2);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);

        const res = await fetch('/api/v1/agriculture-land');
        if (res.ok) {
            const data = await res.json();

            data.forEach(stat => {
                // Limpieza para asegurar coincidencia
                const countryClean = stat.country.toLowerCase().trim();
                const position = coords[countryClean];

                if (position) {
                    L.circle(position, {
                        color: '#27ae60',
                        fillColor: '#2ecc71',
                        fillOpacity: 0.6,
                        // Radio basado en el porcentaje de tierra
                        radius: parseFloat(stat.land_agriculture || 0) * 12000 
                    }).addTo(map)
                      .bindPopup(`
                        <div style="text-align: center;">
                            <b style="text-transform: uppercase;">${stat.country}</b><br>
                            Tierra: ${stat.land_agriculture}%<br>
                            Año: ${stat.year}
                        </div>
                      `);
                } else {
                    console.warn("Falta coordenada para:", countryClean);
                }
            });
        }
    });
</script>

<main>
    <div class="header">
        <h1>📍 Mapa de Superficie Agrícola</h1>
        <a href="/analytics/agriculture-land" class="back-link">Volver</a>
    </div>
    <div bind:this={mapElement} class="map-view"></div>
</main>

<style>
.header { padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; background: white; }
    .back-link { border: 2px solid #2ecc71; color: #2ecc71; padding: 5px 15px; border-radius: 20px; text-decoration: none; font-weight: bold; }
    .map-view { height: calc(100vh - 80px); width: 100%; z-index: 1; }
</style>