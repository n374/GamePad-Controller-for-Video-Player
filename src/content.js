console.log('Content script loaded.');


class Player {
    constructor(toast) {
        this.toast = toast;
    }

    getSpeed() {
        const video = document.querySelector('video');
        if (video) {
            return video.playbackRate;
        } else {
            console.log('No video element found on the page.');
            return null;
        }
    }

    setSpeed(speed) {
        const video = document.querySelector('video');
        if (this.getSpeed() === speed) {
            return
        }
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
            this.toast.setContent(`<< ${seconds}s`);
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


class GamePad {
    constructor() {
        // previous button state
        this.pressed = false
        // previous state timestamp
        this.ts = 0
    }

    getPressedKey() {
        const gamepads = navigator.getGamepads();
        if (!gamepads) {
            return null;
        }
        const gamepad = gamepads[0];
        if (!gamepad) {
            return null
        }


        let idx = -1;
        let val = -1;
        for (let i = 0; i < gamepad.buttons.length; i++) {
            if (gamepad.buttons[i].value > 0.1) {
                idx = i;
                val = gamepad.buttons[i].value;
                break
            }
        }
        for (let i = 0; i < gamepad.axes.length; i++) {
            if (gamepad.axes[i] > 0.1) {
                idx = -i;
                val = gamepad.axes
                break
            }
        }

        // if no button is pressed, return null, and save null as state
        if (idx === -1) {
            this.pressed = false
            return null;
        }

        let state = {idx: idx, val: val};

        // if pressed less than 100 ms ago, return val as -1, to indicate that the button is still pressed
        if (this.pressed && new Date().getTime() - this.ts < 100) {
            return {idx: idx, val: -1};
        }

        // save state and ts
        this.pressed = true;
        this.ts = new Date().getTime();
        return state;
    }
}

window.addEventListener("gamepadconnected", function () {
    console.log('Initializing content script...');
    const toast = new Toast();
    const player = new Player(toast);
    const gamepad = new GamePad();
    let restored = true

    function handleGamepadInput() {
        function f() {
            let pressed = gamepad.getPressedKey()
            if (pressed == null) {
                if (!restored) {
                    player.setSpeed(1)
                    restored = true
                }
                return null;
            }

            if (pressed.val === -1) {
                return null
            }

            restored = false;

            let val = Math.floor(pressed.val * 100) / 100
            if (pressed.idx === 7) {
                if (val <= 0.5) {
                    player.setSpeed(1 + val * 2);
                } else {
                    player.setSpeed(1 + 1 + (val-0.5) * 4);
                }
            }
            if (pressed.idx === 2) {
                player.seekForward(-1)
            }
            if (pressed.idx === 14) {
                player.seekForward(-5)
            }
            if (pressed.idx === 11) {
                player.pauseOrPlay()
            }
            if (pressed.idx === 10) {
                player.fullscreenToggle()
            }
        }

        f()

        // handle button presses
        requestAnimationFrame(handleGamepadInput);
    }

    console.log('Starting gamepad input listener...');
    handleGamepadInput();
});