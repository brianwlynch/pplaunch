const { BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const remoteMain = require("@electron/remote/main");
const { getWindowSize } = require("../../helpers/WindowSize");

class HelpWindow {
  window;
  wc;

  constructor({parent}) {
    const { width, height, fullscreen } = getWindowSize();
    this.window = new BrowserWindow({
        width,
        height,
        fullscreen,
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