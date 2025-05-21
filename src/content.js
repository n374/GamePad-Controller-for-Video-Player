console.log('Content script loaded.');


class Player {
    constructor() {
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
        if (video) {
            console.log(`Changing playback speed to: ${speed}`);
            video.playbackRate = speed;
        } else {
            console.log('No video element found on the page.');
        }
    }

    seekForward(seconds) {
        const video = document.querySelector('video');
        if (video) {
            video.currentTime += seconds;
        } else {
            console.log('No video element found on the page.');
        }
    }
}

class Toast {
    constructor() {
        this.toast = document.getElementById("toast");
        if (this.toast == null) {
            console.log('Creating toast element...');
            const style = document.createElement('style');
            style.textContent = `
#toast {
  visibility: hidden;
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
        this.toast.className = "show";
        this.toast.textContent = content;
        setTimeout(() => {
            this.toast.className = this.toast.className.replace("show", "");
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

        // if not pressed last time
        if (!this.pressed) {
            // save state and ts
            this.pressed = true;
            this.ts = new Date().getTime();
            return state;
        }

        // if key pressed, only check state every 100 ms
        if (new Date().getTime() - this.ts < 100) {
            return null;
        }


        // save state and ts
        this.pressed = true;
        this.ts = new Date().getTime();

        return state;
    }
}

window.addEventListener("gamepadconnected", function () {
    console.log('Initializing content script...');
    const player = new Player();
    const toast = new Toast();
    const gamepad = new GamePad();

    function handleGamepadInput() {
        function f() {
            let pressed = gamepad.getPressedKey()
            if (pressed == null) {
                return null;
            }

            console.log(pressed);

            val = Math.floor(pressed.val * 10) / 10
            if (pressed.idx === 7) {
                // A button pressed
                player.setSpeed(1 + val);
                toast.setContent(`Speed: ${player.getSpeed()}`);
            }
            if (pressed.idx === 6) {
                // A button pressed
                player.setSpeed(-1 - val);
                toast.setContent(`Speed: ${player.getSpeed()}`);
            }
        }
        f()

        // handle button presses
        requestAnimationFrame(handleGamepadInput);
    }

    console.log('Starting gamepad input listener...');
    handleGamepadInput();
});