// HomeBase Back-up: wat deze fork toevoegt aan KopiaUI. Apart gehouden, zodat electron.js dicht bij Kopia blijft.
//  - tr(): Nederlands of Engels volgens het systeem (de Nederlandse tekst is de sleutel, zoals in HomeBaseOS).
//  - homebase-pair: de gegevens van een koppelcode ophalen bij HomeBaseOS (het venster mag dat zelf niet: het draait op https).
//  - known-folders: de gewone mappen van de gebruiker (Documenten, Afbeeldingen …) voor "Wat wil je bewaren?".
import { app, ipcMain } from "electron";
import fs from "fs";
import http from "http";
import https from "https";

const EN = {
  "HomeBase Back-up wordt geladen…": "HomeBase Back-up is loading…",
  "Voor de beste ervaring hoort HomeBase Back-up in de map Apps.\n\nNu verplaatsen?": "For the best experience, HomeBase Back-up belongs in the Applications folder.\n\nMove it now?",
  "Ja": "Yes",
  "Nee": "No",
  "HomeBase Back-up draait op de achtergrond": "HomeBase Back-up is running in the background",
  "Klik op het pictogram in het systeemvak om het menu te openen": "Click the icon in the system tray to open the menu",
  "<opstarten>": "<starting up>",
  "<voorbereiden>": "<initializing>",
  "<niet gekoppeld>": "<not paired>",
  "Bijwerken mislukt, klik om v{version} zelf te downloaden": "Update failed, click to download v{version} yourself",
  "Nieuwe versie: v{version}": "Update available: v{version}",
  "Downloaden en installeren…": "Download and install…",
  "HomeBase Back-up is bijgewerkt: {version}": "HomeBase Back-up is up to date: {version}",
  "Met nog een opslag verbinden…": "Connect to another storage…",
  "Nu zoeken naar updates": "Check for updates now",
  "Starten bij aanmelden": "Launch at startup",
  "Meldingen": "Notifications",
  "Aan": "On",
  "Alleen waarschuwingen en fouten": "Warnings and errors only",
  "Uit": "Off",
  "Stoppen": "Quit",
  "HomeBase Back-up v{version} is beschikbaar.\n\nNu installeren?": "HomeBase Back-up v{version} is available.\n\nInstall it now?",
  "Nieuwe versie van HomeBase Back-up": "New version of HomeBase Back-up",
  "Versie v{version} is beschikbaar.\n\nKlik hier om ze te downloaden en te installeren.": "Version v{version} is available.\n\nClick here to download and install it.",
  "Gebruikersmap": "User folder",
  "Documenten": "Documents",
  "Bureaublad": "Desktop",
  "Afbeeldingen": "Pictures",
  "Downloads": "Downloads",
  "Muziek": "Music",
  "Video's": "Videos",
};

function isDutch() {
  const langs = app.getPreferredSystemLanguages ? app.getPreferredSystemLanguages() : [];
  return String(langs[0] || app.getLocale() || "").toLowerCase().startsWith("nl");
}

export function tr(text, vars) {
  const s = isDutch() ? text : EN[text] || text;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s;
}

// Alleen http(s) naar /api/backup/pair/<code> op een adres in je netwerk; antwoord { status, data }.
function fetchPairing(url) {
  return new Promise((resolve, reject) => {
    let u;
    try {
      u = new URL(url);
    } catch {
      reject(new Error("ongeldig adres"));
      return;
    }
    if (!/^https?:$/.test(u.protocol) || !/^\/api\/backup\/pair\/[A-Z0-9]{8}$/.test(u.pathname)) {
      reject(new Error("ongeldig adres"));
      return;
    }
    // HomeBaseOS gebruikt meestal http in je thuisnetwerk; met https is het certificaat vaak zelfgemaakt.
    const lib = u.protocol === "https:" ? https : http;
    const req = lib.get(u, { timeout: 10000, rejectUnauthorized: false }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c) => {
        body += c;
        if (body.length > 65536) req.destroy(new Error("antwoord te groot"));
      });
      res.on("end", () => {
        let data = null;
        try {
          data = JSON.parse(body);
        } catch {
          /* geen JSON */
        }
        resolve({ status: res.statusCode, data });
      });
    });
    req.on("timeout", () => req.destroy(new Error("time-out")));
    req.on("error", reject);
  });
}

const FOLDERS = [
  ["home", "Gebruikersmap"],
  ["documents", "Documenten"],
  ["desktop", "Bureaublad"],
  ["pictures", "Afbeeldingen"],
  ["downloads", "Downloads"],
  ["music", "Muziek"],
  ["videos", "Video's"],
];

export function registerHomeBaseHandlers() {
  ipcMain.handle("homebase-pair", (_event, url) => fetchPairing(String(url || "")));
  ipcMain.handle("known-folders", () =>
    FOLDERS.map(([key, label]) => {
      let p = null;
      try {
        p = app.getPath(key);
      } catch {
        /* niet op dit systeem */
      }
      // label blijft Nederlands: de interface vertaalt het zelf
      return p && fs.existsSync(p) ? { key, label, path: p } : null;
    }).filter(Boolean),
  );
}
