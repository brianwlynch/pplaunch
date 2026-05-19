const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
// const { app } = require('@electron/remote');
const { callbackify } = require('util');


contextBridge.exposeInMainWorld('settingsAPI', {
    load: () => ipcRenderer.invoke("settings:load"),
    save: (data) => ipcRenderer.invoke("settings:save", data),

    onChanged: (cb) => {
        ipcRenderer.on("settings:changed", (_evt, next) => cb(next));
    }
});

contextBridge.exposeInMainWorld("debugAPI", {
  on: () => ipcRenderer.send("debug-active"),
  off: () => ipcRenderer.send("debug-inactive"),
});

contextBridge.exposeInMainWorld("zoomAPI", {
    get: (origin) => ipcRenderer.invoke("zoom:get", origin),
    set: (origin, level) => ipcRenderer.invoke("zoom:set", origin, level),
    reset: (origin) => ipcRenderer.invoke("zoom:reset", origin),
})

contextBridge.exposeInMainWorld('appAPI', {
    openSettings: () => ipcRenderer.send("open-settings-window"),
    openHelp: () => ipcRenderer.send("open-help-window"),
    openGameSettings: () => ipcRenderer.send("open-game-settings-window"),
    openTFC: (url) => ipcRenderer.send("open-tfc-window", url),
    debugActive: () => ipcRenderer.send("debug-active"),
});

contextBridge.exposeInMainWorld("sharingAPI", {
    peers: () => ipcRenderer.invoke("sharing:peers"),
    start: () => ipcRenderer.invoke("sharing:start"),
    stop: () => ipcRenderer.invoke("sharing:stop"),
    onPeerFound: (cb) => ipcRenderer.on("sharing:peer-found", (_evt, peer) => cb(peer)),
    onPeerLost: (cb) => ipcRenderer.on("sharing:peer-lost", (_evt, peer) => cb(peer)),
    pushScores: (scores) => ipcRenderer.invoke("sharing:push-scores", scores),
    onScoresUpdated: (cb) => ipcRenderer.on("sharing:scores-updated", (_evt, scores) => cb(scores)),
})

contextBridge.exposeInMainWorld("loggingAPI", {
    error: (msg, service) => ipcRenderer.send("logging:error", msg, service),
    warn: (msg, service) => ipcRenderer.send("logging:warn", msg, service),
    info: (msg, service) => ipcRenderer.send("logging:info", msg, service),
})

let bridge = {
    updateMessage: (callback) => ipcRenderer.on("updateMessage", callback),
};

contextBridge.exposeInMainWorld("bridge", bridge);