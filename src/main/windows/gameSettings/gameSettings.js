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
