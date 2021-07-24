require('v8-compile-cache');
const path = require('path');
const { app, BrowserWindow, ipcMain, protocol, shell, ipcRenderer, dialog } = require('electron');
const store = require('electron-store');
const log = require('electron-log');
const prompt = require('electron-prompt');
const { autoUpdater } = require('electron-updater');
// const appConfig = require('./config/main.json');

const osType = process.platform;
const config = new store();

const devMode = config.get('devmode');

log.info(`LaF v${app.getVersion()}${devMode ? '@DEV' : ''}\n- electron@${process.versions.electron}\n- nodejs@${process.versions.node}\n- Chromium@${process.versions.chrome}`);

const wm = require('./js/util/wm');
const tools = require('./js/util/tools');

let splashWindow = null;
let gameWindow = null;

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
        flagsInfo += `\n- ${f[0]}, ${f[1]}: ${isEnable}`;
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
        autoUpdater.on('error', (e) => {
            log.error(e);
            splashWindow.webContents.send('status', langPack.updater.error + e.name);
            setTimeout(() => {
                launchGame();
                return;
            }, 1000);
            return;
        });
        autoUpdater.on('checking-for-update', () => { splashWindow.send('status', langPack.updater.checking); });
        autoUpdater.on('update-available', (i) => {
            log.info(i);
            splashWindow.webContents.send('status', langPack.update.available + i.version)
            .then(() => {
                setTimeout(() => {
                    if (updateMode === 'skip') {
                        splashWindow.webContents.send('status', langPack.updater.skipped);
                        setTimeout(() => {
                            launchGame();
                            return;
                        }, 1000);
                    }
                }, 1000);
            });
        });
        autoUpdater.on('update-not-available', (i) => {
            log.info(i);
            splashWindow.webContents.send('status', langPack.updater.uptodate);
            setTimeout(() => {
                launchGame();
                return;
            }, 1000);
        });
        autoUpdater.on('download-progress', (i) => {
            splashWindow.webContents.send('status', langPack.updater.progress.format(Math.floor(i.percent), Math.floor(i.bytesPerSecond / 1000)));
        });
        autoUpdater.on('update-downloaded', () => {
            splashWindow.webContents.send('status', langPack.updater.downloaded);
            setTimeout(() => {
                autoUpdater.quitAndInstall();
            }, 1500);
        });
        autoUpdater.autoDownload = updateMode === 'download';
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


/* イベントハンドラー */

// SplashWindow
ipcMain.handle('getAppVersion', async () => {
    const version = await app.getVersion();
    return version;
});

ipcMain.on('openSettings', () => {
    // Do something
});

// GameWindow
ipcMain.handle('restartClient', () => {
    app.relaunch();
    app.quit();
});

ipcMain.handle('showDialog', (e, accName) => {
    const answer = dialog.showMessageBoxSync(gameWindow, {
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

ipcMain.on('exitClient', () => {
    app.exit();
});

// App
app.on('ready', () => {
    protocol.registerFileProtocol('laf', (request, callback) => callback(decodeURI(request.url.replace(/^laf:/, ''))));
    initSplashWindow();
});