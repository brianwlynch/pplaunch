const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const { app } = require('@electron/remote');
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
    openTFC: (url) => ipcRenderer.send("open-tfc-window", url),
    debugActive: () => ipcRenderer.send("debug-active"),
});

let bridge = {
    updateMessage: (callback) => ipcRenderer.on("updateMessage", callback),
};

contextBridge.exposeInMainWorld("bridge", bridge);