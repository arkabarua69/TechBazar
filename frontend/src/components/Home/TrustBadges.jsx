import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import VerifiedIcon from '@mui/icons-material/Verified';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SecurityIcon from '@mui/icons-material/Security';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { richTextToHtml } from '../../utils/richText';

// Map icon-key strings (stored in DB) to MUI icon components
const ICON_MAP = {
    AttachMoney:   AttachMoneyIcon,
    FlashOn:       FlashOnIcon,
    Verified:      VerifiedIcon,
    HeadsetMic:    HeadsetMicIcon,
    LocalShipping: LocalShippingIcon,
    Security:      SecurityIcon,
    Star:          StarIcon,
    CheckCircle:   CheckCircleIcon,
};

const BadgeIcon = ({ iconKey }) => {
    const Icon = ICON_MAP[iconKey];
    if (Icon) {
        return (
            <span
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-accent)', opacity: 1 }}
            >
                <Icon sx={{ fontSize: '24px', color: '#fff' }} />
            </span>
        );
    }
    // raw emoji / unknown — render as text
    return <span className="text-2xl sm:text-3xl">{iconKey}</span>;
};

// Trust badges: 4 cards side by side on desktop, 2×2 grid on mobile
const TrustBadges = ({ badges = [] }) => {
    if (!badges.length) return null;

    return (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {badges.map((badge, i) => (
                <div
                    key={i}
                    className="surface p-4 sm:p-5 flex flex-col items-center text-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition duration-200"
                >
                    <BadgeIcon iconKey={badge.icon} />
                    <p className="font-display font-semibold text-sm sm:text-base" style={{ color: 'var(--color-text-primary)' }}>
                        {badge.title}
                    </p>
                    <div
                        className="text-xs leading-snug rte-content"
                        style={{ color: 'var(--color-text-muted)' }}
                        dangerouslySetInnerHTML={{ __html: richTextToHtml(badge.description) }}
                    />
                </div>
            ))}
        </section>
    );
};

export default TrustBadges;
