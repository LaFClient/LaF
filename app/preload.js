const { remote, ipcRenderer } = require("electron");

const initIpc = () => {
    ipcRenderer.on("esc", () => {
        document.exitPointerLock()
    });
};

initIpc();