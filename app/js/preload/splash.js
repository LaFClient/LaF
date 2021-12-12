const { ipcRenderer } = require('electron');

const CSSs = [
    '../css/keyframes/splash-rolling1.css',
    '../css/keyframes/splash-drop1.css',
];

window.onload = () => {
    const el = document.createElement('link');
    el.setAttribute('rel', 'stylesheet');
    el.setAttribute('href', CSSs[Math.round(Math.random() * (CSSs.length - 1))]);
    document.getElementsByTagName('head')[0].appendChild(el);
};

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
    window.closeApp = () => {
        ipcRenderer.send('exitClient');
    };
});