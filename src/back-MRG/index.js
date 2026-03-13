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
        // Buscamos si ya hay contenido
        db.find({}, (err, stats) => {
            if (stats.length === 0) {
                // Si está vacío, insertamos el array de datos iniciales
                db.insert(dataMRG);
                res.status(201).send("Datos iniciales cargados con éxito.");
            } else {
                // Si ya tiene algo, lanzamos el error 400
                res.status(400).send("Bad Request: Data already exists");
            }
        });
    });

    // GET a la lista de recursos
    app.get(BASE_URL_API, (req, res) => {
        const { country, year, from, to } = req.query;

        // 1. Obtenemos TODOS los datos de la base de datos
        db.find({}, (err, stats) => {
            let filteredData = stats;

            // 2. Aplicamos los filtros de JavaScript sobre el resultado
            if (country) {
                filteredData = filteredData.filter(
                    (d) => d.country.toLowerCase() === country.toLowerCase()
                );
            }
            if (year) {
                filteredData = filteredData.filter((d) => d.year == year);
            }
            if (from) {
                filteredData = filteredData.filter((d) => d.year >= parseInt(from));
            }
            if (to) {
                filteredData = filteredData.filter((d) => d.year <= parseInt(to));
            }

            // 3. Enviamos el resultado (NeDB ya devuelve objetos, res.json es ideal aquí)
            res.status(200).json(filteredData);
        });
    });

    // GET de un país con rango (Ej: /Spain?from=2000&to=2010)
    app.get(BASE_URL_API + "/:country", (req, res) => {
        let country = req.params.country;
        let { from, to } = req.query;

        // Buscamos en la DB los que coincidan con el país
        db.find({ country: country }, (err, stats) => {
            let filteredData = stats;

            if (from) filteredData = filteredData.filter((d) => d.year >= parseInt(from));
            if (to) filteredData = filteredData.filter((d) => d.year <= parseInt(to));

            res.status(200).json(filteredData);
        });
    });

    // POST: Crear nuevo recurso
    app.post(BASE_URL_API, (req, res) => {
        let newData = req.body;
        if (!newData.country || !newData.year) return res.sendStatus(400);

        // Comprobamos si ya existe antes de insertar
        db.find({ country: newData.country, year: newData.year }, (err, stats) => {
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
        res.sendStatus(405); // Method Not Allowed
    });

    // DELETE de toda la lista
    app.delete(BASE_URL_API, (req, res) => {
        if (req.query.admin !== "true") return res.sendStatus(401);

        // En NeDB, {} significa "todos" y multi: true permite borrar más de uno
        db.remove({}, { multi: true }, (err, numRemoved) => {
            res.sendStatus(200);
        });
    });

    // MÉTODOS SOBRE UN RECURSO CONCRETO

    // GET (Ej: /api/v1/water-productivities/Spain/2000)
    app.get(BASE_URL_API + "/:country/:year", (req, res) => {
        let { country, year } = req.params;
        db.find({ country: country, year: parseInt(year) }, (err, stats) => {
            if (stats.length > 0) {
                const resource = stats[0];
                delete resource._id; // Limpieza opcional
                res.status(200).json(resource);
            } else {
                res.sendStatus(404);
            }
        });
    });

    // Post (NO PERMITIDO)
    app.post(BASE_URL_API + "/:country/:year", (req, res) => res.sendStatus(405));

    // PUT (Ej: /api/v1/water-productivities/Spain/2000)
    app.put(BASE_URL_API + "/:country/:year", (req, res) => {
        let { country, year } = req.params;
        let updatedData = req.body;

        if (country !== updatedData.country || year != updatedData.year) {
            return res.sendStatus(400);
        }

        // Actualizamos donde coincida país y año
        db.update({ country: country, year: parseInt(year) }, updatedData, {}, (err, numReplaced) => {
            if (numReplaced === 0) {
                res.sendStatus(404);
            } else {
                res.sendStatus(200);
            }
        });
    });

    // DELETE (Ej: /api/v1/water-productivities/Spain/2000)
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