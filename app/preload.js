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

window.lafUtils = new utils();

if (config.get("lang") == "ja_JP") {
    langPack = new langRes.ja_JP();
} else {
    langPack = new langRes.en_US();
}

Object.assign(console, log.functions);

Object.assign(window.lafUtils, {
    searchMatches: (id, name, cat) => {
        let settingsWindow = window.windows[0];
        let query = settingsWindow.settingSearch.toLowerCase() || "";
        return (id.toLowerCase() || "").includes(query) || (name.toLowerCase() || "").includes(query) || (cat.toLowerCase() || "").includes(query);
    }
})

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
const initDiscordRPC = () => {
    window.addEventListener("focus", () => {
        
    })
}
*/

window.OffCliV = true;

document.addEventListener("DOMContentLoaded", () => {
    window.utils = new utils();
    let observer = new MutationObserver(() => {
        console.log("Debug: DOMLoaded")
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