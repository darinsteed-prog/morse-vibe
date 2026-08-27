const fs = require("fs");
const file = "server.ts";
let src = fs.readFileSync(file, "utf8");

// Add static https import at top
src = src.replace(
  `import express from "express";`,
  `import express from "express";
import * as https from "https";`
);

// Remove dynamic imports
src = src.replace(
  `      const https = await import("https");
      const data = await new Promise<any>((resolve, reject) => {
        const r = https.get("https://api.adsb.lol/v2/lat/53.3/lon/-6.3/dist/250",`,
  `      const data = await new Promise<any>((resolve, reject) => {
        const r = https.get("https://api.adsb.lol/v2/lat/53.3/lon/-6.3/dist/250",`
);

src = src.replace(
  `      const https = await import("https");
      const data = await new Promise<any>((resolve, reject) => {
        const req2 = https.get(url,`,
  `      const data = await new Promise<any>((resolve, reject) => {
        const req2 = https.get(url,`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed https to static import");
