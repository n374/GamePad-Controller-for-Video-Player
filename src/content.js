console.log('Content script loaded.');
let port

const blindArea = 0.2;

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
        // https://w3c.github.io/gamepad/standard_gamepad.svg
        switch (pressed.type) {
            case TYPE.axis:
                break;
            case TYPE.button:
                switch (pressed.idx) {
                    case 1:
                        player.seekForward(5)
                        break;
                    case 2:
                        player.seekForward(-1)
                        break;
                    case 7:
                        if (val <= 0.5) {
                            player.setSpeed(1 + val * 2);
                        } else {
                            player.setSpeed(1 + 1 + (val - 0.5) * 4);
                        }
                        break;
                    case 10:
                        player.fullscreenToggle();
                        break;
                    case 11:
                        player.pauseOrPlay();
                        break;
                    case 14:
                        player.seekForward(-5)
                        break;
                }
        }
    }

    getPressedKey(gamepad) {
        let type = null
        let idx = null;
        let val = null;
        for (let i = 0; i < gamepad.axes.length; i++) {
            if (gamepad.axes[i].value > blindArea) {
                type = TYPE.axis;
                idx = i;
                val = (gamepad.axes[i].value - blindArea) / (1 - blindArea);
                break
            }
        }
        for (let i = 0; i < gamepad.buttons.length; i++) {
            if (gamepad.buttons[i].value > blindArea) {
                type = TYPE.button;
                idx = i;
                val = (gamepad.buttons[i].value - blindArea) / (1 - blindArea);
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
