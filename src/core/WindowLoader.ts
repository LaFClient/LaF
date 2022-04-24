// LaF Client ウィンドウローダー (c) 2022 Hiro527
require('v8-compile-cache');
import {
    app,
    BrowserView,
    BrowserWindow,
    clipboard,
    dialog,
    ipcMain,
    shell,
} from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import path from 'path';
import * as fs from 'fs';
import * as localShortcut from 'electron-localshortcut';
import isDev from 'electron-is-dev';

import i18next from 'i18next';
import { UrlType } from './Tools';

const PackageInfo = require('../../package.json');

let i18n = i18next;
const config = new Store();

const initSwapper = (win: BrowserView) => {
    const swapPath = path.join(app.getPath('documents'), '/LaFSwap');
    if (!fs.existsSync(swapPath)) {
        fs.mkdir(swapPath, { recursive: true }, (e) => {
            log.warn('ERROR IN RESOURCE SWAPPER');
            log.warn(e);
        });
    }
    const urls: string[] = [];
    const recursiveFolder = (win: BrowserView, prefix = '') => {
        try {
            fs.readdirSync(path.join(swapPath, prefix), {
                withFileTypes: true,
            }).forEach((cPath) => {
                if (cPath.isDirectory()) {
                    recursiveFolder(win, `${prefix}/${cPath.name}`);
                } else {
                    const name = `${prefix}/${cPath.name}`;
                    const isAsset =
                        /^\/(models|textures|sound|scares)($|\/)/.test(name);
                    if (isAsset) {
                        urls.push(
                            `*://assets.krunker.io${name}`,
                            `*://assets.krunker.io${name}?*`
                        );
                    } else {
                        urls.push(
                            `*://krunker.io${name}`,
                            `*://krunker.io${name}?*`,
                            `*://comp.krunker.io${name}`,
                            `*://comp.krunker.io${name}?*`
                        );
                    }
                }
            });
        } catch (e) {
            log.warn('Error in Resource Swapper');
            log.warn(e);
        }
    };
    recursiveFolder(win);
    if (urls.length) {
        win.webContents.session.webRequest.onBeforeRequest(
            { urls: urls },
            (details, callback) =>
                callback({
                    redirectURL:
                        'laf://' +
                        path.join(swapPath, new URL(details.url).pathname),
                })
        );
    }
};

export const LaunchGame = async (): Promise<BrowserWindow> => {
    // ウィンドウの初期化
    const Window = new BrowserWindow({
        width: config.get('window.width', 1500) as number,
        height: config.get('window.height', 1000) as number,
        minWidth: 1200,
        minHeight: 800,
        x: config.get('window.x', undefined) as number | undefined,
        y: config.get('window.y', undefined) as number | undefined,
        backgroundColor: '#1a1a1a',
        show: false,
        title: 'LaF Client',
        frame: false,
        webPreferences: {
            contextIsolation: false,
            preload: path.join(__dirname, '../script/GameWindow.js'),
            webviewTag: true,
        },
    });
    if (config.get('window.Maximized')) Window.maximize();
    if (config.get('window.FullScreen')) Window.setFullScreen(true);
    // ブラウザビューの初期化
    const view = new BrowserView({
        webPreferences: {
            preload: path.join(__dirname, '../script/GameView.js'),
        },
    });
    view.webContents.loadURL('https://krunker.io');
    Window.setBrowserView(view);
    // ブラウザビューの位置を指定
    view.setBounds({
        x: 0,
        y: 40,
        width: Window.getBounds().width,
        height: Window.getBounds().height - 40,
    });
    view.setBackgroundColor('#1a1a1a');
    // ショートカットの登録
    const Shortcuts = [
        [
            'f4',
            () => {
                Window.webContents.send('HQJoin');
            },
        ],
        [
            'f5',
            () => {
                // リ↓ロ↑ードする
                view.webContents.reload();
            },
        ],
        [
            'ctrl+f5',
            () => {
                // リ↓ロ↑ードする(キャッシュ無効化)
                view.webContents.reloadIgnoringCache();
            },
        ],
        [
            'f6',
            () => {
                // 別のマッチへ
                Window.webContents.send('NewGame');
            },
        ],
        [
            'f7',
            () => {
                // クリップボードへURLをコピー
                clipboard.writeText(view.webContents.getURL());
            },
        ],
        [
            'f8',
            () => {
                // クリップボードのURLへアクセス
                const url = clipboard.readText();
                if (UrlType(url) === 'game') {
                    view.webContents.loadURL(url);
                }
            },
        ],
        [
            'f11',
            () => {
                const isFullScreen = Window.isFullScreen();
                Window.setFullScreen(!isFullScreen);
                Window.webContents.send('ToggleFullScreenUI');
                config.set('window.FullScreen', !isFullScreen);
            },
        ],
        [
            'ctrl+shift+f1',
            () => {
                // クライアントの再起動
                app.relaunch();
                app.quit();
            },
        ],
        [
            'f12',
            () => {
                // 開発者ツールの起動(ゲーム)
                view.webContents.openDevTools();
            },
        ],
        [
            'ctrl+f12',
            () => {
                // 開発者ツールの起動(ウィンドウ)
                Window.webContents.openDevTools();
            },
        ],
    ];
    Shortcuts.forEach((k) => {
        localShortcut.register(
            Window,
            k[0] as string | string[],
            k[1] as () => void
        );
    });
    if (config.get('general.ResSwp')) initSwapper(view);
    Window.loadFile(path.join(__dirname, '../../assets/ui/GameWindow.html'));
    Window.removeMenu();
    ipcMain.handle('UIInformation', () => {
        return {
            canGoBack: view.webContents.canGoBack(),
            canGoNext: view.webContents.canGoForward(),
            isFullScreen: Window.isFullScreen(),
            isMaximized: Window.isMaximized(),
            isLinkCmdEnabled:
                config.get('twitch.AccountName', null) &&
                config.get('twitch.LinkCommand', false),
        };
    });
    ipcMain.handle('WindowControl', (e, action) => {
        switch (action) {
            case 'Maximize':
                if (Window.isMaximized() || Window.isFullScreen()) {
                    if (Window.isFullScreen()) {
                        Window.setFullScreen(false);
                        Window.webContents.send('ToggleFullScreenUI');
                    }
                    Window.unmaximize();
                } else {
                    Window.maximize();
                }
                break;
            case 'Minimize':
                Window.minimize();
                break;
            case 'Close':
                Window.close();
        }
    });
    ipcMain.handle('GetConfig', (e, id) => {
        return config.get(id);
    });
    ipcMain.on('AppFullscrToggle', (e) => {
        const isFullScreen = Window.isFullScreen();
        Window.setFullScreen(!isFullScreen);
        config.set('window.FullScreen', !isFullScreen);
    });
    ipcMain.on('AppFullscrUIToggle', (e) => {
        Window.webContents.send('ToggleFullScreenUI');
    })
    ipcMain.on('AppGoBack', () => {
        if (view.webContents.canGoBack()) view.webContents.goBack();
    });
    ipcMain.on('AppGoNext', () => {
        if (view.webContents.canGoForward()) view.webContents.goForward();
    });
    ipcMain.on('LoadURL', (e, url) => {
        view.webContents.loadURL(url);
    });
    ipcMain.on('AppReload', () => {
        view.webContents.reload();
    });
    ipcMain.on('AppReloadWithoutCache', () => {
        view.webContents.reloadIgnoringCache();
    });
    ipcMain.on('AppCopyURL', () => {
        clipboard.writeText(view.webContents.getURL());
    });
    ipcMain.on('AppNewGame', () => {
        view.webContents.loadURL('https://krunker.io/');
    });
    ipcMain.on('AppLinkCmd', () => {
        const prevVal = config.get('twitch.LinkCommand', false);
        config.set('twitch.LinkCommand', !prevVal);
    });
    ipcMain.on('AppRelaunch', () => {
        app.relaunch();
        app.quit();
    });
    ipcMain.on('OpenGameDevTool', () => {
        view.webContents.openDevTools();
    });
    ipcMain.on('OpenWindowDevTool', () => {
        Window.webContents.openDevTools();
    });
    Window.on('resize', () => {
        const newBounds = Window.getBounds();
        const isMaximized = Window.isMaximized() && !Window.isFullScreen();
        const MaximizeMargin = 16;
        view.setBounds({
            x: 0,
            y: 40,
            width: newBounds.width - (isMaximized ? MaximizeMargin : 0),
            height: newBounds.height - 40 - (isMaximized ? MaximizeMargin : 0),
        });
    });
    Window.on('ready-to-show', () => {
        Window.webContents.send('InitUI');
        Window.show();
    });
    view.webContents.on('new-window', (e, url) => {
        e.preventDefault();
        shell.openExternal(url);
    });
    view.webContents.on('will-prevent-unload', (e) => {
        if (
            !dialog.showMessageBoxSync({
                buttons: [i18n.t('dialog.yes'), i18n.t('dialog.no')],
                title: i18n.t('dialog.confirmLeaveTitle'),
                message: i18n.t('dialog.confirmLeaveMsg'),
                noLink: true,
            })
        ) {
            e.preventDefault();
        }
    });
    Window.on('close', (e) => {
        config.set('window.Maximized', Window.isMaximized());
        config.set('window.FullScreen', Window.isFullScreen());
        if (!(Window.isFullScreen() || Window.isMaximized())) {
            const Size = Window.getSize();
            const Position = Window.getPosition();
            config.set('window.x', Position[0]);
            config.set('window.y', Position[1]);
            config.set('window.width', Size[0]);
            config.set('window.height', Size[1]);
        }
        Window.destroy();
        app.quit();
    });
    return Window;
};
