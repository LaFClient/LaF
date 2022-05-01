// LaF Client メインモジュール (c) 2022 Hiro527
require('v8-compile-cache');
import { app, ipcMain, protocol } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import path from 'path';
import isDev from 'electron-is-dev';
import { i18n as i18nType } from 'i18next';

import { LaFPlugin } from './@types/types';
import * as ConfigTransfer from './plugin/ConfigTransfer';
import * as WindowLoader from './core/WindowLoader';
import { localization } from './core/i18n';
import { setupIpc } from './core/ipcMainHandler';

const PackageInfo = require('../package.json');

log.info(
    `LaF Client ${PackageInfo.version}${
        isDev ? '-development' : '-release'
    }\n    - electron@${process.versions.electron}\n    - nodejs@${
        process.versions.node
    }\n    - Chromium@${process.versions.chrome}`
);

/* 初期化ブロック */

let i18n: i18nType;
const config = new Store();

// 設定移行用
ConfigTransfer.execute();

// 脆弱性への対応: https://github.com/advisories/GHSA-mpjm-v997-c4h4
delete require('electron').nativeImage.createThumbnailFromPath;

// シングルインスタンスロック
if (!app.requestSingleInstanceLock()) {
    log.error(
        "Other process(es) are already existing. Quit. If you can't see the window, please kill all task(s)."
    );
    app.exit();
}

// カスタムプロトコルlaf://への対応(ローカルファイルへのアクセス用)
protocol.registerSchemesAsPrivileged([
    {
        scheme: 'laf',
        privileges: { secure: true, corsEnabled: true },
    },
]);

// Chromiumの起動フラグを構成
let flagsInfo = 'Chromium Options:';
const chromiumFlags: any[] = [
    // ['オプション', null('オプション2'), 有効[boolean]]
    // FPS解放周り
    [
        'disable-frame-rate-limit',
        null,
        config.get('graphics.UnlimitedFPS', true),
    ],
    ['disable-gpu-vsync', null, config.get('graphics.UnlimitedFPS', true)],
    // 描画関係
    ['use-angle', config.get('graphics.AngleType', 'default'), true],
    [
        'enable-webgl2-compute-context',
        null,
        config.get('graphics.GL2Context', true),
    ],
    [
        'disable-accelerated-2d-canvas',
        'true',
        !config.get('graphics.HWAcceleration', true),
    ],
    // ウィンドウキャプチャに必要な設定(win32でのみ動作する。frznさんに感謝)
    ['in-process-gpu', null, process.platform === 'win32' ? true : false],
    // その他
    [
        'autoplay-policy',
        'no-user-gesture-required',
        config.get('general.AutoPlay', true),
    ],
    ['proxy-server', 'localhost:37564', config.get('dev.enableProxy', false)],
];
chromiumFlags.forEach((f) => {
    const isEnable = f[2] ? 'Enable' : 'Disable';
    flagsInfo += `\n    - ${f[0]}, ${f[1]}: ${isEnable}`;
    if (f[2]) {
        if (f[1] === null) {
            app.commandLine.appendSwitch(f[0]);
        } else {
            app.commandLine.appendSwitch(f[0], f[1]);
        }
    }
});
log.info(flagsInfo);

app.on('ready', async () => {
    // Ipcハンドラのセットアップ
    await setupIpc();
    // i18nモジュールの初期化
    i18n = await localization();
    // カスタムファイルプロトコルの登録
    protocol.registerFileProtocol('laf', (request, callback) =>
        callback(decodeURI(request.url.replace(/^laf:\//, '')))
    );
    // ゲームの起動
    await WindowLoader.LaunchGame();
});
