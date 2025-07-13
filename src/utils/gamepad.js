import { defaultConfig } from "./config.js";

const TYPE = Object.freeze({
    button: "button",
    axis: "axis"
});

function getPressedKey(gamepad, config) {
    const DeadZone = config && config.variables && config.variables.DeadZone ? config.variables.DeadZone : 0.2;
    let type = null
    let idx = null;
    let val = null;
    for (let i = 0; i < gamepad.axes.length; i++) {
        if (gamepad.axes[i].value > DeadZone) {
            type = TYPE.axis;
            idx = i;
            val = (gamepad.axes[i].value - DeadZone) / (1 - DeadZone);
            break
        }
    }
    for (let i = 0; i < gamepad.buttons.length; i++) {
        if (gamepad.buttons[i].value > DeadZone) {
            type = TYPE.button;
            idx = i;
            val = (gamepad.buttons[i].value - DeadZone) / (1 - DeadZone);
            break
        }
    }

    if (idx === null) {
        return null;
    }

    return {type: type, idx: idx, val: val};
}

export function getAction(gp, config, pressedState) {
    let pressed = getPressedKey(gp, config)
    if (pressed == null) {
        if (!pressedState.restored) {
            pressedState.restored = true
            return {action: "setSpeed", params: {speed: 1}};
        }
        return null;
    }

    if (pressed.val === null) {
        return null
    }

    pressedState.restored = false;

    let val = Math.floor(pressed.val * 100) / 100
    if (!config || !config.keymapping) {
        return;
    }

    const keymap = config.keymapping.buttons[pressed.idx];
    if (!keymap) {
        return;
    }

    switch (keymap.action) {
        case "seekForward":
            if (keymap.params) {
                return {action: "seekForward", params: keymap.params};
            }
            break;
        case "setSpeed":
            let speed;
            if (keymap.params && keymap.params.speed !== undefined) {
                speed = keymap.params.speed;
            } else {
                speed = (val <= 0.5) ? (1 + val * 2) : (1 + 1 + (val - 0.5) * 4);
            }
            return {action: "setSpeed", params: {speed: speed}};
        case "fullscreenToggle":
            return {action: "fullscreenToggle"};
        case "pauseOrPlay":
            return {action: "pauseOrPlay"};
    }
}