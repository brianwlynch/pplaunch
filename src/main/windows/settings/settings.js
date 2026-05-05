async function loadSettings() {
    const settings = await window.settingsAPI.load();
    console.warn("Settings.js");

    //DEBUG
    console.log("Debug:", settings.DEBUG)
    document.getElementById('debugMode').checked = !!settings.DEBUG;

    //REDIRECT
    console.log("Redirect:", settings.REDIRECT_MODE);
    select.value = settings.REDIRECT_MODE || "tfc";

    const config = optionsConfig[select.value];
    config.show.forEach(id => document.getElementById(id).style.display = "block");
    config.hide.forEach(id => document.getElementById(id).style.display = "none");

    //URL PREFIX
    console.log("Prefix:", settings.URL_PREFIX)
    document.getElementById('urlPrefix').value = settings.URL_PREFIX || "control";

    //TFC INSTANCE
    console.log("TFC:", settings.TFC_INSTANCE)
    if (settings.TFC_INSTANCE === "none") {
        document.getElementById('tfcInstance').value = '';
    } else {
        document.getElementById('tfcInstance').value = settings.TFC_INSTANCE || '';
    }

    //BASE URL
    console.log("BASE:", settings.BASE_URL)
    document.getElementById('baseURLDropdown').value = settings.BASE_URL || "nep";

    //CUSTOM URL
    console.log("CUSTOM:", settings.CUSTOM_INSTANCE)
    document.getElementById('customInstance').value = settings.CUSTOM_INSTANCE || '';

    //LOADING STRING
    console.log("LOADING:", settings.LOADING_STRING)
    document.getElementById('loadingString').value = settings.LOADING_STRING || '';

    //PANEL LOCATION
    console.log("UNIT NAME:", settings.UNIT)
    document.getElementById('unit').value = settings.UNIT || '';

    console.log("LOCATION:", settings.LOCATION)
    document.getElementById('panelLocation').value = settings.LOCATION || '';

    console.log("CUSTOM LOCATION:", settings.CUSTOM_LOCATION)
    document.getElementById('customLocation').value = settings.CUSTOM_LOCATION || '';

    const locationConfig = customLocationCellConfig[settings.LOCATION];
    if (locationConfig) {
        locationConfig.show.forEach(id => document.getElementById(id).style.display = "block");
        locationConfig.hide.forEach(id => document.getElementById(id).style.display = "none");
    }

};

async function saveSettings() {
    const current = await window.settingsAPI.load();

    await window.settingsAPI.save({
        ...current,
        DEBUG: document.getElementById('debugMode').checked,
        TFC_INSTANCE: document.getElementById('tfcInstance').value,
        CUSTOM_INSTANCE: document.getElementById('customInstance').value,
        REDIRECT_MODE: document.getElementById('redirectMode').value,
        URL_PREFIX: document.getElementById('urlPrefix').value,
        BASE_URL: document.getElementById('baseURLDropdown').value,
        LOADING_STRING: document.getElementById('loadingString').value,
        UNIT: document.getElementById('unit').value,
        LOCATION: document.getElementById('panelLocation').value,
        CUSTOM_LOCATION: document.getElementById('customLocation').value
    });
    window.settingsAPI.onChanged();

    window.close();
}

window.addEventListener("DOMContentLoaded", loadSettings);

const select = document.getElementById("redirectMode");
const tfcInstanceTable = document.getElementById("tfcInstanceTable");
const customDiv = document.getElementById("customDiv");

const optionsConfig = {
    tfc: {
        show: ["tfcInstanceTable"],
        hide: ["customDiv"]
    },
    custom: {
        show: ["customDiv"],
        hide: ["tfcInstanceTable"]
    },
}
const customLocationCellConfig = {
    "audio": {
        show: [],
        hide: ["customLocationCell"]
    },
    "engineering": {
        show: [],
        hide: ["customLocationCell"]
    },
    "flex": {
        show: [],
        hide: ["customLocationCell"]
    },
    "production": {
        show: [],
        hide: ["customLocationCell"]
    },
    "replay": {
        show: [],
        hide: ["customLocationCell"]
    },
    "submix": {
        show: [],
        hide: ["customLocationCell"]
    },
    "td": {
        show: [],
        hide: ["customLocationCell"]
    },
    "video": {
        show: [],
        hide: ["customLocationCell"]
    },
    "non": {
        show: [],
        hide: ["customLocationCell"]
    },
    "custom": {
        show: ["customLocationCell"],
        hide: []
    }
};

select.addEventListener("change", () => {
    const config = optionsConfig[select.value];

    config.show.forEach(id => document.getElementById(id).style.display = "block");
    config.hide.forEach(id => document.getElementById(id).style.display = "none");

});

const panelLocationSelect = document.getElementById("panelLocation");

panelLocationSelect.addEventListener("change", () => {
    const locationConfig = customLocationCellConfig[panelLocationSelect.value];
    if (locationConfig) {
        locationConfig.show.forEach(id => document.getElementById(id).style.display = "block");
        locationConfig.hide.forEach(id => document.getElementById(id).style.display = "none");
    }
});