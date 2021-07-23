const { ipcRenderer } = require('electron');
const store = require('electron-store');

const config = new store();

exports.clientTools = class {
    urlType(url) {
        if (url.startsWith('https://krunker.io/social.html')) return 'hub';
        if (url.startsWith('https://krunker.io/editor.html')) return 'editor';
        if (url.startsWith('https://krunker.io/viewer.html')) return 'viewer';
        if (url.startsWith('https://krunker.io') || url.startsWith('https://comp.krunker.io/?game=') || url.startsWith('https://127.0.0.1:8080')) return 'game';
        return 'external';
    }
};
exports.gameTools = class {
    searchMatches(id, name, cat) {
        const settingsWindow = window.windows[0];
        const query = settingsWindow.settingSearch.toLowerCase() || '';
        return (id.toLowerCase() || '').includes(query) || (name.toLowerCase() || '').includes(query) || (cat.toLowerCase() || '').includes(query);
    }
    setSetting(id, status) {
        config.set(id, status);
    }
    setdSetting(id, status, time) {
        setTimeout(() => {
            config.set(id, status);
        }, time);
    }
    getSetting(id, status) {
        config.get(id, status);
    }
    restartClient() {
        ipcRenderer.invoke('restartClient');
    }
};