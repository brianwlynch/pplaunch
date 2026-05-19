var TFC_INSTANCE = null;
var DEBUG = null;
var TARGET_URL = null;
var BASE_URL = null;
var CUSTOM_INSTANCE = null;
var REDIRECT_MODE = null;
let previousRedirectMode = null; // To avoid constantly updating the messages array

var FirstRun = true;
let debugIcon;
let alertIcon;
let clockIcon;
let startTime;
let settings;


window.addEventListener("DOMContentLoaded", async () => {
    debugIcon = document.getElementById("td_debug");
    alertIcon = document.getElementById("td_alert");
    clockIcon = document.getElementById("td_clock");
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
        
        if(DEBUG || FirstRun){
            console.log(settings);
        }
        FirstRun = false;

        if(DEBUG){
            window.appAPI.debugActive();
        }

        if(debugIcon) debugIcon.style.display = DEBUG ? "table-cell" : "none";

        REDIRECT_MODE = settings.REDIRECT_MODE || "tfc";
        if(REDIRECT_MODE !== previousRedirectMode){
            initializeMessages(REDIRECT_MODE);
            previousRedirectMode = REDIRECT_MODE;
        }

        CUSTOM_INSTANCE = settings.CUSTOM_INSTANCE || "";
        
        if (settings.BASE_URL == "nep"){
            BASE_URL = ".nepgroup.io"
        } else if (settings.BASE_URL == "tfc"){
            BASE_URL = ".tfclabs.com"
        }

        URL_PREFIX = settings.URL_PREFIX || "";
        
        if(REDIRECT_MODE === "custom"){
            if(title) title.innerHTML = settings.LOADING_STRING ? `${settings.LOADING_STRING} Is Launching` : "TFC Is Launching";
            if(title_2) title_2.innerHTML = settings.LOADING_STRING ? `${settings.LOADING_STRING} is ready` : "TFC is ready";
        } else {
            if(title) title.innerHTML = "TFC Is Launching";
            if(title_2) title_2.innerHTML = "TFC is ready";
        }
    }
}

async function checkServer() {
    settings = await window.settingsAPI.load();
    
    if (!updatedAutoUpdateUI){
        updateMessage(receivedUpdateMessage);
    }
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
    
    switch(REDIRECT_MODE) {
        case "tfc":
            TARGET_URL = "https://" + URL_PREFIX + "." + TFC_INSTANCE + BASE_URL + "/production/pool/panel";
            break;
        case "custom":
            TARGET_URL = CUSTOM_INSTANCE;
            break;
        default:
            TARGET_URL = "";
    }

    try {
        console.info(`Checking TFC at:`, TARGET_URL);
        const response = await fetch(TARGET_URL, { method: "GET"});
        const text = await response.text();
        
        if (response.status === 404 || (response.status === 200 && text.includes("404"))){
                console.error(`[Index] ${new Date().toISOString()} - Failed to fetch! - 404 Not Found`)
                return;
        } else {
            redirect()
        }

    } catch (e) {
        console.warn(`Server likely not up yet:`, e.message);
        clockIcon.addEventListener("click", () => snackBar('Server likely not up yet: <b><i>"' + e.message + '"</i></b><br>Debug mode will tell you more!'));
    }

    curTime = (Date.now() - startTime)/ 60000;
    waitTime = 1 //Minutes
    if( curTime >= waitTime){
        clockIcon.style.display = "table-cell";
    } else {
        clockIcon.style.display = "none";    
    }

}

let redirected = false;
function redirect(){
    if (DEBUG){
        console.warn(`Connection to TFC is ok! Won't redirect due to debug mode!`);
        clockIcon.addEventListener("click", () => snackBar('You are in Debug mode!'));
        return;
    }
    
    if (inGameMode){
        document.getElementById("redirect").classList.add("shown");
        return;
    } else {
        if (!redirected){
            window.appAPI.openTFC(TARGET_URL);
        } else {
            console.warn(`Already redirected!`)
        }
    }
}
function redirectGame(){
    if (DEBUG){
        console.warn(`Connection to TFC is ok! Won't redirect due to debug mode!`);
        clockIcon.addEventListener("click", () => snackBar('You are in Debug mode!'));
        return;
    } else {
        if (!redirected){
            window.appAPI.openTFC(TARGET_URL);
            window.close();
        } else {
            console.warn(`Already redirected!`);
        }
    }
}

document.addEventListener("DOMContentLoaded", function() {
    window.bridge.updateMessage(updateMessage);
    receivedUpdateMessage = updateMessage;
});


let receivedUpdateMessage = null;
let updatedAutoUpdateUI = false;
function updateMessage(event, message){
    let icon = document.getElementById("cloud_icon");
    let td = document.getElementById("td_cloud");

    if(!icon || !td){
        console.log(`[Index/AutoUpdater] ${message}`);
        console.warn("[Index/AutoUpdater] DOM Not ready for UI Updates");
        updatedAutoUpdateUI = false;
        return;
    } else {
        updatedAutoUpdateUI = true;
    }

    icon.onclick = null;

    if (message.includes("Error")) {
        console.error(message);
        td.style.display = "none";
        return;
    }

    window.loggingAPI.info(message, "Index");
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