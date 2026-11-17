const { BrowserWindow, ipcMain, globalShortcut } = require("electron");
const path = require("path");
const remoteMain = require("@electron/remote/main");
const { getWindowSize } = require("../../helpers/WindowSize");

const ZOOM_STEPS = [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2]

class TFCWindow {
  window;
  wc;

  constructor(target_url, { onFailHard } = {}) {

    const { width, height, fullscreen } = getWindowSize()

    this.window = new BrowserWindow({
      width,
      height,
      fullscreen,
      frame: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    this.window.loadURL(target_url);
    this.wc = this.window.webContents;
    //this.wc.openDevTools({ mode: "undocked" });

    remoteMain.enable(this.window.webContents);


    //Apply Zoom
    this.wc.on("did-finish-load", () => this.applySavedZoom());
    this.wc.on("did-navigate", () => this.applySavedZoom());
    this.wc.on("did-navigate-in-page", () => this.applySavedZoom());

    this.window.on("focus", () => this.registerZoomShortcuts());
    this.window.on("blur", () => this.unregisterZoomShortcuts());
    this.window.on("closed", () => this.unregisterZoomShortcuts());

    this.handleMessages();
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

  getOrigin() {
    try {
      const url = new URL(this.wc.getURL());
      return url.origin;
    } catch {
      return null;
    }
  }

  registerZoomShortcuts() {
    const wc = this.wc
    if (!wc) return;

    const updateZoom = (direction) => {
      const origin = this.getOrigin();
      if (!origin) return;
      const idx = nearestStepIndex(wc.getZoomFactor());
      const next = ZOOM_STEPS[Math.min(Math.max(idx + direction, 0), ZOOM_STEPS.length -1)];
      wc.setZoomFactor(next);
      this.saveZoom(origin, next);
    };

    const nearestStepIndex = (factor) => {
      let best = 0;
      ZOOM_STEPS.forEach((f, i) => {
        if (Math.abs(f - factor) < Math.abs(ZOOM_STEPS[best] - factor)) best = i;
      });
      return best;
    }

    if (this._zoomShortcutsRegistered) return;
    this._zoomShortcutsRegistered = true;

    globalShortcut.register("Control+=", () => updateZoom(1));
    globalShortcut.register("Control+-", () => updateZoom(-1));
    globalShortcut.register("Control+0", () => {
      const origin = this.getOrigin();
      if (!origin) return;
      wc.setZoomFactor(1);
      this.saveZoom(origin, 1);
    });

  }

  unregisterZoomShortcuts() {
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
    const v = levels[origin]
    return ZOOM_STEPS.includes(v) ? v : 1;
  }

  saveZoom(origin, level) {
    const SettingsStore = require("../../services/SettingsStore");
    const store = new SettingsStore();
    const s = store.load();
    const levels = s.ZOOM_LEVELS || {};
    levels[origin] = level;
    s.ZOOM_LEVELS = levels;
    store.save(s);
  }

  applySavedZoom() {
    const origin = this.getOrigin();
    if (!origin) return;
    const saved = this.loadZoom(origin);
    this.wc.setZoomFactor(saved);
  }

}

module.exports = TFCWindow;