const { ipcRenderer, app } = require("electron");

module.exports =  class utils {
    urlType(url) {
        if (url.substr(0, 25) === "https://krunker.io/?game=" || url.substr(0, 30) === "https://comp.krunker.io/?game=") return "game";
        if (url.substr(0, 30) === "https://krunker.io/social.html") return "social";
        if (url.substr(0, 30) === "https://krunker.io/editor.html") return "editor";
    }
}