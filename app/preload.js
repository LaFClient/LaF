const { ipcRenderer } = require("electron");
const { prompt } = require("electron-prompt");

const initIpc = () => {
    ipcRenderer.on("ESC", () => {
        document.exitPointerLock()
    });
    ipcRenderer.on("DIALOG_OPEN", (event, arg) => {
        switch(arg){
            case "URL":
                prompt({
                    title: "Join to the game",
                    label: "URL",
                    type: "input"
                }).then((r) => {
                    if(r !== null ) {
                        if (r.substr(0, 25) === "https://krunker.io/?game=" || r.substr(0, 30) === "https://comp.krunker.io/?game=") ipcRenderer.send("OPEN_LINK", r);
                    };
                }).catch(console.error);
        }
    })
};

initIpc();