// LaF Client GameWindow Preload (c) 2022 Hiro527
require('v8-compile-cache');
import { clipboard, ipcRenderer } from 'electron';
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
    Object.keys(LangResource.ui.title).forEach((k) => {
        document
            .getElementById(k)
            ?.setAttribute('title', i18n.t(`ui.title.${k}`));
    });
    document.getElementById('AMLoading')!.innerText =
        i18n.t('ui.title.AMLoading');
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
ipcRenderer.on('ToggleFullScreenUI', (e) => {
    window.ToggleStatus('AppFullscrToggle', 'fullscreen', 'fullscreen_exit');
});

ipcRenderer.on('ShowMessage', (e, message: string, ms?: number) => {
    window.ShowMessage(message, ms);
});

// AltManagerのUIを更新
ipcRenderer.on('GameActivity', (e, gameActivity: GameActivity) => {
    const PreviousAccount = config.get('client.user', null);
    const CurrentAccount = gameActivity.user;
    config.set('client.user', CurrentAccount);
    if (PreviousAccount !== CurrentAccount && isAMInitialized) {
        document
            .getElementById(`option_${PreviousAccount}`)
            ?.removeAttribute('selected');
        document
            .getElementById(`option_${CurrentAccount}`)
            ?.setAttribute('selected', '');
    }
    const SelectEl = document.getElementById(
        'AltManagerSelector'
    )! as HTMLSelectElement;
    const SelectedValue = SelectEl.options[SelectEl.selectedIndex].value;
    if (SelectedValue === 'Guest') {
        document.getElementById('AMEdit')!.className = 'AppControlBtn disabled';
        document.getElementById('AMDelete')!.className =
            'AppControlBtn disabled';
        document.getElementById('AMLogin')!.className =
            'AppControlBtn disabled';
        document.getElementById('AMLogin')!.removeAttribute('style');
        document.getElementById('AMLogout')!.style.display = 'none';
    } else {
        document.getElementById('AMEdit')!.className = 'AppControlBtn';
        document.getElementById('AMDelete')!.className = 'AppControlBtn';
        document.getElementById('AMLogin')!.className = 'AppControlBtn';
        if (SelectedValue === CurrentAccount) {
            document.getElementById('AMLogin')!.style.display = 'none';
            document.getElementById('AMLogout')!.removeAttribute('style');
        } else {
            document.getElementById('AMLogin')!.removeAttribute('style');
            document.getElementById('AMLogout')!.style.display = 'none';
        }
    }
});

// AltManagerのセレクタを更新
ipcRenderer.on('AltAccounts', (e, data: AltAccounts) => {
    const Update = JSON.stringify(Accounts) !== '{}';
    if (JSON.stringify(data) === JSON.stringify(Accounts) && Update) {
        return;
    }
    Accounts = data;
    const AMSelector = document.getElementById(
        'AltManagerSelector'
    )! as HTMLSelectElement;
    const SelectedValue = AMSelector.options[AMSelector.selectedIndex].value;
    let AccountsHTML = `<option id="option_Guest" value="Guest">${i18n.t(
        'ui.altm.guestAcc'
    )}</option>`;
    const CurrentAccount = config.get('client.user', null);
    Object.keys(Accounts).forEach((k) => {
        AccountsHTML += `<option id="option_${k}" value="${k}"${
            (k === CurrentAccount && !Update) || k === SelectedValue
                ? ' selected'
                : ''
        }>${k}</option>`;
    });
    AMSelector.innerHTML = AccountsHTML;
    isAMInitialized = true;
});

window.AddAccount = () => {
    ipcRenderer.sendTo(2, 'AddAccount');
};

window.EditAccount = () => {
    const SelectEl = document.getElementById(
        'AltManagerSelector'
    )! as HTMLSelectElement;
    const AccountName = SelectEl.options[SelectEl.selectedIndex].value;
    ipcRenderer.sendTo(2, 'EditAccount', AccountName);
};

window.LoginAccount = () => {
    const SelectEl = document.getElementById(
        'AltManagerSelector'
    )! as HTMLSelectElement;
    const AccountName = SelectEl.options[SelectEl.selectedIndex].value;
    ipcRenderer.sendTo(2, 'LoginAccount', AccountName);
};

window.LogoutAccount = () => {
    ipcRenderer.sendTo(2, 'LogoutAccount');
};

window.DeleteAccount = () => {
    const SelectEl = document.getElementById(
        'AltManagerSelector'
    )! as HTMLSelectElement;
    const AccountName = SelectEl.options[SelectEl.selectedIndex].value;
    ipcRenderer.sendTo(2, 'DeleteAccount', AccountName);
};