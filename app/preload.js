require("v8-compile-cache");
const { ipcRenderer } = require("electron");
const log = require("electron-log");
const utils = require("./utils.js")
const tools = require("./tools.js")
// const path = require("path");

const lafUtils = new utils();
const lafTools = new tools();

Object.assign(console, log.functions);

window.prompt = (message, defaultValue) => {
    return ipcRenderer.sendSync("PROMPT", message, defaultValue);
};

const initIpc = () => {
    ipcRenderer.on("ESC", () => {
        document.exitPointerLock();
    });
};
initIpc();

/*
document.addEventListener("DOMContentLoaded", () => {
        let observer = new MutationObserver(() => {
            observer.disconnect()
            lafUtils.generateSettings()
    });
});
*/