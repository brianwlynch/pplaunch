const fs = require("fs");
const path = require("path");
const { app, session } = require("electron");
const LoggingService = require("./LoggingService");
const log = new LoggingService("SettingsStore");


class SettingsStore {
    constructor() {
        this.userSettingsPath = path.join(app.getPath('userData'), 'settings.json');

        this.defaultSetting = path.resolve(__dirname, "..", "windows", "settings", "settings.json");
    }

    ensureExists() {
        if (fs.existsSync(this.userSettingsPath)) return;

        fs.mkdirSync(path.dirname(this.userSettingsPath), { recursive: true });

        try {
            if (fs.existsSync(this.defaultSetting)) {
                fs.copyFileSync(this.defaultSetting, this.userSettingsPath);
            } else {
                fs.writeFileSync(this.userSettingsPath, JSON.stringify({}, null, 2), "utf-8");
                log.warn("Default settings.json not fund; creating empty settings.");
                log.warn(`Looked for: ${this.defaultSetting}`);
            }
        } catch (err) {
            log.error(`Failed to seed settings: ${err}`);
            fs.writeFileSync(this.userSettingsPath, JSON.stringify({}, null, 2), "utf-8");
        }
    }

    load() {
        this.ensureExists();
        const settings = JSON.parse(fs.readFileSync(this.userSettingsPath, "utf-8"));
        return this.applyInstallerSettings(settings);
    }

    applyInstallerSettings(settings){
        if(!app.isPackaged) return settings;
        const file = path.join(path.dirname(app.getPath('exe')), "installer-settings.json");
        if(!fs.existsSync(file)) return settings;
        try{
            const stamp = fs.statSync(file).mtimeMs;
            if (settings.INSTALLER_APPLIED === stamp) return settings; // Already merged
            const overrides = JSON.parse(fs.readFileSync(file, 'utf-8'));
            const merged = { ...settings, ...overrides, INSTALLER_APPLIED: stamp };
            this.save(merged);
            log.info('Applied installer settings');
            return merged;
        } catch (err) {
            log.error(`Failed to apply installer settings: ${err}`);
            return settings;
        }
    }

    save(data) {
        this.ensureExists();
        fs.writeFileSync(this.userSettingsPath, JSON.stringify(data, null, 2), "utf-8");
    }

    clearCookies() {
        Promise.all([
            session.defaultSession.clearStorageData({
                storages: ['cookies', 'cachestorage']
            }),
            session.defaultSession.clearCache()
        ]).then(() => {
            log.warn("Cookies and cache have been reset!");
            app.relaunch();
            log.warn("################ RESTARTING APP ################");
            app.exit();
        }).catch((err) => {
            log.error(`Failed to clear cookies and cache: ${err}`);
        });
    }
}

module.exports = SettingsStore