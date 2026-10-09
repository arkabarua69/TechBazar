import { useTranslation, LANG_EN, LANG_BN } from '../../i18n/LanguageContext';

// Bilingual toggle button: "EN | BN" — the active side glows black,
// the inactive side is muted. Clicking flips the language via context.
const LanguageToggle = () => {
    const { lang, switchLanguage, t } = useTranslation();
    const isBn = lang === LANG_BN;

    return (
        <div className="flex flex-col gap-1.5 mb-6 mx-3.5">
            <label className="text-xs font-medium text-gray-500 px-1">
                {t('switch_language')}
            </label>
            <div className="flex items-center bg-gray-100 rounded-full p-1 h-11">
                <button
                    onClick={() => switchLanguage(LANG_EN)}
                    className={`
                        flex-1 rounded-full h-9 flex items-center justify-center
                        text-sm font-semibold transition-all duration-200
                        ${!isBn
                            ? 'bg-black text-white shadow'
                            : 'text-gray-500 hover:text-gray-700'}
                    `}
                    aria-pressed={!isBn}
                    aria-label={t('lang_en')}
                >
                    EN
                </button>
                <button
                    onClick={() => switchLanguage(LANG_BN)}
                    className={`
                        flex-1 rounded-full h-9 flex items-center justify-center
                        text-sm font-semibold transition-all duration-200
                        ${isBn
                            ? 'bg-black text-white shadow'
                            : 'text-gray-500 hover:text-gray-700'}
                    `}
                    aria-pressed={isBn}
                    aria-label={t('lang_bn')}
                >
                    BN
                </button>
            </div>
        </div>
    );
};

export default LanguageToggle;
