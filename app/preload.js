const { ipcRenderer } = require("electron");
const path = require("path");
const utils = require("./utils.js")

let lafUtils = new utils();

window.prompt = (message, defaultValue) => ipcRenderer.invoke("PROMPT", message, defaultValue);

const initIpc = () => {
    console.log("start init ipc");
    ipcRenderer.on("ESC", () => {
        document.exitPointerLock();
    });
    ipcRenderer.on("OPEN_URL_PROMPT", (event) => {
        
    })
    console.log("finished init ipc")
};
setTimeout(initIpc, 1000)

//document.addEventListener("DOMContentLoaded", () => {
//        let observer = new MutationObserver(() => {
//            observer.disconnect()
//            lafUtils.generateSettings()
//    });
//})