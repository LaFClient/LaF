const { ipcRenderer } = require("electron");
const path = require("path");
const utils = require("./utils.js")

const lafUtils = new utils();

gameUI = document.getElementById("gameUI");

window.prompt = (message, defaultValue) => {
    ipcRenderer.send("OPEN_PROMPT", message, defaultValue);
}

initIpc = () => {
    ipcRenderer.on("ESC", () => {
        document.exitPointerLock();
    });
}
initIpc();

document.addEventListener("DOMContentLoaded", () => {
        let observer = new MutationObserver(() => {
            observer.disconnect()
            lafUtils.generateSettings()
    });
})