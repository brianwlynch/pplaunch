const { app, BrowserWindow, Menu, MenuItem } = require('electron');
const { assert } = require('node:console');
const path = require('node:path');
const { ipcMain } = require('electron');
const electronSquirrelStartup = require('electron-squirrel-startup');
const { fstat } = require('node:fs');


const isMacOs = process.platform == "darwin";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

require('@electron/remote/main').initialize();

// //Delete Registry key on uninstall
if(require('electron-squirrel-startup')) {
  const squirrelEvent = process.argv[1];

  if(squirrelEvent === '--squirrel-uninstall'){

    //Remove AppData Folder
    const appDataPath = path.join(app.getPath('appData'), app.getName());
    try{
      fs.rmSync(appDataPath, { recursive: true, force: true });
      console.log('AppData folder removed.');
    } catch (err) {
      console.error('Failed to delete AppData folder: , err');
    }


    //Remove Startup Keys
    const runKey = new WinReg({
      hive: WinReg.HKCU,
      key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
    });

    runKey.remove(app.getName(), function(err) {
      if (err) {
        console.error('Failed to remove startup entry:', err);
      } else console.log('Startup entry removed.');
    });

    app.quit();
  }
  
  return;
}

// ######################
// ### Page Settings  ###
// ######################
let mainWindow;
let settingsWindow;
let helpWindow;
let tfcWindow;

// Main Window
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

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
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  settingsWindow.loadFile('src/settings.html');

  require('@electron/remote/main').enable(settingsWindow.webContents);

};

// Help Page
function openHelpPanel(){
  helpWindow = new BrowserWindow({
    width: 720,
    height: 600,
    modal: true,
    parent: mainWindow,
    show: false,
    transparent: true,
    frame: false,
    roundedCorners: true,
    webPreferences:{
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  helpWindow.loadFile('src/help.html');

};

//TFC Page
//The main window will close and this will open with TFC
function openTFCWindow(target_url){
  tfcWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
  })

  tfcWindow.loadURL(target_url);

};

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

app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
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


app.on('window-all-closed', () => {
  app.quit();
});

//Autostart on boot
app.on('ready', () => {
  app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath('exe'),
  });
});