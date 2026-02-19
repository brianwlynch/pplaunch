const { autoUpdater } = require("electron-updater");

class AutoUpdaterService {
    constructor ({ windowManager }){
        this.wm = windowManager;

        autoUpdater.autoDownload = false;
        autoUpdater.autoInstallOnAppQuit = true;

        this._bound = false;
    }

    _send(message){
        const main = this.wm.get("main");
        const w = main?.window;
        if(w && !w.isDestroyed()) {
            w.webContents.send("updateMessage", message);
        }
    }

    bindEvents(){
        if (this._bound) return;
        this._bound = true;

        autoUpdater.on("checking-for-update", () => {
            this._send("Looking for updates");
        });

        autoUpdater.on("update-available", async (info) => {
            this._send("Update available.");
            try {
                await autoUpdater.downloadUpdate();
            } catch (err) {
                this._send(`Error: ${err?.message || String(err)}`);
            }
        });

        autoUpdater.on("update-not-available", (info) => {
            this._send("Update not available.");
        });

        autoUpdater.on("update-downloaded", (info) => {
            this._send("Update downloaded.");
        });

        autoUpdater.on("error", (err) => {
            const msg =
                (err && (err.stack || err.message)) ? (err.stack || err.message)
                : String(err);

            this._send(`Error: ${msg}`);
        });
    }

    async check(){
        this.bindEvents();

        this._send("Looking for updates");

        try{
            return await autoUpdater.checkForUpdates();
        } catch (err) {
            console.warn("autoUpdater failed:", err);
            this._send(`Error: ${err?.message || String(err)}`);
        }
    }
}

module.exports = AutoUpdaterService;