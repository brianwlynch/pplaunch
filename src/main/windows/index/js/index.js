var TFC_INSTANCE = null;
var DEBUG = null;
var TARGET_URL = null;
var BASE_URL = null;
var CUSTOM_INSTANCE = null;
var REDIRECT_MODE = null;
let previousRedirectMode = null; // To avoid constantly updating the messages array
let GOOFS_ENABLED = true; // Enables space invaders and pickle rick possibilities.

var FirstRun = true;
let debugIcon;
let alertIcon;
let clockIcon;
let checksIcon;
let startTime;
let settings;

// Will try to access server then if debug this will turn false
var checkServerEnabled = true;
// Will try to access server then redirect dialog will open and this will turn false
var checkServerEnabledGame = true;

window.addEventListener("DOMContentLoaded", async () => {
    debugIcon = document.getElementById("td_debug");
    alertIcon = document.getElementById("td_alert");
    clockIcon = document.getElementById("td_clock");
    checksIcon = document.getElementById("td_checks");
    title = document.getElementById("title");
    title_2 = document.getElementById("title_2");

    startTime = new Date();

    document.getElementById('settings_icon').addEventListener('click', () => {
        window.appAPI.openSettings();
        if (DEBUG || true) {
            console.log(`Settings icon clicked, opening settings window.`);
        }
    });
    document.getElementById('help_icon').addEventListener('click', () => {
        window.appAPI.openHelp();
        if (DEBUG || true) {
            console.log(`Help icon clicked, opening help window.`);
        }
    });
    document.getElementById('gameSettingsIcon').addEventListener('click', () => {
        window.appAPI.openGameSettings();
        if (DEBUG || true) {
            console.log(`Game Settings icon clicked, opening settings window.`);
        }
    });

    settings = await window.settingsAPI.load();
    loadSettings(settings);

    setInterval(checkServer, 5000);
})

function loadSettings(settings) {

    if (Object.keys(settings).length === 0) {
        console.warn(`No settings file found.`);
    } else {
        DEBUG = !!settings.DEBUG;
        TFC_INSTANCE = settings.TFC_INSTANCE || '';

        if (DEBUG || FirstRun) {
            console.log(settings);
        }
        FirstRun = false;

        if (DEBUG) {
            window.appAPI.debugActive();
        } else {
            // Sever is already accessible, redirect.
            if (!checkServerEnabled) {
                redirect();
            }
        }

        if (debugIcon) debugIcon.style.display = DEBUG ? "table-cell" : "none";

        REDIRECT_MODE = settings.REDIRECT_MODE || "tfc";
        if (REDIRECT_MODE !== previousRedirectMode) {
            initializeMessages(REDIRECT_MODE);
            previousRedirectMode = REDIRECT_MODE;
        }

        CUSTOM_INSTANCE = settings.CUSTOM_INSTANCE || "";

        if (settings.BASE_URL == "nep") {
            BASE_URL = ".nepgroup.io"
        } else if (settings.BASE_URL == "tfc") {
            BASE_URL = ".tfclabs.com"
        }

        URL_PREFIX = settings.URL_PREFIX || "";

        if (REDIRECT_MODE === "custom") {
            if (title) title.innerHTML = settings.LOADING_STRING ? `${settings.LOADING_STRING} Is Launching` : "TFC Is Launching";
            if (title_2) title_2.innerHTML = settings.LOADING_STRING ? `${settings.LOADING_STRING} is ready` : "TFC is ready";
        } else {
            if (title) title.innerHTML = "TFC Is Launching";
            if (title_2) title_2.innerHTML = "TFC is ready";
        }

        GOOFS_ENABLED = !!settings.GOOFS_ENABLED;
        if (GOOFS_ENABLED) {
            doShenanigans()
        }
    }
}

async function checkServer() {
    settings = await window.settingsAPI.load();

    loadSettings(settings);

    if ((!TFC_INSTANCE || TFC_INSTANCE == "none") && REDIRECT_MODE == "tfc") {
        msg = "TFC_INSTANCE not set. Please check your settings!";
        console.warn(msg);
        alertIcon.addEventListener("click", () => snackBar(msg));
        alertIcon.style.display = "table-cell";
        loadSettings();
        return;
    } else {
        alertIcon.style.display = "none";
    }

    if (!CUSTOM_INSTANCE && REDIRECT_MODE == "custom") {
        msg = "CUSTOM_URL not set. Please check your settings!";
        console.warn(msg);
        alertIcon.addEventListener("click", () => snackBar(msg));
        alertIcon.style.display = "table-cell";
        loadSettings();
        return;
    } else {
        alertIcon.style.display = "none";
    }

    switch (REDIRECT_MODE) {
        case "tfc":
            TARGET_URL = "https://" + URL_PREFIX + "." + TFC_INSTANCE + BASE_URL + "/production/pool/panel";
            break;
        case "custom":
            TARGET_URL = CUSTOM_INSTANCE;
            break;
        default:
            TARGET_URL = "";
    }

    if (checkServerEnabled && checkServerEnabledGame) {
        try {
            console.info(`Checking TFC at:`, TARGET_URL);
            const response = await fetch(TARGET_URL, { method: "GET" });
            const text = await response.text();

            if (response.status === 404 || (response.status === 200 && text.includes("404 page not found"))) {
                console.error(`[Index] ${new Date().toISOString()} - Failed to fetch! - 404 Not Found or 200 with "404 Not Found"`)
                return;
            } else if (response.status === 500) {
                console.error(`[Index] ${new Date().toISOString()} - Failed to fetch! - 500 Internal Server Error.`)
                return;
            } else {
                redirect()
            }

        } catch (e) {
            console.warn(`Server likely not up yet:`, e.message);
            clockIcon.addEventListener("click", () => snackBar('Server likely not up yet: <b><i>"' + e.message + '"</i></b><br>Debug mode will tell you more!'));
            checkServerEnabled = true;
        }
    } else {
        if (!checkServerEnabled) {
            console.warn(`Connection to TFC is ok! Won't attempt to reach TFC again due to debug mode!`)
        } else if (!checkServerEnabledGame) {
            // Only shows up once the TFC was accessible, the "Tap to redirect" dialog should be shown top left.
            console.warn(`Connection to TFC is ok! Won't redirect due to game mode! CLICK DIALOG to redirect!`);
        }
    }

    curTime = (Date.now() - startTime) / 60000;
    waitTime = 10 //Minutes
    if (curTime >= waitTime) {
        clockIcon.style.display = "table-cell";
    } else {
        clockIcon.style.display = "none";
    }

}

let redirected = false;
function redirect(bypass = false) {
    if (DEBUG & !bypass) {
        console.warn(`##### Connection to TFC is ok! Won't redirect due to debug mode! #####`);
        clockIcon.addEventListener("click", () => snackBar('You are in Debug mode!'));
        checkServerEnabled = false;
        if (checksIcon) checksIcon.style.display = "table-cell";
        return;
    }

    if (inGameMode) {
        checkServerEnabledGame = false;
        document.getElementById("redirect").classList.add("shown");
        return;
    } else {
        if (!redirected) {
            window.appAPI.openTFC(TARGET_URL);
        } else {
            console.warn(`Already redirected!`)
        }
    }
}
function redirectGame() {
    if (DEBUG) {
        console.warn(`Connection to TFC is ok! Won't redirect due to debug mode!`);
        clockIcon.addEventListener("click", () => snackBar('You are in Debug mode!'));
        checkServerEnabled = false;
        return;
    } else {
        if (!redirected) {
            window.appAPI.openTFC(TARGET_URL);
            window.close();
        } else {
            console.warn(`Already redirected!`);
        }
    }
}

function snackBar(message) {
    bar = document.getElementById("snackbar");
    barMessage = document.getElementById("snackbar-message");
    barMessage.innerHTML = message;
    bar.className = "show";

    setTimeout(function () { bar.className = bar.className.replace("show", ""); }, 10000);
}

async function updateFooter() {
    const version = await window.appAPI.getVersion();
    const ips = await window.appAPI.getIPAddresses();
    document.getElementById("footer").textContent =
        "v" + version + "\u00A0\u00A0|\u00A0\u00A0" + ips.join("\u00A0\u00A0|\u00A0\u00A0");
}

updateFooter();

function checkGoofs() {
    if (GOOFS_ENABLED) {
        launchGame()
    } else {
        console.warn("Sorry! Goofs aren't enabled!")
    }
}

// Changes the rocket picture
function doShenanigans() {

    const rocket = document.getElementById("rocket-img");
    easterEgg = Math.random()

    if (.03 <= easterEgg && easterEgg <= .04) {
        rocket.src = "../assets/images/truck_1.png";
        rocket.style.height = "calc(var(--rocket-size) * 1.75)";
        rocket.style.mixBlendMode = "normal";
    }
    else if (easterEgg <= .02) {
        rocket.src = "../assets/images/picklerick.gif";
        rocket.style.height = "calc(var(--rocket-size) * 1.25)";
    }
}