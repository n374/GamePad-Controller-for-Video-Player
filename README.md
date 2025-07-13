# GamePad Controller for Video Player

## Overview
The GamePad Controller for Video Playe is a Chrome extension that allows users to control video player's playback speed using a gamepad. By leveraging the Gamepad API, this extension provides an interactive way to enhance the viewing experience.

## Features
- Adjust playback speed using gamepad buttons.
- Seamless integration with HTML5 video player.
- Easy to set up and use.

## Build

To build the extension, you need to have Node.js and npm installed. 

1. Install the dependencies:
   ```
   npm install
   ```
2. Build the extension:
   ```
   npm run build
   ```
This will create a `dist` directory inside `src` with the bundled files.

## Installation
1. Clone the repository:
   ```
   git clone https://github.com/m374/GamePad-Controller-for-Video-Player.git
   ```
2. Navigate to the project directory:
   ```
   cd GamePad-Controller-for-Video-Player
   ```
3. Open Chrome and go to `chrome://extensions/`.
4. Enable "Developer mode" in the top right corner.
5. Click on "Load unpacked" and select the project directory. Chrome will load the extension from the `src` directory, which is configured to use the bundled files from the `dist` directory.

## Usage
1. Connect your gamepad to your computer.
2. Open a video player in your browser.
3. Use the designated buttons on your gamepad to adjust the playback speed:
   - Button A: Increase playback speed.
   - Button B: Decrease playback speed.

## Contributing
If you'd like to contribute to this project, please fork the repository and submit a pull request. 

## License
This project is licensed under the MIT License. See the LICENSE file for details.