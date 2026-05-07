import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import {handler} from "./src/front/build/handler.js";

import path from "path";

import { loadBackendMRG } from "./src/back-MRG/index.js";
import { agricultureLandReady, loadBackendFMM, loadBackendFMM_v2 } from "./src/back-FMM/index.js";
import { loadBackendPGG } from "./src/back-PGG/index.js";

const port = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(bodyParser.json());

const INTEGRATIONS_PROXY_BASE = "/api/v1/integrations-proxy";

const INTEGRATIONS_PROXY_SOURCES = {
  "global-ev-charging-infrastructures": {
    endpoint: "https://sos2526-16-production.up.railway.app/api/v1/global-ev-charging-infrastructures",
    loadInitialData:
      "https://sos2526-16-production.up.railway.app/api/v1/global-ev-charging-infrastructures/loadInitialData",
  },
  "wool-stats": {
    endpoint: "https://sos2526-20-stable.onrender.com/api/v2/wool-stats",
    loadInitialData: "https://sos2526-20-stable.onrender.com/api/v2/wool-stats/loadInitialData",
  },
  "cholera-stats": {
    endpoint: "https://soporte-sos.onrender.com/api/v1/cholera-stats",
    loadInitialData: "https://soporte-sos.onrender.com/api/v1/cholera-stats/loadInitialData",
  },
  "pandemics": {
    endpoint: "https://sos2526-10.onrender.com/api/v2/pandemics",
    loadInitialData: "https://sos2526-10.onrender.com/api/v2/pandemics/loadInitialData",
  },
  "drinking-water-services": {
    endpoint: "https://sos2526-27.onrender.com/api/v1/drinking-water-services",
    loadInitialData:
      "https://sos2526-27.onrender.com/api/v1/drinking-water-services/loadInitialData",
  },
  "restcountries-europe": {
    endpoint:
      "https://restcountries.com/v3.1/region/europe?fields=name,cca2,population,area",
  },
  "open-meteo-madrid": {
    endpoint:
      "https://api.open-meteo.com/v1/forecast?latitude=40.4168&longitude=-3.7038&current=temperature_2m,wind_speed_10m",
  },
  "exchange-rates-eur": {
    endpoint: "https://api.exchangerate-api.com/v4/latest/EUR",
  },
};

async function parseUpstreamPayload(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (_e) {
    return { raw: text };
  }
}

app.get(INTEGRATIONS_PROXY_BASE + "/sources", (req, res) => {
  const sources = Object.entries(INTEGRATIONS_PROXY_SOURCES).map(([id, value]) => ({
    source: id,
    endpoint: value.endpoint,
    hasLoadInitialData: !!value.loadInitialData,
  }));

  res.status(200).json(sources);
});

app.get(INTEGRATIONS_PROXY_BASE + "/:source/loadInitialData", async (req, res) => {
  const sourceConfig = INTEGRATIONS_PROXY_SOURCES[req.params.source];

  if (!sourceConfig) return res.status(404).json({ error: "Unknown source" });
  if (!sourceConfig.loadInitialData) {
    return res.status(400).json({ error: "loadInitialData not supported by this source" });
  }

  try {
    const upstreamResponse = await fetch(sourceConfig.loadInitialData, {
      headers: { Accept: "application/json, text/plain" },
    });
    const payload = await parseUpstreamPayload(upstreamResponse);

    res.status(upstreamResponse.status).json({
      source: req.params.source,
      status: upstreamResponse.status,
      payload,
    });
  } catch (error) {
    res.status(502).json({
      source: req.params.source,
      error: "Failed to fetch loadInitialData from upstream source",
      details: String(error?.message || error),
    });
  }
});

app.get(INTEGRATIONS_PROXY_BASE + "/:source", async (req, res) => {
  const sourceConfig = INTEGRATIONS_PROXY_SOURCES[req.params.source];

  if (!sourceConfig) return res.status(404).json({ error: "Unknown source" });

  try {
    const url = new URL(sourceConfig.endpoint);
    Object.entries(req.query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });

    const upstreamResponse = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    const payload = await parseUpstreamPayload(upstreamResponse);

    res.status(upstreamResponse.status).json(payload);
  } catch (error) {
    res.status(502).json({
      source: req.params.source,
      error: "Proxy request failed",
      details: String(error?.message || error),
    });
  }
});

loadBackendMRG(app);
loadBackendFMM(app);
loadBackendFMM_v2(app);
loadBackendPGG(app);

await agricultureLandReady;

app.use(handler);

app.listen(port, () => {
  console.log(`Servidor de grupo funcionando en puerto ${port}`);
});
