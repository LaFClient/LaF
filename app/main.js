require('v8-compile-cache');
const path = require('path');
const { app, BrowserWindow, ipcMain, protocol, shell, dialog, session, clipboard } = require('electron');
const store = require('electron-store');
const log = require('electron-log');
const prompt = require('electron-prompt');
const { autoUpdater } = require('electron-updater');
const DiscordRPC = require('discord-rpc');
const os = require('os');
const fetch = require('node-fetch');
const tmi = require('tmi.js');
// const appConfig = require('./config/main.json');

const platformType = process.platform;
const config = new store();

const devMode = config.get('devmode');

log.info(`LaF v${app.getVersion()}${devMode ? '@DEV' : ''}\n    - electron@${process.versions.electron}\n    - nodejs@${process.versions.node}\n    - Chromium@${process.versions.chrome}`);

const wm = require('./js/util/wm');
const tools = require('./js/util/tools');

const ClientID = '810350252023349248';
let twitchToken = config.get('twitchToken', null);
let twitchAcc = config.get('twitchAcc', null);

let splashWindow = null;
let gameWindow = null;

const isRPCEnabled = config.get('enableRPC', true);
const isSwapperEnabled = config.get('enableResourceSwapper', true);

/* 初期化ブロック */
delete require('electron').nativeImage.createThumbnailFromPath;
if (!app.requestSingleInstanceLock()) {
    log.error('Other process(es) are already existing. Quit. If you can\'t see the window, please kill all task(s).');
    app.exit();
}

protocol.registerSchemesAsPrivileged([{
    scheme: 'laf',
    privileges: { secure: true, corsEnabled: true },
}]);

const langPack = require(config.get('lang', 'en_US') === 'ja_JP' ? './lang/ja_JP' : './lang/en_US');

log.info(`UI Language: ${config.get('lang')}`);

const initFlags = () => {
    let flagsInfo = 'Chromium Options:';
    const chromiumFlags = [
        // ['オプション', null('オプション2'), 有効[bool]]
        // FPS解放周り
        ['disable-frame-rate-limit', null, config.get('unlimitedFPS', true)],
        ['disable-gpu-vsync', null, config.get('unlimitedFPS', true)],
        // 描画関係
        ['use-angle', config.get('angleType', 'default'), true],
        ['enable-webgl2-compute-context', null, config.get('webgl2Context', true)],
        ['disable-accelerated-2d-canvas', 'true', !config.get('acceleratedCanvas', true)],
        // ウィンドウキャプチャに必要な設定(win32でのみ動作する。frznさんに感謝)
        ['in-process-gpu', null, platformType === 'win32' ? true : false],
        // その他
        ['autoplay-policy', 'no-user-gesture-required', config.get('autoPlay', true)],
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
        twitchLogin();
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
            log.error(e);
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

const initTwitchChat = () => {
    if (!config.get('twitchAcc', null)) return;
    log.info('Twitch Chatbot: Initializing...');
    const tclient = new tmi.Client({
        options: { debug: true },
        logger: log,
        identity: {
            username: config.get('twitchAcc'),
            password: `oauth:${twitchToken}`,
        },
        channels: [
            config.get('twitchAcc'),
        ],
    });
    tclient.connect().catch(log.error);
    tclient.on('message', (channel, tags, message, self) => {
        if (self || !config.get('enableLinkCmd', false) || !config.get('isUserLive', false)) return;
        if (message.toLocaleLowerCase() === '!link') {
            console.log('link');
            ipcMain.handleOnce('sendLink', (e, v) => {
                console.log(v);
                tclient.say(channel, `@${tags.username} ${v}`);
            });
            gameWindow.webContents.send('getLink');
        }
    });
};

const getUserIsLive = () => {
    const method = 'GET';
    const headers = {
        'Authorization': `Bearer ${twitchToken}`,
        'Client-ID': 'q9pn15rtycv6l9waebyyw99d70mh00',
    };
    fetch(`https://api.twitch.tv/helix/streams?user_login=${config.get('twitchAcc', null)}`, { method, headers })
        .then(res => res.json())
        .then(res => {
            if (res.data.length === 0) return;
            if (res.data[0].type === 'live') {
                config.set('isUserLive', true);
            }
            else {
                config.set('isUserLive', false);
            }
        })
        .catch(log.error);
};

const twitchLogin = () => {
    if (!twitchToken) return;
    const method = 'GET';
    const headers = {
        'Authorization': `Bearer ${twitchToken}`,
        'Client-ID': 'q9pn15rtycv6l9waebyyw99d70mh00',
    };
    fetch('https://api.twitch.tv/helix/users', { method, headers })
        .then(res => res.json())
        .then(res => {
            log.info(`Twitch Login: ${res.data[0].login}`);
            config.set('twitchAcc', res.data[0].login);
            twitchAcc = res.data[0].login;
            config.set('twitchAccId', res.data[0].id);
            gameWindow.webContents.send('twitchEvent', 'loggedIn');
            config.set('twitchError', false);
            setInterval(getUserIsLive, 10000);
            initTwitchChat();
        })
        .catch(err => {
            log.error('Twitch Login: Error');
            log.error(err);
            gameWindow.webContents.send('twitchEvent', 'loginErr');
            config.set('twitchError', true);
        });
};

DiscordRPC.register(ClientID);
const rpc = new DiscordRPC.Client({ transport: 'ipc' });

/* イベントハンドラー */
// DiscordRPC`
rpc.on('ready', () => {
    log.info('Discord RPC Ready');
});

ipcMain.handle('RPC_SEND', (e, d) => {
    if (rpc.user) {
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
    app.exit();
});

ipcMain.handle('openInfo', () => {
    shell.openExternal('https://hiro527.github.io/LaF');
});

ipcMain.handle('showDialog', async (e, accName) => {
    const answer = await dialog.showMessageBox(gameWindow, {
        title: 'LaF',
        message: langPack.altManager.deleteAcc.confirm.replace('%accName%', accName),
        buttons: [langPack.dialog.ok, langPack.dialog.cancel],
    });
    return answer.response;
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
    if (cssPath !== undefined) {
        config.set('userCSSPath', cssPath[0]);
    }
    return cssPath;
});

ipcMain.on('exitClient', () => {
    app.exit();
});

ipcMain.on('copyPCInfo', () => {
    const versions = `LaF v${app.getVersion()}${devMode ? '@DEV' : ''}\n    - electron@${process.versions.electron}\n    - nodejs@${process.versions.node}\n    - Chromium@${process.versions.chrome}`;
    const uiLang = `UI Language: ${config.get('lang')}`;
    let flagsInfo = 'Chromium Options:';
    const chromiumFlags = [
        // ['オプション', null('オプション2'), 有効[bool]]
        // FPS解放周り
        ['disable-frame-rate-limit', null, config.get('unlimitedFPS', true)],
        ['disable-gpu-vsync', null, config.get('unlimitedFPS', true)],
        // 描画関係
        ['use-angle', config.get('angleType', 'default'), true],
        ['enable-webgl2-compute-context', null, config.get('webgl2Context', true)],
        ['disable-accelerated-2d-canvas', 'true', !config.get('acceleratedCanvas', true)],
        // ウィンドウキャプチャに必要な設定(win32でのみ動作する。frznさんに感謝)
        ['in-process-gpu', null, platformType === 'win32' ? true : false],
        // その他
        ['autoplay-policy', 'no-user-gesture-required', config.get('autoPlay', true)],
    ];
    chromiumFlags.forEach((f) => {
        const isEnable = f[2] ? 'Enable' : 'Disable';
        flagsInfo += `\n    - ${f[0]}, ${f[1]}: ${isEnable}`;
    });
    const osRelease = os.release();
    let osVersion = '';
    if (osRelease.startsWith('6.1')) osVersion = 'Windows 7';
    if (osRelease.startsWith('6.2')) osVersion = 'Windows 8';
    if (osRelease.startsWith('6.3')) osVersion = 'Windows 8.1';
    if (osRelease.startsWith('10') && Number(osRelease.split('.')[2]) < 22000) osVersion = 'Windows 10';
    if (osRelease.startsWith('10') && Number(osRelease.split('.')[2]) >= 22000) osVersion = 'Windows 11';
    const osInfoTxt = `OS: ${osVersion} / ${os.release()} ${os.arch()}`;
    const cpuInfo = os.cpus();
    const cpuInfoTxt = `CPU: ${cpuInfo[0].model.trim()}@${Math.round((cpuInfo[0].speed / 1000) * 100) / 100}GHz`;
    const memInfoTxt = `RAM: ${Math.round(((os.totalmem - os.freemem) / 1073741824) * 100) / 100}GB / ${Math.round((os.totalmem / 1073741824) * 100) / 100}GB`;
    const memUsageTxt = `RAM Usage: ${Math.round((process.memoryUsage().rss / 1048576) * 100) / 100}MB`;
    const { exec } = require('child_process');
    let gpuInfoTxt = '';
    if (platformType === 'win32') {
        exec('wmic path win32_VideoController get name', (error, stdout, stderr) => {
            if (error || stderr) {
                gpuInfoTxt = 'Error in exec process.';
            }
            else {
                const output = stdout.split('\r\r\n');
                output.shift();
                let c = 0;
                output.forEach((v) => {
                    if (v !== '') {
                        gpuInfoTxt += `GPU${c}: ${v.trim()}`;
                        if (c + 1 !== output.length) {
                            gpuInfoTxt += '\n';
                        }
                        c += 1;
                    }
                });
            }
            const sysInfo = '=====Client Information=====\n' + versions + '\n' + flagsInfo + '\n' + uiLang + '\n' + memUsageTxt + '\n=====System Information=====\n' + osInfoTxt + '\n' + cpuInfoTxt + '\n' + memInfoTxt + '\n' + gpuInfoTxt;
            clipboard.writeText(sysInfo);
        });
    }
    else {
        const sysInfo = '=====Client Information=====\n' + versions + '\n' + flagsInfo + '\n' + uiLang + '\n' + memUsageTxt + '\n=====System Information=====\n' + osInfoTxt + '\n' + cpuInfoTxt + '\n' + memInfoTxt + '\n' + 'GPU: Not Supported';
        clipboard.writeText(sysInfo);
    }
});

ipcMain.on('openLogFolder', () => {
    shell.showItemInFolder(path.join(app.getPath('appData'), 'laf/logs'));
});

ipcMain.handle('linkTwitch', () => {
    const express = require('express');
    const oauthURL = 'https://id.twitch.tv/oauth2/authorize?client_id=q9pn15rtycv6l9waebyyw99d70mh00&redirect_uri=http://localhost:65535&response_type=token&scope=chat:read+chat:edit+channel:moderate+whispers:read+whispers:edit+channel_editor';
    const eapp = express();
    let server = null;
    eapp.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'html/twitch.html'));
    });
    eapp.get('/token', (req, res) => {
        config.set('twitchToken', req.query.token);
        twitchToken = req.query.token;
        log.info('Received token. Server will be closed.');
        twitchLogin(true);
        setTimeout(() => server.close(), 1500);
    });
    server = eapp.listen('65535', () => {
        log.info('HTTP Server started. It will close after 10 mins passed.');
    });
    shell.openExternal(oauthURL);
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

app.on('quit', () => {
    config.set('isUserLive', false);
});