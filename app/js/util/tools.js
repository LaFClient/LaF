const { ipcRenderer } = require('electron');

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
    restartClient() {
        ipcRenderer.invoke('restartClient');
    }
};