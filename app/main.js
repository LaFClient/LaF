require("v8-compile-cache");
const { app, BrowserWindow, clipboard, ipcMain, shell, session, dialog, protocol } = require("electron");
const localShortcut = require("electron-localshortcut");
const prompt = require("electron-prompt");
const log = require("electron-log");
const store = require("electron-store");
const path = require("path");
const fs = require("fs");
const DiscordRPC = require("discord-rpc");
const tools = require("./js/tools");
const langRes = require("./js/lang");
// const { NONAME } = require("dns");

const config = new store();

Object.assign(console, log.functions);

let gameWindow = null,
    splashWindow = null,
    infoWindow = null;

let windowManage = {
    "hub": null,
    "editor": null,
    "viewer": null
};

let cssPath = {
    type1: "css/EasyCSS/type1.css",
    type2: "css/EasyCSS/type2.css",
    type3: "css/EasyCSS/type3.css",
    custom: config.get("userCSSPath", "")
};

let swapPath = path.join(app.getPath("documents"), "/LaFSwap");

let lafTools = new tools();
let langPack = null;

let isRPCEnabled = config.get("enableRPC", true);
let isSwapperEnabled = config.get("enableResourceSwapper", true);
let ezCSSMode = config.get("easyCSSMode", "disable");
let isEzCSSEnabled = ezCSSMode !== "disable";

const ClientID = "810350252023349248";

console.log(`LaF v${app.getVersion()}\n- electron@${process.versions.electron}\n- nodejs@${process.versions.node}\n- Chromium@${process.versions.chrome}`);

if (!app.requestSingleInstanceLock()) {
    console.error("Other process(es) are already existing. Quit. If you can't see the window, please kill all task(s).")
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
        ["in-process-gpu", null, true],
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

if (!fs.existsSync(swapPath)) {
    fs.mkdir(swapPath, { recursive: true }, e => { })
}

protocol.registerSchemesAsPrivileged([{
    scheme: 'laf',
    privileges: { secure: true, corsEnabled: true }
}]);

const initResourceSwapper = (win) => {
    let urls = [];
    const recursiveFolder = (win, prefix = "") => {
        try {
            fs.readdirSync(path.join(swapPath, prefix), { withFileTypes: true }).forEach(cPath => {
                if (cPath.isDirectory()) {
                    recursiveFolder(win, `${prefix}/${cPath.name}`);
                } else {
                    let name = `${prefix}/${cPath.name}`;
                    let isAsset = /^\/(models|textures)($|\/)/.test(name);
                    if (isAsset) {
                        urls.push(`*://assets.krunker.io${name}`, `*://assets.krunker.io${name}?*`);
                    } else {
                        urls.push(`*://krunker.io${name}`, `*://krunker.io${name}?*`, `*://comp.krunker.io${name}`, `*://comp.krunker.io${name}?*`);
                    }
                }
            })
        } catch (e) {
            console.error("Error occurred on Resource Swapper.");
            console.error(e);
        }
    }

    if (isSwapperEnabled) {
        recursiveFolder(win);
    } else if (isEzCSSEnabled && !isSwapperEnabled) {
        urls.push(`*://krunker.io/css/main_custom.css`, `*://krunker.io/css/main_custom.css?*`, `*://comp.krunker.io/css/main_custom.css`, `*://comp.krunker.io/css/main_custom.css?*`)
    }
    if (!urls.includes("*://krunker.io/css/main_custom.css")) {
        urls.push(`*://krunker.io/css/main_custom.css`, `*://krunker.io/css/main_custom.css?*`, `*://comp.krunker.io/css/main_custom.css`, `*://comp.krunker.io/css/main_custom.css?*`)
    }

    if (urls.length) {
        win.webContents.session.webRequest.onBeforeRequest({ urls: urls }, (details, callback) => callback({
            redirectURL: isEzCSSEnabled && new URL(details.url).pathname === "/css/main_custom.css" ? (ezCSSMode === "custom" ? "laf:/" + cssPath["custom"] : "laf:/" + path.join(__dirname, cssPath[ezCSSMode])) : "laf:/" + path.join(swapPath, new URL(details.url).pathname)
        }));
    }
}

const initGameWindow = () => {
    gameWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        title: "LaF",
        fullscreen: config.get("Fullscreen", false),
        webPreferences: {
            preload: path.join(__dirname, "js/preload.js"),
            contextIsolation: false
        }
    });
    gameWindow.removeMenu();

    initShortcutKeys();
    initResourceSwapper(gameWindow);

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
        if (config.get("isFirstLaunch", true)) {
            initInfoWindow();
            config.set("isFirstLaunch", false);
        }
        if (config.get("isMaximized", true)) gameWindow.maximize();
        gameWindow.show();
    });

    gameWindow.webContents.on("new-window", (event, url) => {
        event.preventDefault();
        switch (lafTools.urlType(url)) {
            case "game":
                gameWindow.loadURL(url);
                break;
            case "hub":
                if (!windowManage.hub) {
                    windowManage.hub = initNewWindow(url, "Krunker Hub");
                    windowManage.hub.on("closed", () => windowManage.hub = null)
                } else {
                    windowManage.hub.loadURL(url);
                }
                break;
            case "viewer":
                if (!windowManage.viewer) {
                    windowManage.viewer = initNewWindow(url, "Krunker Viewer");
                    windowManage.viewer.on("closed", () => windowManage.viewer = null)
                } else {
                    windowManage.viewer.loadURL(url);
                }
                break;
            case "editor":
                if (!windowManage.editor) {
                    windowManage.editor = initNewWindow(url, "Krunker Editor");
                    windowManage.editor.on("closed", () => windowManage.editor = null)
                } else {
                    windowManage.editor.loadURL(url);
                }
                break;
            default:
                shell.openExternal(url);
        };
    });

    gameWindow.on('page-title-updated', (e) => {
        e.preventDefault();
    });

    gameWindow.webContents.on("did-finish-load", () => {
        gameWindow.webContents.send("DID-FINISH-LOAD");
        console.log("DID-FINISH-LOAD");
    })
};

const initNewWindow = (url, title) => {
    let win = new BrowserWindow({
        width: 1350,
        height: 900,
        show: false,
        parent: gameWindow,
        title: `LaF: ${title}`,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    win.removeMenu();

    if (isSwapperEnabled) initResourceSwapper(win)

    win.loadURL(url);

    win.once("ready-to-show", () => {
        win.show();
    });

    win.webContents.on("new-window", (event, url) => {
        event.preventDefault();
        switch (lafTools.urlType(url)) {
            case "game":
                gameWindow.loadURL(url);
                break;
            case "hub":
                if (!windowManage.hub) {
                    windowManage.hub = initNewWindow(url, "Krunker Hub");
                    windowManage.hub.on("closed", () => windowManage.hub = null)
                } else {
                    windowManage.hub.loadURL(url);
                }
                break;
            case "viewer":
                if (!windowManage.viewer) {
                    windowManage.viewer = initNewWindow(url, "Krunker Viewer");
                    windowManage.viewer.on("closed", () => windowManage.viewer = null)
                } else {
                    windowManage.viewer.loadURL(url);
                }
                break;
            case "editor":
                if (!windowManage.editor) {
                    windowManage.editor = initNewWindow(url, "Krunker Editor");
                    windowManage.editor.on("closed", () => windowManage.editor = null)
                } else {
                    windowManage.editor.loadURL(url);
                }
                break;
            default:
                shell.openExternal(url);
        };
    });

    win.on('page-title-updated', (e) => {
        e.preventDefault();
    });

    win.webContents.on("will-prevent-unload", (event) => {
        if (!dialog.showMessageBoxSync({
            buttons: [langPack.leavePage, langPack.cancel],
            title: langPack.leavePageTitle,
            message: langPack.confirmLeavePage,
            noLink: true
        })) {
            event.preventDefault();
        }
    });

    const sKeys = [
        ["Esc", () => {             // ウィンドウ内でのESCキーの有効化
            win.webContents.send("ESC")
        }],
        ["F5", () => {              // リ↓ロ↑ードする
            win.reload()
        }],
        ["F7", () => {              // クリップボードへURLをコピー
            clipboard.writeText(win.webContents.getURL())
        }],
        [["Ctrl+F1", "F12"], () => {         // 開発者ツールの起動
            win.webContents.openDevTools()
        }]
    ];
    sKeys.forEach((k) => {
        localShortcut.register(win, k[0], k[1])
    });

    return win;
};

const initInfoWindow = () => {
    infoWindow = new BrowserWindow({
        width: 1350,
        height: 900,
        show: false,
        resizable: false,
        maximizable: false,
        parent: gameWindow,
        title: "LaF: Information",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    infoWindow.removeMenu();

    infoWindow.loadURL(path.join(__dirname, "html/info.html"));

    infoWindow.on("close", () => {
        infoWindow = null;
    })

    infoWindow.once("ready-to-show", () => {
        infoWindow.show();
    });

};

const initSplashWindow = () => {
    splashWindow = new BrowserWindow({
        width: 640,
        height: 320,
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
    splashWindow.loadURL(path.join(__dirname, "html/splash.html"))
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
                    if (r === null) {
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
        [["Ctrl+F1", "F12"], () => {         // 開発者ツールの起動
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

ipcMain.on("OPEN_SWAP", (e) => {
    shell.showItemInFolder(swapPath);
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
            if (r === null) {
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

ipcMain.on("OPEN_INFO", () => {
    initInfoWindow();
})

ipcMain.on("GET_VERSION", (e) => {
    e.reply("GET_VERSION", app.getVersion())
});

ipcMain.on("GET_LANG", (e) => {
    e.reply("GET_LANG", config.get("lang"))
});

ipcMain.on("setCustomCSS", (e) => {
    let cssPath = dialog.showOpenDialogSync(null, {
        properties: ['openFile'],
        title: "LaF: CSS File Loader",
        defaultPath: '.',
        filters: [
            { name: 'CSS File', extensions: ['txt', 'css'] }
        ]
    });
    if (cssPath) {
        config.set("userCSSPath", cssPath);
        e.reply("setCustomCSS", cssPath);
    };
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
    protocol.registerFileProtocol('laf', (request, callback) => callback(decodeURI(request.url.replace(/^laf:/, ''))));
    if (isRPCEnabled) {
        let loggedIn;
        try {
            rpc.login({ clientId: ClientID });
            loggedIn = true;
        } catch (e) {
            console.error(e);
        }
        if (loggedIn) {
            console.log("Discord Login OK")
        }
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

/*
- Special Thanks -
idkr from Mixaz: https://github.com/Mixaz017/idkr
本ソフトウェア(以下、LaFとする)ではMITライセンスに従ってidkrの一部のソースコードを流用しています。
ただし、LaFを使用したことによる損害に対する責任はMixaz様には一切ございませんことをご了承ください。
*/