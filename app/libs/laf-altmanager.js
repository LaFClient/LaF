require('v8-compile-cache');
const log = require("electron-log");
const store = require("electron-store");

// 初期化ブロック
Object.assign(console, log.functions);
const config = new store();
switch (config.get("lang", "ja_JP")) {
    case "ja_JP":
        const langRes = require("../lang/ja_JP");
        break;
    case "en_US":
        const langRes = require("../lang/en_US");
        break;
}
const langPack = new langRes.lang();

// 本体
export class manager {
    insertHeaderBtnHTML() {
        let signedOutHeaderBarEl = document.getElementById("signedOutHeaderBar");
        let mLevelContEl = document.getElementById("mLevelCont");
        let altManagerBtnHTMLloggedOut = `
        <div class="verticalSeparator" style="height:35px;"></div>
        <div class="button buttonPI lgn" id="lafAltMngMBtnO" style="width:auto;margin-right:0px;padding-top:3px;padding-bottom:15px" onmouseenter="playTick()" onclick="window.utils.showAltMng()">
        Alt Manager <span class="material-icons" style="vertical-align:bottom;color:#fff;font-size:30px;margin-bottom:-1px;">manage_accounts</span>
        </div>
        `
        let altManagerBtnHTMLloggedIn = `
        <div class="verticalSeparator" style="height:35px;"></div>
        <div class="button buttonPI lgn" id="lafAltMngMBtnI" style="width:70px;margin-right:0px;padding-top:3px;padding-bottom:15px;transform:scale(0.75)" onmouseenter="playTick()" onclick="window.utils.showAltMng()">
        <span class="material-icons" style="vertical-align:bottom;color:#fff;font-size:30px;margin-bottom:-1px;">manage_accounts</span>
        </div>
        <div class="button buttonR lgn"  id="lafAltMngLogoutBtn" style="width:70px;margin-right:0px;padding-top:3px;padding-bottom:15px;transform:scale(0.75)" onmouseenter="playTick()" onclick="window.logoutAcc()">
        <span class="material-icons" style="vertical-align:bottom;color:#fff;font-size:30px;margin-bottom:-1px;">logout</span>
        </div>
        `
        signedOutHeaderBarEl.insertAdjacentHTML("beforeend", altManagerBtnHTMLloggedOut);
        mLevelContEl.insertAdjacentHTML("afterend", altManagerBtnHTMLloggedIn);
    }
    insertAddAccBtnHTML() {
        let windowHeaderEl = document.getElementById("windowHeader");
        let accountButtonEl = document.getElementsByClassName("accountButton")
        if (windowHeaderEl.innerText = "Account" && accountButtonEl) {
            accountButtonEl[1].insertAdjacentHTML("afterend", "<div class='accountButton' onclick='window.utils.addAltAcc()' style='width:910px'>Add Account</div>");
        }
    }
    showMainUI(force=false) {
        let menuWindowEl = document.getElementById("menuWindow");
        let windowHolderEl = document.getElementById("windowHolder");
        let windowHeaderEl = document.getElementById("windowHeader");
        let altAccounts = JSON.parse(localStorage.getItem("altAccounts"));
        menuWindowEl.style.overflowY = "auto";
        let tmpHTML = `
        <div id="lafAltTitle" style="font-size:30px;text-align:center;margin:3px;font-weight:700;">Alt Mamager</div>
        <hr style="color:rgba(28, 28, 28, .5);">
        <div class="lafAltMngHolder" style="display:flex;flex-direction:column;justify-content:center;">
        `;
        Object.keys(altAccounts).forEach((k) => {
            tmpHTML += `
            <div class="lafAltMngAccName" style="display:flex;justify-content:flex-end;align-items:center;">
            <span style="margin-right:auto">${k}</span>
            <div class="button buttonG lgn" style="width:70px;margin-right:0px;padding-top:3px;padding-bottom:15px;transform:scale(0.75)" onmouseenter="playTick()" onclick="window.utils.loginAcc('${k}')">
            <span class="material-icons" style="vertical-align:bottom;color:#fff;font-size:30px;margin-bottom:-1px;">login</span>
            </div>
            <div class="verticalSeparator" style="height:35px;background:rgba(28, 28, 28, .3);"></div>
            <div class="button buttonY lgn" style="width:70px;margin-right:0px;padding-top:3px;padding-bottom:15px;transform:scale(0.75)" onmouseenter="playTick()" onclick="window.utils.editAcc('${k}')">
            <span class="material-icons" style="vertical-align:bottom;color:#fff;font-size:30px;margin-bottom:-1px;">edit</span>
            </div>
            <div class="button buttonR lgn" style="width:70px;margin-right:0px;padding-top:3px;padding-bottom:15px;transform:scale(0.75)" onmouseenter="playTick()" onclick="window.utils.deleteAcc('${k}')">
            <span class="material-icons" style="vertical-align:bottom;color:#fff;font-size:30px;margin-bottom:-1px;">delete</span>
            </div></div>`
        })
        tmpHTML += "</div>"
        if (windowHolderEl.style.display === "block") {
            if (windowHeaderEl.innerText === "Alt Manager" && !force) {
                windowHolderEl.style.display = "none";
            } else {
                windowHeaderEl.innerText = "Alt Manager";
                menuWindowEl.innerHTML = tmpHTML;
            }
        } else {
            windowHolderEl.style.display = "block";
            windowHeaderEl.innerText = "Alt Manager";
            menuWindowEl.innerHTML = tmpHTML;
        }
    }
    showEditUI(mode="a", accName="") {
        /*
        mode {
            新規追加: a,
            編集: e
        }
        */
        let menuWindowEl = document.getElementById("menuWindow");
        switch (mode) {
            case "a":
                menuWindowEl.innerHTML = `
                <input id="accName" type="text" placeholder="Enter Username" class="accountInput" style="margin-top:0">
                <input id="accPass" type="password" placeholder="Enter New Password" class="accountInput">
                <div class="accountButton" onclick="window.altMng.editAcc('a')" style="width:100%">${langPack.addAcc}</div>
                `
                break;
            case "e":
                menuWindowEl.innerHTML = `
                <input id="accName" type="text" placeholder="Enter Username" class="accountInput" style="margin-top:0" value="${accName}" readonly="readonly">
                <input id="accPass" type="password" placeholder="Enter New Password" class="accountInput">
                <div id="accResp" style="margin-top:10px;font-size:18px;color:rgba(0,0,0,0.5);">${langPack.edittingAcc.replace("%accName%", accName)}</div>
                <div class="accountButton" onclick="window.altMng.saveAcc()" style="width:100%">${langPack.saveAcc}</div>
                `
                break;
        }
    }
    editAcc(mode="a") {
        /*
        mode {
            新規追加: a,
            編集: e,
            削除: d
        }
        */
        let accNameEl = document.getElementById("accName");
        let accPassEl = document.getElementById("accPass");
        let accRespEl = document.getElementById("accResp");
        let accPassB64 = btoa(accPassEl.value);
        let altAccounts = JSON.parse(localStorage.getItem("altAccounts"));
        switch (mode) {
            case "a":
                if (!altAccounts) {
                    altAccounts = {
                        [accNameEl.value]: accPassB64
                    };
                    localStorage.setItem("altAccounts", JSON.stringify(altAccounts));
                    accNameEl.value = "";
                    accPassEl.value = "";
                    accRespEl.innerText = langPack.addAccOK;
                } else {
                    let existing = false;
                    Object.keys(altAccounts).forEach((k) => {
                        if (k === accNameEl.value) {
                            accRespEl.innerText = langPack.addAccErr;
                            existing = true;
                        }
                    })
                    if (!existing) {
                        altAccounts[accNameEl.value] = accPassB64;
                        localStorage.setItem("altAccounts", JSON.stringify(altAccounts));
                        accNameEl.value = "";
                        accPassEl.value = "";
                        accRespEl.innerText = langPack.addAccOK;
                    }
                }
                break;
            case "e":
                altAccounts[accNameEl.value] = accPassB64;
                localStorage.setItem("altAccounts", JSON.stringify(altAccounts));
                accNameEl.value = "";
                accPassEl.value = "";
                accRespEl.innerText = langPack.saveAccOK;
                break;
            case "d":
                if (confirm(langPack.deleteAcc.replace("%accName%", accName))) {
                    let altAccounts = JSON.parse(localStorage.getItem("altAccounts"));
                    delete altAccounts[accName];
                    localStorage.setItem("altAccounts", JSON.stringify(altAccounts));
                    this.showAltMng(true);
                }
        }
    }
    saveAcc() {
        this.editAcc("e");
        setTimeout(document.getElementById("windowHolder").style.display = "none", 3000);
    }
    loginAcc(accName) {
        let accNameEl = document.getElementById("accName");
        let accPassEl = document.getElementById("accPass");
        let altAccounts = JSON.parse(localStorage.getItem("altAccounts"));
        window.logoutAcc()
        accNameEl.value = accName;
        accPassEl.value = atob(altAccounts[accName]);
        window.loginAcc();
        accNameEl.style.display = 'none';
        accPassEl.style.display = 'none';
        document.getElementsByClassName('accountButton').forEach((el) => {
            el.style.display = "none";
        })
    }
}