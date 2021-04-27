require('v8-compile-cache');
const { ipcRenderer } = require("electron");
const log = require("electron-log");
const store = require("electron-store");
const { fstat } = require('fs');
const path = require("path");
const fs = require("fs");
const langRes = require("./lang");

const config = new store();

if (config.get("lang") === "ja_JP") {
    langPack = new langRes.ja_JP();
} else {
    langPack = new langRes.en_US();
}

Object.assign(console, log.functions);

let gameUI = document.getElementById("gameUI");
let settingsWindow = null;

module.exports = class utils {
    settings = {
        unlimitedFPS: {
            id: "unlimitedFPS",
            title: langPack.unlimitedFPS,
            category: "Video",
            type: "checkbox",
            restart: true,
            val: config.get("unlimitedFPS", true),
            default: true
        },
        angleType: {
            id: "angleType",
            title: langPack.angleType,
            category: "Video",
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
            default: "gl"
        },
        webgl2Context: {
            id: "webgl2Context",
            title: langPack.webgl2Context,
            category: "Video",
            type: "checkbox",
            restart: true,
            val: config.get("webgl2Context", true),
            default: true
        },
        acceleratedCanvas: {
            id: "acceleratedCanvas",
            title: langPack.acceleratedCanvas,
            category: "Video",
            type: "checkbox",
            restart: true,
            val: config.get("acceleratedCanvas", true),
            default: true
        },
        languages: {
            id: "lang",
            title: langPack.languageSetting,
            category: "Customize",
            type: "select",
            restart: true,
            options: {
                ja_JP: "日本語",
                en_US: "English"
            },
            val: config.get("lang", "en_US"),
            default: "en_US"
        },
        enableRPC: {
            id: "enableRPC",
            title: langPack.enableRPC,
            category: "Customize",
            type: "checkbox",
            restart: true,
            val: config.get("showExitBtn", true),
            default: true
        },
        enableAltMng: {
            id: "enableAltMng",
            title: langPack.enableAltMng,
            category: "Customize",
            type: "checkbox",
            restart: true,
            val: config.get("enableAltMng", true),
            default: true
        },
        showExitBtn: {
            id: "showExitBtn",
            title: langPack.showExitBtn,
            category: "Customize",
            type: "select",
            restart: true,
            options: {
                top: langPack.topExitBtn,
                bottom: langPack.bottomExitBtn,
                disable: langPack.disableExitBtn
            },
            val: config.get("showExitBtn", "bottom"),
            default: "bottom"
        },
        enableResourceSwapper: {
            id: "enableResourceSwapper",
            title: langPack.resourceSwapper,
            category: "Customize",
            type: "checkbox",
            restart: true,
            val: config.get("enableResourceSwapper", true),
            default: true
        },
        easyCSSMode: {
            id: "easyCSSMode",
            title: langPack.easyCSS,
            category: "Customize",
            type: "select",
            restart: true,
            options: {
                type1: langPack.easyCSStype1,
                type2: langPack.easyCSStype2,
                //type3: langPack.easyCSStype3,
                custom: langPack.easyCSSCustom,
                disable: langPack.easyCSSDisable
            },
            val: config.get("easyCSSMode", "disable"),
            default: "disable"
        },
        userCSSPath: {
            id: "userCSSPath",
            title: langPack.userCSSPath,
            category: "Customize",
            type: "fileWithEyes",
            restart: true,
            val: config.get("userCSSPath", ""),
            default: ""
        }
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

            let clientTabIndex = settingsWindow.tabs.push({ name: "LaF", categories: [] })
            settingsWindow.getCSettings = () => {
                settingsWindow = window.windows[0];
                let customHTML = ""
                if (clientTabIndex != settingsWindow.tabIndex + 1 && !settingsWindow.settingSearch) {
                    return "";
                }
                let prevCat = null;
                Object.values(this.settings).forEach((k) => {
                    if (settingsWindow.settingSearch && !window.lafUtils.searchMatches(k.id, k.title, k.category)) {
                        return;
                    }
                    let tmpHTML = "";
                    if (k.category != prevCat) {
                        if (prevCat) {
                            tmpHTML += "</div>"
                        }
                        prevCat = k.category;
                        tmpHTML += `<div class='setHed' id='setHed_${btoa(k.category)}' onclick='window.windows[0].collapseFolder(this)'><span class='material-icons plusOrMinus'>keyboard_arrow_down</span> ${k.category}</div><div id='setBod_${btoa(k.category)}'>`;
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

    injectAddAccBtn() {
        // console.log("INSERT ALT")
        let menuWindow = document.getElementById("menuWindow");
        if (menuWindow.firstChild.id === "accName") {
            menuWindow.insertAdjacentHTML("beforeend", "<div class='accountButton' onclick='window.utils.addAltAcc()' style='width:100%'>Add Account</div>");
        }
    }

    showAltMng() {
        let menuWindow = document.getElementById("menuWindow");
        menuWindow.style.overflowY = "auto";
        let tmpHTML = `
        <div id="lafAltTitle" style="font-size:30px;text-align:center;margin:3px;font-weight:700;">Alt Mamager</div>
        <hr style="color:rgba(28, 28, 28, .5);">
        <div class="lafAltMngHolder" style="display:flex;flex-direction:column;justify-content:center;">
        `;
        const generateHTML = () => {
            let altAccounts = JSON.parse(localStorage.getItem("altAccounts"));
            Object.keys(altAccounts).forEach((k) => {
                tmpHTML += `
                <div class="lafAltMngAccName" style="display:flex;justify-content:flex-end;align-items:center;">
                <span style="margin-right:auto">${k}</span>
                <div class="button buttonG lgn" style="width:70px;margin-right:0px;padding-top:3px;padding-bottom:15px;transform:scale(0.75)" onmouseenter="playTick()" onclick="window.utils.loginAcc('${k}')">
                <span class="material-icons" style="vertical-align:bottom;color:#fff;font-size:30px;margin-bottom:-1px;">login</span>
                </div>
                <div class="verticalSeparator" style="height:35px;background:rgba(28, 28, 28, .3);"></div>
                <div class="button buttonY lgn" style="width:70px;margin-right:0px;padding-top:3px;padding-bottom:15px;transform:scale(0.75)" onmouseenter="playTick()" onclick="window.utils.editAcc('${k}')">
                <span class="material-icons" style="vertical-align:bottom;color:#fff;font-size:30px;margin-bottom:-1px;">edit</span>
                </div>
                <div class="button buttonR lgn" style="width:70px;margin-right:0px;padding-top:3px;padding-bottom:15px;transform:scale(0.75)" onmouseenter="playTick()" onclick="window.utils.deleteAcc('${k}')">
                <span class="material-icons" style="vertical-align:bottom;color:#fff;font-size:30px;margin-bottom:-1px;">delete</span>
                </div></div>`
            })
            tmpHTML += "</div>"
        }
        generateHTML();
        if (document.getElementById("windowHolder").style.display === "block") {
            if (document.getElementById("windowHeader").innerText === "Alt Manager") {
                document.getElementById("windowHolder").style.display = "none";
            } else {
                document.getElementById("windowHeader").innerText = "Alt Manager";
                menuWindow.innerHTML = tmpHTML;
            }
        } else {
            document.getElementById("windowHolder").style.display = "block";
            document.getElementById("windowHeader").innerText = "Alt Manager";
            menuWindow.innerHTML = tmpHTML;
        }
    }

    addAltAcc(f=false) {
        let accNameEl = document.getElementById("accName");
        let accPassEl = document.getElementById("accPass");
        let accPassB64 = btoa(accPassEl.value);
        let altAccounts = JSON.parse(localStorage.getItem("altAccounts"));
        if (!altAccounts) {
            altAccounts = {
                [accNameEl.value]: accPassB64
            };
            localStorage.setItem("altAccounts", JSON.stringify(altAccounts));
            accNameEl.value = "";
            accPassEl.value = "";
            document.getElementById("accResp").innerText = langPack.addAccOK;
        } else {
            let existing = false;
            Object.keys(altAccounts).forEach((k) => {
                if (k === accNameEl.value && !f) {
                    document.getElementById("accResp").innerText = langPack.addAccErr;
                    existing = true;
                }
            })
            if (!existing) {
                altAccounts[accNameEl.value] = accPassB64;
                localStorage.setItem("altAccounts", JSON.stringify(altAccounts));
                document.getElementById("accName").value = "";
                document.getElementById("accPass").value = "";
                document.getElementById("accResp").innerText = f ? langPack.saveAccOK : langPack.addAccOK;
            }
        }
    }

    loginAcc(accName) {
        let altAccounts = JSON.parse(localStorage.getItem("altAccounts"));
        window.logoutAcc()
        let accNameEl = document.getElementById("accName");
        let accPassEl = document.getElementById("accPass");
        accNameEl.value = accName;
        accPassEl.value = atob(altAccounts[accName]);
        window.loginAcc();
        document.getElementById('accName').style.display = 'none';
        document.getElementById('accPass').style.display = 'none';
        document.getElementsByClassName('accountButton').forEach((k) => {
            k.style.display = "none";
        })
    }

    editAcc(accName) {
        let menuWindow = document.getElementById("menuWindow");
        menuWindow.innerHTML = `
        <input id="accName" type="text" placeholder="Enter Username" class="accountInput" style="margin-top:0" value="${accName}" readonly="readonly">
        <input id="accPass" type="password" placeholder="Enter New Password" class="accountInput">
        <div id="accResp" style="margin-top:10px;font-size:18px;color:rgba(0,0,0,0.5);">${langPack.edittingAcc.replace("%accName%", accName)}</div>
        <div class="accountButton" onclick="window.utils.addAltAcc(true)" style="width:100%">Save Account</div>
        `
    }

    saveAcc() {
        try {
            this.addAltAcc(true);
        } catch (e) {
            console.error(e);
        }
        setTimeout(document.getElementById("windowHolder").style.display = "none", 3000);
    }

    deleteAcc(accName) {
        if (confirm(langPack.deleteAcc.replace("%accName%", accName))) {
            let altAccounts = JSON.parse(localStorage.getItem("altAccounts"));
            delete altAccounts[accName];
            localStorage.setItem("altAccounts", JSON.stringify(altAccounts));
            this.showAltMng(true);
        }
    }

    tolset(v, opt="") {
        switch (v) {
            case "userCSSPath":
                ipcRenderer.send("userCSSPath")
                ipcRenderer.on("userCSSPath", (e, v) => {
                    let el = document.getElementById("userCSSPath");
                    el.innerHTML = v;
                })
                break;
            case "openSwapper":
                ipcRenderer.send("OPEN_SWAP")
                break;
            case "clearCache":
                if (confirm(langPack.confirmClearCache)) {
                    ipcRenderer.send("CLEAR_CACHE");
                    alert(langPack.clearedCacheAndRestart)
                    ipcRenderer.send("RELAUNCH");
                }
                break;
            case "changeVisibility":
                let el = document.getElementById(`eye_${opt}`);
                if (config.get(`${opt}_visibility`, true)) {
                    el.innerText = "visibility_off"
                    document.getElementById(opt).style.display = "none";
                    config.set(`${opt}_visibility`, false);
                } else {
                    el.innerText = "visibility"
                    document.getElementById(opt).style.display = "";
                    config.set(`${opt}_visibility`, true);
                }
                break;
            case "resetOptions":
                if (confirm(langPack.confirmResetConfig)) {
                    config.clear();
                    alert(langPack.resetConfigAndRestart)
                    ipcRenderer.send("RELAUNCH");
                }
                break;
            case "restartClient":
                ipcRenderer.send("RELAUNCH")
                break;
            case "openInfo":
                ipcRenderer.send("OPEN_INFO")
                break;
        }
    }
}