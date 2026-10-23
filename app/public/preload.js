const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("kopiaUI", {
  selectDirectory: function (onSelected) {
    ipcRenderer.invoke("select-dir").then((v) => {
      onSelected(v);
    });
  },
  browseDirectory: function (path) {
    ipcRenderer.invoke("browse-dir", path);
  },
  // HomeBase Back-up: koppelen met HomeBaseOS en de gewone mappen van de gebruiker (zie homebase.js).
  homebasePair: function (url) {
    return ipcRenderer.invoke("homebase-pair", url);
  },
  knownFolders: function () {
    return ipcRenderer.invoke("known-folders");
  },
});
