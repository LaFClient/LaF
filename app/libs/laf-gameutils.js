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
                console.error(e);
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

    generateHTML(obj) {
        switch (obj.type) {
            case "checkbox":
                return `
                <label class='switch'>
                <input type='checkbox' onclick='window.utils.setConfig("${obj.id}", this.checked, true)'${config.get(obj.id, obj.default) ? ' checked' : ''}>
                <span class='slider'></span>
                </label>`;
            case "select":
                let tmpHTML = `<select onchange='window.utils.setConfig("${obj.id}", this.value, ${obj.restart})' class="inputGrey2">`;
                Object.keys(obj.options).forEach((k) => {
                    tmpHTML += `<option value="${k}" ${config.get(obj.id, obj.default) === k ? " selected" : ""}>${obj.options[k]}</option>`
                })
                return tmpHTML + "</select>";
            case "slider":
                return `
                <input type='number' class='sliderVal' id='c_slid_input_${obj.id}' min='${obj.min}' max='${obj.max}' value='${config.get(obj.id, obj.default)}' onkeypress='window.utils.delaySetConfig("${obj.id}", this)' style='border-width:0px'/><div class='slidecontainer'><input type='range' id='c_slid_${obj.id}' min='${obj.min}' max='${obj.max}' step='${obj.step}' value='${config.get(obj.id, obj.default)}' class='sliderM' oninput='window.utils.setConfig("${obj.id}", this.value)'></div>
                `;
            case "file":
                return `
                <button class='settingsBtn' onclick='window.utils.tolset("${obj.id}")' style="float:right;margin-top:5px;">${langPack.selectFile}</button><div id='${obj.id}' style="font-size:13pt;margin-top:10px;text-align:right;">${config.get(obj.id, obj.default)}</div>
                `
            case "fileWithEyes":
                return `
                <button class='settingsBtn' onclick='window.utils.tolset("${obj.id}")' style="float:right;margin-top:5px;">${langPack.selectFile}</button>
                <a class="material-icons" id="eye_${obj.id}" onclick="window.utils.tolset('changeVisibility', '${obj.id}')" style="text-decoration:none;float:right;margin-top:10px;color:rgba(0,0,0,0.5);">${config.get(`${obj.id}_visibility`, true) ? "visibility" : "visibility_off"}</a>
                <div id='${obj.id}' style="font-size:13pt;margin-top:10px;text-align:right;display:${config.get(`${obj.id}_visibility`, true) ? '' : 'none'};">${config.get(obj.id, obj.default)}</div>
                `
            default:
                return `
                <input type='${obj.type}' name='${obj.id}' id='c_slid_${obj.id}' ${obj.type == 'color' ? 'style="float:right;margin-top:5px;"' : `class='inputGrey2' ${obj.placeholder ? `placeholder='${obj.placeholder}'` : ''}`} value='${config.get(obj.id, obj.default).replace(/'/g, '')}' oninput='window.utils.setConfig("${obj.id}", this.value, ${obj.restart})'/>
                `;
        };
    }

    setupGameWindow() {
        const injectSettings = () => {
            settingsWindow = window.windows[0];

            let GetSettings = settingsWindow.getSettings;
            settingsWindow.getSettings = (...args) => GetSettings.call(settingsWindow, ...args).replace(/^<\/div>/, '') + settingsWindow.getCSettings();

            settingsWindow.getCSettings = () => {
                settingsWindow = window.windows[0];
                let customHTML = ""
                if (settingsWindow.tabIndex !== 6 && !settingsWindow.settingSearch) {
                    return "";
                }
                let prevCat = null;
                Object.values(this.settings).forEach((k) => {
                    if (settingsWindow.settingSearch && !window.lafUtils.searchMatches(k.id, k.title, k.category)) {
                        return "";
                    }
                    let tmpHTML = "";
                    if (k.category != prevCat) {
                        if (prevCat) {
                            tmpHTML += "</div>"
                        }
                        prevCat = k.category;
                        tmpHTML += `<div class='setHed' id='setHed_${k.category}' onclick='window.windows[0].collapseFolder(this)'><span class='material-icons plusOrMinus'>keyboard_arrow_down</span> ${k.category}</div><div class='setBodH' id='setBod_${btoa(k.category)}'>`;
                    }
                    tmpHTML += `<div class='settName' id='${k.id}_div' style='display:${k.hide ? 'none' : 'block'}'>${k.title} `
                    if (k.restart) {
                        tmpHTML += "<span style='color: #eb5656'> *</span>"
                    }
                    customHTML += tmpHTML + this.generateHTML(k) + "</div>";
                });
                if (!settingsWindow.settingSearch) {
                    customHTML += `
                    </div>
                    <a onclick="window.utils.tolset('clearCache')" class="menuLink">${langPack.clearCache}</a> | 
                    <a onclick="window.utils.tolset('resetOptions')" class="menuLink">${langPack.resetOption}</a> | 
                    <a onclick="window.utils.tolset('restartClient')" class="menuLink">${langPack.restart}</a></br>
                    <a onclick="window.utils.tolset('openSwapper')" class="menuLink">${langPack.openSwapFolder}</a> | 
                    <a onclick="window.utils.tolset('openInfo')" class="menuLink">${langPack.openInfo}</a>
                    `;
                }
                return customHTML ? customHTML + "</div>" : "";
            }
        }
        injectSettings();
    }
}