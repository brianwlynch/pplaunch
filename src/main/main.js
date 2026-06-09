const { app, BrowserWindow, Menu, MenuItem, session, webContents, ipcMain } = require('electron');
const { assert } = require('node:console');
const path = require('node:path');
const { fstat } = require('node:fs');
const fs = require('fs');
const { eventNames } = require('node:process');
const { autoUpdater, AppUpdater } = require("electron-updater");
const MainWindow = require("./windows/index/mainWindow");
const HelpWindow = require("./windows/help/helpWindow");
const SettingsWindow = require("./windows/settings/settingsWindow");
const GameSettingsWindow = require("./windows/gameSettings/gameSettingsWindow");
const TFCWindow = require("./windows/tfc/tfcWindow");
const WindowManager = require("./windows/windowManager");
const registerSettingsIpc = require("./ipc/settingsIPC");
const AutoUpdaterService = require("./services/AutoUpdaterService");
const SharingService = require("./services/SharingService");
const registerSharingIpc = require("./ipc/sharingIPC");
const LoggingService = require("./services/LoggingService");
const registerLoggingIpc = require('./ipc/loggingIPC');
const SettingsStore = require("./services/SettingsStore");

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

const wm = new WindowManager();
const updater = new AutoUpdaterService({ windowManager: wm });
const sharing = new SharingService({ windowManager: wm });
const log = new LoggingService("Main");
log.warn("################ STARTING APP ################\n");

const settings = new SettingsStore();
const initialSettings = settings.load();
let cachedLocation = initialSettings.LOCATION;
let cachedCustomLocation = initialSettings.CUSTOM_LOCATION;

require('@electron/remote/main').initialize();

// Global main-process error handling
process.on('uncaughtException', (error) => {
  log.error(`Uncaught exception: ${error.stack || error.message || error}`);
  app.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.error(`Unhandled promise rejection: ${reason?.stack || reason?.message || reason}`);
});

//Only allow the app to run once
const appLocked = app.requestSingleInstanceLock();
if (!appLocked) {
  //Another instance is already running
  app.quit()
}

app.on('second-instance', (event, commandLine, workingDirectory) => {
  mainWindow = wm.get("main");
  if (mainWindow) {
    try {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    } catch (err) {
      log.error(`Error Focusing on main window on second-instance: `, err);
    }
  }
  tfcWindow = wm.get("tfc");
  if (tfcWindow) {
    try {
      if (tfcWindow.isMinimized()) tfcWindow.restore();
      if (!tfcWindow.isVisible()) tfcWindow.show();
      tfcWindow.focus();
    } catch (err) {
      log.error(`Error Focusing on TFC window on second-instance: `, err);
    }
  }
  settingsWindow = wm.get("settings");
  if (settingsWindow) {
    try {
      if (settingsWindow.isMinimized()) settingsWindow.restore();
      if (!settingsWindow.isVisible()) settingsWindow.show();
      settingsWindow.focus();
    } catch (err) {
      log.error(`Error Focusing on Settings window on second-instance: `, err);
    }
  }
});

// ############################
// ### Auto Start Settings  ###
// ############################

//Autostart on boot - Windows
app.on('ready', () => {
  app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath('exe'),
  });
});

//Autostart on boot - Ubuntu
if (process.platform === 'linux') {

  const autoStartDir = path.join(process.env.HOME, '.config', 'autostart');
  const desktopFile = path.join(autoStartDir, 'pplaunch.desktop');
  const iconPath = path.join(__dirname, 'assets', 'images', 'icon.png');

  const contents = '[Desktop Entry]\n' +
    'Type=Application\n' +
    'Name=PPLaunch\n' +
    'Exec=/usr/bin/pplaunch\n' +
    'X-GNOME-Autostart-enabled=true\n' +
    'Icon=' + iconPath + '\n' +
    'Hidden=false\n' +
    'NoDisplay=false\n' +
    'Comment=Launch TFC Soft Panel\n';

  // Ensure the autostart directory exists
  if (!fs.existsSync(autoStartDir)) {
    fs.mkdirSync(autoStartDir, { recursive: true });
  }

  // Create the .desktop file for autostart
  if (!fs.existsSync(desktopFile)) {
    try {
      fs.writeFileSync(desktopFile, contents);
      log.info(`Autostart file created successfully.`);
    } catch (error) {
      log.error(`Error creating autostart file:`, error);
    }
  };
};

// ######################
// ### Page Settings  ###
// ######################

function createMainWindow() {
  logNewWindow("Main");
  return wm.open("main", MainWindow);
}
function createHelpWindow() {
  logNewWindow("Help");
  main = wm.get("main");
  return wm.open("help", HelpWindow, main);
}
function createSettingsWindow() {
  logNewWindow("Settings");
  main = wm.get("main");
  return wm.open("settings", SettingsWindow, { parent: main, preload_path: path.join(__dirname, "preload", "preload.js") });
}
function createGameSettingsWindow() {
  logNewWindow("Game Settings");
  main = wm.get("main");
  return wm.open("gameSettings", GameSettingsWindow, { parent: main, preload_path: path.join(__dirname, "preload", "preload.js") });
}
function createTfcWindow(target_url) {
  logNewWindow("TFC");

  if (!wm.isClosed("settings") || !wm.isClosed("help")) return;
  sharing.stop("Opening TFC!");
  wm.close("main");

  return wm.open("tfc", TFCWindow, target_url, {});
}
function logNewWindow(win) {
  log.info(`Opening a window: ${win}`);
}


// ######################
// ### Menu Settings  ###
// ######################

Menu.setApplicationMenu(
  Menu.buildFromTemplate(
    [{
      label: 'File',
      submenu: [
        { role: 'close' },
      ]
    },
    {
      label: "Edit",
      submenu: [
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ]
    },
    {
      label: "Window",
      submenu: [
        { role: "Reload" },
        { type: "separator" },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
      ]
    },
    {
      label: "Debug",
      submenu: [
        { role: 'toggleDevTools' },
        { role: "forceReload" },
        {
          label: 'Restart App',
          click: () => {
            app.relaunch(); app.exit(0);
          }
        },
      ]
    },
    ],
  )
);

// ######################
// ### App Functions  ###
// ######################

app.on("before-quit", async (event) => {
  event.preventDefault();

  await sharing.stop("Quitting");
  log.warn("################ CLOSING APP ################");
  app.exit(0);
})

app.on('window-all-closed', () => {
  app.quit();
});

app.whenReady().then(() => {

  registerSettingsIpc({
    onSave: (data) => {
      const locationChanged =
        data.LOCATION !== cachedLocation ||
        data.CUSTOM_LOCATION !== cachedCustomLocation;
      if (locationChanged) {
        cachedLocation = data.LOCATION;
        cachedCustomLocation = data.CUSTOM_LOCATION;
        sharing.restart("Settings Updated!")
      }
    }
  })

  registerSharingIpc(sharing);
  registerLoggingIpc(new LoggingService("IPC"));
  sharing.start();

  createMainWindow();
  updater.check();

  ipcMain.on('open-settings-window', () => {
    createSettingsWindow();
  });

  ipcMain.on('open-help-window', () => {
    createHelpWindow();
  });

  ipcMain.on('open-game-settings-window', () => {
    createGameSettingsWindow();
  });

  ipcMain.on('open-tfc-window', (event, target_url) => {
    createTfcWindow(target_url);
  });

  ipcMain.on("debug-active", () => {
    const main = wm.get("main");
    main?.window?.webContents?.openDevTools({ mode: "right" });
  });

  ipcMain.on("debug-inactive", () => {
    const main = wm.get("main");
    main?.window?.webContents?.closeDevTools();
  });

});

// Doesn't work when running `npm run start` from network share; an electron limitation.
// app.commandLine.appendSwitch('disable-gpu');
// app.commandLine.appendSwitch('disable-gpu-sandbox');