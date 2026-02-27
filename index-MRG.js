let express = require("express");

const data = [
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

let avrgWaterProductAFG =
  data
    .filter((d) => d.country === "Afghanistan")
    .map((d) => d.waterProductivity)
    .reduce((a, b) => a + b) /
  data.filter((d) => d.country === "Afghanistan").length;

const app = express();

app.get("/average", (req, res) => {
  res.send(avrgWaterProductAFG.toString());
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
