require('v8-compile-cache');
const { ipcRenderer } = require('electron');
const store = require('electron-store');
const log = require('electron-log');

const config = new store();

const langPack = require(config.get('lang', 'en_US') === 'ja_JP' ? '../../lang/ja_JP' : '../../lang/en_US');

log.info('Script Loaded: js/util/settings.js');

module.exports = {
    lang: {
        title: langPack.settings.lang,
        cat: 'General',
        type: 'select',
        val: config.get('lang', 'en_US'),
        options: {
            ja_JP: '日本語',
            en_US: 'English',
        },
        restart: true,
    },
    enableSwapper: {
        title: langPack.settings.enableSwapper,
        cat: 'General',
        type: 'checkbox',
        val: config.get('enableResourceSwapper', true),
        restart: true,
    },
    enableRPC: {
        title: langPack.settings.enableRPC,
        cat: 'General',
        type: 'checkbox',
        val: config.get('enableRPC', true),
        restart: true,
    },
    enableAltManager: {
        title: langPack.settings.enableAltManager,
        cat: 'General',
        type: 'checkbox',
        val: config.get('enableAltMng', true),
        restart: true,
    },
    unlimitedFPS: {
        title: langPack.settings.unlimitedFPS,
        cat: 'Graphics',
        type: 'checkbox',
        val: config.get('unlimitedFPS', true),
        restart: true,
    },
    angleType: {
        title: langPack.settings.angleType,
        cat: 'Graphics',
        type: 'select',
        val: config.get('angleType', 'Default'),
        restart: true,
        options: {
            default: 'Default',
            gl: 'OpenGL',
            d3d11: 'D3D11',
            d3d9: 'D3D9',
            d3d11on12: 'D3D11on12',
        },
    },
    webgl2Context: {
        title: langPack.settings.webgl2Context,
        cat: 'Graphics',
        type: 'checkbox',
        val: config.get('webgl2Context', true),
        restart: true,
    },
    acceleratedCanvas: {
        title: langPack.settings.acceleratedCanvas,
        cat: 'Graphics',
        type: 'checkbox',
        val: config.get('acceleratedCanvas', true),
        restart: true,
    },
    easyCSSMode: {
        title: langPack.settings.easyCSSMode,
        cat: 'Customize',
        type: 'select',
        val: config.get('easyCSSMode', 'disable'),
        restart: true,
        options: {
            type1: langPack.settings.easyCSStype1,
            type2: langPack.settings.easyCSStype2,
            //type3: langPack.easyCSStype3,
            custom: langPack.settings.easyCSSCustom,
            disable: langPack.settings.easyCSSDisable,
        },
    },
    userCSSPath: {
        title: langPack.settings.userCSSPath,
        cat: 'Customize',
        type: 'fileWithEyes',
        val: config.get('userCSSPath', ''),
        restart: true,
    },
    showExitBtn: {
        title: langPack.settings.showExitBtn,
        cat: 'Customize',
        type: 'select',
        val: config.get('showExitBtn', 'bottom'),
        restart: true,
        options: {
            top: langPack.settings.topExitBtn,
            bottom: langPack.settings.bottomExitBtn,
            disable: langPack.settings.disableExitBtn,
        },
    },
};