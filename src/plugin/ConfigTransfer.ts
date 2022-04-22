// LaF Client Config Transfer (c) 2022 Hiro527
/* INFORMATION */
// This program is for transfer old config to newer one.
// It might be disabled & deleted in the nearly future.
import Store from "electron-store";
import { ConfigIdList } from "../@types/types";

module.exports = {
    name: "ConfigTransfer",
    version: "1.0",
    run: () => {
        const config = new Store();
        if (!config.get('client.ConfigVersion', null)) {
            return
        }
        const ids: ConfigIdList = {
            lang: "general.Lang",
            autoPlay: "general.AutoPlay",
            enableResourceSwapper: "general.ResSwp",
            enableAltMng: "general.AltMng",
            enableTimer: "general.MenuTimer",
            enableRPC: "discord.RPC",
            shareMapInfo: "discord.ShareMap",
            shareModeInfo: "discord.ShareMode",
            shareClassInfo: "discord.ShareClass",
            shareTimerInfo: "discord.ShareTimer",
            unlimitedFPS: "graphics.UnlimitedFPS",
            angleType: "graphics.AngleType",
            webgl2Context: "graphics.GL2Context",
            acceleratedCanvas: "graphics.HWAcceleration",
            easyCSSMode: "custom.EasyCSSMode",
            userCSSPath: "custom.UserCSSPath",
            userCSSPath_visibility: "custom.UserCSSPathVisibility",
            showExitBtn: "custom.ShowExitBtn",
            joinMatchPresentRegion: "hqjoin.RestrictRegion",
            joinMatchCustom: "hqjoin.CustomMatch",
            joinMatchOCustom: "hqjoin.OfficialCustomMatch",
            joinMatchMode: "hqjoin.GameMode",
            enableLinkCmd: "twitch.LinkCommand",
            twitchToken: "twitch.AccountToken",
        };
        Object.keys(ids).forEach((k) => {
            const value = config.get(k) || null;
            if (value) {
                config.set(ids[k], value);
            }
        });
    },
};
