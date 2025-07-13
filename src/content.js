import { defaultConfig } from "./utils/config.js";
import { getAction } from "./utils/gamepad.js";

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

let player = new Player(new Toast());
let pressedState = { pressed: false, ts: 0, restored: true };

function handleGamepadInput() {
    const gps = navigator.getGamepads();
    if (!gps || gps.length === 0) {
        requestAnimationFrame(handleGamepadInput);
        return;
    }
    const gp = gps[0];
    if (!gp) {
        requestAnimationFrame(handleGamepadInput);
        return;
    }

    const action = getAction(gp, config, pressedState);

    if (action) {
        switch (action.action) {
            case "seekForward":
                player.seekForward(action.params.seconds);
                break;
            case "setSpeed":
                player.setSpeed(action.params.speed);
                break;
            case "fullscreenToggle":
                player.fullscreenToggle();
                break;
            case "pauseOrPlay":
                player.pauseOrPlay();
                break;
        }
    }

    requestAnimationFrame(handleGamepadInput);
}

window.addEventListener("gamepadconnected", function () {
    console.log('Initializing content script...');
    console.log('Starting gamepad input listener...');
    handleGamepadInput();
});
