const { BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const remoteMain = require("@electron/remote/main");

class GameSettingsWindow {
  window;
  wc;

  constructor({parent, preload_path}) {
    this.window = new BrowserWindow({
        width: 470,
        height: 360,
        modal: true,
        parent: parent,
        show: false,
        transparent: true,
        frame: false,
        roundedCorners: true,
        webPreferences:{
            preload: preload_path,
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
        }
    });

    this.window.once("ready-to-show", () => {
      this.window.show();
    });

    this.handleMessages();
    remoteMain.enable(this.window.webContents);
    this.wc = this.window.webContents;
    // this.wc.openDevTools({ mode: "undocked" });

    this.window.loadFile(path.join(__dirname, "gameSettings.html"));
  }

  close() {
    this.window.close();
    ipcMain.removeAllListeners();
  }

  hide() {
    this.window.hide();
  }

  handleMessages() {
    //Ipc functions go here.
  }
}

module.exports = GameSettingsWindow;