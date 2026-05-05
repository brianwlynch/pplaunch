const { ipcMain } = require("electron");

function registerSharingIpc(sharingService) {
    ipcMain.handle("sharing:peers", async () => sharingService.getPeers());
    ipcMain.handle("sharing:start", async () => { sharingService.start(); return true; });
    ipcMain.handle("sharing:stop", async () => { await sharingService.stop(); return true; });
    ipcMain.handle("sharing:push-scores", async (_evt, scores) => {
        await sharingService.pushToAll(scores);
        return true;
    });
}

module.exports = registerSharingIpc;