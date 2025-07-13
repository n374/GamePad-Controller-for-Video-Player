export const defaultConfig = {
    "variables": {
        "DeadZone": 0.2,
        "MinInterval": 200
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
