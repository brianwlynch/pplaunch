## Changelog

### v3.3.0 - **Beta**
- Removed Keep Alive service
- Removed Auto Updater
- Added better logging. There is now an `app.log` file in the app directory.
  - Logs read bottom up.
  - Windows - `%appdata%\TFC Public Panel Launcher\app.log`
  - Linux - `~/.config/TFC Public Panel Launcher/app.log`
- Added a leaderboard to SpaceInvaders
- Added option in settings window to clear cookies.
- Added a HTTP 500 response check. Won't redirect
- Fixed scores returning after resetting the leaderboard.
- Renamed "main" window folder to "index".
- CHANGE location of panel location from main settings to game settings
- CHANGE how many times the server will be checked.
- CHANGE footer to auto pull from package info
- CHANGE how zoom is handled in TFCWindow
- CHANGE rocket animation for smaller screens
- CHANGE layout for space invaders for smaller screens
- CHANGE to a new dedicated css for Help page
- DISABLED scores, need to figure out better way to handle.
- ADD device ip to bottom of screen
- ADD helper to get size of screen
- ADD a setting to disable goofs
- ADD build scripts to set panel settings when installing
- ADD ansible script to deploy folder
- ADD Highlight to footer

### v3.2.0 - **Latest**
- Removed Demo mode
- ReStructured project files
  - Converted old `index.js` to become `main.js` took a lot of the file and split it into multiple smaller ones.
- Updated settings page to allow redirect to new ui.
- Goes back to wait screen if connection to TFC is lost for 45 seconds.
- Added auto update features.
  - ** These panels often don't get internet access so we will need a way to alert for updates outside the app as well.
- Made snack bars for errors so you don't need to open debug mode.
- Added a clock icon to see why the panel didn't redirect AFTER 10 minutes.
- Added ability to change "TFC Is Launching" to a custom string, when in that mode.
- Prevent TFC Window from opening if Help or Settings windows are open.

### v3.1.2
- Prevented App from launching twice
- Changed contact info to QR for Github issues page

### v3.1.1
- Added support for different types of TFC URLs, including custom URLs
- Changed from nodeIntegrations to using APIs on the preload.js
- `TFC_INSTANCE` to demo mode will no longer work. It now has its own drop down option.

### v3.1.0
- Adding support for Linux installs
- If you set `TFC_INSTANCE` to "demo" on the settings page, it will redirect you to `NEPGroup.com`
- If `TFC_INSTANCE` instance is set to "none", the settings box will be empty.
- Independent sound controls for music and sfx.

### v3.0.1
- Fixed persistent zoom across pages
- Checks to see if the settings.json exists

### v3.0.0
- Switched to electron build. 
- Script running in background is no longer needed
- Added music to shenanigans
- Added new loading screen messages

### v2.0.0
- Initial launcher built by Dennis

## Future Changes
- [x] High score list for shenanigans - Added in `v3.3.0`
