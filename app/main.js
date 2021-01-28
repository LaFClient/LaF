const { app, BrowserWindow, getCurrentWindow, clipboard, ipcMain } = require("electron");
const localShortcut= require("electron-localshortcut");
const inputPrompt = require("electron-prompt");
const path = require("path")

let gameWindow = null;
let promptWindow = null;


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
            nodeIntegration: true
        }
    });
    gameWindow.setMenuBarVisibility(false)

    gameWindow.loadURL("https://krunker.io");

    initShortcutKeys();
    
    gameWindow.on("closed", () => {
        gameWindow = null;
    });

    gameWindow.once("ready-to-show", () => {
        gameWindow.setTitle("LaF");
        gameWindow.show();
    });
};

const initShortcutKeys = () => {
    const sKeys = [
        ["Esc", () => {             // ゲーム内でのESCキーの有効化
            gameWindow.webContents.send("ESC")
            console.log("ESC pressed.");
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
            let copiedText = clipboard.readText();
            if (copiedText.substr(0, 25) === "https://krunker.io/?game=" || copiedText.substr(0, 30) === "https://comp.krunker.io/?game=") gameWindow.loadURL(copiedText);
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