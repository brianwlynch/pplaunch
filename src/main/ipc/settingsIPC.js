const { ipcMain } = require("electron");
const SettingsStore = require("../services/SettingsStore");

function registerSettingsIpc(){
    const store = new SettingsStore();

    ipcMain.handle("settings:load", async () => store.load());

    ipcMain.handle("settings:save", async (_evt, data) => {
        store.save(data);
        return true;
    });

    ipcMain.handle("zoom:get", async(_e, origin) => {
        const s = store.load();
        const levels = s.ZOOM_LEVELS || {};
        return levels[origin] ?? 0;
    });

    ipcMain.handle("zoom:set", async (_e, origin, level) => {
        const s = store.load();
        const levels = s.ZOOM_LEVELS || {};
        levels[origin] = level;
        s.ZOOM_LEVELS = levels;
        store.save(s);
        return true;
    });

    ipcMain.handle("zoom:reset", async (_e, origin) => {
        const s = store.load();
        const levels = s.ZOOM_LEVELS || {};
        levels[origin] = 0;
        s.ZOOM_LEVELS = levels;
        store.save(s);
        return true;
    })
}

module.exports = registerSettingsIpc;