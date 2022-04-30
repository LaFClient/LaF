// LaF Client GameFrame Preload (c) 2022 Hiro527
require('v8-compile-cache');
import { app, clipboard, ipcRenderer } from 'electron';
import Store from 'electron-store';
import Mousetrap from 'mousetrap';
import { i18n as i18nType } from 'i18next';

import { localization } from '../core/i18n';

import { AltAccounts, ClientWindow, GameWindow } from '../@types/types';
import { UrlType } from '../core/Tools';

const PackageInfo = require('../../package.json');

let i18n: i18nType;
const config = new Store();

declare const window: GameWindow;

// クライアントのバージョン警告を無効化
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
            HQJoin();
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
            // フルスクリーンの切り替え
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

// クイックジョイン
const HQJoin = () => {
    // WIP
};

// チャット欄にメッセージを表示するやつ
const ShowMessage = (message: string, color?: string) => {
    const MessageList = document.getElementById('chatList')!;
    const NewMessageId = MessageList.childElementCount;
    MessageList.insertAdjacentHTML(
        'beforeend',
        `<div data-tab="-1" id="chatMsg_${NewMessageId}"><div class="chatItem"><span class="chatMsg"${
            color ? ` style="color:${color}"` : ''
        }>${message}</span></div><br></div>`
    );
};

// ウォーターマークの挿入
const injectWaterMark = () => {
    const gameUIEl = document.getElementById('gameUI')!;
    gameUIEl.insertAdjacentHTML(
        'beforeend',
        `
    <div id='LaFWaterMark' style='position:absolute;font-size:15px;bottom:5px;right:5px;color:rgba(255, 255, 255, .75);'>LaF v${PackageInfo.version}</div>
    `
    );
};

// 読み込み時に発火
window.onload = async () => {
    i18n = await localization();
    injectWaterMark();
    ipcRenderer.sendTo(
        1,
        'AltAccounts',
        JSON.parse(localStorage.getItem('altAccounts') || '{}')
    );
    setInterval(() => {
        const gameActivity = window.getGameActivity();
        // メインプロセスへ
        ipcRenderer.send('GameActivity', gameActivity);
        // UIプロセスへ
        ipcRenderer.sendTo(1, 'GameActivity', gameActivity);
        ipcRenderer.sendTo(
            1,
            'AltAccounts',
            JSON.parse(localStorage.getItem('altAccounts') || '{}')
        );
    }, 200);
};

// アカウントをAltManagerに保存
window.saveAcc = (force?: boolean) => {
    const accNameEl = document.getElementById('accName')! as HTMLInputElement;
    const accPassEl = document.getElementById('accPass')! as HTMLInputElement;
    const accRespEl = document.getElementById('accResp')!;
    // パスワードは一応Base64にしておく(悪あがき)
    const accPassB64 = Buffer.from(accPassEl.value).toString('base64');
    let altAccounts: AltAccounts = JSON.parse(
        localStorage.getItem('altAccounts') || '{}'
    );
    if (!(accNameEl.value.length || accPassEl.value.length))
        accRespEl.innerText;
    if (!altAccounts) {
        altAccounts = {
            [accNameEl.value]: accPassB64,
        };
        localStorage.setItem('altAccounts', JSON.stringify(altAccounts));
        accNameEl.value = '';
        accPassEl.value = '';
        accRespEl!.innerText = i18n.t('ui.altm.ok');
    } else {
        let existing = false;
        Object.keys(altAccounts).forEach((k) => {
            if (k === accNameEl.value && !force) {
                accRespEl!.innerText = i18n.t('ui.altm.error');
                existing = true;
            }
        });
        if (!existing || force) {
            altAccounts[accNameEl.value] = accPassB64;
            localStorage.setItem('altAccounts', JSON.stringify(altAccounts));
            accNameEl.value = '';
            accPassEl.value = '';
            accRespEl.innerText = i18n.t('ui.altm.ok');
        }
    }
};

ipcRenderer.on('ShowMessage', (e, message: string, color: string) => {
    ShowMessage(message, color);
});

// アカウントでログイン
ipcRenderer.on('LoginAccount', (e, AccountName: string) => {
    window.logoutAcc();
    let accNameEl = document.getElementById('accName') as HTMLInputElement;
    let accPassEl = document.getElementById('accPass') as HTMLInputElement;
    const altAccounts = JSON.parse(localStorage.getItem('altAccounts') || '{}');
    accNameEl.value = AccountName;
    accPassEl.value = Buffer.from(
        altAccounts[AccountName],
        'base64'
    ).toString();
    accNameEl.style.display = 'none';
    accPassEl.style.display = 'none';
    document
        .getElementById('menuWindow')
        ?.lastElementChild?.lastElementChild?.remove();
    setTimeout(() => {
        window.loginAcc();
    }, 100);
});

// アカウントからログアウト
ipcRenderer.on('LogoutAccount', (e) => {
    window.logoutAcc();
});

// アカウント登録画面を表示
ipcRenderer.on('AddAccount', (e) => {
    document.getElementById('windowHolder')!.className = 'popupWin';
    document.getElementById('menuWindowSideL')!.style.display = 'none';
    const menuWindowEl = document.getElementById('menuWindow')!;
    menuWindowEl.outerHTML = `
    <div id='menuWindow' class='dark' style='overflow-y: auto; width: 960px;'>
        <div style='position:relative;z-index:9'>
            <div id='referralHeader'>Add Account</div>
            <div style='height:20px;'></div><input id='accName' type='text' placeholder='${i18n.t(
                'ui.altm.namePh'
            )}' class='accountInput' style='margin-top:0'><input id='accPass' type='password' placeholder='${i18n.t(
        'ui.altm.passPh'
    )}' class='accountInput'>
            <div class='setBodH' style='margin-left:0px;width:calc(100% - 40px)'>
                <div id='accResp' style='margin-top:20px;margin-bottom:20px;font-size:18px;color:rgba(255,255,255,0.5);text-align:center'>${i18n.t(
                    'ui.altm.info'
                )}</span></div>
            </div>
            <div style='width:100%;text-align:center;margin-top:10px;background-color:rgba(0,0,0,0.3);padding-top:10px;padding-bottom:20px;'>
                <div class='accBtn button buttonPI' style='width:95%' onclick='SOUND.play(\`select_0\`,0.1);saveAcc();'>${i18n.t(
                    'ui.altm.addTitle'
                )}</div>
            </div>
        </div>
    </div>`;
    document.getElementById('windowHolder')!.style.display = 'block';
});

// アカウントの編集画面を表示
ipcRenderer.on('EditAccount', (e, AccountName: string) => {
    document.getElementById('windowHolder')!.className = 'popupWin';
    document.getElementById('menuWindowSideL')!.style.display = 'none';
    const menuWindowEl = document.getElementById('menuWindow')!;
    menuWindowEl.outerHTML = `
    <div id='menuWindow' class='dark' style='overflow-y: auto; width: 960px;'>
        <div style='position:relative;z-index:9'>
            <div id='referralHeader'>Edit Account</div>
            <div style='height:20px;'></div><input id='accName' type='text' placeholder='${i18n.t(
                'ui.altm.namePh'
            )}' class='accountInput' style='margin-top:0' value='${AccountName}' readonly='readonly'><input id='accPass' type='password' placeholder='${i18n.t(
        'ui.altm.passPh'
    )}' class='accountInput'>
            <div class='setBodH' style='margin-left:0px;width:calc(100% - 40px)'>
                <div id='accResp' style='margin-top:20px;margin-bottom:20px;font-size:18px;color:rgba(255,255,255,0.5);text-align:center'>${i18n.t(
                    'ui.altm.info'
                )}</span></div>
            </div>
            <div style='width:100%;text-align:center;margin-top:10px;background-color:rgba(0,0,0,0.3);padding-top:10px;padding-bottom:20px;'>
                <div class='accBtn button buttonPI' style='width:95%' onclick='SOUND.play(\`select_0\`,0.1);saveAcc(true);'>${i18n.t(
                    'ui.altm.saveTitle'
                )}</div>
            </div>
        </div>
    </div>`;
    document.getElementById('windowHolder')!.style.display = 'block';
});

// アカウントの削除画面を表示
ipcRenderer.on('DeleteAccount', (e, AccountName: string) => {
    const result = window.confirm(
        i18n.t('ui.altm.confirmDelete').replace('{0}', AccountName)
    );
    if (result) {
        const altAccounts = JSON.parse(
            localStorage.getItem('altAccounts') || '{}'
        );
        delete altAccounts[AccountName];
        localStorage.setItem('altAccounts', JSON.stringify(altAccounts));
    }
});
