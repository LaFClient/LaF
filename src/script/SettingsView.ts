// LaF Client SettingsWindow Preload (c) 2022 Hiro527
require('v8-compile-cache');
import { app, BrowserWindow, clipboard, ipcRenderer } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';

import { localization } from '../core/i18n';
import { SettingsWindow } from '../@types/types';
import { UrlType } from '../core/Tools';
import { i18n as i18nType } from 'i18next';

const PackageInfo = require('../../package.json');

let i18n: i18nType;
const config = new Store();

let WindowId: string;

declare const window: SettingsWindow;

const GenerateHTML = () => {
    
}

window.onload = async () => {
    i18n = await localization();
}