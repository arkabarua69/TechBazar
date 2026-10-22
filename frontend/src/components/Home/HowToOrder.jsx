import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PaymentsIcon from '@mui/icons-material/Payments';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { richTextToHtml } from '../../utils/richText';

// Map icon-key strings (stored in DB) to MUI icon components
const ICON_MAP = {
    ShoppingCart:   ShoppingCartIcon,
    Payments:       PaymentsIcon,
    Inventory2:     Inventory2Icon,
    PhoneAndroid:   PhoneAndroidIcon,
    LocalShipping:  LocalShippingIcon,
    CheckCircle:    CheckCircleIcon,
    Storefront:     StorefrontIcon,
};

const StepIcon = ({ iconKey }) => {
    const Icon = ICON_MAP[iconKey];
    if (Icon) {
        return <Icon sx={{ fontSize: '28px', color: 'var(--color-accent)' }} />;
    }
    return <span className="text-3xl">{iconKey}</span>;
};

// "How to Order?" — 3 simple steps
const HowToOrder = ({ steps = [] }) => {
    if (!steps.length) return null;

    return (
        <section className="surface p-5 sm:p-7">
            <div className="text-center mb-6">
                <h2 className="section-title">How to Order?</h2>
                <p className="section-tagline mt-1">Complete your order in just 3 simple steps</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {steps.map((step, i) => (
                    <div
                        key={i}
                        className="relative bg-white border border-line rounded-xl p-5 flex flex-col items-center text-center gap-3 shadow-sm"
                        style={{ backgroundColor: 'var(--color-surface)' }}
                    >
                        {/* step number badge */}
                        <span
                            className="absolute -top-3 left-4 w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shadow"
                            style={{ backgroundColor: 'var(--color-accent)' }}
                        >
                            {i + 1}
                        </span>

                        {/* icon */}
                        <div
                            className="w-14 h-14 rounded-full flex items-center justify-center mt-1"
                            style={{ backgroundColor: 'var(--color-accent-light, rgba(232,75,15,0.08))', border: '1.5px solid var(--accent-20)' }}
                        >
                            <StepIcon iconKey={step.icon} />
                        </div>

                        <p className="font-display font-semibold text-slate-900 text-sm sm:text-base">
                            {step.title}
                        </p>
                        <div
                            className="text-xs sm:text-sm text-slate-500 rte-content"
                            dangerouslySetInnerHTML={{ __html: richTextToHtml(step.description) }}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
};

export default HowToOrder;
