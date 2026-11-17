# TFC Public Panel Launcher

**PPLaunch** is a small client-side "app" meant for use on TFC public panels such as touchscreens and tablets. It enables these devices to power up before the TFC servers without the need for a human to refresh the browser once the TFC servers are online.

The panel will open, then every five seconds it will try to connect to the TFC servers. Upon successful connection it will reload the page automatically. If you see a 401 page from TFC, then there is no assigned public panel for the IP address of the computer running this program.

**DISCLAIMER** - This is not an official TFC Product. If something does not work **DO NOT** contact TFC Support, they will not be able to help you!

## First launch
Upon first launch, the TFC Instance will not be set. Open the settings page (with the gear) and set your instance.

## Other Versions
Both are not released yet!
- [Android](https://github.com/brianwlynch/pplaunch-android)
  - Google Play - *Coming Soon*
- [iOS (iPAD)](https://github.com/brianwlynch/pplaunch-ios)
  - App Store - *Coming Soon*

## Changelog

[v3.3.0](https://github.com/brianwlynch/pplaunch/releases/tag/v3.3.0-beta) - *Latest*

[CHANGELOG](CHANGELOG.md)

## Settings

Settings for the panel are changed by the cogwheel in the top right corner of the screen.

The `settings.json` file is where the panel saves the settings. It is located in the following locations:

- Ubuntu: `~/.config/TFC Public Panel Launcher/settings.json`
- Windows: `%appdata%/TFC Public Panel Launcher/settings.json`

If manually changing the files, this is the config options:

### Global Options

| KEY | TYPE | ALLOWED OPTIONS | DEFAULT | DESCRIPTION
|--|--| -- | -- | -- |
| DEBUG | boolean | `true` / `false` | `false` | Enables/disables debug mode, see below |
| GOOFS_ENABLED | boolean | `true` / `false` | `true` | **Can't be changed from the UI** Enables/disables space invaders and rocket picture changes. Suggest set to false for VIP buildings |

### Redirect Modes
| KEY | TYPE | ALLOWED OPTIONS | DEFAULT
|--|--| -- | -- |
| REDIRECT_MODE | string | `tfc` / `custom` | `tfc` |

#### TFC
When using `tfc` as your redirect mode, the front end will show a url builder.
This is the `URL_PREFIX` + `TFC_INSTANCE` + `BASE_URL` 

Ex. `control`.`ss7`.`nep` would equate to a url of `https://control.ss7.nepgroup.io/production/pool/panel`

Ex. `next`.`pittlab`.`tfc` would equate to a url of `https://next.pittlab.tfclabs.com/production/pool/panel`

***The new UI does not currently support public panels, this is future-proofing this application***

| KEY | TYPE | ALLOWED OPTIONS | DEFAULT
|--|--| -- | -- |
| URL_PREFIX | string | `control`/ `next` | `control` |
| TFC_INSTANCE | string | *user_defined* | |
| BASE_URL | string | `nep` / `tfc` | `nep` |

#### Custom
When using `custom` as your redirect_mode, the front end will show a entry for a url, and a custom string.
Ex. `https://nepgroup.com` and `NEP Group` would make the panel redirect to said URL and the loading screen will show "NEP Group is loading"

The following sentences will be removed from the subtitle loop.
```
"Waiting for TFC servers to come online."
"The panel will start once the TFC servers come online."
"We are still cranking open the expando, be patient."
```

| KEY | TYPE | ALLOWED OPTIONS | DESCRIPTION
|--|--| -- | -- |
| CUSTOM_INSTANCE | string | *user_defined* | Any HTTPS link you want the panel to redirect to |
| LOADING_STRING | string | *user_defined* | Change what the title says on the loading screen |


### Game Settings
These following settings are used in space invaders. They are **not required** for normal operation.

| KEY | TYPE | ALLOWED OPTIONS | DESCRIPTION
|--|--| -- | -- |
| UNIT| string | *user_defined* | Where the panel is (Ex. SS7)
| LOCATION | string | `audio`, `engineering`, `flex`, `production`, `replay`, `submix`, `td`, `video`, `non`, `custom` | Where in the unit the panel is. `non` is used for "Non-Specific locations" like an iPad or surface that roams the entire Unit. `custom` will use the `CUSTOM_LOCATION` field. |
| CUSTOM_LOCATION | string | *user_defined* | Ex. EIC's Laptop |
| LOCAL_SCORES | string | - | Encoded score data managed by the app; don't edit. | 

### Zoom
Do to a limitation in electron apps, zoom levels are not saved automatically like in Chrome. This app remembers a zoom level for each site it opens. Zoom is changed with the keyboard while the TFC page is open:

| SHORTCUT | ACTION |
| -- | -- |
| `Ctrl` + `=` | Zoom in one step |
| `Ctrl` + `-` | Zoom out one step |
| `Ctrl` + `0` | Reset to 100% |

| KEY | TYPE | ALLOWED OPTIONS | DEFAULT | DESCRIPTION
|--|--| -- | -- | -- |
| ZOOM_LEVELS | object | `"<site>": <zoom>` pairs | `{}` | **Managed by the app.** Saved zoom for each site. The site is just the start of the URL (e.g. `https://control.ss7.nepgroup.io`, with no path). The zoom is a multiplier: `1` = 100%, `1.25` = 125%, `0.8` = 80%. |

Allowed zoom values: `0.5`, `0.67`, `0.75`, `0.8`, `0.9`, `1`, `1.1`, `1.25`, `1.5`, `1.75`, `2` (50% – 200%).
Any other value, including leftovers from older versions, is treated as `1` (100%) and replaced the next time you zoom.

### Example Settings File
```json
{
	"DEBUG": false,
	"GOOFS_ENABLED": true,
	"REDIRECT_MODE": "tfc",
	"URL_PREFIX": "control",
	"TFC_INSTANCE": "ss7",
	"BASE_URL": "nep",
	"CUSTOM_INSTANCE": "",
	"LOADING_STRING": "",
	"UNIT": "SS7",
	"LOCATION": "Replay",
	"CUSTOM_LOCATION": "",
	"LOCAL_SCORES": "",
	"ZOOM_LEVELS": {
		"https://control.ss7.nepgroup.io": 1
	}
}
``` 

## Debug mode
In the settings menu you can enable debug mode. Debug mode is checked to see if it is enabled every five seconds. Developer tools will open!
The panel will continue to operate as normally. Use the `console` tab in dev tools to see some logs.

While in debug mode, the panel will attempt to connect to TFC. Once it connects, checks will appear in the top left and the panel will not try to connect to TFC, or automatically redirect you to it. Click the checks to force a redirect.
