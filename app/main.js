require("v8-compile-cache");
const { app, BrowserWindow, clipboard, ipcMain, shell, session, dialog } = require("electron");
const localShortcut = require("electron-localshortcut");
const prompt = require("electron-prompt");
const log = require("electron-log");
const store = require("electron-store");
const path = require("path");
const DiscordRPC = require("discord-rpc");
const tools = require("./tools");
const langRes = require("./lang");

const config = new store();

Object.assign(console, log.functions);

let gameWindow = null,
    editorWindow = null,
    hubWindow = null,
    viewerWindow = null;
    splashWindow = null;

let lafTools = new tools();
let langPack = null;

let isRPCEnabled = config.get("enableRPC", true);

const ClientID = "810350252023349248";

console.log(`LaF v${app.getVersion()}\n- electron@${process.versions.electron}\n- nodejs@${process.versions.node}\n- Chromium@${process.versions.chrome}`);

if (!app.requestSingleInstanceLock()) {
	app.quit();
    
};

if (config.get("lang") === "ja_JP") {
    langPack = new langRes.ja_JP();
} else {
    langPack = new langRes.en_US();
}

console.log(`UI Language: ${langPack.lang}`)

const initFlags = () => {
    flagsInfo = `Chromium Options:`
    chromiumFlags = [
        // ["オプション", null("オプション2"), 有効[bool]]
        // FPS解放周り
        ["disable-frame-rate-limit", null, config.get("unlimitedFPS", true)],
        ["disable-gpu-vsync", null, config.get("unlimitedFPS", true)],
        // 描画関係
        ["use-angle", config.get("angleType", "gl"), true],
        ["enable-webgl2-compute-context", null, config.get("webgl2Context", true)],
        ["disable-accelerated-2d-canvas", "true", !config.get("acceleratedCanvas", true)],
        ["in-process-gpu", null, config.get("inProcessGPU", false)],
        ["ignore-gpu-blacklist", null, true],
        // その他
        ["autoplay-policy", "no-user-gesture-required", true]
    ];
    chromiumFlags.forEach((f) => {
        isEnable = f[2] ? "Enable" : "Disable";
        flagsInfo += `\n- ${f[0]}, ${f[1]}: ${isEnable}`;
        if (f[2]) {
            if (f[1] === null) {
                app.commandLine.appendSwitch(f[0]);
            } else {
                app.commandLine.appendSwitch(f[0], f[1]);
            };
        }
    });
    console.log(flagsInfo);
};
initFlags();

console.log(`Discord RPC: ${isRPCEnabled ? "Enabled" : "Disabled"}`)

const initGameWindow = () => {
    gameWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        fullscreen: config.get("Fullscreen", false),
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: false,
            enableRemoteModule: true
        }
    });
    gameWindow.removeMenu();

    initShortcutKeys();

    gameWindow.loadURL("https://krunker.io");

    gameWindow.on("close", () => {
        config.set("isMaximized", gameWindow.isMaximized())
    })

    gameWindow.on("closed", () => {
        gameWindow = null;
        app.quit()
    });

    gameWindow.once("ready-to-show", () => {
        splashWindow.destroy();
        if (config.get("isMaximized", true)) gameWindow.maximize();
        gameWindow.setTitle("LaF");
        gameWindow.show();
    });

    gameWindow.webContents.on("new-window", (event, url) => {
        event.preventDefault();
        switch (lafTools.urlType(url)) {
            case "game":
                gameWindow.loadURL(url);
                break;
            case "hub":
                if (!hubWindow) {
                    initHubWindow(url)
                } else {
                    hubWindow.loadURL(url);
                }
                break;
            case "viewer":
                initViewerWindow(url);
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

    gameWindow.webContents.on("did-finish-load", () => {
        gameWindow.webContents.send("DID-FINISH-LOAD");
        console.log("DID-FINISH-LOAD");
    })
};

const initHubWindow = (url) => {
    console.log("New Window: Krunker Hub")
    hubWindow = new BrowserWindow({
        width: 900,
        height: 600,
        show: false,
        parent: gameWindow,
        webPreferences: {
            contextIsolation: false,
            enableRemoteModule: true
        }
    });
    hubWindow.removeMenu();
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
        switch (lafTools.urlType(url)) {
            case "hub":
                hubWindow.loadURL(url);
                break;
            case "viewer":
                initViewerWindow(url);
                break;
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
    console.log("New Window: Krunker Editor")
    editorWindow = new BrowserWindow({
        width: 900,
        height: 600,
        show: false,
        parent: gameWindow,
        webPreferences: {
            contextIsolation: false,
            enableRemoteModule: true
        }
    });
    editorWindow.removeMenu();
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
        switch (lafTools.urlType(url)) {
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

    editorWindow.webContents.on("will-prevent-unload", (event) => {
        if (!dialog.showMessageBoxSync({
            buttons: [langPack.leavePage, langPack.cancel],
            title: langPack.leavePageTitle,
            message: langPack.confirmLeavePage,
            noLink: true
        })) {
            event.preventDefault();
        }
    });
};

const initViewerWindow = (url) => {
    console.log("New Window: Krunker Viewer")
    viewerWindow = new BrowserWindow({
        width: 900,
        height: 600,
        show: false,
        parent: gameWindow,
        webPreferences: {
            contextIsolation: false,
            enableRemoteModule: true
        }
    });
    viewerWindow.removeMenu();
    viewerWindow.loadURL(url);

    viewerWindow.on("closed", () => {
        viewerWindow = null;
    });

    viewerWindow.once("ready-to-show", () => {
        viewerWindow.setTitle("LaF: Krunker Viewer");
        viewerWindow.show();
    });

    viewerWindow.webContents.on("new-window", (event, url) => {
        event.preventDefault();
        switch (lafTools.urlType(url)) {
            case "hub":
                initHubWindow(url);
                break;
            case "viewer":
                viewerWindow.loadURL(url);
                break;
            case "game":
                viewerWindow.destroy();
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

const initSplashWindow = () => {
    splashWindow = new BrowserWindow({
        width: 640,
        height: 360,
        frame: false,
        resizable: false,
        movable: false,
        center: true,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    splashWindow.removeMenu();
    splashWindow.loadURL(path.join(__dirname, "splash.html"))
    splashWindow.webContents.once("did-finish-load", () => {
        splashWindow.show();
        initAutoUpdater();
    });
};

const initAutoUpdater = () => {
    const { autoUpdater } = require("electron-updater");

    let updateCheck = null;

    autoUpdater.logger = log;

    autoUpdater.on("checking-for-update", (info) => {
        splashWindow.webContents.send("checking-for-update")
        updateCheck = setTimeout(() => {
            splashWindow.webContents.send("update-not-available")
            setTimeout(() => {
                initGameWindow()
            }, 1000)
        }, 15000)
    })
    autoUpdater.on("update-available", (info) => {
        console.log(info)
        if (updateCheck) clearTimeout(updateCheck)
        splashWindow.webContents.send("update-available", info)
    })
    autoUpdater.on("update-not-available", (info) => {
        console.log(info)
        if (updateCheck) clearTimeout(updateCheck)
        splashWindow.webContents.send("update-not-available")
        setTimeout(() => {
            initGameWindow()
        }, 1000)
    })
    autoUpdater.on("error", (err) => {
        console.log(err)
        if (updateCheck) clearTimeout(updateCheck)
        splashWindow.webContents.send("update-error")
        setTimeout(() => {
            initGameWindow()
        }, 1000)
    })
    autoUpdater.on("download-progress", (info) => {
        if (updateCheck) clearTimeout(updateCheck)
        splashWindow.webContents.send("download-progress", info)
    })
    autoUpdater.on("update-downloaded", (info) => {
        if (updateCheck) clearTimeout(updateCheck)
        splashWindow.webContents.send("update-downloaded", info)
        setTimeout(() => {
            autoUpdater.quitAndInstall()
        }, 3000)
    });
    autoUpdater.autoDownload = "download";
    autoUpdater.allowPrerelease = false;
    // autoUpdater.allowDowngrade = true;
    autoUpdater.checkForUpdates();
}

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
            if (lafTools.urlType(copiedText) === "game") gameWindow.loadURL(copiedText)
        }],
        ["Shift+F8", () => {        // URLを入力するフォームの表示
            prompt({
                title: "LaF",
                label: langPack.inputURL,
                value: "",
                inputAttrs: {
                    type: "url"
                },
                type: "input",
                alwaysOnTop: true,
                icon: path.join(__dirname, "img/icon.ico"),
                skipTaskbar: true,
                buttonLabels: {
                    ok: langPack.ok,
                    cancel: langPack.cancel
                },
                width: 400,
                height: 200,
                customStylesheet: path.join(__dirname, "css/prompt.css")
            })
            .then((r) => {
                if(r === null) {
                    console.log("User canceled.");
                } else {
                    if (lafTools.urlType(r) === "game") gameWindow.loadURL(r);
                }
            })
            .catch(console.error);
        }],
        ["F11", () => {
            isFullScreen = gameWindow.isFullScreen();
            config.set("Fullscreen", !isFullScreen)
            gameWindow.setFullScreen(!isFullScreen);
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
    gameWindow.loadURL(arg);
});


ipcMain.on("PROMPT", (e, message, defaultValue) => {
    prompt({
        title: "LaF",
        label: message,
        value: defaultValue,
        inputAttrs: {
            type: "text"
        },
        type: "input",
        alwaysOnTop: true,
        icon: path.join(__dirname, "img/icon.ico"),
        skipTaskbar: true,
        buttonLabels: {
            ok: langPack.ok,
            cancel: langPack.cancel
        },
        width: 400,
        height: 200,
        customStylesheet: path.join(__dirname, "css/prompt.css")
    })
    .then((r) => {
        if(r === null) {
            console.log("User canceled.");
            e.returnValue = null;
        } else {
            console.log(r)
            e.returnValue = r;
        }
    })
    .catch(console.error);
})

ipcMain.on("CLOSE", () => {
    app.quit();
})

ipcMain.on("CLEAR_CACHE", () => {
    session.defaultSession.clearStorageData();
    console.log("CLEARED CACHE.");
});

ipcMain.on("RELAUNCH", () => {
    app.relaunch();
    app.quit();
});

ipcMain.on("GET_VERSION", (e) => {
    e.reply("GET_VERSION", app.getVersion())
});

ipcMain.on("GET_LANG", (e) => {
    e.reply("GET_LANG", config.get("lang"))
});

let isDiscordAlive;

ipcMain.handle("RPC_SEND", (e, d) => {
    if (isDiscordAlive) {
        rpc.setActivity(d);
    }
})

DiscordRPC.register(ClientID);
const rpc = new DiscordRPC.Client({ transport: "ipc" });

rpc.on("ready", () => {
    isDiscordAlive = true;
    console.log("Discord RPC Ready")
})

app.once("ready", () => {
    if (isRPCEnabled && isDiscordAlive) {
        rpc.login({ clientId: ClientID })
        .catch(
            console.error
        );
    }
    initSplashWindow();
});

app.on("quit", async () => {
    if (isRPCEnabled) {
        gameWindow.webContents.send("RPC_STOP");
		await rpc.clearActivity();
		rpc.destroy();
	}
})