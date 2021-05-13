require('v8-compile-cache');
const log = require("electron-log");
const store = require("electron-store");

// laf-gameutils@1.0.0

// 初期化ブロック
Object.assign(console, log.functions);
const config = new store();
switch (config.get("lang", "ja_JP")) {
    case "ja_JP":
        const langRes = require("../lang/ja_JP");
        break;
    case "en_US":
        const langRes = require("../lang/en_US");
        break;
}
const langPack = new langRes.lang();

// 本体
export class utils {
    initGameWindow() {
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
        ipcRenderer.on("ESC", () => {
            document.exitPointerLock();
        });
    }

    setConfig(id, value, restart) {
        config.set(id, value)
        console.log(`${id} has set to ${value}.`)
        if (restart) {
            if (confirm(langPack.restartNowMsg)) {
                ipcRenderer.send("RELAUNCH")
            }
        }
    }

    delayID = {};
    delaySetConfig(id, target, delay = 600) {
        if (delayID[id]) clearTimeout(this.delayID[id])
        this.delayID[id] = setTimeout(() => {
            this.setConfig(id, target.value);
            delete this.delayID[id]
        }, delay)
    }

    initMenuTimer = () => {
        const getActivity = () => {
            let gameActivity;
            try  {
                gameActivity = window.getGameActivity();
            } catch (e) {
                // 何もしなくていい
            }
            let timerSec = gameActivity.time % 60;
            let timerMin = gameActivity.time < 60 ? "0" : (gameActivity.time - timerSec) / 60;
            document.getElementById("menuTimer").innerText = (`${("0" + timerMin).slice(-2)}:${("0" + timerSec).slice(-2)}`)
        }
        setInterval(getActivity, 500);
    }

    insertMenuTimerHTML = () => {
        let instructionsEl = document.getElementById("instructions");
        let menuTimerHTML = `
        <div id="menuTimer" style="position:absolute;top:55%;left:50%;margin-right:50%;transform:translate(-50%,-50%);font-size:50px;color:rgba(255, 255, 255, 0.8);"></div>
        `;
        instructionsEl.insertAdjacentHTML("afterend", menuTimerHTML)
    }

    initDiscordRPC = () => {
        let rpcActivity = null;
        let rpcInterval = null;
        const sendDiscordRPC = () => {
            try {
                let gameActivity = window.getGameActivity();
                rpcActivity = {
                    state: gameActivity.map,
                    details: gameActivity.mode,
                    largeImageKey: "laf_icon",
                    largeImageText: "LaF CLient"
                }
                if (gameActivity.time) {
                    rpcActivity.endTimestamp = Date.now() + gameActivity.time * 1e3;
                }
                ipcRenderer.invoke("RPC_SEND", rpcActivity)
            } catch (error) {
                rpcActivity = {
                    state: "Playing Krunker",
                    largeImageKey: "laf_icon",
                    largeImageText: "LaF CLient"
                }
                ipcRenderer.invoke("RPC_SEND", rpcActivity)
            }
        }
        if (isEnabledRPC) {
            rpcActivity = {
                startTimestamp: Math.floor(Date.now() / 1e3)
            }
            ipcRenderer.invoke("RPC_SEND", rpcActivity);
            rpcInterval = setInterval(sendDiscordRPC, 500);
        }
    }

    insertWaterMarkHTML = () => {
        let gameUIEl = document.getElementById("gameUI");
        ipcRenderer.send("GET_VERSION");
        ipcRenderer.on("GET_VERSION", (e, v) => {
            gameUIEl.insertAdjacentHTML("beforeend", `
            <div id="LaFWaterMark" style="position:absolute;font-size:15px;bottom:5px;right:5px;color:rgba(255, 255, 255, .75);">LaF v${v}</div>
            `);
        })
    }
}