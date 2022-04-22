// LaF Client メインモジュール (c) 2022 Hiro527
require('v8-compile-cache');
import { app, ipcMain } from 'electron';
import * as Store from 'electron-store';
import * as log from 'electron-log';
import path from 'path';
import isDev from 'electron-is-dev';

import { LaFPlugin } from './@types/types';
import * as ConfigTransfer from './plugin/ConfigTransfer';
import { localization } from './core/i18n';
import { i18n } from 'i18next';

const PackageInfo = require('../package.json');

let locale: i18n | null = null;

log.info(
    `LaF Client ${PackageInfo.version}${isDev ? '-development' : '-release'}\n    - electron@${process.versions.electron}\n    - nodejs@${process.versions.node}\n    - Chromium@${process.versions.chrome}`
);

// 設定移行用
ConfigTransfer.execute();

app.on('ready', async () => {
    locale = await localization(app.getLocale());
});
