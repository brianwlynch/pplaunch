const { app, BrowserWindow, Menu, MenuItem, session, webContents, ipcMain } = require('electron');
const { assert } = require('node:console');
const path = require('node:path');
const { fstat } = require('node:fs');
const fs = require('fs');
const { eventNames } = require('node:process');
const { autoUpdater, AppUpdater } = require("electron-updater");
const MainWindow = require("./windows/main/mainWindow");
const HelpWindow = require("./windows/help/helpWindow");
const SettingsWindow = require("./windows/settings/settingsWindow");
const TFCWindow = require("./windows/tfc/tfcWindow");
const WindowManager = require("./windows/windowManager");
const registerSettingsIpc = require("./ipc/settingsIPC");
const AutoUpdaterService = require("./services/AutoUpdaterService");

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

const wm = new WindowManager();
const updater = new AutoUpdaterService({windowManager: wm});

require('@electron/remote/main').initialize();

//Only allow the app to run once
const appLocked = app.requestSingleInstanceLock();
if (!appLocked){
  //Another instance is already running
  app.quit()
}

app.on('second-instance', (event, commandLine, workingDirectory) => {
  if (mainWindow){
    try {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    } catch (err) {
      console.error("Error Focusing on main window on second-instance: ", err);
    }
  }
  if (tfcWindow){
    try {
      if (tfcWindow.isMinimized()) tfcWindow.restore();
      if (!tfcWindow.isVisible()) tfcWindow.show();
      tfcWindow.focus();
    } catch (err) {
      console.error("Error Focusing on TFC window on second-instance: ", err);
    }
  }
  if (settingsWindow){
    try {
      if (settingsWindow.isMinimized()) settingsWindow.restore();
      if (!settingsWindow.isVisible()) settingsWindow.show();
      settingsWindow.focus();
    } catch (err) {
      console.error("Error Focusing on Settings window on second-instance: ", err);
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

  const contents ='[Desktop Entry]\n' +
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
      console.log('Autostart file created successfully.');
    } catch (error) {
      console.error('Error creating autostart file:', error);
    }
  };
};

// ######################
// ### Page Settings  ###
// ######################

function createMainWindow(){
  console.log("Attempting... createMainWindow");
  return wm.open("main", MainWindow);
}
function createHelpWindow(){
  console.log("Attempting... createHelpWindow");
  main = wm.get("main");
  return wm.open("help", HelpWindow, main);
}
function createSettingsWindow(){
  console.log("Attempting... createSettingsWindow");
  main = wm.get("main");
  return wm.open("settings", SettingsWindow, {parent: main, preload_path: path.join(__dirname, "preload", "preload.js")});
}
function createTfcWindow(target_url){
  console.log("Attempting... createTFCWindow");
  
  if(!wm.isClosed("settings") || !wm.isClosed("help")) return;
  wm.close("main");
  
  return wm.open("tfc", TFCWindow, target_url, {
    onFailHard: (info) => {
      console.warn("TFC keepAlive failed hard:", info);

      wm.open("main", MainWindow);
      wm.get("main")?.window?.webContents?.send(
        "updateMessage", "Can't get to TFC for 60s! <br> ($info.reason)."
      );
    }
  });
}


// ######################
// ### Menu Settings  ###
// ######################

Menu.setApplicationMenu(
  Menu.buildFromTemplate(
    [{
        label: 'File',
        submenu:[
          {role: 'Help',
            click: async () => {
              createHelpWindow()
              helpWindow.once('ready-to-show', () => {
                helpWindow.show();
              });
            }
          },
          {type: 'separator'},
          {label: 'Settings',
            click: async () => {
              createSettingsWindow()
              settingsWindow.once('ready-to-show', () => {
                settingsWindow.show();
              });
            }
          },
          {type: 'separator'},
          {role: 'Close'},
        ]
      },
      {
        label: "Edit",
        submenu:[
          {role: 'cut'},
          {role: 'copy'},
          {role: 'paste'},
        ]
      },
      {
        label: "Window",
        submenu: [
          {role: "Reload"},
          {type: "separator"},
          {role: 'zoomIn'},
          {role: 'zoomOut'},
          {role: 'resetZoom'},
        ]
      },
      {
        label: "Debug",
        submenu:[
          {role: 'toggleDevTools'},
          {role: "forceReload"},
          { label: 'Restart App',
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

app.on('window-all-closed', () => {
  app.quit();
});

app.whenReady().then(() => {

  registerSettingsIpc();
  
  createMainWindow();
  updater.check();

  ipcMain.on('open-settings-window',() => {
    createSettingsWindow();
  });

  ipcMain.on('open-help-window',() => {
    createHelpWindow();
  });

  ipcMain.on('open-tfc-window',(event, target_url) => {
    createTfcWindow(target_url);
  });
  
  ipcMain.on("debug-active", () => {
    const main = wm.get("main");
    main?.window?.webContents?.openDevTools({ mode: "right"});
  });

  ipcMain.on("debug-inactive", () => {
    const main = wm.get("main");
    main?.window?.webContents?.closeDevTools();
  });

});