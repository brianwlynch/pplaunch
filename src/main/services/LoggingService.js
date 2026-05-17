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

    append(message){
        fs.appendFileSync(this.logPath, message, (err) => {
            if (err) throw err;
        });
    }

}

module.exports = Logging