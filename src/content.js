const defaultConfig = {
    "variables": {
        "DeadZone": 0.2
    },
    "keymapping": {
        "buttons": {
            "1": {
                "action": "seekForward",
                "params": {
                    "seconds": 5
                }
            },
            "2": {
                "action": "seekForward",
                "params": {
                    "seconds": -1
                }
            },
            "7": {
                "action": "setSpeed"
            },
            "10": {
                "action": "fullscreenToggle"
            },
            "11": {
                "action": "pauseOrPlay"
            },
            "14": {
                "action": "seekForward",
                "params": {
                    "seconds": -5
                }
            }
        }
    }
};

let config = defaultConfig;

chrome.storage.sync.get({config: defaultConfig}, (data) => {
    config = data.config;
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.config) {
        config = changes.config.newValue;
    }
});

const ACTION = Object.freeze({
    // Msg from background script to the content script, to enable/disable gamepad API listening
    EnableListening: "enableListening",
    DisableListening: "disableListening",

    // Msg from content script to the background script, to pass the key pressing state
    KeyPressed: "keyPressed",


    // Msg from background script to the content script, to control the video player
    GetSpeed: "getSpeed",
    SetSpeed: "setSpeed",
    SeekForward: "seekForward",
    PauseOrPlay: "pauseOrPlay",
    FullscreenToggle: "fullscreenToggle",
})

class Player {
    constructor(toast) {
        this.toast = toast;
    }

    getSpeed() {
        const video = document.querySelector('video');
        if (video) {
            return video.playbackRate;
        }
        console.log('No video element found on the page.');
        return null;
    }

    setSpeed(speed) {
        if (this.getSpeed() === speed) {
            return
        }
        const video = document.querySelector('video');
        if (video) {
            video.playbackRate = speed;
        } else {
            console.log('No video element found on the page.');
        }
        this.toast.setContent(`Speed: ${Math.floor(this.getSpeed() * 100) / 100}`);
    }

    seekForward(seconds) {
        const video = document.querySelector('video');
        if (video) {
            video.currentTime += seconds;
            if (seconds > 0) {
                this.toast.setContent(`>> ${seconds}s`);
            } else {
                this.toast.setContent(`<< ${seconds}s`);
            }
        } else {
            console.log('No video element found on the page.');
        }
    }

    pauseOrPlay() {
        const video = document.querySelector('video');
        if (video.paused) {
            video.play()
        } else {
            video.pause()
        }
    }

    fullscreenToggle() {
        const video = document.querySelector('video');
        if (video) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                video.requestFullscreen();
            }
        } else {
            console.log('No video element found on the page.');
        }
    }
}

class Toast {
    constructor() {
        this.start = 0;
        this.toast = document.getElementById("toast");
        if (this.toast == null) {
            console.log('Creating toast element...');
            const style = document.createElement('style');
            style.textContent = `
#toast {
  visibility: hidden;
  opacity: 0.5;
  z-index: 9999;
  min-width: 250px;
  margin-left: -125px;
  background-color: #333;
  color: #fff;
  text-align: center;
  border-radius: 2px;
  padding: 16px;
  position: fixed;
  left: 50%;
  bottom: 30px;
  font-size: 17px;
}

#toast.show {
  visibility: visible;
  display: block;
  -webkit-animation: fadein 0.5s, fadeout 0.5s 2.5s;
  animation: fadein 0.5s, fadeout 0.5s 2.5s;
}
            `;
            document.head.appendChild(style);

            this.toast = document.createElement('div');
            this.toast.id = 'toast';
            document.body.appendChild(this.toast);
        }
    }

    setContent(content) {
        this.start = new Date().getTime();
        this.toast.className = "show";
        this.toast.textContent = content;
        setTimeout(() => {
            if (this.start + 3000 <= new Date().getTime()) {
                this.toast.className = this.toast.className.replace("show", "");
            }
        }, 3000);
    }
}


const TYPE = Object.freeze({
    button: "button",
    axis: "axis"
})

class GamePad {
    constructor() {
        this.pressed = false; // state of the pressed button
        this.ts = 0; // timestamp of the last pressed button
        this.restored = true; // state of the restored speed
    }


    handleKeyPressed(gp) {
        let pressed = this.getPressedKey(gp)
        if (pressed == null) {
            if (!this.restored) {
                player.setSpeed(1)
                this.restored = true
            }
            return null;
        }

        if (pressed.val === null) {
            return null
        }

        this.restored = false;

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
                player.seekForward(keymap.params.seconds);
                break;
            case "setSpeed":
                let speed;
                if (keymap.params && keymap.params.speed !== undefined) {
                    speed = keymap.params.speed;
                } else {
                    speed = (val <= 0.5) ? (1 + val * 2) : (1 + 1 + (val - 0.5) * 4);
                }
                player.setSpeed(speed);
                break;
            case "fullscreenToggle":
                player.fullscreenToggle();
                break;
            case "pauseOrPlay":
                player.pauseOrPlay();
                break;
        }
    }

    getPressedKey(gamepad) {
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

        // if no button is pressed, return null, and save null as state
        if (idx === null) {
            this.pressed = false
            return null;
        }

        let state = {type: type, idx: idx, val: val};

        // if pressed less than 100 ms ago, return val as null, to indicate that the button is still pressed
        if (this.pressed && new Date().getTime() - this.ts < 100) {
            return {type: type, idx: idx, val: null};
        }

        // save state and ts
        this.pressed = true;
        this.ts = new Date().getTime();
        return state;
    }
}

let gamePad = new GamePad();
let player = new Player(new Toast());

function addListener() {
    window.addEventListener("gamepadconnected", function () {
        console.log('Initializing content script...');

        function handleGamepadInput() {
            function f() {
                const gps = navigator.getGamepads();
                if (!gps || gps.length === 0) {
                    return null;
                }
                const gp = gps[0];
                if (gp) {
                    gamePad.handleKeyPressed(gp);
                }
            }

            f()

            // handle button presses
            requestAnimationFrame(handleGamepadInput);
        }

        console.log('Starting gamepad input listener...');
        handleGamepadInput();
    });
}
addListener()