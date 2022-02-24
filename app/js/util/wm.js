require('v8-compile-cache');
const { app, BrowserWindow, clipboard, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const store = require('electron-store');
const log = require('electron-log');
const localShortcut = require('electron-localshortcut');
const tools = require('./tools');

const config = new store();
const lafTools = new tools.clientTools();

const isSwapperEnabled = config.get('enableResourceSwapper', true);
const ezCSSMode = config.get('easyCSSMode', 'disable');
const langPack = require(config.get('lang', 'en_US') === 'ja_JP' ? '../../lang/ja_JP' : '../../lang/en_US');

log.info('Script Loaded: js/util/wm.js');

const windows = {
    game: null,
    hub: null,
    viewer: null,
    editor: null,
};

const initSwapper = (win) => {
    const swapPath = path.join(app.getPath('documents'), '/LaFSwap');
    if (!fs.existsSync(swapPath)) {
        fs.mkdir(swapPath, { recursive: true }, e => {
            log.warn('ERROR IN RESOURCE SWAPPER');
            log.warn(e);
        });
    }
    const urls = [];
    const recursiveFolder = (win, prefix = '') => {
        try {
            fs.readdirSync(path.join(swapPath, prefix), { withFileTypes: true }).forEach((cPath) => {
                if (cPath.isDirectory()) {
                    recursiveFolder(win, `${prefix}/${cPath.name}`);
                }
                else {
                    const name = `${prefix}/${cPath.name}`;
                    const isAsset = /^\/(models|textures|sound|scares)($|\/)/.test(name);
                    if (isAsset) {
                        urls.push(`*://assets.krunker.io${name}`, `*://assets.krunker.io${name}?*`);
                    }
                    else {
                        urls.push(`*://krunker.io${name}`, `*://krunker.io${name}?*`, `*://comp.krunker.io${name}`, `*://comp.krunker.io${name}?*`);
                    }
                }
            });
        }
        catch (e) {
            log.warn('ERROR IN RESOURCE SWAPPER');
            log.warn(e);
        }
    };
    recursiveFolder(win);
    if (urls.length) {
        win.webContents.session.webRequest.onBeforeRequest({ urls: urls }, (details, callback) => callback({
            redirectURL: 'laf://' + path.join(swapPath, new URL(details.url).pathname),
        }));
    }
};

exports.launchGame = () => {
    windows.game = new this.gameWindow();
    return windows.game;
};

exports.gameWindow = class {
    constructor() {
        const brWin = new BrowserWindow({
            width: config.get('window.width', 1500),
            height: config.get('window.height', 1000),
            x: config.get('window.x'),
            y: config.get('window.y'),
            show: false,
            title: 'LaF',
            webPreferences: {
                contextIsolation: false,
                preload: path.join(__dirname, '../preload/game.js'),
            },
        });
        const initShortcutKeys = () => {
            const sKeys = [
                ['Esc', () => {
                    // ゲーム内でのESCキーの有効化
                    brWin.webContents.send('ESC');
                }],
                ['F4', () => {
                    brWin.webContents.send('joinMatch');
                }],
                ['F5', () => {
                    // リ↓ロ↑ードする
                    brWin.reload();
                }],
                ['F6', () => {
                    // 別のマッチへ
                    brWin.loadURL('https://krunker.io');
                }],
                ['F7', () => {
                    // クリップボードへURLをコピー(実質Inviteボタン)
                    clipboard.writeText(brWin.webContents.getURL());
                }],
                ['F8', () => {
                    // クリップボードのURLへアクセス(実質Joinボタン)
                    const copiedText = clipboard.readText();
                    if (lafTools.urlType(copiedText) === 'game') brWin.loadURL(copiedText);
                }],
                ['F11', () => {
                    const isFullScreen = brWin.isFullScreen();
                    config.set('Fullscreen', !isFullScreen);
                    brWin.setFullScreen(!isFullScreen);
                }],
                ['Ctrl+Shift+F1', () => {
                    // クライアントの再起動
                    app.relaunch();
                    app.quit();
                }],
                [
                    ['Ctrl+F1', 'F12'], () => {
                        // 開発者ツールの起動
                        brWin.webContents.openDevTools();
                    },
                ],
            ];

            sKeys.forEach((k) => {
                localShortcut.register(brWin, k[0], k[1]);
            });
        };

        brWin.removeMenu();
        initShortcutKeys();
        if (isSwapperEnabled) {
            initSwapper(brWin);
        }
        if (config.get('isMaximized', false)) brWin.maximize();
        if (config.get('Fullscreen', false)) brWin.setFullScreen(true);
        brWin.loadURL('https://krunker.io');

        // イベントハンドラ
        brWin.once('ready-to-show', () => {
            brWin.show();
        });
        brWin.webContents.on('did-finish-load', () => {
            brWin.webContents.send('didFinishLoad');
        });
        brWin.on('page-title-updated', (e) => {
            e.preventDefault();
        });
        brWin.webContents.on('will-prevent-unload', (e) => {
            if (!dialog.showMessageBoxSync({
                buttons: [langPack.dialog.yes, langPack.dialog.no],
                title: langPack.dialog.social.leavePageTitle,
                message: langPack.dialog.social.leavePageMessage,
                noLink: true,
            })) {
                e.preventDefault();
            }
        });
        brWin.on('close', () => {
            const isMaximized = brWin.isMaximized();
            const isFullScreen = brWin.isFullScreen();
            const windowSize = brWin.getSize();
            const windowPosition = brWin.getPosition();

            config.set('isMaximized', isMaximized);
            config.set('Fullscreen', isFullScreen);
            if (!(isMaximized || isFullScreen)) {
                config.set('window.width', windowSize[0]);
                config.set('window.height', windowSize[1]);
                config.set('window.x', windowPosition[0]);
                config.set('window.y', windowPosition[1]);
            }
        });
        brWin.webContents.on('new-window', (e, url) => {
            e.preventDefault();
            openNewWindow(url);
        });
        return brWin;
    }
};

exports.socialWindow = class {
    constructor(url) {
        const brWin = new BrowserWindow({
            width: 1500,
            height: 1000,
            show: false,
            title: 'LaF',
            webPreferences: {
                contextIsolation: false,
                preload: path.join(__dirname, '../preload/social.js'),
            },
        });
        const initShortcutKeys = () => {
            const sKeys = [
                ['Esc', () => {
                    // ゲーム内でのESCキーの有効化
                    // eslint-disable-next-line semi
                    brWin.webContents.send('ESC')
                }],
                ['F5', () => {
                    // リ↓ロ↑ードする
                    brWin.reload();
                }],
                ['F7', () => {
                    // クリップボードへURLをコピー(実質Inviteボタン)
                    clipboard.writeText(brWin.webContents.getURL());
                }],
                ['F11', () => {
                    const isFullScreen = brWin.isFullScreen();
                    config.set('Fullscreen', !isFullScreen);
                    brWin.setFullScreen(!isFullScreen);
                }],
                ['F12', () => {
                    // 開発者ツールの起動
                    brWin.webContents.openDevTools();
                }],
                ['Ctrl+Shift+F1', () => {
                    // クライアントの再起動
                    app.relaunch();
                    app.quit();
                }],
            ];

            sKeys.forEach((k) => {
                localShortcut.register(brWin, k[0], k[1]);
            });
        };

        brWin.removeMenu();
        initShortcutKeys();
        if (isSwapperEnabled) initSwapper(brWin);
        brWin.loadURL(url);
        brWin.once('ready-to-show', () => {
            brWin.show();
        });
        brWin.on('page-title-updated', (e) => {
            e.preventDefault();
        });
        brWin.webContents.on('will-prevent-unload', (e) => {
            if (!dialog.showMessageBoxSync({
                buttons: [langPack.dialog.yes, langPack.dialog.no],
                title: langPack.dialog.social.leavePageTitle,
                message: langPack.dialog.social.leavePageMessage,
                noLink: true,
            })) {
                e.preventDefault();
            }
        });
        brWin.on('closed', () => {
            brWin.destroy();
            windows[lafTools.urlType(url)] = null;
        });
        brWin.webContents.on('new-window', (e, url) => {
            e.preventDefault();
            openNewWindow(url);
        });
        return brWin;
    }
};

const openNewWindow = (url) => {
    if (lafTools.urlType(url) === 'external') {
        shell.openExternal(url);
        return;
    }
    const winObj = windows[lafTools.urlType(url)];
    if (winObj) {
        winObj.loadURL(url);
        winObj.on('closed', () => windows[lafTools.urlType(url)] = null);
    }
    else {
        windows[lafTools.urlType(url)] = new this.socialWindow(url);
    }
};