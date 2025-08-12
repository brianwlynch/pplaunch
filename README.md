# TFC Public Panel Launcher

**PPLaunch** is a small client-side "app" meant for use on TFC public panels such as touchscreens and tablets. It enables these devices to power up before the TFC servers without the need for a human to refresh the browser once the TFC servers are online.

The panel will open, then every five seconds it will try to connect to the TFC servers. Upon sucessful connection it will reload the page automatically. If you see a 401 page from TFC, then there is no assigned public panel for the IP address of the computer running this program.

**DISCLAIMER** - This is not an official TFC Product. If something does not work **DO NOT** contact TFC Support, they will not be able to help you!

## First launch
Upon first launch, the TFC Instance will no be set. Open the settings page (with the gear) and set your instance.

## Debug mode
In the settings menu you can enable debug mode. Debug mode is checked to see if it is enabled every five seconds. Developer tools will open!
The panel will continute to operate as normally. Use the `console` tab in dev tools to see some logs. If the panel does connect to TFC, it **will not** redirect you until you disable debug mode. 

## Changelog

### v3.1.1 - **Latest**
- Added support for different types of TFC URLs, including custom URLs
- Changed from nodeIntegrations to using APIs on the preload.js
- `TFC_INSTANCE` to demo mode will no longer work. It now has its own drop down option.

### v3.1.0
- Adding support for Linux installs
- If you set `TFC_INSTANCE` to "demo" on the settings page, it will redirect you to `NEPGroup.com`
- If `TFC_INSTANCE` instance is set to "none", the settings box will be empty.
- Independent sound controls for music and sfx.

### v3.0.1
- Fixed persistant zoom across pages
- Checks to see if the settings.json exists

### v3.0.0
- Switched to electron build. 
- Script running in backgroup is no longer needed
- Added music to shenanigans
- Added new loading screen messages

### v2.0.0
- Initial launcher built by Dennis

## Future Changes
- [x] *Option for other types of TFC instances that use different url patterns* - Implemented in `v3.1.1`
- [ ] High score list for shenanigans
