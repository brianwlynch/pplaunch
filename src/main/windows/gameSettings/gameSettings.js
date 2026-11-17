resetButton = document.getElementById("resetButton");

async function resetScores() {
    console.log("Reset Scores Pressed!");
    
    const settings = await window.settingsAPI.load();
    try{
        await window.settingsAPI.save({ ...settings, LOCAL_SCORES: ""});
        window.loggingAPI.info(`Leaderboard has been reset.`, "GameSettings");
    } catch (error) {
        window.loggingAPI.error(`Unable to reset leaderboard: ${error}`, "GameSettings");
    }
    window.close();
};

async function loadGameSettings() {
    const settings = await window.settingsAPI.load();
    console.warn("Settings.js");

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
}

async function saveGameSettings() {
    const current = await window.settingsAPI.load();

    await window.settingsAPI.save({
        ...current,
        UNIT: document.getElementById('unit').value,
        LOCATION: document.getElementById('panelLocation').value,
        CUSTOM_LOCATION: document.getElementById('customLocation').value
    });
    window.settingsAPI.onChanged();

    window.close();
}

window.addEventListener("DOMContentLoaded", loadGameSettings);

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

const panelLocationSelect = document.getElementById("panelLocation");

panelLocationSelect.addEventListener("change", () => {
    const locationConfig = customLocationCellConfig[panelLocationSelect.value];
    if (locationConfig) {
        locationConfig.show.forEach(id => document.getElementById(id).style.display = "block");
        locationConfig.hide.forEach(id => document.getElementById(id).style.display = "none");
    }
});