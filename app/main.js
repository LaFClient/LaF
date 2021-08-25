require('v8-compile-cache');
const path = require('path');
const { app, BrowserWindow, ipcMain, protocol, shell, ipcRenderer, dialog, session } = require('electron');
const store = require('electron-store');
const log = require('electron-log');
const prompt = require('electron-prompt');
const { autoUpdater } = require('electron-updater');
const DiscordRPC = require('discord-rpc');
const os = require('os');
// const appConfig = require('./config/main.json');

const osType = process.platform;
const config = new store();

const devMode = config.get('devmode');

log.info(`LaF v${app.getVersion()}${devMode ? '@DEV' : ''}\n- electron@${process.versions.electron}\n- nodejs@${process.versions.node}\n- Chromium@${process.versions.chrome}`);

const wm = require('./js/util/wm');
const tools = require('./js/util/tools');

const ClientID = '810350252023349248';

let splashWindow = null;
let gameWindow = null;

const isRPCEnabled = config.get('enableRPC', true);
const isSwapperEnabled = config.get('enableResourceSwapper', true);

/* 初期化ブロック */
if (!app.requestSingleInstanceLock()) {
    log.error('Other process(es) are already existing. Quit. If you can\'t see the window, please kill all task(s).');
    app.quit();
}

protocol.registerSchemesAsPrivileged([{
    scheme: 'laf',
    privileges: { secure: true, corsEnabled: true },
}]);

const langPack = require(config.get('lang', 'en_US') === 'ja_JP' ? './lang/ja_JP' : './lang/en_US');

const initFlags = () => {
    let flagsInfo = 'Chromium Options:';
    const chromiumFlags = [
        // ['オプション', null('オプション2'), 有効[bool]]
        // FPS解放周り
        ['disable-frame-rate-limit', null, config.get('unlimitedFPS', true)],
        ['disable-gpu-vsync', null, config.get('unlimitedFPS', true)],
        // 描画関係
        ['use-angle', config.get('angleType', 'gl'), true],
        ['enable-webgl2-compute-context', null, config.get('webgl2Context', true)],
        ['disable-accelerated-2d-canvas', 'true', !config.get('acceleratedCanvas', true)],
        // ウィンドウキャプチャに必要な設定(win32でのみ動作する。frznさんに感謝)
        ['in-process-gpu', null, osType === 'win32' ? true : false],
        // その他
        ['autoplay-policy', 'no-user-gesture-required', true],
    ];
    chromiumFlags.forEach((f) => {
        const isEnable = f[2] ? 'Enable' : 'Disable';
        flagsInfo += `\n    - ${f[0]}, ${f[1]}: ${isEnable}`;
        if (f[2]) {
            if (f[1] === null) {
                app.commandLine.appendSwitch(f[0]);
            }
            else {
                app.commandLine.appendSwitch(f[0], f[1]);
            }
        }
    });
    log.info(flagsInfo);
};
initFlags();

const launchGame = () => {
    gameWindow = wm.launchGame();
    gameWindow.once('ready-to-show', () => {
        splashWindow.destroy();
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
        alwaysOnTop: true,
        webPreferences: {
            contextIsolation: false,
            preload: path.join(__dirname, 'js/preload/splash.js'),
        },
    });
    const initAutoUpdater = async (updateMode) => {
        autoUpdater.logger = log;
        let updateCheck = null;
        autoUpdater.logger = log;
        autoUpdater.on('checking-for-update', (i) => {
            splashWindow.webContents.send('status', langPack.updater.checking);
            updateCheck = setTimeout(() => {
                splashWindow.webContents.send('status', langPack.updater.error);
                setTimeout(() => {
                    launchGame();
                }, 1000);
            }, 15000);
        });
        autoUpdater.on('update-available', (i) => {
            log.info(i);
            if (updateCheck) clearTimeout(updateCheck);
            splashWindow.webContents.send('status', langPack.updater.available + i.version);
        });
        autoUpdater.on('update-not-available', (i) => {
            log.info(i);
            if (updateCheck) clearTimeout(updateCheck);
            splashWindow.webContents.send('status', langPack.updater.uptodate);
            setTimeout(() => {
                launchGame();
            }, 1000);
        });
        autoUpdater.on('error', (e) => {
            log.info(e);
            if (updateCheck) clearTimeout(updateCheck);
            splashWindow.webContents.send('status', langPack.updater.error + e.name);
            setTimeout(() => {
                launchGame();
            }, 1000);
        });
        autoUpdater.on('download-progress', (i) => {
            if (updateCheck) clearTimeout(updateCheck);
            splashWindow.webContents.send('status', langPack.updater.progress.replace('{0}', Math.floor(i.percent)).replace('{1}', Math.floor(i.bytesPerSecond / 1000)));
        });
        autoUpdater.on('update-downloaded', (i) => {
            if (updateCheck) clearTimeout(updateCheck);
            splashWindow.webContents.send('status', langPack.updater.downloaded);
            setTimeout(() => {
                autoUpdater.quitAndInstall();
            }, 3000);
        });
        autoUpdater.autoDownload = 'download';
        autoUpdater.allowPrerelease = devMode;
        autoUpdater.checkForUpdates();
    };
    splashWindow.removeMenu();
    splashWindow.loadURL(path.join(__dirname, 'html/splashWindow.html'));
    splashWindow.webContents.once('did-finish-load', () => {
        splashWindow.show();
        initAutoUpdater();
    });
};

DiscordRPC.register(ClientID);
const rpc = new DiscordRPC.Client({ transport: 'ipc' });

/* イベントハンドラー */
// DiscordRPC
let isDiscordAlive;
rpc.on('ready', () => {
    isDiscordAlive = true;
    log.info('Discord RPC Ready');
});

ipcMain.handle('RPC_SEND', (e, d) => {
    if (isDiscordAlive) {
        rpc.setActivity(d);
    }
});

// SplashWindow
ipcMain.handle('getAppVersion', async () => {
    const version = await app.getVersion();
    return version;
});

// GameWindow
ipcMain.handle('clearUserData', () => {
    session.defaultSession.clearStorageData();
    log.info('Cleared userdata.');
});

ipcMain.handle('openSwapper', () => {
    shell.showItemInFolder(path.join(app.getPath('documents'), '/LaFSwap'));
});

ipcMain.handle('restartClient', () => {
    app.relaunch();
    app.quit();
});

ipcMain.handle('openInfo', () => {
    shell.openExternal('https://hiro527.github.io/LaF');
});

ipcMain.handle('showDialog', (e, accName) => {
    const answer = dialog.showMessageBox(gameWindow, {
        title: 'LaF',
        message: langPack.altManager.deleteAcc.confirm.replace('%accName%', accName),
        buttons: [langPack.dialog.ok, langPack.dialog.cancel],
        cancelId: -1,
    });
    return answer;
});

ipcMain.on('showPrompt', (e, message, defaultValue) => {
    prompt({
        title: 'LaF',
        label: message,
        value: defaultValue,
        inputAttrs: {
            type: 'text',
        },
        type: 'input',
        alwaysOnTop: true,
        icon: path.join(__dirname, 'img/icon.ico'),
        skipTaskbar: true,
        buttonLabels: {
            ok: langPack.dialog.ok,
            cancel: langPack.dialog.cancel,
        },
        width: 400,
        height: 200,
        customStylesheet: path.join(__dirname, 'css/prompt.css'),
    })
        .then((r) => {
            if (r === null) {
                log.info('showPrompt: User Cancelled.');
                e.returnValue = null;
            }
            else {
                log.info(r);
                e.returnValue = r;
            }
        })
        .catch(console.error);
});

ipcMain.handle('openFileDialog', (e) => {
    const cssPath = dialog.showOpenDialogSync(null, {
        properties: ['openFile'],
        title: 'LaF: CSS File Loader',
        defaultPath: '.',
        filters: [
            { name: 'CSS File', extensions: ['txt', 'css'] },
        ],
    });
    if (cssPath) {
        config.set('userCSSPath', cssPath[0]);
        e.reply('userCSSPath', cssPath);
    }
});

ipcMain.on('exitClient', () => {
    app.exit();
});

ipcMain.handle('getPCInfo', () => {
    
});

// App
app.on('ready', () => {
    protocol.registerFileProtocol('laf', (request, callback) => callback(decodeURI(request.url.replace(/^laf:/, ''))));
    if (isRPCEnabled) {
        let loggedIn;
        try {
            rpc.login({ clientId: ClientID });
            loggedIn = true;
        }
        catch (e) {
            console.error(e);
        }
        if (loggedIn) {
            log.info('Discord Login OK');
        }
    }
    initSplashWindow();
});