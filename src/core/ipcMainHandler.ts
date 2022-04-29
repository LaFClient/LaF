// LaF Client ipcハンドラ (c) 2022 Hiro527
require('v8-compile-cache');
import { app, ipcMain, protocol } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import { i18n as i18nType } from 'i18next';

import { localization } from '../core/i18n';

const PackageInfo = require('../../package.json');

let i18n: i18nType;
const config = new Store();

export const setupIpc = async () => {
    i18n = await localization();
}