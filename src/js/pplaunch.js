const SLOW_LOAD_MS = 3e4,
      TRANSITION_DURATION = 1e4,
      messageEl = document.getElementById("message"),
      messages = [
        "Waiting for TFC servers to come online.",
        "Hang tight, the panel will launch automatically.",
        "The panel will start once the TFC servers come online.",
        "Grab a coffee, we're getting things ready.",
        "Patience is the art of concealing your impatience.",
        "Good things come to those who wait... and wait... and wait.",
        "The best things in life take time — even a rocket needs a countdown.",
        "Sometimes the wait is the hardest part, but it's worth it.",
        "Like a cup of coffee, great things brew slowly.",
        "Waiting isn’t a waste when you’re preparing for something amazing.",
        "All good things come to those who wait — and we're almost there!",
        "In the end, everything is worth the wait. Almost there!",
        "Patience is not the ability to wait, but how we act while waiting.",
        "The servers may be loading, but so is greatness!",
        "We are still cranking open the expando, be patient.",
      ];

function message(e) {
    setTimeout(() => {
        messageEl.innerText = messages[e];
        messageEl.style.animation = "fadein 2s ease-in-out";
    }, 2e3);
}

function slowLoad() {
    let e = 0;
    setInterval(() => {
        messageEl.style.animation = "fadeout 2s ease-in-out";
        message(e);
        e >= messages.length - 1 ? e = 0 : e++;
    }, TRANSITION_DURATION);
}

function doShennanigans() {

    const rocket = document.getElementById("rocket-img");
    easterEgg = Math.random()

    if (.03 <= easterEgg && easterEgg <= .04) {
        rocket.src = "assets/images/truck_1.png";
        rocket.style.height = "200px";
        rocket.style.mixBlendMode = "normal";
    }
    else if (easterEgg <= .02) {
        rocket.src = "assets/images/picklerick.gif";
    }
}

doShennanigans();

setTimeout(() => {
    slowLoad();
}, SLOW_LOAD_MS);
