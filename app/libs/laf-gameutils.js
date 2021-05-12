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
}