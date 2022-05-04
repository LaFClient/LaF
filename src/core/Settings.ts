// LaFClient 設定モジュール (c) 2022 Hiro527
import Store from 'electron-store';
import { localization } from '../core/i18n';
import { i18n as i18nType } from 'i18next';
import { ClientSettings } from '../@types/types';

let i18n: i18nType = localization() as i18nType;
const config = new Store();

export const settings: ClientSettings = {
    General: {
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
        type: 'checkbox',
        default: true,
        restart: false,
    },
    UserCSSPathVisibility: {
        type: 'checkbox',
        default: false,
        restart: false,
    },
    HQJoin: {
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
        default: 'ffa',
        options: {
            all: i18n.t('settings.hqjoin.allmode') as string,
            ffa: 'FFA',
            tdm: 'TDM',
            hp: 'Hardpoint',
            ctf: 'Capture the Flag',
            po: 'Parkour',
            has: 'Hide & Seek',
            inf: 'Infected',
            race: 'Race',
            lms: 'Last Man Standing',
            sis: 'Simon Says',
            gg: 'Gun Game',
            ph: 'Prop Hunt',
            bh: 'Boss Hunt',
            st: 'Stalker',
            koh: 'King of the Hill',
            oic: 'One in the Chamber',
            td: 'Trade',
            kc: 'Kill Confirmed',
            df: 'Defuse',
            shs: 'Sharp Shooter',
            tr: 'Traitor',
            raid: 'Raid',
            bl: 'Blitz',
            dom: 'Domination',
            kffa: 'Kranked FFA',
        },
        restart: false,
    },
    Twitch: {
        category: 'twitch',
    },
    LinkCommand: {
        type: 'checkbox',
        default: false,
        restart: false,
    },
};
