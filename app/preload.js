const { ipcRenderer } = require("electron");

gameUI = document.getElementById("gameUI");

const initIpc = () => {
    ipcRenderer.on("ESC", () => {
        document.exitPointerLock()
    });
};
initIpc();