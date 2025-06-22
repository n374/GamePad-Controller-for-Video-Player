// This file contains the background script for the Chrome extension. 
// It listens for messages from the content script and manages the overall state of the extension.

const blindArea = 0.2;
const domains = ["*://*.youtube.com/*", "*://*.bilibili.com/*"]
const ACTION = Object.freeze({
    // Msg from background script to the content script, to enable/disable gamepad API listening
    EnableListening: "enableListening",
    DisableListening: "disableListening",

    // Msg from content script to the background script, to pass the key pressing state
    KeyPressed: "keyPressed",


    // Msg from background script to the content script, to control the video player
    SetSpeed: "setSpeed",
    SeekForward: "seekForward",
    PauseOrPlay: "pauseOrPlay",
    FullscreenToggle: "fullscreenToggle",
})
const TYPE = Object.freeze({
    button: "button",
    axis: "axis"
})

class Player {
    constructor(channel) {
        this.channel = channel;
    }

    getSpeed() {
        this.sendMessage(ACTION.GetSpeed, null, (action, param) => {
        })
    }

    setSpeed(speed) {
        this.sendMessage(ACTION.SetSpeed, {speed: speed});
    }

    seekForward(seconds) {
        this.sendMessage(ACTION.SeekForward, {seconds: seconds});
    }

    pauseOrPlay() {
        this.sendMessage(ACTION.PauseOrPlay);
    }

    fullscreenToggle() {
        this.sendMessage(ACTION.FullscreenToggle);
    }

    sendMessage(action, param, callback) {
        let id = Date.now() + Math.random(); // unique id for the message
        this.channel.postMessage({id: id, action: action, param: param}); // send the message with id
    }
}

class GamePad {
    constructor() {
        this.pressed = false; // state of the pressed button
        this.ts = 0; // timestamp of the last pressed button
        this.restored = true; // state of the restored speed
    }


    handleKeyPressed(channel, gp) {
        let pressed = this.getPressedKey(gp)
        let player = new Player(channel);
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
            if (gamepad.axes[i] > blindArea) {
                type = TYPE.axis;
                idx = i;
                val = (gamepad.axes[i] - blindArea) / (1 - blindArea);
                break
            }
        }
        for (let i = 0; i < gamepad.buttons.length; i++) {
            if (gamepad.buttons[i] > blindArea) {
                type = TYPE.button;
                idx = i;
                val = (gamepad.buttons[i] - blindArea) / (1 - blindArea);
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

chrome.runtime.onConnect.addListener(function (port) {
    console.log("Connection established from:", port.sender.tab.id);

    // 验证连接来源或名称 (可选)
    if (port.name !== "GamePad-Controller-for-Video-Player") {
        return; // 不是预期的连接
    }

    // 监听通过此连接发来的消息
    port.onMessage.addListener(function (msg) {
        if (msg.action === ACTION.KeyPressed) {
            gamePad.handleKeyPressed(port, msg.param);
        } else {
            console.warn("Unknown action:", msg);
        }
    });

    // (可选) 监听连接断开
    port.onDisconnect.addListener(function () {
        console.log("Port disconnected");
        tabListening = -1; // reset the listening tab
        // find another tab that matches the domain patterns
        chrome.tabs.query({}, (tabs) => {
            for (let tab in tabs) {
                if (!matchesDomain(tab.url)) {
                    continue
                }
                tabListening = tab.id; // set the first matching tab as the listening tab
                chrome.tabs.sendMessage(tabListening, {action: ACTION.EnableListening}, (response) => {
                });
                return
            }
        })
    });
})

let gamePad = new GamePad();
let tabListening = -1

// if a tab is updated and its URL matches the domain patterns, and we are not listening yet,
// send a message to the content script to enable listening for gamepad input
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && matchesDomain(tab.url)) {
        // send a message to the content script of the updated tab
        if (tabListening === -1) {
            console.log("no tab is listening, setting tab for listening", tabId);
            tabListening = tabId;
            chrome.tabs.sendMessage(tabId, {action: ACTION.EnableListening}, (response) => {
            });
        }
    }
});

// a function to check if a url matches any of the domain patterns
function matchesDomain(url) {
    return domains.some(domain => {
        const regex = new RegExp(domain.replace(/\*/g, '.*'));
        return regex.test(url);
    });
}

