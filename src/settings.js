import { defaultConfig } from "./utils/config.js";

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