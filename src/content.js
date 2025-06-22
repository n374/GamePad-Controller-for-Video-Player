console.log('Content script loaded.');
let port


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

let listening = false;
let toast = null
let player = null

function addListener() {
    if (listening) {
        console.log('Already listening for gamepad input.');
        return;
    }

    toast = new Toast();
    player = new Player(toast);
    if (port == null) {
        port = chrome.runtime.connect({name: "GamePad-Controller-for-Video-Player"}); // 建立连接
    }
    port.onMessage.addListener((msg) => {
        switch (msg.action) {
            case ACTION.GetSpeed:
                const speed = player.getSpeed();
                port.postMessage({id: msg.id, action: ACTION.GetSpeed, speed: speed});
                break;
            case ACTION.SetSpeed:
                player.setSpeed(msg.param.speed);
                break;
            case ACTION.SeekForward:
                player.seekForward(msg.param.seconds);
                break;
            case ACTION.PauseOrPlay:
                player.pauseOrPlay();
                break;
            case ACTION.FullscreenToggle:
                player.fullscreenToggle();
                break;
            default:
                console.warn('Unknown action:', msg.action);
        }
    })

    window.addEventListener("gamepadconnected", function () {
        console.log('Initializing content script...');

        function handleGamepadInput() {
            function f() {
                const gps = navigator.getGamepads();
                if (!gps || gps.length === 0) {
                    return null;
                }
                const gp = gps[0];
                if (!gp) {
                    return null
                }
                if (port != null) {
                    port.postMessage({
                        id: Date.now() + Math.random(),
                        action: ACTION.KeyPressed,
                        param: {
                            axes: gp.axes,
                            buttons: gp.buttons.map(button => button.value)
                        }
                    });
                }
            }

            f()

            // handle button presses
            requestAnimationFrame(handleGamepadInput);
        }

        console.log('Starting gamepad input listener...');
        handleGamepadInput();
    });
    listening = true;
}


// receive messages from the background script
console.log('Listening for gamepad input.');
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message from background script:', request);
    if (request.action === ACTION.EnableListening) {
        sendResponse({status: "success"});
        addListener()
        return true; // indicates that the response will be sent asynchronously
    }
    sendResponse({status: "success",})
    return true
});
