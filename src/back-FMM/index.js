import Datastore from 'nedb';
import fs from 'fs';
import util from 'util';
import axios from 'axios';

 // --- BLOQUE ouath
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import session from 'express-session';

function setupOAuth(app) {
    
    app.use(session({ 
        secret: 'frase_secreta_para_tu_asignatura', 
        resave: false, 
        saveUninitialized: false 
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    // 2. Estrategia 
    passport.use(new GitHubStrategy({
        clientID: "Ov23li2z75MNZV7bj2bU", 
        clientSecret: "f22b9e24fbaa446c934ed7c88c1c15c4d2752935",
        callbackURL: "http://localhost:3000/auth/github/callback"
    }, (accessToken, refreshToken, profile, done) => {
        return done(null, profile);
    }));

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));

    // 3. Rutas
    app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

    app.get('/auth/github/callback', 
        passport.authenticate('github', { failureRedirect: '/' }),
        (req, res) => { 
            console.log("Usuario logueado correctamente");
            res.redirect('/'); 
        }
    );

    app.get('/api/v1/logout', (req, res) => {
        req.logout(() => res.redirect('/'));
    });
}

// Middleware 
function isLogged(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.status(401).send("🚫 Error: Debes identificarte con GitHub en /auth/github para usar esta función.");
}

//--------------------------------------------------------------------------------


let BASE_URL_API = "/api/v1/agriculture-land";
let BASE_URL_API_V2 = "/api/v2/agriculture-land";


const db = new Datastore({ filename: './src/db/agriculture-land.db', autoload: false });
const agricultureLandReady = new Promise((resolve, reject) => {
    db.loadDatabase((err) => {
        if (!err) {
            resolve();
            return;
        }

        const message = String(err && err.message ? err.message : err);
        const isCrashSafeRecoveryError =
            err && err.code === 'ENOENT' &&
            message.includes('rename') &&
            message.includes('agriculture-land.db~');

        if (isCrashSafeRecoveryError) {
            console.warn('Recovered agriculture-land database after a crash-safe write error.');
            if (db.executor && typeof db.executor.processBuffer === 'function') {
                db.executor.processBuffer();
            }
            resolve();
            return;
        }

        reject(err);
    });
});
const jsonRawData = fs.readFileSync('./datos-fmm.json', 'utf8');
const initialAgricultureData = JSON.parse(jsonRawData);

if (typeof util.isRegExp !== 'function') {
    util.isRegExp = function (obj) {
        return Object.prototype.toString.call(obj) === '[object RegExp]' || obj instanceof RegExp;
    };
}
if (typeof util.isDate !== 'function') {
    util.isDate = function (obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    };
}

function loadBackendFMM(app) {

    app.get(BASE_URL_API + "/loadInitialData", (req, res) => {
        db.remove({}, { multi: true }, (err) => {
            if (err) return res.status(500).send("Error limpiando DB");
            db.insert(initialAgricultureData, (err, newDocs) => {
                if (err) {
                    return res.status(500).send("Error insertando datos iniciales");
                } else {
                    return res.status(201).send(`✅ Éxito: ${newDocs.length} registros cargados.`);
                }
            });
        });
    });

    app.get(BASE_URL_API, (req, res) => {
        let { country, year, from, to, limit, offset } = req.query;
        let query = {};

        if (country) {
            query.$or = [{ country: country }, { "country ": country }];
        }

        if (year) {
            query.year = parseInt(year);
        } else if (from || to) {
            query.year = {};
            if (from) query.year.$gte = parseInt(from);
            if (to) query.year.$lte = parseInt(to);
        }

        db.find(query)
          .skip(parseInt(offset) || 0) 
          .limit(parseInt(limit) || 0)
          .exec((err, docs) => {
              if (err) return res.sendStatus(500);
              const result = docs.map((d) => {
                  const cleanedDoc = { ...d };
                  delete cleanedDoc._id;
                  if (cleanedDoc["country "]) {
                      cleanedDoc.country = cleanedDoc["country "];
                      delete cleanedDoc["country "];
                  }
                  return cleanedDoc;
              });
              res.status(200).send(result);
          });
    });

    app.get(BASE_URL_API + "/:country/:year", (req, res) => {
        const { country, year } = req.params;
        db.find({ 
            $or: [{ country: country }, { "country ": country }], 
            year: parseInt(year) 
        }, (err, docs) => {
            if (err) return res.sendStatus(500);
            if (docs.length > 0) {
                const resource = { ...docs[0] };
                delete resource._id;
                if (resource["country "]) {
                    resource.country = resource["country "];
                    delete resource["country "];
                }
                return res.status(200).json(resource);
            }
            res.sendStatus(404);
        });
    });

    app.post(BASE_URL_API, (req, res) => {
        const newData = req.body;
        const camposEsperados = ["country", "year", "country_code", "land_agriculture", "types_land", "index"];
        const camposRecibidos = Object.keys(newData);

        const tieneEstructuraExacta = camposEsperados.every(f => camposRecibidos.includes(f)) 
                                      && camposRecibidos.length === camposEsperados.length;

        if (!tieneEstructuraExacta) return res.sendStatus(400); 

        db.find({ 
            $or: [{ country: newData.country }, { "country ": newData.country }], 
            year: parseInt(newData.year) 
        }, (err, docs) => {
            if (err) return res.sendStatus(500);
            if (docs.length > 0) return res.sendStatus(409); 

            db.insert(newData, (err) => {
                if (err) return res.sendStatus(500);
                res.sendStatus(201); 
            });
        });
    });

    app.put(BASE_URL_API + "/:country/:year", (req, res) => {
        const { country, year } = req.params;
        const updatedData = req.body;
        const camposEsperados = ["country", "year", "country_code", "land_agriculture", "types_land", "index"];
        const camposRecibidos = Object.keys(updatedData);

        if (camposRecibidos.length !== camposEsperados.length || country !== updatedData.country || parseInt(year) !== updatedData.year) {
            return res.sendStatus(400);
        }

        db.update(
            { $or: [{ country: country }, { "country ": country }], year: parseInt(year) }, 
            { $set: updatedData }, 
            {}, 
            (err, numReplaced) => {
                if (err) return res.sendStatus(500);
                numReplaced > 0 ? res.sendStatus(200) : res.sendStatus(404);
            }
        );
    });

    app.delete(BASE_URL_API + "/:country/:year", (req, res) => {
        const { country, year } = req.params;
        db.remove({ 
            $or: [{ country: country }, { "country ": country }], 
            year: parseInt(year) 
        }, {}, (err, numRemoved) => {
            if (err) return res.sendStatus(500);
            numRemoved > 0 ? res.sendStatus(200) : res.sendStatus(404);
        });
    });

    app.delete(BASE_URL_API, (req, res) => {
        if (req.query.admin !== "true") return res.sendStatus(401); 
        db.remove({}, { multi: true }, (err) => {
            if (err) return res.sendStatus(500);
            res.sendStatus(200);
        });
    });

    app.post(BASE_URL_API + "/:country/:year", (req, res) => res.sendStatus(405));
    app.put(BASE_URL_API, (req, res) => res.sendStatus(405));
    app.get(BASE_URL_API + "/docs", (req, res) => res.redirect("https://documenter.getpostman.com/view/52395584/2sBXigMDSm"));
}
//--------------------------------------------------------------------------------------------------

function loadBackendFMM_v2(app) {
    let BASE_URL_API_V2 = "/api/v2/agriculture-land";

    // 1. Activamos la configuración de OAuth para que funcionen las rutas /auth/github
    setupOAuth(app); 

    // --- GET publico
    app.get(BASE_URL_API_V2, (req, res) => {
        let { country, year, from, to, limit, offset } = req.query;
        let query = {};

        if (country) {
            query.$or = [{ country: country }, { "country ": country }];
        }

        if (year) {
            query.year = parseInt(year);
        } else if (from || to) {
            query.year = {};
            if (from) query.year.$gte = parseInt(from);
            if (to) query.year.$lte = parseInt(to);
        }

        db.find(query)
          .skip(parseInt(offset) || 0) 
          .limit(parseInt(limit) || 0)
          .exec((err, docs) => {
              if (err) return res.sendStatus(500);
              const result = docs.map((d) => {
                  const cleanedDoc = { ...d };
                  delete cleanedDoc._id;
                  if (cleanedDoc["country "]) {
                      cleanedDoc.country = cleanedDoc["country "];
                      delete cleanedDoc["country "];
                  }
                  return cleanedDoc;
              });
              res.status(200).send(result);
          });
    });

    // --- GET 
    app.get(BASE_URL_API_V2 + "/:country/:year", (req, res) => {
        const { country, year } = req.params;
        db.find({ 
            $or: [{ country: country }, { "country ": country }], 
            year: parseInt(year) 
        }, (err, docs) => {
            if (err) return res.sendStatus(500);
            if (docs.length > 0) {
                const resource = { ...docs[0] };
                delete resource._id;
                if (resource["country "]) {
                    resource.country = resource["country "];
                    delete resource["country "];
                }
                return res.status(200).json(resource);
            }
            res.sendStatus(404);
        });
    });

    // --- POST 
    app.post(BASE_URL_API_V2, isLogged, (req, res) => {
        const newData = req.body;
        const camposEsperados = ["country", "year", "country_code", "land_agriculture", "types_land", "index"];
        const camposRecibidos = Object.keys(newData);

        const tieneEstructuraExacta = camposEsperados.every(f => camposRecibidos.includes(f)) 
                                      && camposRecibidos.length === camposEsperados.length;

        if (!tieneEstructuraExacta) return res.sendStatus(400); 

        db.find({ 
            $or: [{ country: newData.country }, { "country ": newData.country }], 
            year: parseInt(newData.year) 
        }, (err, docs) => {
            if (err) return res.sendStatus(500);
            if (docs.length > 0) return res.sendStatus(409); 

            db.insert(newData, (err) => {
                if (err) return res.sendStatus(500);
                res.sendStatus(201); 
            });
        });
    });

    // --- PUT 
    app.put(BASE_URL_API_V2 + "/:country/:year", isLogged, (req, res) => {
        const { country, year } = req.params;
        const updatedData = req.body;
        const camposEsperados = ["country", "year", "country_code", "land_agriculture", "types_land", "index"];
        const camposRecibidos = Object.keys(updatedData);

        if (camposRecibidos.length !== camposEsperados.length || country !== updatedData.country || parseInt(year) !== updatedData.year) {
            return res.sendStatus(400);
        }

        db.update(
            { $or: [{ country: country }, { "country ": country }], year: parseInt(year) }, 
            { $set: updatedData }, 
            {}, 
            (err, numReplaced) => {
                if (err) return res.sendStatus(500);
                numReplaced > 0 ? res.sendStatus(200) : res.sendStatus(404);
            }
        );
    });

    // --- individual
    app.delete(BASE_URL_API_V2 + "/:country/:year", isLogged, (req, res) => {
        const { country, year } = req.params;
        db.remove({ 
            $or: [{ country: country }, { "country ": country }], 
            year: parseInt(year) 
        }, {}, (err, numRemoved) => {
            if (err) return res.sendStatus(500);
            numRemoved > 0 ? res.sendStatus(200) : res.sendStatus(404);
        });
    });

    // --- delete masivo Login GitHub + ?admin=true
    app.delete(BASE_URL_API_V2, isLogged, (req, res) => {
        if (req.query.admin !== "true") return res.sendStatus(401); 
        db.remove({}, { multi: true }, (err) => {
            if (err) return res.sendStatus(500);
            res.sendStatus(200);
        });
    });

    // Rutas 
    app.post(BASE_URL_API_V2 + "/:country/:year", (req, res) => res.sendStatus(405));
    app.put(BASE_URL_API_V2, (req, res) => res.sendStatus(405));
    app.get(BASE_URL_API_V2 + "/docs", (req, res) => res.redirect("https://documenter.getpostman.com/view/52395584/2sBXigMDSm"));
}




function loadIntegrationsProxy(app) {
    // Fíjate que le hemos puesto 
    app.get("/api/v1/proxy-pokemon", async (req, res) => {
        try {
            console.log("Petición recibida en el proxy de Pokemon");
            const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=10");
            const data = await response.json();
           
            res.json(data.results); 
        } catch (error) {
            console.error("Error en Proxy Pokemon:", error);
            res.status(500).json({ error: "Error conectando con PokeAPI" });
        }
    });
}

export { agricultureLandReady, loadBackendFMM, loadBackendFMM_v2, loadIntegrationsProxy };
