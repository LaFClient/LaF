const { ipcRenderer } = require("electron");

const initIpc = () => {
    ipcRenderer.on("ESC", () => {
        document.exitPointerLock()
    });
};

initIpc();