const { ipcRenderer } = require("electron");

const initIpc = () => {
    ipcRenderer.on("esc", () => {
        document.exitPointerLock()
    });
};

initIpc();