let express = require("express");
let bodyParser = require("body-parser");
let cool = require('cool-ascii-faces');


const app = express();
const port = process.env.PORT || 3000;

app.use("/", express.static("./static"));
app.use(bodyParser.json());

// --- RUTA ABOUT ---
app.get("/about", (req, res) => {
    // __dirname  dice "donde esté este archivo index.js"
    res.sendFile(__dirname + "/static/about.html");
});

// --- RUTA COOL ---
app.get('/cool', (req, res) => {
    res.send(cool());
    console.log("New cool face delivered");
});


// --- (MRG) ---
{
    let BASE_URL_API = "/api/v1/water-productivities";

    const dataMRG = [
        { country: "Afghanistan", year: 2000, countryCode: "AFG", waterProductivity: 0.3, waterStress: 28.68, annualFreshwater: 22.69 },
        { country: "Angola", year: 1988, countryCode: "AGO", waterProductivity: 63.2, waterStress: 28.68, annualFreshwater: 22.69 },
        { country: "Albania", year: 1991, countryCode: "ALB", waterProductivity: 4.6, waterStress: 28.68, annualFreshwater: 22.69 },
        { country: "Argentina", year: 1977, countryCode: "ARG", waterProductivity: 9.1, waterStress: 28.68, annualFreshwater: 22.69 },
        { country: "United Arab Emirates", year: 1981, countryCode: "ARE", waterProductivity: 132.1, waterStress: 28.68, annualFreshwater: 22.69 },
        { country: "Afghanistan", year: 2014, countryCode: "AFG", waterProductivity: 1.2, waterStress: 28.68, annualFreshwater: 22.69 },
        { country: "Barbados", year: 1963, countryCode: "BRB", waterProductivity: 74.2, waterStress: 28.68, annualFreshwater: 22.69 },
        { country: "Denmark", year: 1971, countryCode: "DNK", waterProductivity: 180.4, waterStress: 28.68, annualFreshwater: 22.69 },
        { country: "Spain", year: 2000, countryCode: "ESP", waterProductivity: 14, waterStress: 28.68, annualFreshwater: 22.69 },
        { country: "Afghanistan", year: 2016, countryCode: "AFG", waterProductivity: 2, waterStress: 28.68, annualFreshwater: 22.69 }
    ];

    // Ruta dinámica /samples/MRG
    app.get("/samples/MRG", (req, res) => {
        let avrgWaterProductAFG =
            dataMRG
                .filter((d) => d.country === "Afghanistan")
                .map((d) => d.waterProductivity)
                .reduce((a, b) => a + b) /
            dataMRG.filter((d) => d.country === "Afghanistan").length;
        res.send(
            `<html><body><h3>The average water productivity for Afghanistan is ${avrgWaterProductAFG.toString()}</h3></body></html>`,
        );
    });


    let waterStats = [];

    // Cargar datos iniciales 
    app.get(BASE_URL_API + "/loadInitialData", (req, res) => {
        if (waterStats.length === 0) {
            waterStats = [...dataMRG];
            res.status(200).send("Datos iniciales cargados con éxito.");
        } else {
            res.status(400).send("Bad Request: Data already exists");
        }
    });

    // B. GET a la lista de recursos
    app.get(BASE_URL_API, (req, res) => {
        // Si el usuario ha puesto ?country=XXX, lo guardamos, etc.
        const { country, year, from, to } = req.query;

        let filteredData = [...waterStats];

        // 3. SI el usuario ha puesto ?country=XXX, filtramos la lista
        if (country) {
            filteredData = filteredData.filter(d => d.country.toLowerCase() === country.toLowerCase());
        }
        if (year) {
            filteredData = filteredData.filter(d => d.year == year);
        }
        if (from) {
            filteredData = filteredData.filter(d => d.year >= parseInt(from));
        }
        if (to) {
            filteredData = filteredData.filter(d => d.year <= parseInt(to));
        }

        res.status(200).send(JSON.stringify(filteredData, null, 2));
    });

    // GET de un país con rango (Ej: /Spain?from=2000&to=2010)
    app.get(BASE_URL_API + "/:country", (req, res) => {
        let country = req.params.country;
        let { from, to } = req.query;

        // Filtramos por país
        let filteredData = waterStats.filter(d => d.country.toLowerCase() === country.toLowerCase());

        // Filtramos por rango si existe
        if (from) filteredData = filteredData.filter(d => d.year >= parseInt(from));
        if (to) filteredData = filteredData.filter(d => d.year <= parseInt(to));

        res.status(200).send(JSON.stringify(filteredData, null, 2)); 
    });

    // POST: Crear nuevo recurso
    app.post(BASE_URL_API, (req, res) => {
        let newData = req.body;
        // Comprobar campos obligatorios
        if (!newData.country || !newData.year) {
            return res.sendStatus(400); // Bad Request
        }
        // Comprobar si ya existe un recurso con el mismo país y año
        let exists = waterStats.some(d => d.country === newData.country && d.year == newData.year);
        if (exists) {
            res.sendStatus(409); // Conflict
        } else {
            waterStats.push(newData);
            res.status(201).send("CREATED"); // Created
        }
    });

    // PUT sobre la lista (NO PERMITIDO)
    app.put(BASE_URL_API, (req, res) => {
        res.sendStatus(405); // Method Not Allowed
    });

    // DELETE de toda la lista
    app.delete(BASE_URL_API, (req, res) => {
        // Si el usuario no envía .../api/v1/water-productivities?admin=true
        if (req.query.admin !== "true") {
            return res.sendStatus(401); // Unauthorized
        }

        waterStats = [];
        res.sendStatus(200);
    });

    // MÉTODOS SOBRE UN RECURSO CONCRETO

    // GET (Ej: /api/v1/water-productivities/Spain/2000)
    app.get(BASE_URL_API + "/:country/:year", (req, res) => {
        let { country, year } = req.params;
        let resource = waterStats.find(d => d.country === country && d.year == year);
        if (resource) {
            res.status(200).send(JSON.stringify(resource, null, 2));
        } else {
            res.sendStatus(404); // Not Found
        }
    });

     // Post (NO PERMITIDO)
    app.post(BASE_URL_API + "/:country/:year", (req, res) => res.sendStatus(405));

    // PUT (Ej: /api/v1/water-productivities/Spain/2000)
    app.put(BASE_URL_API + "/:country/:year", (req, res) => {
        let { country, year } = req.params;
        let updatedData = req.body;

        // ERROR 400: El país/año de la URL no coincide con el del cuerpo JSON
        if (country !== updatedData.country || year != updatedData.year) {
            return res.sendStatus(400);
        }

        // Posición en el array
        let index = waterStats.findIndex(d => d.country === country && d.year == year);

        if (index !== -1) {
            // Si existe, lo sustituimos por los nuevos datos
            waterStats[index] = updatedData;
            res.sendStatus(200);
        } else {
            // ERROR 404: No existe ese país/año para actualizar
            res.sendStatus(404);
        }
    });

    // DELETE (Ej: /api/v1/water-productivities/Spain/2000)
    app.delete(BASE_URL_API + "/:country/:year", (req, res) => {
        let { country, year } = req.params;
        let index = waterStats.findIndex(d => d.country === country && d.year == year);
        if (index !== -1) {
            waterStats.splice(index, 1); // Elimina 1 elemento en la posición index
            res.sendStatus(200);
        } else {
            res.sendStatus(404); // Not Found
        }
    });

}



app.listen(port, () => {
    console.log(`Servidor de grupo funcionando en puerto ${port}`);
});