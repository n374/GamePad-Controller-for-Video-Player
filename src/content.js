console.log('Content script loaded.');

window.addEventListener("gamepadconnected", function () {
    console.log('Initializing content script...');
    const playbackSpeedOptions = [0.5, 1, 1.5, 2];
    let currentSpeedIndex = 1; // Default to normal speed (1x)

    function changePlaybackSpeed(speed) {
        const video = document.querySelector('video');
        if (video) {
            console.log(`Changing playback speed to: ${speed}`);

            let toast = document.getElementById("toast");
            if (toast == null ) {
                console.log('Creating toast element...');
                // add CSS definition to the page
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
  position: fixed; /* 确保固定在视口 */
  left: 50%;
  bottom: 30px;
  font-size: 17px;
}

#toast.show {
  visibility: visible;
  display: block; /* 确保显示 */
  -webkit-animation: fadein 0.5s, fadeout 0.5s 2.5s;
  animation: fadein 0.5s, fadeout 0.5s 2.5s;
}
            `;
            document.head.appendChild(style);
                // add a div with id as toast
                toast = document.createElement('div');
                toast.id = 'toast';
                toast.className = 'show';
                // toast.textContent = `Playback speed changed to ` + getPlaybackSpeed();
                document.body.appendChild(toast);
            }
        
            toast.className = "show";
            toast.textContent = `Playback speed changed to ` + getPlaybackSpeed();
            setTimeout(function(){ toast.className = toast.className.replace("show", ""); }, 3000);

            video.playbackRate = speed;
        } else {
            console.log('No video element found on the page.');
        }
    }
    function getPlaybackSpeed() {
        const video = document.querySelector('video');
        if (video) {
            return video.playbackRate;
        } else {
            console.log('No video element found on the page.');
            return null;
        }
    }

    function handleGamepadInput() {
        const gamepads = navigator.getGamepads();
        if (gamepads) {
            // console.log('Gamepads detected:', gamepads);
            const gamepad = gamepads[0]; // Assuming we're using the first gamepad
            if (gamepad) {
                // iterate through all buttons, and print their pressed state
                // gamepad.buttons.forEach((button, index) => {
                //     if (button.pressed || button.value > 0 || button.touched) {
                //         console.log(`Button ${index} pressed: ${button.pressed}, value: ${button.value}`);
                //     }
                // })
                // gamepad.axes.forEach((axis, index) => {
                //     if (axis > 0.1 || axis < -0.10) {
                //         console.log(`Axis ${index} value: ${axis}`);
                //     }
                // })
                // Check for button presses
                // https://w3c.github.io/gamepad/standard_gamepad.svg
                if (gamepad.buttons[0].pressed) { // A button
                    // console.log(`Gamepad connected`, gamepad);
                    // console.log('Button 0 pressed: Increasing speed.');
                    currentSpeedIndex = (currentSpeedIndex + 1) % playbackSpeedOptions.length;
                    changePlaybackSpeed(playbackSpeedOptions[currentSpeedIndex]);
                }
                if (gamepad.buttons[1].pressed) { // B button
                    // console.log('Button 1 pressed: Decreasing speed.');
                    currentSpeedIndex = (currentSpeedIndex - 1 + playbackSpeedOptions.length) % playbackSpeedOptions.length;
                    changePlaybackSpeed(playbackSpeedOptions[currentSpeedIndex]);
                }
            }
        }
        requestAnimationFrame(handleGamepadInput);
    }

    // Start listening for gamepad input
    console.log('Starting gamepad input listener...');
    handleGamepadInput()
    requestAnimationFrame(handleGamepadInput);
});