import { Helmet } from "react-helmet";
import { useSiteConfig } from '../../context/SiteConfigContext';

// Page title + meta description.
// The final title is built from the admin-editable seo.titleTemplate
// ("%s | SiteName") — the passed title is stripped of any trailing
// " | SiteName" suffix first so pages don't double the brand name.
const MetaData = ({ title, description }) => {
    const { config } = useSiteConfig();
    const seo = config.seo || {};
    const brand = config.branding?.name || 'Store';

    let clean = title || '';
    const suffix = ` | ${brand}`;
    if (clean.endsWith(suffix)) clean = clean.slice(0, -suffix.length);

    const template = seo.titleTemplate || `%s | ${brand}`;
    const fullTitle = template.includes('%s')
        ? template.replace('%s', clean)
        : clean;

    const metaDescription = description || seo.description;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            {metaDescription ? <meta name="description" content={metaDescription} /> : null}
        </Helmet>
    );
};

export default MetaData;
