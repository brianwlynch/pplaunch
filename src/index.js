const { app, BrowserWindow, Menu, MenuItem, session, webContents, globalShortcut, ipcMain } = require('electron');
const { assert } = require('node:console');
const path = require('node:path');
const { fstat } = require('node:fs');
const fs = require('fs');
const { eventNames } = require('node:process');
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
const { autoUpdater, AppUpdater } = require("electron-updater");

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

const isMacOs = process.platform == "darwin";
let target_url = "";


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


require('@electron/remote/main').initialize();


// #################################
// ### Save and Recall Settings  ###
// #################################


function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch (e) {
    return { AUTO_START: false, ZOOM_LEVLES: {} };
  }
}

function saveSettings(settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

let settings = loadSettings();
let zoomLevels = settings.ZOOM_LEVLES || {};

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
let mainWindow;
let settingsWindow;
let helpWindow;
let tfcWindow;

// main Window
const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  mainWindow.showMessage = (message) => {
    if (mainWindow && mainWindow.webContents && !mainWindow.isDestroyed()){
      console.log("showMessage trapped");
      console.log(message);
      mainWindow.webContents.send("updateMessage", message);
    }
  };

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  //mainWindow.webContents.toggleDevTools();
  require('@electron/remote/main').enable(mainWindow.webContents);
};

// Settings Page
function openSettingsPanel(){
  settingsWindow = new BrowserWindow({
    width: 500,
    height: 375,
    modal: true,
    parent: mainWindow,
    show: false,
    transparent: true,
    frame: false,
    roundedCorners: true,
    webPreferences:{
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    }
  })

  settingsWindow.loadFile(path.join(__dirname, 'settings.html'));

  //settingsWindow.webContents.toggleDevTools();
  require('@electron/remote/main').enable(settingsWindow.webContents);

};

// Help Page
function openHelpPanel(){
  helpWindow = new BrowserWindow({
    width: 720,
    height: 800,
    modal: true,
    parent: mainWindow,
    show: false,
    transparent: true,
    frame: false,
    roundedCorners: true,
    webPreferences:{
      nodeIntegration: false,
      contextIsolation: false,
      sandbox: false,
    }
  })

  helpWindow.loadFile(path.join(__dirname, 'help.html'));

};

//TFC Page
//The main window will close and this will open with TFC
function openTFCWindow(target_url){
  tfcWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    webPreferences:{
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  tfcWindow.loadURL(target_url);

  // Electron doesn't save the zoom level for different URLs by default so this will help it remember.

  tfcWindow.once('ready-to-show', () => {
    const wc = tfcWindow.webContents;
    const updateZoom = (delta) => {
      const url = new URL(wc.getURL());
      const domainKey = url.origin;

      const level = wc.getZoomLevel();
      const newLevel = level + delta;
      wc.setZoomLevel(newLevel);
      zoomLevels[domainKey] = newLevel;
      settings.ZOOM_LEVLES = zoomLevels;
      saveSettings(settings);
    };

    globalShortcut.register('Control+=', () => updateZoom(0.25));
    globalShortcut.register('Control+-', () => updateZoom(-0.25));


    globalShortcut.register('Control+0', () => {
      const url = new URL(wc.getURL());
      const domainKey = url.origin;
      wc.setZoomLevel(0);
      zoomLevels[domainKey] = 0;
    })
  });

  // Stop listening for shortcuts
  tfcWindow.on('closed', () => {
    globalShortcut.unregisterAll();
  });

  tfcWindow.webContents.on('did-navigate-in-page', () => {
    const url = new URL(tfcWindow.webContents.getURL());
    const domainKey = url.origin;
    const savedZoom = zoomLevels[domainKey] ?? 0;
    tfcWindow.webContents.setZoomLevel(savedZoom);
  });

    // Keep Alive - poll every 5 seconds
  tfcKeepAliveInterval = setInterval(() => tfcKeepAlive(target_url), 5000);
  tfcWindow.on('closed', () => {
    if (tfcKeepAliveInterval) {
      clearInterval(tfcKeepAliveInterval);
      tfcKeepAliveInterval = null;
    }
  });

};


let last_ok = Date.now();
let tfcKeepAliveInterval = null;

// keep-alive function (never throws; logs errors)
async function tfcKeepAlive(target_url){
  try {
    console.info("Checking TFC at:", target_url);
    const response = await fetch(target_url, { method: "GET" });
    const text = await response.text();
    const now = Date.now();
    const timeout = 60; // seconds

    if (response.status === 200 && !text.includes("404")) {
      last_ok = now;
      return;
    }

    console.log("Can't get to TFC (status/body)...");
    if (now - last_ok > timeout * 1000) {
      console.log("TFC unreachable for too long, falling back to main window");
      // close tfcWindow only if it exists and isn't destroyed
      if (tfcWindow && !tfcWindow.isDestroyed()) {
        try { tfcWindow.close(); } catch (err) { console.warn('tfcWindow.close() failed', err.message); }
      }

      // reopen main window safely
      try {
        if (!mainWindow || mainWindow.isDestroyed()) {
          createMainWindow();
        } else {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        }
      } catch (err) {
        console.warn('Failed to show/create mainWindow', err.message);
      }
    }
  } catch (e) {
    console.warn("tfcKeepAlive fetch error:", e.message);
    // also check timeout and fallback if needed
    try {
      const now = Date.now();
      const timeout = 60;
      if (now - last_ok > timeout * 1000) {
        if (tfcWindow && !tfcWindow.isDestroyed()) {
          try { tfcWindow.close(); } catch (err) { console.warn('tfcWindow.close() failed', err.message); }
        }
        if (!mainWindow || mainWindow.isDestroyed()) {
          createMainWindow();
        } else {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        }
      } else {
        console.warn("Closing window in ~", Math.round(timeout - (now - last_ok)/1000), "seconds!")
      }
    } catch (err) {
      console.warn('Error during fallback handling:', err.message);
    }
  }
}


// ######################
// ### Menu Settings  ###
// ######################

const extraMenu = isMacOs
  ? [
      {
        label: app.name,
        submenu:[
          {role: 'Quit'},
        ]
      },
  ]
: [];

Menu.setApplicationMenu(
  Menu.buildFromTemplate(
    [...extraMenu,
      {
        label: 'File',
        submenu:[
          {role: 'Help',
            click: async () => {
              openHelpPanel()
              helpWindow.once('ready-to-show', () => {
                helpWindow.show();
              });
            }
          },
          {type: 'separator'},
          {label: 'Settings',
            click: async () => {
              openSettingsPanel()
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

app.on('window-all-closed', () => {
  app.quit();
});

app.whenReady().then(() => {
  // Make sure the settings file exists
  if (!fs.existsSync(settingsPath)) {
    try {
      fs.copyFileSync(path.join(__dirname, 'settings.json'), settingsPath);
      console.log('Settings file created successfully.');
    } catch (error) {
      console.error('Error creating settings file:', error);
    }
  };
  
  createMainWindow();

  
  autoUpdater.checkForUpdates()
    .catch(err => console.warn("autoUpdated check failed:", err));
  if(mainWindow && typeof mainWindow.showMessage === "function"){
    mainWindow.showMessage("Looking for updates");
  }

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
  
  ipcMain.on('open-settings-window',() => {
    openSettingsPanel()
    settingsWindow.once('ready-to-show', () => {
      settingsWindow.show();
    });
  });

  ipcMain.on('open-help-window',() => {
    openHelpPanel()
    helpWindow.once('ready-to-show', () => {
      helpWindow.show();
    });
  });

  ipcMain.on('open-tfc-window',(event, target_url) => {
    target_url = target_url;
    openTFCWindow(target_url);
    tfcWindow.once('ready-to-show', () =>{
      tfcWindow.show();
      if(mainWindow){
        mainWindow.close();
      }
    });


  });
  
  ipcMain.on('debug-active',() => {
    mainWindow.webContents.openDevTools();
  });
  ipcMain.on('debug-inactive',() => {
    mainWindow.webContents.closeDevTools();
  });
});

autoUpdater.on("update-available", (info) => {
  mainWindow.showMessage("Update available.");
  let pth = autoUpdater.downloadUpdate();
  mainWindow.showMessage(pth);
});

autoUpdater.on("update-not-available", (info) => {
  mainWindow.showMessage("Update not available.");
});

autoUpdater.on("update-downloaded", (info) => {
  mainWindow.showMessage("Update downloaded.");
});

autoUpdater.on("error", (info) => {
  mainWindow.showMessage(info);
});