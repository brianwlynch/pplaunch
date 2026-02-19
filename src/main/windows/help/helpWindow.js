const { BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const remoteMain = require("@electron/remote/main");

class HelpWindow {
  window;
  wc;

  constructor({parent}) {
    this.window = new BrowserWindow({
        width: 720,
        height: 980,
        modal: true,
        parent: parent,
        show: false,
        transparent: true,
        frame: false,
        roundedCorners: true,
        webPreferences:{
            nodeIntegration: false,
            contextIsolation: false,
            sandbox: false,
        } 
    });

    this.window.once("ready-to-show", () => {
      this.window.show();
    });

    this.handleMessages();
    remoteMain.enable(this.window.webContents);

    this.wc = this.window.webContents;
    //this.wc.openDevTools({ mode: "undocked" });

    this.window.loadFile(path.join(__dirname, "help.html"));
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

module.exports = HelpWindow;