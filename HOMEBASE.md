# HomeBase Backup

This fork of [Kopia](https://github.com/kopia/kopia) is **HomeBase Backup**: the app that has PCs and Macs back up every hour to a NAS with [HomeBaseOS](https://github.com/lennertvh1/homebaseos). It is KopiaUI with its own name, an interface in the style of the HomeBaseOS dashboard (English and Dutch), and pairing with a code instead of address + fingerprint + name.

Kopia is licensed under the Apache License 2.0 (see `LICENSE`). So is this fork. "Kopia" is the name of the original project; this app is not officially affiliated with it.

## What is different from Kopia

| Where | Change |
|---|---|
| `htmlui-homebase/` | Replaces the module `github.com/kopia/htmluibuild` (see `replace` in `go.mod`): the built interface from the fork [lennertvh1/htmlui](https://github.com/lennertvh1/htmlui), branch `homebase`. |
| `homebase/build-htmlui.sh` | Builds that interface and puts it in `htmlui-homebase/build`. |
| `app/package.json` | Name *HomeBase Backup*, app id `be.homebaseos.backup`, updates and releases from this fork, file names without spaces. |
| `app/public/homebase.js` | New: translations (English key, Dutch in `NL`) for menus and notifications, fetching a pairing code from HomeBaseOS (`homebase-pair`) and the user's standard folders (`known-folders`). |
| `app/public/preload.js` | `kopiaUI.homebasePair()` and `kopiaUI.knownFolders()` for the interface. |
| `app/public/electron.js` | Name and texts via `tr()`; the window opens on a normal start (not when starting automatically at sign-in, `--hidden`), when opening the app again and on a click on the Dock. Release notes from this fork. |
| `app/public/auto-launch.js` | Name *HomeBase Backup*, starts at sign-in without a window. |
| `app/assets`, `app/resources`, `app/public/*.png` | Icons with the HomeBaseOS house. |
| `.github/workflows/homebase-backup.yml` | Builds the app for Windows, macOS (Intel and Apple Silicon) and Linux; for a tag `v*` the installers are attached to the release. |
| `.github/workflows/*`, `.github/dependabot.yml` | Kopia's workflows and Dependabot are gone: they need secrets of kopia/kopia or open pull requests. Only `homebase-backup.yml` stays. |

Kopia's Go code itself is unchanged.

## Pairing with HomeBaseOS

1. In HomeBaseOS: *Backups → Devices → + Device → With the HomeBase Backup app*. You get a pairing code (8 characters, 15 minutes, one-time).
2. In the app: the address of HomeBaseOS (e.g. `freddy.local`) + the code. The app requests `GET http://<address>:8080/api/backup/pair/<code>` and gets the port, the server's fingerprint, the name (`<device>@<device>`) and the password. With those it connects to the Kopia server on the NAS (`/api/v1/repo/connect` with `apiServer`).
3. *What do you want to keep safe?*: Documents, Desktop and Pictures are on by default. Each folder becomes a source with the NAS's global policy (every hour; old versions: 10 latest, 24 hourly, 14 days, 8 weeks, 12 months, 3 years).

## Building

```bash
# side by side: homebase-backup/kopia (this repo) and homebase-backup/htmlui (fork, branch homebase)
homebase/build-htmlui.sh                       # interface → htmlui-homebase/build
go build -o dist/kopia_darwin_amd64/kopia .    # the path the app uses in development mode (also on Apple Silicon)
cd app && npm ci && npx electron .             # start the app (don't set ELECTRON_RUN_AS_NODE, e.g. from VS Code: env -u ELECTRON_RUN_AS_NODE)
npx electron-builder --mac dmg --arm64 --publish never   # installer; the workflow builds Windows and Linux
```

A release: push a tag `vX.Y.Z` on this branch. Without the secrets `MAC_CERT_P12`/`MAC_CERT_PASSWORD` (macOS) and a Windows certificate the app is not signed: macOS then opens it via right-click → Open, Windows shows SmartScreen.

## Updating Kopia

```bash
git remote add upstream https://github.com/kopia/kopia.git   # once
git fetch upstream && git rebase upstream/master             # on branch homebase
```

`replace` in `go.mod` and the files above are the only places where conflicts can arise. If Kopia changes a workflow that is gone here, the rebase gives a "deleted by us" conflict: resolve it with `git rm <file>` and `git rebase --continue`.

Scheduled workflows run on the fork's default branch. So make `homebase` the default branch (Settings → Branches); then nothing of Kopia runs anymore, not even from `master`.
