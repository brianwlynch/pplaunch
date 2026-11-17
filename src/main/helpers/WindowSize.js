const { app, screen } = require("electron");

// Test override
// npm start -- --screen-size 1920*258 (Densitron Panel)
function getTestScreenSize(){
    const raw = app.commandLine.getSwitchValue("screen-size") || process.env.PPLAUNCH_SCREEN_SIZE;
    const m = /^(\d+)x(\d+)$/i.exec(raw || "");
    return m ? { width: Number(m[1]), height: Number(m[2]) } : null;
}

function getDisplay(parent){
    const win = parent?.window ?? parent;
    return win && !win.isDestroyed()
        ? screen.getDisplayMatching(win.getBounds())
        : screen.getPrimaryDisplay();
}


// Size as a fraction of the work area, clamped to min/max pixels.
function getWindowSize({  
    parent, 
    widthPct = 1, heightPct = 1, 
    minWidth = 0, minHeight = 0,
    maxWidth = Infinity, maxHeight = Infinity
} = {}){
    const override = getTestScreenSize();
    const { width: sw, height: sh } = override ?? getDisplay(parent).workAreaSize;
    const clamp = (v, lo, hi) => Math.round(Math.min(Math.max(v, lo), hi));

    return {
        width: clamp(sw * widthPct, minWidth, Math.min(maxWidth, sw)),
        height: clamp(sh * heightPct, minHeight, Math.min(maxHeight, sh)),
        fullscreen: !override, // override set -> windowed at the baked in size
    };
}

module.exports = { getWindowSize, getTestScreenSize }