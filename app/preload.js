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

const isEnabledRPC = config.get("enableRPC", true)
let rpcAvtivity = null;
let rpcInterval = null;

const initDiscordRPC = () => {
    let sendDiscordRPC = () => {
        try {
            let gameActiviry = window.getGameActivity();
            rpcAvtivity = {
                state: gameActiviry.map,
                details: gameActiviry.mode,
                largeImageKey: "laf_icon",
                largeImageText: "LaF CLient"
            }
            if (gameActiviry.time) {
                rpcAvtivity.endTimestamp = Date.now() + gameActiviry.time * 1e3;
            }
            ipcRenderer.invoke("RPC_SEND", rpcAvtivity)
        } catch (error) {
            rpcAvtivity = {
                state: "Playing Krunker",
                largeImageKey: "laf_icon",
                largeImageText: "LaF CLient"
            }
            ipcRenderer.invoke("RPC_SEND", rpcAvtivity)
        }
    }
    if (isEnabledRPC) {
        rpcAvtivity = {
            startTimestamp: Math.floor(Date.now() / 1e3),
        }
        ipcRenderer.invoke("RPC_SEND", rpcAvtivity);
        rpcInterval = setInterval(sendDiscordRPC, 500);
    }
}

ipcRenderer.on("RPC_STOP", () => {
    if (rpcInterval) {
        clearInterval(rpcInterval)
    }
})

initDiscordRPC();

window.OffCliV = true;

document.addEventListener("DOMContentLoaded", () => {
    window.utils = new utils();
    let observer = new MutationObserver(() => {
        // console.log("Debug: DOMLoaded")
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
    menuContainer = document.getElementById("menuItemContainer")
    quitBTN = document.getElementById("clientExit");
    switch (config.get("showExitBtn", "bottom")){
        case "top":
            menuContainer.removeChild(menuContainer.children[7])
            menuContainer.insertAdjacentHTML("afterbegin", `
            <div class="menuItem" onmouseenter="playTick()" onclick="clientExitPopup()" id="clientExit">
            <div class="menuItemIcon iconExit"></div>
            <div class="menuItemTitle" id="menuBtnExit">Exit</div>
            </div>
            `)
            quitBTN = document.getElementById("clientExit");
            quitBTN.style.display = "inherit";
            break;
        case "bottom":
            quitBTN.style.display = "inherit";
            break;
        case "disable":
            break;
    }
})