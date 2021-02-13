module.exports = class tools{
    urlType(url) {
        if (url.substr(0, 30) === "https://krunker.io/social.html") return "hub";
        if (url.substr(0, 30) === "https://krunker.io/editor.html") return "editor";
        if (url.substr(0, 18) === "https://krunker.io" || url.substr(0, 25) === "https://krunker.io/?game=" || url.substr(0, 30) === "https://comp.krunker.io/?game=" || url.substr(0, 22) === "https://127.0.0.1:8080") return "game";
    }
}