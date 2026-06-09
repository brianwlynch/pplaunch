/** This handles everything with scores
 * There is a local leaderboard shared across the lan via mDNS.
 * There will be a global leaderboard, shared between all the trucks.
 */
class Score {
    constructor(game, player){
        this.id = self.crypto.randomUUID();
        this.player = player;
        this.score = game.score;
        this.level = game.level;

        if(settings.LOCATION == "custom"){
            this.panel = settings.CUSTOM_LOCATION;
        } else this.panel = settings.LOCATION;
        this.truck = settings.UNIT;

    }
}



let localScores = [];
let scoresInitialized = false;
let globalScores = [];

/** Send scores from SpaceInvaders to the scores scripts */
async function sendScores(game){
    const settingsScores = await window.settingsAPI.load();
    localScores = settingsScores.LOCAL_SCORES ? decodeScores(settingsScores.LOCAL_SCORES) : [];

    window.loggingAPI.info(`Got Scores from game!`, "Scores");
    const qualifies = localScores.length < 10 || game.score > localScores[localScores.length - 1].score;
    
    let playerName = '';
    if (qualifies) {
        // window.loggingAPI.info(`Score qualify!`, "Scores");
        playerName = await promptPlayerName(game.score);
    } else {
        // window.loggingAPI.info(`Score doesn't qualify`, "Scores");
    }

    const score = new Score(game, playerName);
    localScores.push(score);
    localScores.sort((a,b) => b.score - a.score);
    if (localScores.length > 10) localScores.length = 10;

    globalScores.push(score);

    await window.settingsAPI.save({ ...settings, LOCAL_SCORES: encodeScores(localScores)});
    updateUI(game);
}

function promptPlayerName(score){
    return new Promise((resolve) => {
        // window.loggingAPI.info(`Waiting for promise!`, "Scores");
        const modal = document.getElementById("name-modal");
        const input = document.getElementById("playerNameInput");
        const submitBtn = document.getElementById("modal-submit");

        document.getElementById('modal-score-display').textContent = `Score: ${score}`;
        input.value = '';
        modal.style.display = 'flex';

        input.focus();

        function onSubmit() {
            const name = input.value.trim() || "NO1";
            modal.style.display = 'none';
            submitBtn.removeEventListener("click", onSubmit);
            resolve(name);
        }

        submitBtn.addEventListener("click", onSubmit);
    });
}


function updateUI(game) {

    document.getElementById("gamecontainer").style.display = "none";
    document.getElementById("scores-container").style.display = "flex";

    const gameScore = document.getElementById("gameScore")
    gameScore.innerHTML = "You scored " + game.score + " and got to level " + game.level;

    const localScoreBody = document.getElementById("localScoreBody");
    localScores.sort((a, b) => b.score - a.score);

    localScoreBody.innerHTML = '';
    localScores.forEach(score => {
        const row = document.createElement('tr');
        row.innerHTML = `
        <td>${score.player}</td>
        <td>${score.level}</td>
        <td>${score.score}</td>
        <td>${score.panel}</td>`;
        localScoreBody.appendChild(row);
    });

    const localIds = new Set(localScores.map(s => s.id));

    //TODO: Implement Global Scoreboard
    // const globalScoreBody = document.getElementById("globalScoreBody");
    // globalScores.sort((a, b) => b.score - a.score);
    // globalScoreBody.innerHTML = '';
    // globalScores.forEach(score => {
    //     const row = document.createElement('tr');
    //     row.innerHTML = `
    //     <td>${score.player}</td>
    //     <td>${score.score}</td>
    //     <td>${score.truck}</td>
    //     <td>${score.panel}</td>`;

    //     if (localIds.has(score.id)) row.classList.add("local-score");

    //     globalScoreBody.appendChild(row);
    // });

}

function encodeScores(scores){
    return btoa(JSON.stringify(scores));
}

function decodeScores(encoded){
    try{
        return JSON.parse(atob(encoded));
    } catch (error) {
        window.loggingAPI.warn(`Decoding error. - ${error}`, "Scores");
    }
}