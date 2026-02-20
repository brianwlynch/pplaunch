function launchGame() {
    //  Create the starfield.
    var container = document.getElementById('starfield');
    container.classList.add('starfield')
    var starfield = new Starfield();
    starfield.initialise(container);
    starfield.start();

    //  Setup the canvas.
    var canvas = document.getElementById("gameCanvas");
    canvas.width =  1200;
    canvas.height = 800;
    
    //  Create the game.
    game = new Game();
    window.game = game;
    
    //  Initialise it with the game canvas.
    game.initialise(canvas);

    //  Start the game.
    game.start();

    //  Listen for keyboard events.
    window.addEventListener("keydown", function keydown(e) {
        var keycode = e.which || window.event.keycode;
        //  Supress further processing of left/right/space (37/29/32)
        if (keycode == 37 || keycode == 39 || keycode == 32) {
            e.preventDefault();
        }
        game.keyDown(keycode);

    });
    window.addEventListener("keyup", function keydown(e) {
        var keycode = e.which || window.event.keycode;
        game.keyUp(keycode);
    });

    window.addEventListener("touchstart", function (e) {
        game.touchstart(e);
    }, false);

    window.addEventListener('touchend', function (e) {
        game.touchend(e);
    }, false);

    window.addEventListener('touchmove', function (e) {
        game.touchmove(e);
    }, false);

    setTimeout(() => {
        document.getElementById('musicIcon').classList.toggle('shown');
    }, 2500);
    setTimeout(() => {
        document.getElementById('sfxIcon').classList.toggle('shown');
    }, 2500);

    inGameMode = true;
}

var inGameMode = false;
var muted;
var game;