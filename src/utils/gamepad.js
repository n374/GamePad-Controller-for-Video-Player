const TYPE = Object.freeze({
    button: "button",
    axis: "axis"
});

// Internal state for the module
let pressedState = {
    isHolding: false,
    lastPressTimestamp: 0,
    isSpeedRestored: true
};

function getPressedKey(gamepad, config) {
    const DeadZone = config && config.variables && config.variables.DeadZone ? config.variables.DeadZone : 0.2;
    let type = null;
    let idx = null;
    let val = null;

    for (let i = 0; i < gamepad.axes.length; i++) {
        if (gamepad.axes[i] && Math.abs(gamepad.axes[i]) > DeadZone) {
            type = TYPE.axis;
            idx = i;
            val = (gamepad.axes[i] - DeadZone) / (1 - DeadZone);
            break;
        }
    }
    if (idx === null) {
        for (let i = 0; i < gamepad.buttons.length; i++) {
            if (gamepad.buttons[i] && gamepad.buttons[i].value > DeadZone) {
                type = TYPE.button;
                idx = i;
                val = (gamepad.buttons[i].value - DeadZone) / (1 - DeadZone);
                break;
            }
        }
    }

    if (idx === null) {
        return null;
    }

    return { type: type, idx: idx, val: val };
}

export function getAction(gp, config) {
    const pressedKey = getPressedKey(gp, config);
    const MinInterval = config && config.variables && config.variables.MinInterval ? config.variables.MinInterval : 200;

    if (pressedKey === null) {
        pressedState.isHolding = false;
        if (!pressedState.isSpeedRestored) {
            pressedState.isSpeedRestored = true;
            return { action: "setSpeed", params: { speed: 1 } };
        }
        return null;
    }

    const now = new Date().getTime();
    if (pressedState.isHolding && (now - pressedState.lastPressTimestamp < MinInterval)) { // 200ms debounce
        return null;
    }

    pressedState.isHolding = true;
    pressedState.lastPressTimestamp = now;
    pressedState.isSpeedRestored = false;

    let val = Math.floor(pressedKey.val * 100) / 100;
    if (!config || !config.keymapping || !config.keymapping.buttons) {
        return null;
    }

    const keymap = config.keymapping.buttons[pressedKey.idx];
    if (!keymap) {
        return null;
    }

    switch (keymap.action) {
        case "seekForward":
            if (keymap.params) {
                return { action: "seekForward", params: keymap.params };
            }
            break;
        case "setSpeed":
            let speed;
            if (keymap.params && keymap.params.speed !== undefined) {
                speed = keymap.params.speed;
            } else {
                speed = (val <= 0.5) ? (1 + val * 2) : (1 + 1 + (val - 0.5) * 4);
            }
            return { action: "setSpeed", params: { speed: speed } };
        case "fullscreenToggle":
            return { action: "fullscreenToggle" };
        case "pauseOrPlay":
            return { action: "pauseOrPlay" };
    }
    
    return null;
}
