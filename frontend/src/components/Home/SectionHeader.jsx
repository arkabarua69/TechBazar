import { Link } from 'react-router-dom';

// Section heading for the magazine layout (Sora heading + muted tagline + link)
const SectionHeader = ({ title, tagline, href = '/products', linkLabel = 'View All' }) => {
    return (
        <div className="flex items-end justify-between gap-4 mb-4">
            <div className="flex flex-col gap-1">
                <h2 className="section-title">{title}</h2>
                {tagline && <p className="section-tagline">{tagline}</p>}
            </div>
            <Link
                to={href}
                className="shrink-0 text-sm font-semibold text-primary-accent hover:text-blue-700 transition duration-200"
            >
                {linkLabel} &rarr;
            </Link>
        </div>
    );
};

export default SectionHeader;
