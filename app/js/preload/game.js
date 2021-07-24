require('v8-compile-cache');
const { ipcRenderer } = require('electron');
const store = require('electron-store');
const log = require('electron-log');
const path = require('path');
const tools = require('../util/tools');
const { BlockList } = require('net');

const osType = process.platform;
const config = new store();

const langPack = require(config.get('lang', 'en_US') === 'ja_JP' ? '../../lang/ja_JP' : '../../lang/en_US');

log.info('Script Loaded: js/preload/preload.js');


const isEnabledTimer = config.get('enableTimer', true);
const devMode = config.get('devmode');

window.OffCliV = true;

window.prompt = (message, defaultValue) => {
    return ipcRenderer.sendSync('showPrompt', message, defaultValue);
};

const injectAltManager = () => {
    const mMenuHolDefEl = document.getElementById('mMenuHolDef');
    mMenuHolDefEl.insertAdjacentHTML('beforeend', `
    <div class="button buttonR lgn" id="logoutBtn" style="display:none;position:absolute;top:2px;right:770px;width:250px;margin-right:0px;padding-top:5px;padding-bottom:13px" onmouseenter="playTick()" onclick="SOUND.play(\`select_0\`,0.1);window.logoutAcc()">
    Logout <span class="material-icons" style="color:#fff;font-size:30px;margin-left:6px;margin-top:-8px;margin-right:-10px;vertical-align:middle;">logout</span></div>
    <div class="button buttonPI lgn" id="altManagerBtn" style="position:absolute;top:2px;right:500px;width:250px;margin-right:0px;padding-top:5px;padding-bottom:13px" onmouseenter="playTick()" onclick="SOUND.play(\`select_0\`,0.1);window.gt.showAltMng()">
    Alt Manager <span class="material-icons" style="color:#fff;font-size:30px;margin-left:6px;margin-top:-8px;margin-right:-10px;vertical-align:middle;">manage_accounts</span></div>
    `);
    const loggedIn = false;
    setInterval(() => {
        const logoutBtnEl = document.getElementById('logoutBtn');
        const signedInHeaderBarEl = document.getElementById('signedInHeaderBar');
        if (signedInHeaderBarEl.style.display !== 'none') {
            logoutBtnEl.style.display = 'block';
        }
        else {
            logoutBtnEl.style.display = 'none';
        }
    }, 100);
};

const injectAddAccBtn = () => {
    const windowHeaderEl = document.getElementById('windowHeader');
    const accBtnEl = document.getElementsByClassName('accBtn');
    if (accBtnEl && windowHeaderEl.innerText === 'Account') {
        accBtnEl[1].insertAdjacentHTML('afterend', `
        <div class='accBtn button buttonPI' style='width:94.5%;margin-top:20px;' onclick='window.gt.showAddAltAcc()'>Add Account</div>
        `);
    }
};

const injectWaterMark = () => {
    const gameUIEl = document.getElementById('gameUI');
    ipcRenderer.invoke('getAppVersion').then((v) => {
        gameUIEl.insertAdjacentHTML('beforeend', `
        <div id='LaFWaterMark' style='position:absolute;font-size:15px;bottom:5px;right:5px;color:rgba(255, 255, 255, .75);'>LaF v${v}</div>
        `);
    });
};

const injectExitBtn = () => {
    const exitBtn = document.getElementById('clientExit');
    switch (config.get('showExitBtn', 'bottom')) {
        case 'top':
            menuContainer.removeChild(menuContainer.children[7]);
            menuContainer.insertAdjacentHTML('afterbegin', `
            <div class='menuItem' onmouseenter='playTick()' onclick='clientExitPopup()' id='clientExit'>
            <div class='menuItemIcon iconExit'></div>
            <div class='menuItemTitle' id='menuBtnExit'>Exit</div>
            </div>
            `);
            exitBtn.style.display = 'inherit';
            break;
        case 'bottom':
            exitBtn.style.display = 'inherit';
            break;
        case 'disable':
            break;
    }
};

const initMenuTimer = () => {
    const instructions = document.getElementById('instructions');
    const menuTimerText = `
    <div id='menuTimer' style='position:absolute;top:55%;left:50%;margin-right:50%;transform:translate(-50%,-50%);font-size:50px;color:rgba(255, 255, 255, 0.8);'>00:00</div>
    `;
    instructions.insertAdjacentHTML('afterend', menuTimerText);

    const getActivity = () => {
        let gameActivity;
        try {
            gameActivity = window.getGameActivity();
        }
        catch (e) {
            log.error(e);
        }
        const time = Math.floor(gameActivity.time);
        const timerS = time % 60;
        const timerM = time < 60 ? '0' : (time - timerS) / 60;
        document.getElementById('menuTimer').innerText = (`${('0' + timerM).slice(-2)}:${('0' + timerS).slice(-2)}`);
    };
    setInterval(getActivity, 500);
};

// イベントハンドラ
ipcRenderer.on('ESC', () => {
    document.exitPointerLock();
});

document.addEventListener('DOMContentLoaded', () => {
    window.gt = new tools.gameTools();
    const winObserver = new MutationObserver(() => {
        winObserver.disconnect();
        window.closeClient = () => {
            ipcRenderer.send('exitClient');
        };
    });
    const menuWindowObserver = new MutationObserver(() => {
        setTimeout(injectAddAccBtn(), 50);
    });
    winObserver.observe(document.getElementById('instructions'), { childList: true });
    menuWindowObserver.observe(document.getElementById('menuWindow'), { childList: true });
});

ipcRenderer.on('didFinishLoad', () => {
    injectExitBtn();
    injectAltManager();
    injectWaterMark();
    if (isEnabledTimer) initMenuTimer();
});