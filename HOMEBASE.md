# HomeBase Back-up

Deze fork van [Kopia](https://github.com/kopia/kopia) is **HomeBase Back-up**: de app die pc's en Macs elk uur een back-up laat maken naar een NAS met [HomeBaseOS](https://github.com/lennertvh1/homebaseos). Het is KopiaUI met een eigen naam, een interface in de stijl van het dashboard van HomeBaseOS (Nederlands en Engels), en koppelen met een code in plaats van adres + vingerafdruk + naam.

Kopia valt onder de Apache License 2.0 (zie `LICENSE`). Deze fork ook. "Kopia" is de naam van het oorspronkelijke project; deze app is er niet officieel aan verbonden.

## Wat is er anders dan Kopia

| Waar | Wijziging |
|---|---|
| `htmlui-homebase/` | Vervangt de module `github.com/kopia/htmluibuild` (zie `replace` in `go.mod`): de gebouwde interface uit de fork [lennertvh1/htmlui](https://github.com/lennertvh1/htmlui), branch `homebase`. |
| `homebase/build-htmlui.sh` | Bouwt die interface en zet ze in `htmlui-homebase/build`. |
| `app/package.json` | Naam *HomeBase Back-up*, app-id `be.homebaseos.backup`, updates en releases uit deze fork, bestandsnamen zonder spaties. |
| `app/public/homebase.js` | Nieuw: vertalingen (nl/en) voor menu's en meldingen, het ophalen van een koppelcode bij HomeBaseOS (`homebase-pair`) en de gewone mappen van de gebruiker (`known-folders`). |
| `app/public/preload.js` | `kopiaUI.homebasePair()` en `kopiaUI.knownFolders()` voor de interface. |
| `app/public/electron.js` | Naam en teksten via `tr()`; het venster opent bij een gewone start (niet bij het automatisch starten bij aanmelden, `--hidden`), bij opnieuw openen en bij een klik op het Dock. Release-notes uit deze fork. |
| `app/public/auto-launch.js` | Naam *HomeBase Back-up*, start bij aanmelden zonder venster. |
| `app/assets`, `app/resources`, `app/public/*.png` | Pictogrammen met het huisje van HomeBaseOS. |
| `.github/workflows/homebase-backup.yml` | Bouwt de app voor Windows, macOS (Intel en Apple Silicon) en Linux; bij een tag `v*` komen de installers bij de release. |
| `.github/workflows/*`, `.github/dependabot.yml` | De workflows en Dependabot van Kopia zijn weg: ze hebben geheimen van kopia/kopia nodig of openen pull requests. Alleen `homebase-backup.yml` blijft. |

De Go-code van Kopia zelf is niet gewijzigd.

## Koppelen met HomeBaseOS

1. In HomeBaseOS: *Back-ups → Toestellen → + Toestel → Met de app HomeBase Back-up*. Je krijgt een koppelcode (8 tekens, 15 minuten, eenmalig).
2. In de app: adres van HomeBaseOS (bv. `freddy.local`) + de code. De app vraagt `GET http://<adres>:8080/api/backup/pair/<code>` op en krijgt de poort, de vingerafdruk van de server, de naam (`<toestel>@<toestel>`) en het wachtwoord. Daarmee verbindt ze met de Kopia-server op de NAS (`/api/v1/repo/connect` met `apiServer`).
3. *Wat wil je bewaren?*: Documenten, Bureaublad en Afbeeldingen staan standaard aan. Elke map wordt een bron met het algemene beleid van de NAS (elk uur; oude versies: 10 laatste, 24 per uur, 14 dagen, 8 weken, 12 maanden, 3 jaar).

## Bouwen

```bash
# naast elkaar: homebase-backup/kopia (deze repo) en homebase-backup/htmlui (fork, branch homebase)
homebase/build-htmlui.sh                       # interface → htmlui-homebase/build
go build -o dist/kopia_darwin_amd64/kopia .    # pad dat de app in ontwikkelmodus gebruikt (ook op Apple Silicon)
cd app && npm ci && npx electron .             # app starten (zet ELECTRON_RUN_AS_NODE niet, bv. vanuit VS Code: env -u ELECTRON_RUN_AS_NODE)
npx electron-builder --mac dmg --arm64 --publish never   # installer; Windows en Linux bouwt de workflow
```

Een release: tag `vX.Y.Z` op deze branch pushen. Zonder de geheimen `MAC_CERT_P12`/`MAC_CERT_PASSWORD` (macOS) en een Windows-certificaat is de app niet ondertekend: macOS opent ze dan via rechtsklik → Open, Windows toont SmartScreen.

## Kopia bijwerken

```bash
git remote add upstream https://github.com/kopia/kopia.git   # eenmalig
git fetch upstream && git rebase upstream/master             # op branch homebase
```

`replace` in `go.mod` en de bestanden hierboven zijn de enige plaatsen waar conflicten kunnen komen. Past Kopia een workflow aan die hier weg is, dan geeft de rebase een conflict "deleted by us": los het op met `git rm <bestand>` en `git rebase --continue`.

Workflows met een schema draaien op de standaardbranch van de fork. Maak daarom `homebase` de standaardbranch (Settings → Branches), dan draait er niets van Kopia meer, ook niet vanuit `master`.
