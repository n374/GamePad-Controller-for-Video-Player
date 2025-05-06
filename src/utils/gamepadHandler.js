function detectGamepadConnection() {
    window.addEventListener("gamepadconnected", (event) => {
        console.log("Gamepad connected:", event.gamepad);
    });

    window.addEventListener("gamepaddisconnected", (event) => {
        console.log("Gamepad disconnected:", event.gamepad);
    });
}

function readGamepadInput() {
    const gamepads = navigator.getGamepads();
    if (gamepads) {
        console.log("Reading gamepad input...");
        for (let gamepad of gamepads) {
            if (gamepad) {
                console.log(`Gamepad detected: ${gamepad.id}`);
                handleButtonPress(gamepad);
            }
        }
    } else {
        console.log("No gamepads detected.");
    }
}

function handleButtonPress(gamepad) {
    const buttonMappings = {
        0: 1.5, // Button 0 increases speed
        1: 0.5, // Button 1 decreases speed
    };

    gamepad.buttons.forEach((button, index) => {
        if (button.pressed) {
            console.log(`Button ${index} pressed.`);
            if (buttonMappings[index]) {
                console.log(`Mapped action: Change playback speed to ${buttonMappings[index]}x`);
                sendMessageToContentScript(buttonMappings[index]);
            } else {
                console.log(`No action mapped for button ${index}.`);
            }
        }
    });
}

function sendMessageToContentScript(speed) {
    console.log(`Sending message to content script with playback speed: ${speed}`);
    chrome.runtime.sendMessage({ playbackSpeed: speed });
}

export { detectGamepadConnection, readGamepadInput };