// LaF Client i18nモジュール (c) 2022 Hiro527
import * as log from 'electron-log';
import isDev from 'electron-is-dev';
import i18next from 'i18next';
import i18next_fsbackend from 'i18next-node-fs-backend';
import path from 'path';

export const localization = (locale: string) => {
    log.info('Initializing i18n module...');
    i18next.use(i18next_fsbackend);
    return i18next.init({
        debug: isDev,
        lng: 'en',
        fallbackLng: 'en',
        initImmediate: false,
        backend: {
            loadPath: path.join(__dirname, '../../assets/i18n/{{lng}}.json'),
            addPath: path.join(__dirname, '../../assets/i18n/{{lng}}-missing.json'),
            jsonIndent: 4,
        },
        saveMissing: isDev,
    }).then(() => {
        // 言語コード: https://source.chromium.org/chromium/chromium/src/+/master:ui/base/l10n/l10n_util.cc
        i18next.changeLanguage(locale);
        return i18next;
    });
};
