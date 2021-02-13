require('v8-compile-cache');
const { ipcRenderer, app } = require("electron");
const log = require("electron-log")

Object.assign(console, log.functions);

let gameUI = document.getElementById("gameUI");

module.exports =  class utils {
    generateSettings() {
        const injectSettings = () => {
            console.log("TEST")
        }

        let waitForWindows = setInterval(() => {
			if (window.windows) {
				injectSettings();
				clearInterval(waitForWindows);
			}
		}, 100);
    }

    importSettingsPrompt() {
        // pass
    }
}