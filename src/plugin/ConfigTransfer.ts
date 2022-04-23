// LaF Client 設定引き継ぎモジュール (c) 2022 Hiro527
/* 注意 */
// LaF Client 10以前のバージョンからの設定引き継ぎ用のため、近い将来にこのプラグインが削除される可能性があります。
import Store from 'electron-store';
import * as log from 'electron-log';
import { DataStore } from '../@types/types';

export const name: string = 'ConfigTransfer';
export const version: string = '1.0';
export const execute = (): void => {
    const config = new Store();
    if (config.get('client.ConfigVersion', null)) {
        return;
    }
    const ids: DataStore = {
        lang: 'general.Lang',
        autoPlay: 'general.AutoPlay',
        enableResourceSwapper: 'general.ResSwp',
        enableAltMng: 'general.AltMng',
        enableTimer: 'general.MenuTimer',
        enableRPC: 'discord.RPC',
        shareMapInfo: 'discord.ShareMap',
        shareModeInfo: 'discord.ShareMode',
        shareClassInfo: 'discord.ShareClass',
        shareTimerInfo: 'discord.ShareTimer',
        unlimitedFPS: 'graphics.UnlimitedFPS',
        angleType: 'graphics.AngleType',
        webgl2Context: 'graphics.GL2Context',
        acceleratedCanvas: 'graphics.HWAcceleration',
        easyCSSMode: 'custom.EasyCSSMode',
        userCSSPath: 'custom.UserCSSPath',
        userCSSPath_visibility: 'custom.UserCSSPathVisibility',
        showExitBtn: 'custom.ShowExitBtn',
        joinMatchPresentRegion: 'hqjoin.RestrictRegion',
        joinMatchCustom: 'hqjoin.CustomMatch',
        joinMatchOCustom: 'hqjoin.OfficialCustomMatch',
        joinMatchMode: 'hqjoin.GameMode',
        enableLinkCmd: 'twitch.LinkCommand',
        twitchToken: 'twitch.AccountToken',
        twitchAcc: 'twitch.AccountName',
        twitchAccId: 'twitch.AccountId',
        isMaximized: 'window.Maximized',
        Fullscreen: 'window.FullScreen',
    };
    Object.keys(ids).forEach((k) => {
        const value = config.get(k, undefined);
        if (value !== undefined) {
            config.delete(k);
            config.set(ids[k], value);
        }
    });
    config.set('client.ConfigVersion', '2.0')
    log.info('Config has been transferred to new version.');
};
