const { app, BrowserWindow, Menu, MenuItem } = require('electron');
const path = require('node:path');

const isMacOs = process.platform == "darwin";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
let settingsWindow;

require('@electron/remote/main').initialize();

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

  //mainWindow.webContents.openDevTools();
  require('@electron/remote/main').enable(mainWindow.webContents);
};


const extraMenu = isMacOs
  ? [
      {
        label: app.name,
        submenu:[
          {role: 'About'},
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
          {role: 'Help'},
          {role: 'Close'},
        ]
      },
  ]
: [];

Menu.setApplicationMenu(
  Menu.buildFromTemplate(
    [...extraMenu],
  )
);

function openSettingsPanel(){
  settingsWindow = new BrowserWindow({
    width: 350,
    height: 275,
    modal: true,
    parent: mainWindow,
    show: false,
    transparent: true,
    webPreferences:{
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  settingsWindow.loadFile('src/settings.html');

  require('@electron/remote/main').enable(settingsWindow.webContents);

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});


app.on('window-all-closed', () => {
  app.quit();
});

