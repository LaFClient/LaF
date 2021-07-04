const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.invoke('getAppVersion').then((v) => {
        document.getElementById('appVersion').innerText = `LaF v${v}`;
    });
    ipcRenderer.on('status', (e, v) => {
        document.getElementById('status').innerText = v;
    });
    window.openSettings = () => {
        ipcRenderer.send('openSettings');
    };
});