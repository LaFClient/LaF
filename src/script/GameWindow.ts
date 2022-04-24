// LaF Client GameWindow Preload (c) 2022 Hiro527
require('v8-compile-cache');
import { app, BrowserWindow, clipboard, ipcRenderer } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import path from 'path';
import isDev from 'electron-is-dev';

import i18next from 'i18next';
import { ClientWindow } from '../@types/types';
import { UrlType } from '../core/Tools';

const PackageInfo = require('../../package.json');

let i18n = i18next;
const config = new Store();

declare const window: ClientWindow;

window.AppControl = async (id: string) => {
    switch (id) {
        case 'AppOpenURL':
            const url = clipboard.readText();
            if (UrlType(url) === 'game') {
                ipcRenderer.send('LoadURL', url);
            }
            break;
        case 'Minimize':
        case 'Maximize':
        case 'Close':
            await ipcRenderer.invoke('WindowControl', id);
            if (id === 'Maximize') {
                const UIInfo = await ipcRenderer.invoke('UIInformation');
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
            ipcRenderer.send(id);
    }
};

window.ToggleStatus = (id: string, valTrue: string, valFalse: string) => {
    const BtnEl = document.getElementById(id)!;
    const status = BtnEl.innerHTML.match(valFalse);
    BtnEl.innerHTML = `<span class="material-symbols-sharp AppControlBtnIcon">${
        status ? valTrue : valFalse
    }</span>`;
};

// UIの初期化
window.onload = async () => {
    const UIInfo = await ipcRenderer.invoke('UIInformation');
    document.getElementById(
        'AppFullscrToggle'
    )!.innerHTML = `<span class="material-symbols-sharp AppControlBtnIcon">${
        UIInfo.isFullScreen ? 'fullscreen_exit' : 'fullscreen'
    }</span>`;
    document.getElementById(
        'AppLinkCmd'
    )!.innerHTML = `<span class="material-symbols-sharp AppControlBtnIcon">${
        UIInfo.isLinkCmdEnabled ? 'link' : 'link_off'
    }</span>`;
    setInterval(async () => {
        const UIInfo = await ipcRenderer.invoke('UIInformation');
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
        if (UIInfo.isMaximized) {
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
ipcRenderer.on('ToggleFullScreenUI', (e) => {
    window.ToggleStatus('AppFullscrToggle', 'fullscreen', 'fullscreen_exit');
});

ipcRenderer.on('ShowMessage', (e, message: string, ms?: number) => {
    window.ShowMessage(message, ms);
});
