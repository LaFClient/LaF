const { ipcRenderer, shell } = require('electron');
const store = require('electron-store');
const log = require('electron-log');

const settings = require('./settings');

const config = new store();
const langPack = require(config.get('lang', 'en_US') === 'ja_JP' ? '../../lang/ja_JP' : '../../lang/en_US');

exports.clientTools = class {
    urlType(url) {
        if (url.startsWith('https://krunker.io/social.html')) return 'hub';
        if (url.startsWith('https://krunker.io/editor.html')) return 'editor';
        if (url.startsWith('https://krunker.io/viewer.html')) return 'viewer';
        if (url.startsWith('https://krunker.io') || url.startsWith('https://comp.krunker.io/?game=') || url.startsWith('https://127.0.0.1:8080')) return 'game';
        return 'external';
    }
    generateHTML(obj) {
        switch (obj.type) {
            case 'checkbox':
                return `
                        <label class='switch'>
                        <input type='checkbox' onclick='window.gt.setSetting("${obj.id}", this.checked);${obj.onchange ? obj.onchange : ''}'${config.get(obj.id, obj.default) ? ' checked' : ''}>
                        <span class='slider'></span>
                        </label>`;
            case 'select':
                let tmpHTML = `<select onchange='window.gt.setSetting("${obj.id}", this.value);${obj.onchange ? obj.onchange : ''}' class="inputGrey2">`;
                Object.keys(obj.options).forEach((k) => {
                    tmpHTML += `<option value="${k}" ${config.get(obj.id, obj.default) === k ? ' selected' : ''}>${obj.options[k]}</option>`;
                });
                return tmpHTML + '</select>';
            case 'selectec':
                let tmpHTMLoc = `<select onchange='window.gt.setSetting("${obj.id}", this.value);window.gt.changeCSS(this.value);' class="inputGrey2">`;
                Object.keys(obj.options).forEach((k) => {
                    tmpHTMLoc += `<option value="${k}" ${config.get(obj.id, obj.default) === k ? ' selected' : ''}>${obj.options[k]}</option>`;
                });
                return tmpHTMLoc + '</select>';
            case 'slider':
                return `
                        <input type='number' class='sliderVal' id='c_slid_input_${obj.id}' min='${obj.min}' max='${obj.max}' value='${config.get(obj.id, obj.default)}' onkeypress='window.gt.setdSetting("${obj.id}", this)' style='border-width:0px'/><div class='slidecontainer'><input type='range' id='c_slid_${obj.id}' min='${obj.min}' max='${obj.max}' step='${obj.step}' value='${config.get(obj.id, obj.default)}' class='sliderM' oninput='window.gt.setSetting("${obj.id}", this.value)'></div>
                        `;
            case 'file':
                return `
                        <button class='settingsBtn' onclick='window.utils.tolset("${obj.id}")' style="float:right;margin-top:5px;">${langPack.selectFile}</button><div id='${obj.id}' style="font-size:13pt;margin-top:10px;text-align:right;">${config.get(obj.id, obj.default)}</div>
                        `;
            case 'fileWithEyes':
                return `
                        <button class='settingsBtn' onclick='window.gt.openFileDialog("${obj.id}")' style="float:right;margin-top:5px;width:auto;">${langPack.settings.selectFile}</button>
                        <a class="material-icons" id="eye_${obj.id}" onclick="window.gt.changeVisibility('${obj.id}')" style="text-decoration:none;float:right;margin-top:10px;color:rgba(255,255,255,1);">${config.get(`${obj.id}_visibility`, true) ? 'visibility' : 'visibility_off'}</a>
                        <div id='${obj.id}_value' style="font-size:13pt;margin-top:10px;text-align:right;display:${config.get(`${obj.id}_visibility`, true) ? '' : 'none'};">${obj.val}</div>
                        `;
            default:
                return `
                <input type='${obj.type}' name='${obj.id}' id='c_slid_${obj.id}' ${obj.type == 'color' ? 'style="float:right;margin-top:5px;"' : `class='inputGrey2' ${obj.placeholder ? `placeholder='${obj.placeholder}'` : ''}}`} value='${config.get(obj.id, obj.default).replace(/'/g, '')}' oninput='window.gt.setSetting("${obj.id}", this.value)'/>
                `;
        }
    }
    setupGameWindow() {
        const injectSettings = () => {
            let settingsWindow = window.windows[0];

            const GetSettings = settingsWindow.getSettings;
            settingsWindow.getSettings = (...args) => GetSettings.call(settingsWindow, ...args).replace(/^<\/div>/, '') + settingsWindow.getCSettings();

            settingsWindow.getCSettings = () => {
                settingsWindow = window.windows[0];
                let customHTML = '';
                if (settingsWindow.tabIndex !== 6 && !settingsWindow.settingSearch) {
                    return '';
                }
                let prevCat = null;
                Object.values(settings).forEach((k) => {
                    if (settingsWindow.settingSearch && !window.gt.searchMatches(k.id, k.title, k.cat)) {
                        return '';
                    }
                    let tmpHTML = '';
                    if (k.cat != prevCat) {
                        if (prevCat) {
                            tmpHTML += '</div>';
                        }
                        tmpHTML += `<div class='setHed' id='setHed_${k.cat}' onclick='window.windows[0].collapseFolder(this)'><span class='material-icons plusOrMinus'>keyboard_arrow_down</span>${k.cat}${prevCat ? '' : `<span id="requiresRestart"><span style="color: #eb5656">*</span> ${langPack.settings.requireRestart}</span>`}</div><div class='setBodH' id='setBod_${k.cat}'>`;
                        prevCat = k.cat;
                    }
                    tmpHTML += `<div class='settName' id='${k.id}_div' style='display:${k.hide ? 'none' : 'block'}'>${k.title} `;
                    if (k.restart) {
                        tmpHTML += '<span style=\'color: #eb5656\'> *</span>';
                    }
                    customHTML += tmpHTML + this.generateHTML(k) + '</div>';
                });
                if (!settingsWindow.settingSearch) {
                    customHTML += `
                    </div>
                    <div style='display:flex;width:100%;justify-content:space-around;'>
                        <div class="button buttonR lgn" style="width:50%;padding-top:5px;padding-bottom:13px;margin:3px" onmouseenter="playTick()" onclick="SOUND.play(\`select_0\`,0.1);window.gt.resetOptions()">
                            ${langPack.settings.resetOptions} <span class="material-icons" style="color:#fff;font-size:30px;margin-left:6px;margin-top:-8px;margin-right:-10px;vertical-align:middle;">restart_alt</span>
                        </div>
                        <div class="button buttonR lgn" id="clearData" style="width:50%;padding-top:5px;padding-bottom:13px;margin:3px" onmouseenter="playTick()" onclick="SOUND.play(\`select_0\`,0.1);window.gt.clearUserData()">
                            ${langPack.settings.clearUserData} <span class="material-icons" style="color:#fff;font-size:30px;margin-left:6px;margin-top:-8px;margin-right:-10px;vertical-align:middle;">delete_forever</span>
                        </div>
                    </div>
                    <div style='display:flex;width:100%;justify-content:space-around;'>
                        <div class="button buttonPI lgn" style="width:50%;padding-top:5px;padding-bottom:13px;margin:3px" onmouseenter="playTick()" onclick="SOUND.play(\`select_0\`,0.1);window.gt.openSwapper()">
                            ${langPack.settings.openSwapper} <span class="material-icons" style="color:#fff;font-size:30px;margin-left:6px;margin-top:-8px;margin-right:-10px;vertical-align:middle;">folder_open</span>
                        </div>
                        <div class="button buttonO lgn" style="width:50%;padding-top:5px;padding-bottom:13px;margin:3px" onmouseenter="playTick()" onclick="SOUND.play(\`select_0\`,0.1);window.gt.restartClient()">
                            ${langPack.settings.restartClient} <span class="material-icons" style="color:#fff;font-size:30px;margin-left:6px;margin-top:-8px;margin-right:-10px;vertical-align:middle;">power_settings_new</span>
                        </div>
                    </div>
                    <div style='display:flex;width:100%;justify-content:space-around;'>
                        <div class="button buttonG lgn" style="width:50%;padding-top:5px;padding-bottom:13px;margin:3px" onmouseenter="playTick()" onclick="SOUND.play(\`select_0\`,0.1);window.gt.openInfo()">
                            ${langPack.settings.openInfo} <span class="material-icons" style="color:#fff;font-size:30px;margin-left:6px;margin-top:-8px;margin-right:-10px;vertical-align:middle;">code</span>
                        </div>
                        <div class="button buttonPI lgn" style="width:50%;padding-top:5px;padding-bottom:13px;margin:3px" onmouseenter="playTick()" onclick="SOUND.play(\`select_0\`,0.1);window.gt.openCSSInfo()">
                            ${langPack.settings.openCSSInfo} <span class="material-icons" style="color:#fff;font-size:30px;margin-left:6px;margin-top:-8px;margin-right:-10px;vertical-align:middle;">brush</span>
                        </div>
                    </div>
                    <div style='display:flex;width:100%;justify-content:space-around;'>
                        <div class="button buttonP lgn" id="lafTwitchLink" style="width:100%;padding-top:5px;padding-bottom:13px;margin:3px" onmouseenter="playTick()" onclick="SOUND.play(\`select_0\`,0.1);window.gt.linkTwitch()">
                            ${config.get('twitchAcc', null) ? `${config.get('twitchError', false) ? langPack.settings.twitchError : langPack.settings.twitchLinked.replace('{0}', config.get('twitchAcc'))}` : langPack.settings.twitchUnlinked}
                        </div>
                    </div>
                    <div style='display:flex;width:100%;justify-content:space-around;'>
                        <div class="button lgn" style="width:90%;padding-top:5px;padding-bottom:13px;margin:3px;border:4px solid #5865F2;" onmouseenter="playTick()" onclick="SOUND.play(\`select_0\`,0.1);window.open('https://discord.gg/9M9TgDRt9G')">
                            ${langPack.settings.openDiscord} <span class="material-icons" style="color:#fff;font-size:30px;margin-top:-8px;vertical-align:middle;">support_agent</span>
                        </div>
                        <div class="button buttonP lgn" style="width:5%;padding-top:5px;padding-bottom:13px;margin:3px" onmouseenter="playTick()" onclick="SOUND.play(\`select_0\`,0.1);window.gt.openLogFolder()">
                            <span class="material-icons" style="color:#fff;font-size:30px;margin-top:-8px;vertical-align:middle;">description</span>
                        </div>
                        <div class="button buttonP lgn" style="width:5%;padding-top:5px;padding-bottom:13px;margin:3px" onmouseenter="playTick()" onclick="SOUND.play(\`select_0\`,0.1);window.gt.copyPCInfo()">
                            <span class="material-icons" style="color:#fff;font-size:30px;margin-top:-8px;vertical-align:middle;">bug_report</span>
                        </div>
                    </div>
                    `;
                    setTimeout(() => {
                        const settHolderEl = document.getElementById('settHolder');
                        settHolderEl.removeChild(settHolderEl.firstElementChild);
                    }, 1);
                }
                return customHTML ? customHTML + '</div>' : '';
            };
        };
        injectSettings();
    }
    sendChat(msg, color) {
        const chatListEl = document.getElementById('chatList');
        const chatId = chatListEl.children.length;
        const html = `<div data-tab="-1" id="chatMsg_${chatId}"><div class="chatItem"><span class="chatMsg" ${color ? `style="color:${color}"` : ''}>&lrm;${msg}&lrm;</spam/></div><br></div>`;
        chatListEl.insertAdjacentHTML('beforeend', html);
        chatListEl.scrollTop = chatListEl.scrollHeight;
    }
};
exports.gameTools = class {
    searchMatches(id, name, cat) {
        const settingsWindow = window.windows[0];
        const query = settingsWindow.settingSearch.toLowerCase() || '';
        return (id.toLowerCase() || '').includes(query) || (name.toLowerCase() || '').includes(query) || (cat.toLowerCase() || '').includes(query);
    }
    openFileDialog(id) {
        ipcRenderer.invoke('openFileDialog').then((result) => {
            if (result !== undefined) {
                const el = document.getElementById(`${id}_value`);
                el.innerText = result;
                const linkEl = document.getElementById('ec_custom');
                linkEl.setAttribute('href', `laf://${result}`);
            }
        });
    }
    changeVisibility(id) {
        const el = document.getElementById(`eye_${id}`);
        if (config.get(`${id}_visibility`, true)) {
            el.innerText = 'visibility_off';
            document.getElementById(`${id}_value`).style.display = 'none';
            config.set(`${id}_visibility`, false);
        }
        else {
            el.innerText = 'visibility';
            document.getElementById(`${id}_value`).style.display = '';
            config.set(`${id}_visibility`, true);
        }
    }
    showAltMng(flag = false) {
        document.getElementById('windowHolder').className = 'popupWin';
        document.getElementById('menuWindowSideL').style.display = 'none';
        const menuWindow = document.getElementById('menuWindow');
        menuWindow.classList = 'dark';
        menuWindow.style.overflowY = 'auto';
        menuWindow.style.width = '800px';
        let tmpHTML = `
        <div id='amTitle' style='font-size:30px;text-align:center;margin:3px;font-weight:700;'>Alt Manager</div>
        <hr style='color:rgba(28, 28, 28, .5);'>
        <div class='button buttonPI lgn' id='addAccBtn' style='text-align:center;width:98%;margin:3px;padding-top:5px;padding-bottom:13px' onmouseenter='playTick()' onclick='SOUND.play(\`select_0\`,0.1);window.gt.showAddAltAcc()'>Add Account</div>
        <div class='amHolder' style='display:flex;flex-direction:column;justify-content:center;'>
        `;
        const generateHTML = () => {
            const altAccounts = JSON.parse(localStorage.getItem('altAccounts'));
            if (!altAccounts) return;
            Object.keys(altAccounts).forEach((k) => {
                tmpHTML += `
                <div class='amAccName' style='display:flex;justify-content:flex-end;align-items:center;'>
                    <span style='margin-right:auto;color:#FFFFFF'>${k}</span>
                    <div class='button buttonG lgn' style='width:70px;margin-right:0px;padding-top:3px;padding-bottom:15px;transform:scale(0.75)' onmouseenter='playTick()' onclick='window.gt.loginAcc("${k}")'>
                        <span class='material-icons' style='vertical-align:bottom;color:#fff;font-size:30px;margin-bottom:-1px;'>login</span>
                    </div>
                    <div class='verticalSeparator' style='height:35px;background:rgba(28, 28, 28, .3);'></div>
                    <div class='button buttonY lgn' style='width:70px;margin-right:0px;padding-top:3px;padding-bottom:15px;transform:scale(0.75)' onmouseenter='playTick()' onclick='window.gt.editAcc("${k}")'>
                        <span class='material-icons' style='vertical-align:bottom;color:#fff;font-size:30px;margin-bottom:-1px;'>edit</span>
                    </div>
                    <div class='button buttonR lgn' style='width:70px;margin-right:0px;padding-top:3px;padding-bottom:15px;transform:scale(0.75)' onmouseenter='playTick()' onclick='window.gt.deleteAcc("${k}")'>
                        <span class='material-icons' style='vertical-align:bottom;color:#fff;font-size:30px;margin-bottom:-1px;'>delete</span>
                    </div>
                </div>`;
            });
            tmpHTML += '</div>';
        };
        generateHTML();
        if (document.getElementById('windowHolder').style.display === 'block' && !flag) {
            if (document.getElementById('windowHeader').innerText === 'Alt Manager') {
                document.getElementById('windowHolder').style.display = 'none';
            }
            else {
                document.getElementById('windowHeader').innerText = 'Alt Manager';
                menuWindow.innerHTML = tmpHTML;
            }
        }
        else {
            document.getElementById('windowHolder').style.display = 'block';
            document.getElementById('windowHeader').innerText = 'Alt Manager';
            menuWindow.innerHTML = tmpHTML;
        }
    }
    changeCSS(k) {
        Object.values(document.getElementsByClassName('easycss')).forEach((el) => {
            el.disabled = true;
        });
        const el = document.getElementById('ec_' + k);
        el.disabled = false;
    }
    showAddAltAcc() {
        const menuWindowEl = document.getElementById('menuWindow');
        menuWindowEl.outerHTML = `
        <div id='menuWindow' class='dark' style='overflow-y: auto; width: 960px;'>
            <div style='position:relative;z-index:9'>
                <div id='referralHeader'>Add Account</div>
                <div style='height:20px;'></div><input id='accName' type='text' placeholder='Enter Username' class='accountInput' style='margin-top:0'><input id='accPass' type='password' placeholder='Enter Password' class='accountInput'>
                <div class='setBodH' style='margin-left:0px;width:calc(100% - 40px)'>
                    <div id='accResp' style='margin-top:20px;margin-bottom:20px;font-size:18px;color:rgba(255,255,255,0.5);text-align:center'>For lost Passwords/Accounts contact <span style='color:rgba(255,255,255,0.8)'>recovery@yendis.ch</span></div>
                </div>
                <div style='width:100%;text-align:center;margin-top:10px;background-color:rgba(0,0,0,0.3);padding-top:10px;padding-bottom:20px;'>
                    <div class='accBtn button buttonPI' style='width:95%' onclick='SOUND.play(\`select_0\`,0.1);window.gt.addAltAcc()'>Add Account</div>
                </div>
            </div>
        </div>`;
    }
    addAltAcc(f = false) {
        const accNameEl = document.getElementById('accName');
        const accPassEl = document.getElementById('accPass');
        const accPassB64 = Buffer.from(accPassEl.value).toString('base64');
        let altAccounts = JSON.parse(localStorage.getItem('altAccounts'));
        if (!altAccounts) {
            altAccounts = {
                [accNameEl.value]: accPassB64,
            };
            localStorage.setItem('altAccounts', JSON.stringify(altAccounts));
            accNameEl.value = '';
            accPassEl.value = '';
            document.getElementById('accResp').innerText = langPack.altManager.addAcc.ok;
        }
        else {
            let existing = false;
            Object.keys(altAccounts).forEach((k) => {
                if (k === accNameEl.value && !f) {
                    document.getElementById('accResp').innerText = langPack.altManager.addAcc.error;
                    existing = true;
                }
            });
            if (!existing) {
                altAccounts[accNameEl.value] = accPassB64;
                localStorage.setItem('altAccounts', JSON.stringify(altAccounts));
                document.getElementById('accName').value = '';
                document.getElementById('accPass').value = '';
                document.getElementById('accResp').innerText = f ? langPack.altManager.addAcc.saveok : langPack.altManager.addAcc.ok;
            }
        }
    }
    loginAcc(accName) {
        let accNameEl = document.getElementById('accName');
        let accPassEl = document.getElementById('accPass');
        const altAccounts = JSON.parse(localStorage.getItem('altAccounts'));
        window.logoutAcc();
        accNameEl = document.getElementById('accName');
        accPassEl = document.getElementById('accPass');
        accNameEl.value = accName;
        accPassEl.value = Buffer.from(altAccounts[accName], 'base64').toString();
        accNameEl.style.display = 'none';
        accPassEl.style.display = 'none';
        document.getElementsByClassName('accBtn').forEach((k) => {
            k.style.display = 'none';
        });
        setTimeout(() => {
            window.loginAcc();
        }, 100);
    }
    deleteAcc(accName) {
        ipcRenderer.invoke('showDialog', accName)
        .then((v) => {
            if (!v) {
                const altAccounts = JSON.parse(localStorage.getItem('altAccounts'));
                delete altAccounts[accName];
                localStorage.setItem('altAccounts', JSON.stringify(altAccounts));
                this.showAltMng(true);
            }
        });
    }
    editAcc(accName) {
        const menuWindowEl = document.getElementById('menuWindow');
        menuWindowEl.outerHTML = `
        <div id='menuWindow' class='dark' style='overflow-y: auto; width: 960px;'>
            <div style='position:relative;z-index:9'>
                <div id='referralHeader'Add Account</div>
                <div style='height:20px;'></div><input id='accName' type='text' placeholder='Enter Username' class='accountInput' style='margin-top:0' value='${accName}' readonly='readonly'><input id='accPass' type='password' placeholder='Enter Password' class='accountInput'>
                <div class='setBodH' style='margin-left:0px;width:calc(100% - 40px)'>
                    <div id='accResp' style='margin-top:20px;margin-bottom:20px;font-size:18px;color:rgba(255,255,255,0.5);text-align:center'>${langPack.altManager.editAcc.edit.replace('%accName%', accName)}</div>
                </div>
                <div style='width:100%;text-align:center;margin-top:10px;background-color:rgba(0,0,0,0.3);padding-top:10px;padding-bottom:20px;'>
                    <div class='accBtn button buttonG' style='width:95%' onclick='SOUND.play(\`select_0\`,0.1);window.gt.saveAcc()'>Save Account</div>
                </div>
            </div>
        </div>`;
    }
    saveAcc() {
        try {
            this.addAltAcc(true);
        }
        catch (e) {
            log.error(e);
        }
        setTimeout(() => { document.getElementById('windowHolder').style.display = 'none'; }, 3000);
    }
    setSetting(id, status) {
        config.set(id, status);
    }
    setdSetting(id, status, time) {
        setTimeout(() => {
            config.set(id, status);
        }, time);
    }
    getSetting(id, def = false) {
        config.get(id, def);
    }
    toggleSetting(id, def) {
        config.set(id, !config.get(id, def));
    }
    resetOptions() {
        if (confirm(langPack.dialog.confirmResetConfig)) {
            config.clear();
            alert(langPack.dialog.resetedConfig);
            ipcRenderer.invoke('restartClient');
        }
    }
    clearUserData() {
        if (confirm(langPack.dialog.confirmClearData)) {
            ipcRenderer.invoke('clearUserData');
            alert(langPack.dialog.clearedData);
            ipcRenderer.invoke('restartClient');
        }
    }
    openSwapper() {
        ipcRenderer.invoke('openSwapper');
    }
    restartClient() {
        ipcRenderer.invoke('restartClient');
    }
    openInfo() {
        shell.openExternal('https://hiro527.github.io');
    }
    openCSSInfo() {
        shell.openExternal('https://namekujilsds.github.io');
    }
    openLogFolder() {
        ipcRenderer.send('openLogFolder');
    }
    copyPCInfo() {
        ipcRenderer.send('copyPCInfo');
        alert(langPack.dialog.copiedSysInfo);
    }
    linkTwitch() {
        if (config.get('twitchToken', null)) {
            if (confirm(langPack.dialog.twitchLogout)) {
                config.set('twitchToken', null);
                config.set('twitchAcc', null);
                config.set('twitchAccId', null);
            }
            log.info('Twitch: Logged Out');
            document.getElementById('lafTwitchLink').innerText = langPack.settings.twitchUnlinked;
        }
        else {
            ipcRenderer.invoke('linkTwitch');
        }
    }
    injectExitBtn() {
        menuContainer = document.getElementById('menuItemContainer');
        const exitBtn = document.getElementById('clientExit');
        const exitBtn2 = document.getElementById('clientExit2') || undefined;
        switch (config.get('showExitBtn', 'bottom')) {
            case 'top':
                if (!exitBtn2) {
                    menuContainer.insertAdjacentHTML('afterbegin', `
                    <div class="menuItem" onmouseenter="playTick()" onclick="SOUND.play(\`select_0\`,0.15);clientExitPopup()" id="clientExit2" style="display: inherit;">
                    <span class="material-icons-outlined menBtnIcn" style="color:#fb5555">exit_to_app</span>
                    <div class="menuItemTitle" id="menuBtnExit">Exit</div>
                    </div>
                    `);
                }
                exitBtn.style.display = 'none';
                alert(langPack.settings.exitBtnAlert);
                break;
            case 'bottom':
                exitBtn.style.display = 'inherit';
                exitBtn2.remove();
                break;
            case 'disable':
                exitBtn.style.display = 'none';
                exitBtn2.remove();
                break;
        }
    }
    toggleDisplay(id) {
        const el = document.getElementById(id);
        if (el.style.display == 'none') {
            el.style.display = el.getAttribute('displayType') ? el.getAttribute('displayType') : 'block';
        }
        else {
            el.setAttribute('displayType', el.style.display);
            el.style.display = 'none';
        }
    }
};