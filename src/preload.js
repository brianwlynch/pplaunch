const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const { app } = require('@electron/remote');

const settingsPath = path.join(app.getPath('userData'), 'settings.json');

contextBridge.exposeInMainWorld('settingsAPI', {
    save: (data) => fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2)),
    load: () => fs.existsSync(settingsPath) ? JSON.parse(fs.readFileSync(settingsPath)) : {},
    notifyUpdate: () => ipcRenderer.send("settings-updated")
});

contextBridge.exposeInMainWorld('appAPI', {
    openSettings: () => ipcRenderer.send("open-settings-window"),
    openHelp: () => ipcRenderer.send("open-help-window"),
    openTFC: (url) => ipcRenderer.send("open-tfc-window", url),
    debugActive: () => ipcRenderer.send("debug-active"),
});