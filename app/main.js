const { app, BrowserWindow, getCurrentWindow, clipboard, ipcMain } = require("electron");
const localShortcut= require("electron-localshortcut");
const inputPrompt = require("electron-prompt");
const path = require("path")

let gameWindow = null;

const initFlags = () => {
    app.commandLine.appendSwitch("disable-frame-rate-limit"); // 将来的には設定で変更可能にする
    app.commandLine.appendSwitch("enable-zero-copy")
};

const initGameWindow = () => {
    gameWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true
        }
    });
    gameWindow.setMenuBarVisibility(false)

    gameWindow.loadURL("https://krunker.io");

    initShortcutKeys();
    
    gameWindow.on("closed", () => {
        gameWindow = null;
    });
};

const initShortcutKeys = () => {
    const sKeys = [
        ["Esc", () => {             // ゲーム内でのESCキーの有効化
            gameWindow.webContents.send("esc")
            console.log("ESC pressed.");
        }], 
        ["F5", () => {              // リ↓ロ↑ードする
            getCurrentWindow.reload()
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

app.on("ready", () => {
    initFlags();
    initGameWindow();
});