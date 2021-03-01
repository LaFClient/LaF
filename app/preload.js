require("v8-compile-cache");
const { ipcRenderer } = require("electron");
const log = require("electron-log");
const store = require("electron-store")
const utils = require("./utils.js")
const tools = require("./tools.js")
const langRes = require("./lang")
// const path = require("path");

const lafUtils = new utils();
const lafTools = new tools();

const config = new store();


if (config.get("lang") == "ja_JP") {
    langPack = new langRes.ja_JP();
} else {
    langPack = new langRes.en_US();
}

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


document.addEventListener("DOMContentLoaded", () => {
    window.utils = new utils();
    let observer = new MutationObserver(() => {
        observer.disconnect();
        window.closeClient = () => {
            ipcRenderer.send("CLOSE");
            console.log("CLOSE BTN")
        }
        lafUtils.setupGameWindow();
    });
    observer.observe(document.getElementById("instructions"), {childList: true});
});

ipcRenderer.on("DID-FINISH-LOAD", () => {
    quitBTN = document.getElementById("clientExit");
    quitBTN.style.display = "inherit";
})