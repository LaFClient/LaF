// LaF Client GameFrame Preload (c) 2022 Hiro527
require('v8-compile-cache');
import { app, BrowserWindow, clipboard, ipcRenderer } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import path from 'path';
import isDev from 'electron-is-dev';

import i18next from 'i18next';

const PackageInfo = require('../../package.json');

let i18n = i18next;
const config = new Store();

// webview用のPreload