const { ipcMain } = require("electron");

function registerLoggingIpc(loggingService) {
    ipcMain.on("logging:info", (_evt, msg, service) => loggingService.info(msg, service));
    ipcMain.on("logging:warn", (_evt, msg, service) => loggingService.warn(msg, service));
    ipcMain.on("logging:error", (_evt, msg, service) => loggingService.error(msg, service));
}

module.exports = registerLoggingIpc;