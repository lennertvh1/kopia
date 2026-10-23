// HomeBase Backup: what this fork adds to KopiaUI. Kept separate, so electron.js stays close to Kopia.
//  - tr(): Dutch or English following the system (the English text is the key, like in HomeBaseOS).
//  - homebase-pair: fetch the details of a pairing code from HomeBaseOS (the window may not do that itself: it runs on https).
//  - known-folders: the user's standard folders (Documents, Pictures …) for "What do you want to keep safe?".
import { app, ipcMain } from "electron";
import fs from "fs";
import http from "http";
import https from "https";

const NL = {
  "HomeBase Backup is loading…": "HomeBase Backup wordt geladen…",
  "For the best experience, HomeBase Backup belongs in the Applications folder.\n\nMove it now?": "Voor de beste ervaring hoort HomeBase Backup in de map Apps.\n\nNu verplaatsen?",
  "Yes": "Ja",
  "No": "Nee",
  "HomeBase Backup is running in the background": "HomeBase Backup draait op de achtergrond",
  "Click the icon in the system tray to open the menu": "Klik op het pictogram in het systeemvak om het menu te openen",
  "<starting up>": "<opstarten>",
  "<initializing>": "<voorbereiden>",
  "<not paired>": "<niet gekoppeld>",
  "Update failed, click to download v{version} yourself": "Bijwerken mislukt, klik om v{version} zelf te downloaden",
  "Update available: v{version}": "Nieuwe versie: v{version}",
  "Download and install…": "Downloaden en installeren…",
  "HomeBase Backup is up to date: {version}": "HomeBase Backup is bijgewerkt: {version}",
  "Connect to another storage…": "Met nog een opslag verbinden…",
  "Check for updates now": "Nu zoeken naar updates",
  "Launch at startup": "Starten bij aanmelden",
  "Notifications": "Meldingen",
  "On": "Aan",
  "Warnings and errors only": "Alleen waarschuwingen en fouten",
  "Off": "Uit",
  "Quit": "Stoppen",
  "HomeBase Backup v{version} is available.\n\nInstall it now?": "HomeBase Backup v{version} is beschikbaar.\n\nNu installeren?",
  "New version of HomeBase Backup": "Nieuwe versie van HomeBase Backup",
  "Version v{version} is available.\n\nClick here to download and install it.": "Versie v{version} is beschikbaar.\n\nKlik hier om ze te downloaden en te installeren.",
};

function isDutch() {
  const langs = app.getPreferredSystemLanguages ? app.getPreferredSystemLanguages() : [];
  return String(langs[0] || app.getLocale() || "").toLowerCase().startsWith("nl");
}

export function tr(text, vars) {
  const s = isDutch() ? NL[text] || text : text;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s;
}

// Only http(s) to /api/backup/pair/<code> at an address in your network; answer { status, data }.
function fetchPairing(url) {
  return new Promise((resolve, reject) => {
    let u;
    try {
      u = new URL(url);
    } catch {
      reject(new Error("invalid address"));
      return;
    }
    if (!/^https?:$/.test(u.protocol) || !/^\/api\/backup\/pair\/[A-Z0-9]{8}$/.test(u.pathname)) {
      reject(new Error("invalid address"));
      return;
    }
    // HomeBaseOS usually uses http in your home network; with https the certificate is often self-made.
    const lib = u.protocol === "https:" ? https : http;
    const req = lib.get(u, { timeout: 10000, rejectUnauthorized: false }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c) => {
        body += c;
        if (body.length > 65536) req.destroy(new Error("response too large"));
      });
      res.on("end", () => {
        let data = null;
        try {
          data = JSON.parse(body);
        } catch {
          /* not JSON */
        }
        resolve({ status: res.statusCode, data });
      });
    });
    req.on("timeout", () => req.destroy(new Error("time-out")));
    req.on("error", reject);
  });
}

const FOLDERS = [
  ["home", "User folder"],
  ["documents", "Documents"],
  ["desktop", "Desktop"],
  ["pictures", "Pictures"],
  ["downloads", "Downloads"],
  ["music", "Music"],
  ["videos", "Videos"],
];

export function registerHomeBaseHandlers() {
  ipcMain.handle("homebase-pair", (_event, url) => fetchPairing(String(url || "")));
  ipcMain.handle("known-folders", () =>
    FOLDERS.map(([key, label]) => {
      let p = null;
      try {
        p = app.getPath(key);
      } catch {
        /* not on this system */
      }
      // the label stays English: the interface translates it itself
      return p && fs.existsSync(p) ? { key, label, path: p } : null;
    }).filter(Boolean),
  );
}
