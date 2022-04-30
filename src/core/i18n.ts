// LaF Client i18nモジュール (c) 2022 Hiro527
import * as log from 'electron-log';
import i18next from 'i18next';
import i18next_fsbackend from 'i18next-node-fs-backend';
import path from 'path';
import Store from 'electron-store';

const config = new Store();

export const localization = (locale?: string) => {
    // 初期化済み→そのままreturn
    if (i18next.isInitialized) return i18next;
    log.info('Initializing i18n module...');
    // jsonを使うためのミドルウェア
    i18next.use(i18next_fsbackend);
    return i18next
        .init({
            debug: true,
            lng: config.get('general.Lang', 'en_US') as string,
            fallbackLng: 'en_US',
            initImmediate: false,
            backend: {
                loadPath: path.join(
                    __dirname,
                    '../../assets/i18n/{{lng}}.json'
                ),
                addPath: path.join(
                    __dirname,
                    '../../assets/i18n/{{lng}}-missing.json'
                ),
                jsonIndent: 4,
            },
            saveMissing: true,
        })
        .then(() => {
            // 言語コード: https://source.chromium.org/chromium/chromium/src/+/master:ui/base/l10n/l10n_util.cc
            i18next.changeLanguage(locale);
            return i18next;
        });
};
