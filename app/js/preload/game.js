require('v8-compile-cache');
const { ipcRenderer } = require('electron');
const store = require('electron-store');
const log = require('electron-log');
const path = require('path');
const lafTools = require('../util/tools');

const tools = new lafTools.clientTools();

const osType = process.platform;
const config = new store();

const langPack = require(config.get('lang', 'en_US') === 'ja_JP' ? '../../lang/ja_JP' : '../../lang/en_US');

log.info('Script Loaded: js/preload/preload.js');

const isEnabledAltManager = config.get('enableAltMng', true);
const isEnabledTimer = config.get('enableTimer', true);
const isEnabledRPC = config.get('enableRPC', true);
const devMode = config.get('devmode');

let rpcActivity = null;
let rpcInterval = null;

// Google Analytics Start
window.dataLayer = window.dataLayer || [];

function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());

gtag('config', 'G-624ZX98XB0');
// Google Analytics End

window.OffCliV = true;

window.prompt = (message, defaultValue) => {
    return ipcRenderer.sendSync('showPrompt', message, defaultValue);
};

const initDiscordRPC = () => {
    const sendDiscordRPC = () => {
        try {
            const gameActivity = window.getGameActivity();
            rpcActivity = {
                state: gameActivity.map ? gameActivity.map : 'Playing Krunker',
                details: gameActivity.mode,
                largeImageKey: 'laf_icon',
                largeImageText: 'LaF CLient',
                smallImageKey: `icon_${gameActivity.class.index}`,
                smallImageText: gameActivity.class.name,
            };
            if (gameActivity.time) {
                rpcActivity.endTimestamp = Date.now() + gameActivity.time * 1e3;
            }
            ipcRenderer.invoke('RPC_SEND', rpcActivity);
        } catch (error) {
            rpcActivity = {
                state: 'Playing Krunker',
                largeImageKey: 'laf_icon',
                largeImageText: 'LaF CLient',
            };
            ipcRenderer.invoke('RPC_SEND', rpcActivity);
        }
    };
    if (isEnabledRPC) {
        rpcActivity = {
            startTimestamp: Math.floor(Date.now() / 1e3),
        };
        ipcRenderer.invoke('RPC_SEND', rpcActivity);
        rpcInterval = setInterval(sendDiscordRPC, 500);
    }
};

const injectAltManager = () => {
    const mMenuHolDefEl = document.getElementById('mMenuHolDef');
    mMenuHolDefEl.insertAdjacentHTML('beforeend', `
    <div class="button buttonR lgn" id="logoutBtn" style="display:none;position:absolute;top:2px;right:990px;width:250px;margin-right:0px;padding-top:5px;padding-bottom:13px;z-index:2147483647 !important;" onmouseenter="playTick()" onclick="SOUND.play(\`select_0\`,0.1);window.logoutAcc()">
    Logout <span class="material-icons" style="color:#fff;font-size:30px;margin-left:6px;margin-top:-8px;margin-right:-10px;vertical-align:middle;">logout</span></div>
    <div class="button buttonPI lgn" id="altManagerBtn" style="position:absolute;top:2px;right:720px;width:250px;margin-right:0px;padding-top:5px;padding-bottom:13px;z-index:2147483647 !important;" onmouseenter="playTick()" onclick="SOUND.play(\`select_0\`,0.1);window.gt.showAltMng()">
    Alt Manager <span class="material-icons" style="color:#fff;font-size:30px;margin-left:6px;margin-top:-8px;margin-right:-10px;vertical-align:middle;">manage_accounts</span></div>
    <div class="button buttonP lgn" id="linkCmdBtn" style="position:absolute;top:2px;right:625px;width:75px;margin-right:0px;padding-top:5px;padding-bottom:13px;z-index:2147483647 !important;" onmouseenter="playTick()" onclick="SOUND.play(\`select_0\`,0.1);window.gt.toggleSetting('enableLinkCmd', false)">
    <span id="linkCmdBtnTxt" class="material-icons" style="color:#fff;font-size:30px;margin-left:6px;margin-top:-5px;margin-right:6px;vertical-align:middle;">${config.get('enableLinkCmd', false) ? 'link' : 'link_off'}</span></div>
    `);
    const loggedIn = false;
    setInterval(() => {
        const logoutBtnEl = document.getElementById('logoutBtn');
        const linkCmdBtnTxtEl = document.getElementById('linkCmdBtnTxt');
        const signedInHeaderBarEl = document.getElementById('signedInHeaderBar');
        if (signedInHeaderBarEl.style.display !== 'none') {
            logoutBtnEl.style.display = 'block';
        } else {
            logoutBtnEl.style.display = 'none';
        }
        if (config.get('enableLinkCmd', false)) {
            linkCmdBtnTxtEl.innerText = 'link';
        } else {
            linkCmdBtnTxtEl.innerText = 'link_off';
        }
        try {
            document.getElementById('mouseAccel_div').style.display = 'block'
        } catch {
            // DO NOTHING
        }
    }, 250);
};

const injectAltManagerHeader = () => {
    if (document.getElementById('windowHeader').innerText !== 'Game Settings') return;
    const settingsHeaderEl = document.getElementsByClassName('settingsHeader');
    const lastChildEl = settingsHeaderEl[0].firstElementChild.firstElementChild;
    lastChildEl.insertAdjacentHTML('beforebegin', `
    <div class='settingsBtn' style='background-color:#ff4747;' onclick='window.logoutAcc()'>Logout</div>
    <div class='settingsBtn' style='margin-left:16px;width:150px;background-color:#fa50ae;' onclick='window.gt.showAltMng()'>AltManager</div>
    `);
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
            menuContainer = document.getElementById('menuItemContainer');
            menuContainer.removeChild(menuContainer.children[7]);
            menuContainer.insertAdjacentHTML('afterbegin', `
            <div class="menuItem" onmouseenter="playTick()" onclick="SOUND.play(\`select_0\`,0.15);clientExitPopup()" id="clientExit" style="display: inherit;">
            <div class="menuItemIcon iconExit"></div>
            <div class="menuItemTitle" id="menuBtnExit">Exit</div>
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
        } catch (e) {
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
    const winObserver = new MutationObserver(() => {
        winObserver.disconnect();
        tools.setupGameWindow();
        window.closeClient = () => {
            ipcRenderer.send('exitClient');
        };
    });
    const menuObserver = new MutationObserver(() => {
        injectAltManagerHeader();
    });
    winObserver.observe(document.getElementById('instructions'), { childList: true });
    menuObserver.observe(document.getElementById('menuWindow'), { childList: true });
});

ipcRenderer.on('didFinishLoad', () => {
    window.gt = new lafTools.gameTools();
    injectExitBtn();
    injectWaterMark();
    initDiscordRPC();
    if (isEnabledAltManager) injectAltManager();
    if (isEnabledTimer) initMenuTimer();
});

ipcRenderer.on('getLink', (e) => {
    ipcRenderer.invoke('sendLink', location.href);
});

ipcRenderer.on('twitchEvent', (e, v) => {
    const el = document.getElementById('lafTwitchLink');
    switch (v) {
        case 'loggedIn':
            el.innerText = langPack.settings.twitchLinked.replace('{0}', config.get('twitchAcc'));
            break;
        case 'logOut':
            el.innerText = langPack.settings.twitchUnlinked;
            break;
        case 'loginErr':
            el.innerText = langPack.settings.twitchError;
    }
});

ipcRenderer.on('joinMatch', async() => {
    const url = 'https://matchmaker.krunker.io/game-list?hostname=krunker.io';
    const MODES = {
        ffa: 0,
        tdm: 1,
        hp: 2,
        ctf: 3,
        po: 4,
        has: 5,
        inf: 6,
        race: 7,
        lms: 8,
        ss: 9,
        gg: 10,
        ph: 11,
        bh: 12,
        st: 13,
        koh: 14,
        oic: 15,
        td: 16,
        kc: 17,
        df: 18,
        ss: 19,
        tr: 20,
        raid: 21,
        bl: 22,
        dom: 23,
        kffa: 24
    };
    fetch(url)
        .then(res => res.json())
        .then(data => {
            let region = null;
            if (config.get('joinMatchPresentRegion', true)) {
                const gameActivity = window.getGameActivity()
                region = new RegExp(`${gameActivity.id.slice(0, 3)}:.+`);
            } else {
                region = new RegExp(/.+:.+/);
            }
            const joinableGames = data.games.filter(game => game[2] < game[3] && region.test(game[0]) && (game[4].g === MODES[config.get('joinMatchMode')] || config.get('joinMatchMode', 'all') === 'all') && (config.get('joinMatchCustom', false) ? game[4].c : !game[4].c) && (config.get('joinMatchOCustom', false) ? game[4].oc : !game[4].oc));
            /*
            ・人数が上限に達していない
            ・リージョンが設定と一致する
            ・モードが設定と一致する
            ・カスタム・公式カスタムのフラグが設定と一致する
            */
            joinableGames.sort(function(a, b) {
                if (a[2] > b[2]) return -1;
                if (a[2] < b[2]) return 1;
                return 0
            })
            if (joinableGames.length) {
                window.open(`https://krunker.io/?game=${joinableGames[0][0]}`);
            } else {
                tools.sendChat(langPack.misc.noJoinableGames, '#fc03ec');
            }
        });
});