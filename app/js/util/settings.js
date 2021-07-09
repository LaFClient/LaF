require('v8-compile-cache');
const { ipcRenderer } = require('electron');
const store = require('electron-store');
const log = require('electron-log');

const config = new store();

const langPack = require(config.get('lang', 'en_US') === 'ja_JP' ? '../../lang/ja_JP' : '../../lang/en_US');

log.info('Script Loaded: js/util/settings.js');

module.exports = {
    unlimitedFPS: {
        id: 'unlimitedFPS',
        title: langPack.unlimitedFPS,
        category: 'Video',
        type: 'checkbox',
        restart: true,
        val: config.get('unlimitedFPS', true),
        default: true,
    },
    angleType: {
        id: 'angleType',
        title: langPack.angleType,
        category: 'Video',
        type: 'select',
        restart: true,
        options: {
            default: 'Default',
            gl: 'OpenGL',
            d3d11: 'D3D11',
            d3d9: 'D3D9',
            d3d11on12: 'D3D11on12',
        },
        val: config.get('angleType', 'gl'),
        default: 'gl',
    },
    webgl2Context: {
        id: 'webgl2Context',
        title: langPack.webgl2Context,
        category: 'Video',
        type: 'checkbox',
        restart: true,
        val: config.get('webgl2Context', true),
        default: true,
    },
    acceleratedCanvas: {
        id: 'acceleratedCanvas',
        title: langPack.acceleratedCanvas,
        category: 'Video',
        type: 'checkbox',
        restart: true,
        val: config.get('acceleratedCanvas', true),
        default: true,
    },
    languages: {
        id: 'lang',
        title: langPack.languageSetting,
        category: 'Customize',
        type: 'select',
        restart: true,
        options: {
            ja_JP: '日本語',
            en_US: 'English',
        },
        val: config.get('lang', 'en_US'),
        default: 'en_US',
    },
    enableRPC: {
        id: 'enableRPC',
        title: langPack.enableRPC,
        category: 'Customize',
        type: 'checkbox',
        restart: true,
        val: config.get('showExitBtn', true),
        default: true,
    },
    enableAltMng: {
        id: 'enableAltMng',
        title: langPack.enableAltMng,
        category: 'Customize',
        type: 'checkbox',
        restart: true,
        val: config.get('enableAltMng', true),
        default: true,
    },
    showExitBtn: {
        id: 'showExitBtn',
        title: langPack.showExitBtn,
        category: 'Customize',
        type: 'select',
        restart: true,
        options: {
            top: langPack.topExitBtn,
            bottom: langPack.bottomExitBtn,
            disable: langPack.disableExitBtn,
        },
        val: config.get('showExitBtn', 'bottom'),
        default: 'bottom',
    },
    enableResourceSwapper: {
        id: 'enableResourceSwapper',
        title: langPack.resourceSwapper,
        category: 'Customize',
        type: 'checkbox',
        restart: true,
        val: config.get('enableResourceSwapper', true),
        default: true,
    },
    easyCSSMode: {
        id: 'easyCSSMode',
        title: langPack.easyCSS,
        category: 'Customize',
        type: 'select',
        restart: true,
        options: {
            type1: langPack.easyCSStype1,
            type2: langPack.easyCSStype2,
            //type3: langPack.easyCSStype3,
            custom: langPack.easyCSSCustom,
            disable: langPack.easyCSSDisable,
        },
        val: config.get('easyCSSMode', 'disable'),
        default: 'disable',
    },
    userCSSPath: {
        id: 'userCSSPath',
        title: langPack.userCSSPath,
        category: 'Customize',
        type: 'fileWithEyes',
        restart: true,
        val: config.get('userCSSPath', ''),
        default: '',
    },
};