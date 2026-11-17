const { BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const remoteMain = require("@electron/remote/main");
const { getWindowSize } = require("../../helpers/WindowSize");
class MainWindow {
    window;
    wc;

    constructor() {
        const { width, height, fullscreen } = getWindowSize()

        this.window = new BrowserWindow({
            width,
            height,
            fullscreen,
            useContentSize: true,
            frame: false,
            webPreferences: {
                preload: path.join(__dirname, '..', '..', 'preload', 'preload.js'),
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: false,
            },
        })

        this.window.once("ready-to-show", () => {
            this.window.show();
        })

        remoteMain.enable(this.window.webContents);
        this.handleMessages();

        this.wc = this.window.webContents;
        //this.wc.openDevTools({ mode: "undocked" });
        this.window.loadFile(path.join(__dirname, 'index.html'));

    }

    close() {
        this.window.close();
        ipcMain.removeAllListeners();
    }

    hide() {
        this.window.hide();
    }

    handleMessages() {
        // IPC Functions go here
    }
}
module.exports = MainWindow;