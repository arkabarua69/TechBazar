import { useSiteConfig } from '../context/SiteConfigContext';
import { DEFAULT_SITE_CONFIG } from '../utils/siteConfig';

// Policy page — every section is admin-editable
// (Admin → Homepage → Branding & Content)
const Policy = () => {
    const { config } = useSiteConfig();
    const content = config.content || DEFAULT_SITE_CONFIG.content;
    const sections = content.policy || [];
    const heading = content.policyTitle || 'Privacy & Return Policy';

    return (
        <main className="w-full mt-4 md:mt-6 pb-10">
            <div className="w-full sm:w-10/12 lg:w-7/12 mx-auto px-3 sm:px-4 flex flex-col gap-4">
                <h1 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900">
                    {heading}
                </h1>

                {sections.map((section) => (
                    <section key={section.title} className="surface p-4 sm:p-5">
                        <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 mb-2">
                            {section.title}
                        </h2>
                        <ul className="flex flex-col gap-1.5">
                            {(section.body || []).map((line, i) => (
                                <li key={i} className="text-xs sm:text-sm text-slate-600 leading-relaxed flex gap-2">
                                    <span className="text-primary-accent mt-0.5">•</span>
                                    <span>{line}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </main>
    );
};

export default Policy;
