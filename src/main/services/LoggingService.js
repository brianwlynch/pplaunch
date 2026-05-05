const fs = require("fs");
const path = require("path");
const { app } = require("electron");

class Logging{
    constructor(service) {
        this.service = service;
        this.logPath = path.join(app.getPath('userData'), 'app.log');
    }

    error(message, service = this.service) {
        const timestamp = new Date().toISOString();
        const logLine = `[${service}][E] - [${timestamp}] - ${message}\n`;
        this.append(logLine);
        console.error(logLine);
    }
    warn(message, service = this.service) {
        const timestamp = new Date().toISOString();
        const logLine = `[${service}][W] - [${timestamp}] - ${message}\n`;
        this.append(logLine);
        console.warn(logLine);
    }
    info(message, service = this.service) {
        const timestamp = new Date().toISOString();
        const logLine = `[${service}][I] - [${timestamp}] - ${message}\n`;
        this.append(logLine);
        console.log(logLine);
    }

    append(message){
        fs.appendFileSync(this.logPath, message, (err) => {
            if (err) throw err;
        });
    }

}

module.exports = Logging