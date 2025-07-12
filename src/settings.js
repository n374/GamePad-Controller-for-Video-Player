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

const configText = document.getElementById('config');
const saveButton = document.getElementById('save');
const resetButton = document.getElementById('reset');
const statusDiv = document.getElementById('status');

function saveOptions() {
    try {
        const parsedConfig = JSON.parse(configText.value);
        chrome.storage.sync.set({config: parsedConfig}, () => {
            statusDiv.textContent = 'Options saved.';
            setTimeout(() => { statusDiv.textContent = ''; }, 1000);
        });
    } catch (e) {
        statusDiv.textContent = 'Error: Invalid JSON.';
    }
}

function restoreOptions() {
    chrome.storage.sync.get({config: defaultConfig}, (items) => {
        configText.value = JSON.stringify(items.config, null, 2);
    });
}

function resetToDefault() {
    configText.value = JSON.stringify(defaultConfig, null, 2);
}

document.addEventListener('DOMContentLoaded', restoreOptions);
saveButton.addEventListener('click', saveOptions);
resetButton.addEventListener('click', resetToDefault);
