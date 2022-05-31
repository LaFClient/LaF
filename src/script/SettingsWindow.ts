// LaF Client SettingsWindow Preload (c) 2022 Hiro527
require('v8-compile-cache');
import { ipcRenderer } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';

import { localization } from '../core/i18n';
import { SettingsWindow } from '../@types/types';
import { UrlType } from '../core/Tools';
import { i18n as i18nType } from 'i18next';

const LangResource = require('../../assets/i18n/en_US.json');

const PackageInfo = require('../../package.json');

let i18n: i18nType;
const config = new Store();

let WindowId: string;

declare const window: SettingsWindow;

window.AppControl = async (id: string) => {
    switch (id) {
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