require('v8-compile-cache');
const { ipcRenderer, app } = require("electron");
const log = require("electron-log")

Object.assign(console, log.functions);

let gameUI = document.getElementById("gameUI");

module.exports =  class utils {
    setupGameWindow () {
        const injectSettings = () => {
            let settingsWindow = window.windows[0];
            let clientTabIndex = settingsWindow.tabs.push({name: "LaF", categories: []})
            window.windows[0].getCSettings = () => {
                let customHTML = ""
                if (clientTabIndex != settingsWindow.tabIndex + 1 && !settingsWindow.settingSearch) {
                    return '';
                }
                customHTML += `
                <a onclick="window.utils.tolset('clearCache')" class="menuLink">キャッシュをクリア</a> | 
                <a onclick="window.utils.tolset('resetOptions')" class="menuLink">オプションのリセット</a> | 
                <a onclick="window.utils.tolset('restartClient')" class="menuLink">再起動</a>
                `;
                return customHTML ? customHTML + "</div>" : "";
            }
        };
        injectSettings();
    }
    tolset (v) {
        switch(v){
            case "clearCache":
                if (confirm("本当にキャッシュをクリアしてもよろしいですか？取り消すことはできません。")) {
                    ipcRenderer.send("CLEAR_CACHE");
                    alert("キャッシュをクリアしました。再起動します。")
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