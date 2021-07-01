require('v8-compile-cache');
const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const store = require('electron-store');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');
// const appConfig = require('./config/main.json');
const osType = process.platform;
const config = new store();

const devMode = config.get('devmode');

/* 初期化ブロック */
log.info(`LaF v${app.getVersion()}${devMode ? '@DEV' : ''}\n- electron@${process.versions.electron}\n- nodejs@${process.versions.node}\n- Chromium@${process.versions.chrome}`);
if (!app.requestSingleInstanceLock()) {
    log.error('Other process(es) are already existing. Quit. If you can\'t see the window, please kill all task(s).');
    app.quit();
}
const langPack = require(config.get('lang') === 'ja_JP' ? './lang/ja_JP' : 'en_US');
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
const initSplashWindow = () => {
    const splashWindow = new BrowserWindow({
        width: 640,
        height: 320,
        frame: false,
        resizable: false,
        movable: false,
        center: true,
        show: false,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'js/preload/splashWindow.js'),
        },
    });
    const initAutoUpdater = async (updateMode) => {
        autoUpdater.logger = log;
        autoUpdater.on('error', (e) => {
            log.error(e);
            splashWindow.webContents.send('status', langPack.updater.error + e.name);
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
                        return;
                    }
                }, 1000);
            });
        });
        autoUpdater.on('update-not-available', (i) => {
            log.info(i);
            splashWindow.webContents.send('status', langPack.updater.uptodate);
            return;
        });
        autoUpdater.on('download-progress', (i) => {
            splashWindow.webContents.send('status', langPack.updater.progress.format(Math.floor(i.percent), Math.floor(i.bytesPerSecond / 1000)));
        });
        autoUpdater.on('update-downloaded', () => {
            splashWindow.webContents.send('status', langPack.updater.downloaded);
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

// App
app.on('ready', () => {
    initSplashWindow();
});