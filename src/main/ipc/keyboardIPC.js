const { ipcMain } = require("electron");
const path = require("path");
const { spawn } = require('child_process');

function getKeyboardCommand() {
    if (process.platform === "win32"){
        const base = provess.env.CommonProgramFiles || "C:\\Program Files\\Common Files";
        return [path.join(base, "microsoft shared", "ink", "TabTip.exe"), []];
    }
    if (process.platform === "linux"){
        return ["onboard", []];
    }
    return null;
}

function registerKeyboardIpc() {
    ipcMain.on("keyboard:open", () => {
        const cmd = getKeyboardCommand();
        if (!cmd) return;
        console.log("Attempting to open OSK");
        const child = spawn(cmd[0], cmd[1], { detached: true, stdio: "ignore" });
        child.on("error", (e) => console.error(`OSK Failed: ${e.message}`));
        child.unref();
    });
}

module.exports = registerKeyboardIpc;