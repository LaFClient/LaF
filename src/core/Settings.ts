// LaFClient 設定モジュール (c) 2022 Hiro527
import Store from 'electron-store';
import { localization } from '../core/i18n';
import { i18n as i18nType } from 'i18next';
import { ClientSettings } from '../@types/types';

let i18n: i18nType = localization() as i18nType;
const config = new Store();

export const getSettings = async () => {
    i18n = await localization();
    const settings: ClientSettings = {
        General: {
            type: 'category',
            category: 'general',
        },
        Lang: {
            type: 'select',
            default: 'en_US',
            options: {
                en_US: 'English',
                ja_JP: '日本語',
            },
            restart: true,
        },
        AutoPlay: {
            type: 'checkbox',
            default: true,
            restart: true,
        },
        ResSwp: {
            type: 'checkbox',
            default: true,
            restart: true,
        },
        AltMng: {
            type: 'checkbox',
            default: true,
            restart: false,
        },
        MenuTimer: {
            type: 'checkbox',
            default: true,
            restart: false,
        },
        Discord: {
            type: 'category',
            category: 'discord',
        },
        RPC: {
            type: 'checkbox',
            default: true,
            restart: false,
        },
        ShareMap: {
            type: 'checkbox',
            default: true,
            restart: false,
        },
        ShareMode: {
            type: 'checkbox',
            default: true,
            restart: false,
        },
        ShareClass: {
            type: 'checkbox',
            default: true,
            restart: false,
        },
        ShareTimer: {
            type: 'checkbox',
            default: true,
            restart: false,
        },
        Graphics: {
            type: 'category',
            category: 'graphics',
        },
        AngleType: {
            type: 'select',
            default: true,
            options: {
                default: 'Default',
                gl: 'OpenGL',
                d3d11: 'D3D11',
                d3d9: 'D3D9',
                d3d11on12: 'D3D11on12',
            },
            restart: true,
        },
        GL2Context: {
            type: 'checkbox',
            default: true,
            restart: true,
        },
        HWAcceleration: {
            type: 'checkbox',
            default: true,
            restart: true,
        },
        Custom: {
            type: 'category',
            category: 'custom',
        },
        EasyCSSMode: {
            type: 'select',
            default: true,
            options: {
                type1: i18n.t('settings.ezcss.type1') as string,
                type2: i18n.t('settings.ezcss.type2') as string,
                type3: i18n.t('settings.ezcss.type3') as string,
                type4: i18n.t('settings.ezcss.type4') as string,
                type5: i18n.t('settings.ezcss.type5') as string,
                custom: i18n.t('settings.ezcss.custom') as string,
                disable: i18n.t('settings.ezcss.disable') as string,
            },
            restart: false,
        },
        UserCSSPath: {
            type: 'checkbox_e',
            default: true,
            restart: false,
        },
        HQJoin: {
            type: 'category',
            category: 'hqjoin',
        },
        RestrictRegion: {
            type: 'checkbox',
            default: true,
            restart: false,
        },
        OfficialCustomMatch: {
            type: 'checkbox',
            default: false,
            restart: false,
        },
        GameMode: {
            type: 'select',
            default: '0',
            options: {
                '0': 'Free for All',
                '1': 'Team Deathmatch',
                '2': 'Hardpoint',
                '3': 'Capture the Flag',
                '4': 'Parkour',
                '5': 'Hide & Seek',
                '6': 'Infected',
                '7': 'Race',
                '8': 'Last Man Standing',
                '9': 'Simon Says',
                '10': 'Gun Game',
                '11': 'Prop Hunt',
                '12': 'Boss Hunt',
                '13': 'Classic FFA',
                '14': 'Deposit',
                '15': 'Stalker',
                '16': 'King of the Hill',
                '17': 'One in the Chamber',
                '18': 'Trade',
                '19': 'Kill Confirmed',
                '20': 'Defuse',
                '21': 'Sharp Shooter',
                '22': 'Traitor',
                '23': 'Raid',
                '24': 'Blitz',
                '25': 'Domination',
                '26': 'Squad Deathmatch',
                '27': 'Kranked FFA',
                '28': 'Team Defender',
                '29': 'Deposit FFA',
            },
            restart: false,
        },
        Twitch: {
            type: 'category',
            category: 'twitch',
        },
        TwitchAccount: {
            type: 't_account',
            default: null,
            restart: false,
        },
        LinkCommand: {
            type: 'checkbox',
            default: false,
            restart: false,
        },
    };
    return settings;
};
