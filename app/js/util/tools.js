const { ipcRenderer } = require('electron');
const store = require('electron-store');
const log = require('electron-log');

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
};
exports.gameTools = class {
    searchMatches(id, name, cat) {
        const settingsWindow = window.windows[0];
        const query = settingsWindow.settingSearch.toLowerCase() || '';
        return (id.toLowerCase() || '').includes(query) || (name.toLowerCase() || '').includes(query) || (cat.toLowerCase() || '').includes(query);
    }
    showAltMng() {
        const menuWindow = document.getElementById('menuWindow');
        // overflow-y: auto;width: 800px;max-height: calc(100% - 330px);top: 50%;transform: translate(-50%, -50%);
        menuWindow.classList = 'dark';
        menuWindow.style.overflowY = 'auto';
        menuWindow.style.width = '800px';
        menuWindow.style.maxHeight = 'calc(100% - 330px)';
        menuWindow.style.top = '50%';
        menuWindow.style.transform = 'translate(-50%, -50%)';
        let tmpHTML = `
        <div id='amTitle' style='font-size:30px;text-align:center;margin:3px;font-weight:700;'>Alt Mamager</div>
        <hr style='color:rgba(28, 28, 28, .5);'>
        <div class='button buttonPI lgn' id='addAccBtn' style='text-align:center;width:98%;margin:3px;padding-top:5px;padding-bottom:13px' onmouseenter='playTick()' onclick='SOUND.play(\`select_0\`,0.1);window.gt.showAddAltAcc()'>Add Acount</div>
        <div class='amHolder' style='display:flex;flex-direction:column;justify-content:center;'>
        `;
        const generateHTML = () => {
            const altAccounts = JSON.parse(localStorage.getItem('altAccounts'));
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
        if (document.getElementById('windowHolder').style.display === 'block') {
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
    showAddAltAcc() {
        const menuWindowEl = document.getElementById('menuWindow');
        menuWindowEl.outerHTML = `
        <div id='menuWindow' class='dark' style='overflow-y: auto; width: 960px; max-height: calc(100% - 330px); top: 50%; transform: translate(-50%, -50%);'>
            <div style='position:relative;z-index:9'>
                <div id='referralHeader'Add Account</div>
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
        const accPassB64 = btoa(accPassEl.value);
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
        accPassEl.value = atob(altAccounts[accName]);
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
        ipcRenderer.invoke('showDialog', accName).then((v) => {
            if (v === 0) {
                const altAccounts = JSON.parse(localStorage.getItem('altAccounts'));
                delete altAccounts[accName];
                localStorage.setItem('altAccounts', JSON.stringify(altAccounts));
                this.showAltMng(true);
            }
        });
        return;
    }
    editAcc(accName) {
        const menuWindowEl = document.getElementById('menuWindow');
        menuWindowEl.outerHTML = `
        <div id='menuWindow' class='dark' style='overflow-y: auto; width: 960px; max-height: calc(100% - 330px); top: 50%; transform: translate(-50%, -50%);'>
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
    getSetting(id, status) {
        config.get(id, status);
    }
    restartClient() {
        ipcRenderer.invoke('restartClient');
    }
};