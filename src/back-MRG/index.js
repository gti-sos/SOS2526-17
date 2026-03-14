import dataStore from "nedb";
import dataMRG from "../../datos-mrg.json" with { type: "json" };

let BASE_URL_API = "/api/v1/water-productivities";
let db = new dataStore();

function loadBackendMRG(app) {
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

    // API RESTful

    // Cargar datos iniciales
    app.get(BASE_URL_API + "/loadInitialData", (req, res) => {
        db.find({}, (err, stats) => {
            if (stats.length === 0) {
                db.insert(dataMRG);
                res.status(201).send("Datos iniciales cargados con éxito.");
            } else {
                res.status(400).send("Bad Request: Data already exists");
            }
        });
    });

    // GET a la lista de recursos (con filtros, limpieza de _id y PAGINACIÓN)
    app.get(BASE_URL_API, (req, res) => {
        const { country, year, countryCode, waterProductivity, waterStress, annualFreshwater, from, to } = req.query;

        // Parámetros de paginación
        let limit = parseInt(req.query.limit);
        let offset = parseInt(req.query.offset);

        db.find({}, (err, stats) => {
            let filteredData = stats;

            // Filtros de búsqueda
            if (country) filteredData = filteredData.filter(d => d.country.toLowerCase() === country.toLowerCase());
            if (countryCode) filteredData = filteredData.filter(d => d.countryCode.toLowerCase() === countryCode.toLowerCase());
            if (year) filteredData = filteredData.filter(d => d.year == year);
            if (waterProductivity) filteredData = filteredData.filter(d => d.waterProductivity == waterProductivity);
            if (waterStress) filteredData = filteredData.filter(d => d.waterStress == waterStress);
            if (annualFreshwater) filteredData = filteredData.filter(d => d.annualFreshwater == annualFreshwater);
            if (from) filteredData = filteredData.filter(d => d.year >= parseInt(from));
            if (to) filteredData = filteredData.filter(d => d.year <= parseInt(to));

            // PAGINACIÓN sobre los datos ya filtrados
            if (!isNaN(limit) && !isNaN(offset)) {
                filteredData = filteredData.slice(offset, offset + limit);
            }

            // Limpiamos _id y enviamos
            res.status(200).json(filteredData.map(d => { delete d._id; return d; }));
        });
    });

    // GET de un país con rango (Ej: /Spain?from=2000&to=2010) y PaGINACIÓN
    app.get(BASE_URL_API + "/:country", (req, res) => {
        let country = req.params.country;
        let { from, to } = req.query;
        let limit = parseInt(req.query.limit);
        let offset = parseInt(req.query.offset);

        db.find({ country: country }, (err, stats) => {
            let filteredData = stats;

            if (from) filteredData = filteredData.filter((d) => d.year >= parseInt(from));
            if (to) filteredData = filteredData.filter((d) => d.year <= parseInt(to));

            // Aplicamos paginación si se proporcionan los parámetros
            if (!isNaN(limit) && !isNaN(offset)) {
                filteredData = filteredData.slice(offset, offset + limit);
            }

            res.status(200).json(filteredData.map(d => { delete d._id; return d; }));
        });
    });

    // POST: Crear nuevo recurso
    app.post(BASE_URL_API, (req, res) => {
        let newData = req.body;
        if (!newData.country || !newData.year) return res.sendStatus(400);

        db.find({ country: newData.country, year: parseInt(newData.year) }, (err, stats) => {
            if (stats.length > 0) {
                res.sendStatus(409); // Conflict
            } else {
                db.insert(newData);
                res.status(201).send("CREATED");
            }
        });
    });

    // PUT sobre la lista (NO PERMITIDO)
    app.put(BASE_URL_API, (req, res) => {
        res.sendStatus(405);
    });

    // DELETE de toda la lista
    app.delete(BASE_URL_API, (req, res) => {
        //if (req.query.admin !== "true") return res.sendStatus(401);

        db.remove({}, { multi: true }, (err, numRemoved) => {
            res.sendStatus(200);
        });
    });

    // GET Recurso específico (Ej: /api/v1/water-productivities/Spain/2000)
    app.get(BASE_URL_API + "/:country/:year", (req, res) => {
        let { country, year } = req.params;
        db.find({ country: country, year: parseInt(year) }, (err, stats) => {
            if (stats.length > 0) {
                const resource = stats[0];
                delete resource._id; // Limpiamos el recurso único
                res.status(200).json(resource);
            } else {
                res.sendStatus(404);
            }
        });
    });

    // POST Recurso específico (NO PERMITIDO)
    app.post(BASE_URL_API + "/:country/:year", (req, res) => res.sendStatus(405));

    // PUT Recurso específico
    app.put(BASE_URL_API + "/:country/:year", (req, res) => {
        let { country, year } = req.params;
        let updatedData = req.body;

        if (country !== updatedData.country || year != updatedData.year) {
            return res.sendStatus(400);
        }

        db.update({ country: country, year: parseInt(year) }, updatedData, {}, (err, numReplaced) => {
            if (numReplaced === 0) {
                res.sendStatus(404);
            } else {
                res.sendStatus(200);
            }
        });
    });

    // DELETE Recurso específico
    app.delete(BASE_URL_API + "/:country/:year", (req, res) => {
        let { country, year } = req.params;
        db.remove({ country: country, year: parseInt(year) }, {}, (err, numRemoved) => {
            if (numRemoved === 0) {
                res.sendStatus(404);
            } else {
                res.sendStatus(200);
            }
        });
    });
}

export { loadBackendMRG };