var TFC_INSTANCE = null;
var DEBUG = null;
var TARGET_URL = null;
var BASE_URL = null;
var CUSTOM_INSTANCE = null;
var REDIRECT_MODE = null;

var FirstRun = true;
let debugIcon;
let alertIcon;
let clockIcon;
let startTime;
let settings;

window.onload = () => {
    debugIcon = document.getElementById("td_debug");
    alertIcon = document.getElementById("td_alert");
    clockIcon = document.getElementById("td_clock");

    startTime = new Date();
    console.log("Panel opened at:", startTime);

    document.getElementById('settings_icon').addEventListener('click', () => {
        window.appAPI.openSettings();
        if (DEBUG || true) {
            console.log("Settings icon clicked, opening settings window.");
        }
    });
    document.getElementById('help_icon').addEventListener('click', () => {
        window.appAPI.openHelp();
        if (DEBUG || true) {
            console.log("Help icon clicked, opening help window.");
        }
    });
};

window.addEventListener("DOMContentLoaded", async () => {
    settings = await window.settingsAPI.load();
    loadSettings(settings);
    setInterval(checkServer, 5000);
})

function loadSettings(settings) {
    
    if (Object.keys(settings).length === 0) {
        console.warn('No settings file found.');
    } else {
        DEBUG = !!settings.DEBUG;
        TFC_INSTANCE = settings.TFC_INSTANCE || '';
        
        if(DEBUG || FirstRun){
            console.log(settings);
        }
        FirstRun = false;

        if(DEBUG){
            window.appAPI.debugActive();
        }

        if(debugIcon) debugIcon.style.display = DEBUG ? "table-cell" : "none";

        REDIRECT_MODE = settings.REDIRECT_MODE || "tfc";
        CUSTOM_INSTANCE = settings.CUSTOM_INSTANCE || "";
        
        if (settings.BASE_URL == "nep"){
            BASE_URL = ".nepgroup.io"
        } else if (settings.BASE_URL == "tfc"){
            BASE_URL = ".tfclabs.com"
        }

        URL_PREFIX = settings.URL_PREFIX || "";
    }
}

async function checkServer() {
    loadSettings(await window.settingsAPI.load());
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
    
    switch(REDIRECT_MODE) {
        case "tfc":
            TARGET_URL = "https://" + URL_PREFIX + "." + TFC_INSTANCE + BASE_URL + "/production/pool/panel";
            break;
        case "demo":
            TARGET_URL = "https://nepgroup.com";
            break;
        case "custom":
            TARGET_URL = CUSTOM_INSTANCE;
            break;
        default:
            TARGET_URL = "";
    }

    try {
        console.info("Checking TFC at:", TARGET_URL);
        const response = await fetch(TARGET_URL, { method: "GET"});
        const text = await response.text();
        
        if (response.status === 404 || (response.status === 200 && text.includes("404"))){
                console.error("Failed to fetch! - 404 Not Found")
                return;
        } else {
            redirect()
        }

    } catch (e) {
        console.warn("Server likely not up yet:", e.message);
        clockIcon.addEventListener("click", () => snackBar('Server likely not up yet: <b><i>"' + e.message + '"</i></b><br>Debug mode will tell you more!'));
    }

    curTime = (Date.now() - startTime)/ 60000;
    waitTime = 10 //Minutes
    if( curTime >= waitTime){
        clockIcon.style.display = "table-cell";
        //console.log("Why is it taking so long to load??");
    } else {
        //console.log("Not Yet, Be Patient -", curTime);
        clockIcon.style.display = "none";    
    }

}

let redirected = false;
function redirect(){
    if (DEBUG){
        console.warn("Connection to TFC is ok! Won't redirect due to debug mode!");
        return;
    }
    
    if (inGameMode){
        document.getElementById("redirect").classList.add("shown");
        return;
    } else {
        if (!redirected){
            window.appAPI.openTFC(TARGET_URL);
            window.close();
        } else {
            console.warn("Already redirected!")
        }
    }
}
function redirectGame(){
    if (DEBUG){
        console.warn("Connection to TFC is ok! Won't redirect due to debug mode!");
        return;
    } else {
        if (!redirected){
            window.appAPI.openTFC(TARGET_URL);
            window.close();
        } else {
            console.warn("Already redirected!")
        }
    }
}

document.addEventListener("DOMContentLoaded", function() {
    window.bridge.updateMessage(updateMessage);
});

function updateMessage(event, message){
    console.log("New Update Message:", message);
    let icon = document.getElementById("cloud_icon");
    let td = document.getElementById("td-cloud");

    icon.onclick = null;

    if (message.includes("Error")) {
        td.style.display = "none";
        return;
    }

    switch(message){
        case "Looking for updates":
            icon.src = "../assets/images/cloud-search.svg";
            icon.onclick = () => snackBar("Looking for an update.");
            break;
        case "Update available.":
            icon.src = "../assets/images/cloud-download.svg";
            icon.onclick = () => snackBar("Downloading new update.");
            break;
        case "Update not available.":
            td.style.display = "none";
            break;
        case "Update downloaded.":
            icon.src = "../assets/images/cloud-check.svg";
            icon.onclick = () => snackBar("Update downloaded. Will be installed when panel closes.");
            break;
    }
}

function snackBar(message) {
    bar = document.getElementById("snackbar");
    barMessage = document.getElementById("snackbar-message");
    barMessage.innerHTML = message;
    bar.className = "show";

    setTimeout(function(){bar.className = bar.className.replace("show", "");}, 10000);
}