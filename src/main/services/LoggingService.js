const fs = require("fs");
const path = require("path");
const { app } = require("electron");
const { measureMemory } = require("vm");

class Logging {
    constructor(service) {
        this.service = service;
        this.logPath = path.join(app.getPath('userData'), 'app.log');
    }

    error(message, service = this.service) {
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}][E][${service}] - ${message}`;
        this.append(logLine + "\n");
        console.error(logLine);
    }
    warn(message, service = this.service) {
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}][W][${service}] - ${message}`;
        this.append(logLine + "\n");
        console.warn(logLine);
    }
    info(message, service = this.service) {
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}][I][${service}] - ${message}`;
        this.append(logLine + "\n");
        console.log(logLine);
    }
    

    append(message) {
        const MAX_LINES = 500;
        const FOOTER = "################ LAST LOG LINE ################";
        const existing = fs.existsSync(this.logPath)
            ? fs.readFileSync(this.logPath, 'utf8')
            : '';

        const existingLines = existing.split("\n").filter(l => !l.includes(FOOTER));
        const lines = [message.trimEnd(), ...existingLines].slice(0, MAX_LINES);
        fs.writeFileSync(this.logPath, lines.join("\n") + "\n" +  FOOTER);
    }

}

module.exports = Logging