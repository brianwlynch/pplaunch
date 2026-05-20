const fs = require("fs");
const path = require("path");
const { app, session } = require("electron");
const LoggingService = require("./LoggingService");
const log = new LoggingService("SettingsStore");


class SettingsStore{
    constructor() {
        this.userSettingsPath = path.join(app.getPath('userData'), 'settings.json');

        this.defaultSetting = path.resolve(__dirname, "..", "windows", "settings", "settings.json");
    }

    ensureExists() {
        if (fs.existsSync(this.userSettingsPath)) return;

        fs.mkdirSync(path.dirname(this.userSettingsPath), {recursive: true});

        try{
            if (fs.existsSync(this.defaultSetting)){
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
        return JSON.parse(fs.readFileSync(this.userSettingsPath, "utf-8"));
    }

    save(data){
        this.ensureExists();
        fs.writeFileSync(this.userSettingsPath, JSON.stringify(data, null, 2), "utf-8");
    }

    clearCookies(){
        session.defaultSession.clearStorageData({
            storages: ['cookies']
        }).then(() => {
            log.warn("Cookies have been reset!");
            app.relaunch();
            log.warn("################ RESTARTING APP ################");
            app.exit();
        }).catch((err) => {
            log.error(`Failed to clear cookies: ${err}`);
        });
    }
}

module.exports = SettingsStore