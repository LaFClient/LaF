// LaF Client GameWindow Preload (c) 2022 Hiro527
require('v8-compile-cache');
import { app, BrowserWindow, clipboard, ipcRenderer } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';

import { localization } from '../core/i18n';
import { ClientWindow, GameActivity, AltAccounts } from '../@types/types';
import { UrlType } from '../core/Tools';
import { i18n as i18nType } from 'i18next';

const LangResource = require('../../assets/i18n/en_US.json');

const PackageInfo = require('../../package.json');

let i18n: i18nType;
const config = new Store();

let isAMInitialized = false;
let Accounts: AltAccounts = {};

let WindowId: string;

declare const window: ClientWindow;

window.AppControl = async (id: string) => {
    switch (id) {
        case 'AppOpenURL':
            const url = clipboard.readText();
            if (UrlType(url) !== 'game' || UrlType(url) !== 'external') {
                ipcRenderer.send(`LoadURL-${WindowId}`, url);
            }
            break;
        case 'Minimize':
        case 'Maximize':
        case 'Close':
            await ipcRenderer.invoke(`WindowControl-${WindowId}`, id);
            if (id === 'Maximize') {
                const UIInfo = await ipcRenderer.invoke(
                    `UIInformation-${WindowId}`
                );
                if (UIInfo.isMaximized) {
                    document
                        .getElementById('MaximizeIcon')
                        ?.setAttribute('src', './img/maximized.svg');
                } else {
                    document
                        .getElementById('MaximizeIcon')
                        ?.setAttribute('src', './img/maximize.svg');
                }
            }
            break;
        default:
            ipcRenderer.send(`${id}-${WindowId}`);
    }
};

// ボタンのアイコンを切り替える
window.ToggleStatus = (id: string, valTrue: string, valFalse: string) => {
    if (
        Array.from(document.getElementById(id)!.classList).some(
            (c) => c === 'disabled'
        )
    )
        return;
    const BtnEl = document.getElementById(id)!;
    const status = BtnEl.innerHTML.match(valFalse);
    BtnEl.innerHTML = `<span class="material-symbols-sharp AppControlBtnIcon">${
        status ? valTrue : valFalse
    }</span>`;
};

// UIの初期化
window.onload = async () => {
    i18n = await localization();
    Object.keys(LangResource.ui.title).forEach((k) => {
        document
            .getElementById(k)
            ?.setAttribute('title', i18n.t(`ui.title.${k}`));
    });
    setInterval(async () => {
        const UIInfo = await ipcRenderer.invoke(`UIInformation-${WindowId}`);
        // ナビゲーション
        const GoBackBtnEl = document.getElementById('AppGoBack')!;
        const GoNextBtnEl = document.getElementById('AppGoNext')!;
        GoBackBtnEl.className = `AppControlBtn${
            UIInfo.canGoBack ? '' : ' disabled'
        }`;
        GoNextBtnEl.className = `AppControlBtn${
            UIInfo.canGoNext ? '' : ' disabled'
        }`;
        // ウィンドウのコントロールボタン
        if (UIInfo.isMaximized || UIInfo.isFullScreen) {
            document
                .getElementById('MaximizeIcon')
                ?.setAttribute('src', './img/maximized.svg');
        } else {
            document
                .getElementById('MaximizeIcon')
                ?.setAttribute('src', './img/maximize.svg');
        }
    }, 100);
};

// イベントハンドラ
ipcRenderer.on('WindowId', (e, id: string) => {
    WindowId = id;
});
