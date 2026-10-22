import { useSiteConfig } from '../context/SiteConfigContext';
import { DEFAULT_SITE_CONFIG } from '../utils/siteConfig';
import { richTextToHtml } from '../utils/richText';
import MetaData from './Layouts/MetaData';

const Policy = () => {
    const { config } = useSiteConfig();
    const content = config.content || DEFAULT_SITE_CONFIG.content;
    const sections = content.policy || [];
    const heading = content.policyTitle || 'Privacy & Return Policy';
    const brandName = config.branding?.name || 'Store';

    return (
        <>
            <MetaData title={`${heading} | ${brandName}`} />
            <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
                {/* Header */}
                <section style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--accent-dark) 100%)' }}>
                    <div className="mx-auto max-w-3xl px-5 sm:px-6 py-8 sm:py-10">
                        <h1 className="font-bold text-xl sm:text-2xl text-white">{heading}</h1>
                        <p className="text-white/70 text-sm mt-1">Our commitment to you</p>
                    </div>
                </section>

                <main className="mx-auto max-w-3xl px-4 sm:px-6 py-6 pb-16 flex flex-col gap-4">
                    {sections.length === 0 ? (
                        <div className="surface p-8 text-center">
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                No policy content has been configured yet.
                            </p>
                        </div>
                    ) : (
                        sections.map((section, i) => (
                            <section key={i} className="surface p-4 sm:p-6">
                                <h2
                                    className="font-bold text-base sm:text-lg mb-3"
                                    style={{ color: 'var(--color-text-primary)' }}
                                >
                                    {section.title}
                                </h2>
                                {(() => {
                                    const body = section.body || [];
                                    const isRich = body.length === 1 && /<[a-z][\s\S]*>/i.test(body[0]);
                                    if (isRich) {
                                        return (
                                            <div
                                                className="text-xs sm:text-sm rte-content"
                                                style={{ color: 'var(--color-text-secondary)' }}
                                                dangerouslySetInnerHTML={{ __html: richTextToHtml(body[0]) }}
                                            />
                                        );
                                    }
                                    return (
                                        <ul className="flex flex-col gap-2">
                                            {body.map((line, j) => (
                                                <li key={j} className="flex gap-2 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                                    <span style={{ color: 'var(--color-accent)', marginTop: '2px', flexShrink: 0 }}>•</span>
                                                    <span>{line}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    );
                                })()}
                            </section>
                        ))
                    )}
                </main>
            </div>
        </>
    );
};

export default Policy;
