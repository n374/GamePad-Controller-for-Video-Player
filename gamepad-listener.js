
const sdl = require('sdl2-gamecontroller');

// This object will hold the state of all connected controllers.
const controllerStates = {};

// --- Event Listeners to Update State ---

sdl.on('controller-device-added', (controller) => {
  console.log('Controller added:', controller.player);
  // Initialize the state for the new controller
  controllerStates[controller.player] = {
    buttons: {
      a: false, b: false, x: false, y: false,
      back: false, guide: false, start: false,
      leftstick: false, rightstick: false,
      leftshoulder: false, rightshoulder: false,
      dpup: false, dpdown: false, dpleft: false, dpright: false,
    },
    axes: {
      leftx: 0, lefty: 0,
      rightx: 0, righty: 0,
      lefttrigger: 0, righttrigger: 0,
    }
  };
});

sdl.on('controller-device-removed', (controller) => {
  console.log('Controller removed:', controller.player);
  // Remove the state for the disconnected controller
  delete controllerStates[controller.player];
});

sdl.on('controller-button-down', (event) => {
  if (controllerStates[event.player]) {
    controllerStates[event.player].buttons[event.button] = true;
  }
});

sdl.on('controller-button-up', (event) => {
  if (controllerStates[event.player]) {
    controllerStates[event.player].buttons[event.button] = false;
  }
});

sdl.on('controller-axis-motion', (event) => {
  if (controllerStates[event.player]) {
    // Normalize axis value from -32768 to 32767 to -1.0 to 1.0
    controllerStates[event.player].axes[event.button] = event.value / 32767.0;
  }
});

// --- Periodic State Reporting ---

setInterval(() => {
  // Pretty print the current state of all controllers
  console.clear();
  console.log('Current Controller States:');
  console.log(JSON.stringify(controllerStates, null, 2));
}, 200);

console.log('Waiting for gamepad events... Script will print current state every 200ms.');
