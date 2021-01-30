const { ipcRenderer } = require("electron");

gameUI = document.getElementById("gameUI");

function initIpc() {
    ipcRenderer.on("ESC", () => {
        document.exitPointerLock();
    });
}
initIpc();