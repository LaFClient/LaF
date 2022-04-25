// LaF Client GameFrame Preload (c) 2022 Hiro527
require('v8-compile-cache');
import { app, clipboard, ipcRenderer } from 'electron';
import Store from 'electron-store';
import Mousetrap from 'mousetrap';
import i18next from 'i18next';

import { ClientWindow } from '../@types/types';
import { UrlType } from '../core/Tools';

const PackageInfo = require('../../package.json');

let i18n = i18next;
const config = new Store();

declare const window: ClientWindow;

window.WindowType = 'game';

window.OffCliV = true;

// ショートカットの登録
const Shortcuts = [
    [
        'esc',
        () => {
            // ゲーム内でのESCキーの有効化
            document.exitPointerLock();
        },
    ],
    [
        'f4',
        () => {
            window.HQJoin;
        },
    ],
    [
        'f5',
        () => {
            // リ↓ロ↑ードする
            ipcRenderer.send('AppReload');
        },
    ],
    [
        'ctrl+f5',
        () => {
            // リ↓ロ↑ードする(キャッシュ無効化)
            ipcRenderer.send('AppReloadWithoutCache');
        },
    ],
    [
        'f6',
        () => {
            // 別のマッチへ
            ipcRenderer.send('AppNewGame');
        },
    ],
    [
        'f7',
        () => {
            // クリップボードへURLをコピー
            ipcRenderer.send('AppCopyURL');
        },
    ],
    [
        'f8',
        () => {
            // クリップボードのURLへアクセス
            const url = clipboard.readText();
            if (UrlType(url) === 'game') {
                ipcRenderer.send('LoadURL', url);
            }
        },
    ],
    [
        'f11',
        () => {
            ipcRenderer.send('AppFullscrToggle');
            ipcRenderer.send('AppFullscrUIToggle');
        },
    ],
    [
        'ctrl+shift+f1',
        () => {
            // クライアントの再起動
            ipcRenderer.send('AppRelaunch');
        },
    ],
    [
        'f12',
        () => {
            // 開発者ツールの起動(ゲーム)
            ipcRenderer.send('OpenGameDevTool');
        },
    ],
    [
        'ctrl+f12',
        () => {
            // 開発者ツールの起動(ウィンドウ)
            ipcRenderer.send('OpenWindowDevTool');
        },
    ],
];
Shortcuts.forEach((k) => {
    Mousetrap.bind(k[0] as string, k[1] as () => void);
});

const ShowMessage = (message: string, color?: string) => {
    const MesasgeList = document.getElementById('chatList')!;
    const NewMessageId = MesasgeList.childElementCount;
    MesasgeList.insertAdjacentHTML(
        'beforeend',
        `<div data-tab="-1" id="chatMsg_${NewMessageId}"><div class="chatItem"><span class="chatMsg"${
            color ? ` style="color:${color}"` : ''
        }>${message}</span></div><br></div>`
    );
};

ipcRenderer.on('ShowMessage', (e, message: string, color: string) => {
    ShowMessage(message, color);
});
