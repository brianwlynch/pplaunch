const { BrowserWindow, ipcMain, globalShortcut } = require("electron");
const path = require("path");
const remoteMain = require("@electron/remote/main");
const KeepAliveService = require("../../services/KeepAliveService");

class TFCWindow {
  window;
  wc;

  constructor(target_url, { onFailHard } = {}) {
    this.window = new BrowserWindow({
        width: 1920,
        height: 1080,
        fullscreen: true,
        webPreferences:{
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    this.window.loadURL(target_url);
    this.wc = this.window.webContents;
    //this.wc.openDevTools({ mode: "undocked" });

    remoteMain.enable(this.window.webContents);
    
    // Keep Alive
    this.keepalive = new KeepAliveService({
      getUrl: () => target_url,
      pollS: 5,
      failAfterS: 60,
      onFailHard: (info) => {
        try {

          this.window.close();
        } catch {}
        onFailHard?.(info);
      },
      onTick: (tick) => {
        
      }
    });


    //Apply Zoom
    this.wc.on("did-finish-load", () => this.applySavedZoom());
    this.wc.on("did-navigate", () => this.applySavedZoom());
    this.wc.on("did-navigate-in-page", () => this.applySavedZoom());
    
    this.window.on("focus", () => this.registerZoomShortcuts());
    this.window.on("blur", () => this.unregisterZoomShortcuts());
    this.window.on("closed", () => this.unregisterZoomShortcuts());
    
    this.handleMessages();

    this.window.once("ready-to-show", () => {
      this.keepalive.start();
    });
    this.window.on("closed", () => {
      this.keepalive.stop();
    });

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
  
  getOrigin(){
    try{
        const url = new URL(this.wc.getURL());
        return url.origin;
    } catch {
        return null;
    }
  }

  async applySavedZoom(){
    const origin = this.getOrigin()
    if (!origin) return;
  }

  registerZoomShortcuts(){
    const wc = this.wc
    if (!wc) return;

    const updateZoom = async (delta) => {
        const origin = this.getOrigin();
        if (!origin) return;

        const level = wc.getZoomLevel();
        const newLevel = level + delta;

        wc.setZoomLevel(newLevel);
        this.saveZoom(origin, newLevel);
    };

    if (this._zoomShortcutsRegistered) return;
    this._zoomShortcutsRegistered = true;

    globalShortcut.register("Control+=", () => updateZoom(0.25));
    globalShortcut.register("Control+-", () => updateZoom(-0.25));
    globalShortcut.register("Control+0", () => {
        const origin = this.getOrigin();
        if(!origin) return;
        wc.setZoomLevel(0);
        this.saveZoom(origin, 0);
    });

  }

  unregisterZoomShortcuts(){
    if (!this._zoomShortcutsRegistered) return;
    this._zoomShortcutsRegistered = false;

    globalShortcut.unregister("Control+=");
    globalShortcut.unregister("Control+-");
    globalShortcut.unregister("Control+0");
  }

  loadZoom(origin) {
    const SettingsStore = require("../../services/SettingsStore");
    const store = new SettingsStore();
    const s = store.load();

    //Quick fix for typo in older version of the panel.
    if (s.ZOOM_LEVLES && !s.ZOOM_LEVELS) {
      s.ZOOM_LEVELS = s.ZOOM_LEVLES;
      delete s.ZOOM_LEVLES;
      store.save(s);
    }

    const levels = s.ZOOM_LEVELS || {};
    return levels[origin] ?? 0;
  }

  saveZoom(origin, level){
    const SettingsStore = require("../../services/SettingsStore");
    const store = new SettingsStore();
    const s = store.load();
    const levels = s.ZOOM_LEVELS || {};
    levels[origin] = level;
    s.ZOOM_LEVELS = levels;
    store.save(s);
  }

  applySavedZoom(){
    const origin = this.getOrigin();
    if(!origin) return;
    const saved = this.loadZoom(origin);
    this.wc.setZoomLevel(saved);
  }

}

module.exports = TFCWindow;