const { BrowserWindow, ipcMain } = require("electron");
const LoggingService = require("../services/LoggingService");

const log = new LoggingService("WindowManager");

class WindowManager {
    windows;

    constructor(){
        this.windows = {
            main: null,
            help: null,
            settings: null,
            tfc: null,
        };
    }

    open(name, WindowClass, ...args){
        const existing = this.windows[name];
        log.info(`Managing a window - ${name}`);

        if (existing && existing.window && !existing.window.isDestroyed()){
            try{
                if(existing.window.isMinimized()) existing.window.restore();
                if(!existing.window.isVisible()) existing.window.show();
                existing.window.focus();
            } catch {log.error(`Existing window error!`);}
            return existing;
        }

        const instance = new WindowClass(...args);
        this.windows[name] = instance;

        if (instance.window){
            instance.window.on("closed", () => {
                this.windows[name] = null;
            });
        }
        
        return instance;
    }

    close(name){
        const entry = this.get(name);
        const win = entry?.window ?? entry;
        if(!win || win.isDestroyed()) return;
        win.close();
    }

    isClosed(name){
        const entry = this.get(name);
        const win = entry?.window ?? entry;
        return !win || win.isDestroyed();
    }

    get(key) {
        return this.windows[key];
    }

}

module.exports = WindowManager;