// LaF Client SettingsWindow Preload (c) 2022 Hiro527
require('v8-compile-cache');
import { app, BrowserWindow, clipboard, ipcRenderer } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';

import { localization } from '../core/i18n';
import { SettingsWindow } from '../@types/types';
import { UrlType } from '../core/Tools';
import { i18n as i18nType } from 'i18next';

import { getSettings } from '../core/Settings';
import Mousetrap from 'mousetrap';

const PackageInfo = require('../../package.json');

let i18n: i18nType;
const config = new Store();

let WindowId: string;

declare const window: SettingsWindow;

// ショートカットの登録
const Shortcuts = [
    [
        'f12',
        () => {
            // 開発者ツールの起動(ゲーム)
            ipcRenderer.send(`OpenViewDevTool-${WindowId}`);
        },
    ],
    [
        'ctrl+f12',
        () => {
            // 開発者ツールの起動(ウィンドウ)
            ipcRenderer.send(`OpenWindowDevTool-${WindowId}`);
        },
    ],
];
Shortcuts.forEach((k) => {
    Mousetrap.bind(k[0] as string, k[1] as () => void);
});

const SetupUI = async () => {
    const settings = await getSettings();
    let html = ``;
    Object.keys(settings).forEach((k) => {
        const s = settings[k];
        switch (s.type) {
            case 'category':
                html += `
                <div class="category" id="${k}_div">${i18n.t(`settings.${k}`)}</div>`;
                break;
            case 'checkbox':
                html += `
                <div class="item_container" id="${k}_div">
                    <div class="item_label">${i18n.t(`settings.${k}`)}</div>
                    <input type="checkbox" id="${k}_input" onchange="setConfig("${k}", this.checked)">
                </div>`
                break;
        }
        document.getElementById('app')!.innerHTML = html;
    })
}

window.onload = async () => {
    i18n = await localization();
    SetupUI();
}

// イベントハンドラ
ipcRenderer.on('WindowId', (e, id: string) => {
    WindowId = id;
});