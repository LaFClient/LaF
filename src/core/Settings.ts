// LaFClient 設定モジュール (c) 2022 Hiro527
import Store from 'electron-store';
import { localization } from '../core/i18n';
import { i18n as i18nType } from 'i18next';

let i18n: i18nType = localization() as i18nType;
const config = new Store();

export const settings = {
    lang: {
        title: i18n.t('settings.lang'),
        cat: i18n.t('settings.cat.general'),
        type: 'select',
        val: config.get('general.lang', 'en_US'),
        options: {
            ja_JP: '日本語',
            en_US: 'English',
        },
        restart: true,
    },
};
