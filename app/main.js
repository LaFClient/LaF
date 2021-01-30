const { app, BrowserWindow, getCurrentWindow, clipboard, ipcMain, shell } = require("electron");
const localShortcut= require("electron-localshortcut");
const path = require("path")
const utils = require("./utils.js")

let gameWindow = null,
    editorWindow = null,
    hubWindow = null;
let promptWindow = null;

var lafUtils = new utils();

const initFlags = () => {
    // 将来的には設定で変更可能にする
    app.commandLine.appendSwitch("disable-frame-rate-limit");       // FPS上限解放
    app.commandLine.appendSwitch("disable-gpu-vsync");
    app.commandLine.appendSwitch("enable-zero-copy");
    app.commandLine.appendSwitch('use-angle', 'd3d9');              // 録画できるようにするやつ
    app.commandLine.appendSwitch('enable-webgl2-compute-context');
};

initFlags();

const initGameWindow = () => {
    gameWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    gameWindow.setMenuBarVisibility(false);
    gameWindow.loadURL("https://krunker.io");

    initShortcutKeys();
    
    gameWindow.on("closed", () => {
        gameWindow = null;
    });

    gameWindow.once("ready-to-show", () => {
        gameWindow.setTitle("LaF");
        gameWindow.show();
    });
    gameWindow.webContents.on("new-window", (event, url) => {
        event.preventDefault();
        switch(lafUtils.urlType(url)) {
            case "hub":
                if (!hubWindow) {
                    initHubWindow(url)
                } else {
                    hubWindow.loadURL(url);
                }
                break;
            case "editor":
                if (!editorWindow) {
                    initEditorWindow(url);
                } else {
                    editorWindow.loadURL(url);
                }
                break;
            default:
                shell.openExternal(url);
        };
    });
};

const initHubWindow = (url) => {
    hubWindow = new BrowserWindow({
        width: 900,
        height: 600,
        show: false,
    });
    hubWindow.setMenuBarVisibility(false);
    hubWindow.loadURL(url);

    hubWindow.on("closed", () => {
        hubWindow = null;
    });
    hubWindow.once("ready-to-show", () => {
        hubWindow.setTitle("LaF: Krunker Hub");
        hubWindow.show();
    });
    hubWindow.webContents.on("new-window", (event, url) => {
        event.preventDefault();
        switch(lafUtils.urlType(url)) {
            case "game":
                hubWindow.destroy();
                gameWindow.loadURL(url);
                break;
            case "editor":
                if (!editorWindow) {
                    initEditorWindow(url);
                } else {
                    editorWindow.loadURL(url);
                };
                break;
            default:
                shell.openExternal(url);
        };
    });
};

const initEditorWindow = (url) => {
    editorWindow = new BrowserWindow({
        width: 900,
        height: 600,
        show: false,
    });
    editorWindow.setMenuBarVisibility(false);
    editorWindow.loadURL(url);

    editorWindow.on("closed", () => {
        editorWindow = null;
    });
    editorWindow.once("ready-to-show", () => {
        editorWindow.setTitle("LaF: Krunker Editor");
        editorWindow.show();
    });
    editorWindow.webContents.on("new-window", (event, url) => {
        event.preventDefault();
        switch(lafUtils.urlType(url)) {
            case "hub":
                if (!hubWindow) {
                    initHubWindow(url);
                } else {
                    hubWindow.loadURL(url);
                };
                break;
            case "game":
                editorWindow.destroy();
                gameWindow.loadURL(url);
                break;
            default:
                shell.openExternal(url);
        };
    });
};

const initShortcutKeys = () => {
    const sKeys = [
        ["Esc", () => {             // ゲーム内でのESCキーの有効化
            gameWindow.webContents.send("ESC")
        }], 
        ["F5", () => {              // リ↓ロ↑ードする
            gameWindow.reload()
        }],
        ["F6", () => {              // 別のマッチへ
            gameWindow.loadURL("https://krunker.io")
        }],
        ["F7", () => {              // クリップボードへURLをコピー(実質Inviteボタン)
            clipboard.writeText(gameWindow.webContents.getURL())
        }],
        ["F8", () => {              // クリップボードのURLへアクセス(実質Joinボタン)
            let copiedText = clipboard.readText()
            if (lafUtils.urlType(copiedText) === "game") gameWindow.loadURL(copiedText)
        }],
        ["Shift+F8", () => {        // URLを入力するフォームの表示
            promptWindow = new BrowserWindow({
                width: 300,
                height: 120,
                parent: gameWindow,
                resizable: false,
                movable: false,
                webPreferences: {
                    nodeIntegration: true
                }
            });
            promptWindow.setMenuBarVisibility(false);
            promptWindow.loadURL(path.join(__dirname, "prompt.html"));

        }],
        ["Ctrl+Shift+F1", () => {   // クライアントの再起動
            app.relaunch();
            app.quit();
        }],
        ["Ctrl+F1", () => {         // 開発者ツールの起動
            gameWindow.webContents.openDevTools()
        }]
    ];

    sKeys.forEach((k) => {
            localShortcut.register(gameWindow, k[0], k[1])
        });
};

ipcMain.on("OPEN_LINK", (event, arg) => {
    promptWindow.destroy();
    gameWindow.loadURL(arg);
});

app.on("ready", () => {
    // initFlags();
    initGameWindow();
});