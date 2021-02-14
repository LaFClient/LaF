require('v8-compile-cache');
const { ipcRenderer, app } = require("electron");
const log = require("electron-log")
const store = require("electron-store")
const langRes = require("./lang")

const config = new store();

if (config.get("lang", "ja_JP")) {
    langPack = new langRes.ja_JP();
} else {
    langPack = new langRes.en_US();
}

Object.assign(console, log.functions);

let gameUI = document.getElementById("gameUI");

module.exports = class utils {
    /*
    settings = {
        languages: {
            id: "lang",
            title: langPack.languageSetting,
            type: "select",
            restart: true,
            options: {
                ja_JP: "日本語",
                en_US: "English"
            },
            val: config.get("lang", "ja_JP"),
            html: `
            <select onchange="window.utils.setConfig('lang', this.value, true)" class="inputGrey2">
                <option value="ja_JP" ${this.settings.languages.val === "ja_JP" ? " selected" : ""}>日本語</option>
                <option value="en_US" ${this.settings.languages.val === "en_US" ? " selected" : ""}>English</option>
            </select>
            `
        },
        unlimitedFPS: {
            id: "unlimitedFPS",
            title: langPack.unlimitedFPS,
            type: "checkbox",
            restart: true,
            val: config.get("unlimitedFPS", true),
            html: () => {return this.generateSettings(this)}
        },
        enableVsync: {
            id: "enableVsync",
            title: langPack.enableVsync,
            type: "checkbox",
            restart: true,
            val: config.get("enableVsync", false),
            html: () => {return this.generateSettings(this)}
        },
        angleType: {
            id: "angleType",
            title: langPack.angleType,
            type: "select",
            restart: true,
            options: {
                default: "Default",
                gl: "OpenGL",
                d3d11: "D3D11",
                d3d9: "D3D9",
                d3d11on12: "D3D11on12"
            },
            val: config.get("angleType", "gl"),
            html: `
            <select onchange="window.utils.setConfig('angleType', this.value, true)" class="inputGrey2">
                <option value="default" ${this.settings.languages.val === "default" ? " selected" : ""}>Default</option>
                <option value="gl" ${this.settings.languages.val === "gl" ? " selected" : ""}>OpenGL</option>
                <option value="d3d11" ${this.settings.languages.val === "d3d11" ? " selected" : ""}>D3D11</option>
                <option value="d3d9" ${this.settings.languages.val === "d3d9" ? " selected" : ""}>D3D9</option>
                <option value="d3d11on12" ${this.settings.languages.val === "d3d11on12" ? " selected" : ""}>D3D11on12</option>
            </select>
            `
        },
        webgl2Context: {
            id: "webgl2Context",
            title: langPack.webgl2Context,
            type: "chackbox",
            restart: true,
            val: config.get("webgl2Context", true),
            html: () => {return this.generateSettings(this)}
        },
        acceleratedCanvas: {
            id: "acceleratedCanvas",
            title: langPack.acceleratedCanvas,
            type: "checkbox",
            restart: true,
            val: config.get("acceleratedCanvas", true),
            html: () => {return this.generateSettings(this)}
        },
        inProcessGPU: {
            id: "inProcessGPU",
            title: langPack.inProcessGPU,
            type: "checkbox",
            restart: true,
            val: config.get("inProcessGPU", false),
            html: () => {return this.generateSettings(this)}
        }
    }*/

    setConfig(id, value, restart) {
        config.set(id, value)
        if (restart) {
            alert(langPack.restartMsg)
            ipcRenderer.send("RELAUNCH")
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

    setupGameWindow() {
        const injectSettings = () => {
            let settingsWindow = window.windows[0];
            let clientTabIndex = settingsWindow.tabs.push({ name: "LaF", categories: [] })
            window.windows[0].getCSettings = () => {
                let customHTML = ""
                if (clientTabIndex != settingsWindow.tabIndex + 1 && !settingsWindow.settingSearch) return '';
                /*Object.values(this.settings).forEach((k) => {
                    let tmpHTML = "";
                    if (k.type !== "category") {
                        tmpHTML += `<div class='settName' id='${k.id}_div' style='display:${k.hide ? 'none' : 'block'}'>${k.title} `
                    }
                    customHTML += tmpHTML + k.html + "</div>";
                });*/
                customHTML += `
                <a onclick="window.utils.tolset('clearCache')" class="menuLink">${langPack.clearCache}</a> | 
                <a onclick="window.utils.tolset('resetOptions')" class="menuLink">${langPack.resetOption}</a> | 
                <a onclick="window.utils.tolset('restartClient')" class="menuLink">${langPack.restart}</a>
                `;
                return customHTML ? customHTML + "</div>" : "";
            }
        }
        injectSettings();
    }
        tolset(v) {
            switch (v) {
                case "clearCache":
                    if (confirm(langPack.confirmClearCache)) {
                        ipcRenderer.send("CLEAR_CACHE");
                        alert(langPack.clearedCacheAndRestart)
                        ipcRenderer.send("RELAUNCH");
                    }
                    break;
                case "resetOptions":
                    // pass
                    break;
                case "restartClient":
                    ipcRenderer.send("RELAUNCH")
                    break;
            }
        }
}