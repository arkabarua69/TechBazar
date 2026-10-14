import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import MetaData from '../Layouts/MetaData';
import {
    Globe,
    Palette,
    Search,
    Mail,
    CreditCard,
    Cloud,
    Share2,
    Truck,
    Shield,
    Zap,
    Key,
    Sliders,
    History,
    Save,
    RotateCcw,
    Eye,
    EyeOff,
    X,
    ChevronDown,
    ChevronUp,
    Loader2,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const MASK_STRING = '••••••••••••••••••••';

const CATEGORIES = [
    { id: 'general',   label: 'General',       Icon: Globe,       count: 12 },
    { id: 'branding',  label: 'Branding',       Icon: Palette,     count: 6  },
    { id: 'seo',       label: 'SEO',            Icon: Search,      count: 6  },
    { id: 'email',     label: 'Email / SMTP',   Icon: Mail,        count: 8  },
    { id: 'payment',   label: 'Payment',        Icon: CreditCard,  count: 8  },
    { id: 'cloud',     label: 'Cloud Storage',  Icon: Cloud,       count: 4  },
    { id: 'social',    label: 'Social Media',   Icon: Share2,      count: 6  },
    { id: 'shipping',  label: 'Shipping',       Icon: Truck,       count: 5  },
    { id: 'security',  label: 'Security',       Icon: Shield,      count: 6  },
    { id: 'cache',     label: 'Cache',          Icon: Zap,         count: 4  },
    { id: 'apiKeys',   label: 'API Keys',       Icon: Key,         count: 5  },
    { id: 'features',  label: 'Features',       Icon: Sliders,     count: 7  },
    { id: 'changelog', label: 'Change Log',     Icon: History,     count: null },
];

// Fields that carry sensitive data — if value still equals MASK_STRING, send "" on save
const SECRET_FIELDS = new Set([
    'email.smtpPassword',
    'email.sendgridApiKey',
    'payment.stripeSecretKey',
    'payment.stripeWebhookSecret',
    'payment.paytmMerchantKey',
    'cloud.cloudinaryApiKey',
    'cloud.cloudinaryApiSecret',
    'apiKeys.businessKoroApiKey',
    'apiKeys.otherApiKey1',
    'apiKeys.otherApiKey2',
]);

const isSecretField = (section, field) => SECRET_FIELDS.has(`${section}.${field}`);

// ─── Field Components ─────────────────────────────────────────────────────────

const inputCls =
    'border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 w-full bg-white';
const labelCls = 'text-xs font-medium text-gray-500 mb-1 block';

const TextField = ({ label, value, onChange, placeholder = '' }) => (
    <div>
        <label className={labelCls}>{label}</label>
        <input
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={inputCls}
        />
    </div>
);

const NumberField = ({ label, value, onChange, min, max, placeholder = '' }) => (
    <div>
        <label className={labelCls}>{label}</label>
        <input
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={placeholder}
            min={min}
            max={max}
            className={inputCls}
        />
    </div>
);

const TextareaField = ({ label, value, onChange, placeholder = '' }) => (
    <div>
        <label className={labelCls}>{label}</label>
        <textarea
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className={inputCls + ' resize-y'}
        />
    </div>
);

const SelectField = ({ label, value, onChange, options }) => (
    <div>
        <label className={labelCls}>{label}</label>
        <select
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputCls}
        >
            {options.map(({ value: v, label: l }) => (
                <option key={v} value={v}>{l}</option>
            ))}
        </select>
    </div>
);

const ToggleField = ({ label, description, value, onChange }) => (
    <div className="flex items-center justify-between gap-4 py-1">
        <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800">{label}</p>
            {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
        <button
            type="button"
            onClick={() => onChange(!value)}
            style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                backgroundColor: value ? '#E84B0F' : '#d1d5db',
                position: 'relative',
                transition: 'background-color 0.2s',
                flexShrink: 0,
                border: 'none',
                cursor: 'pointer',
                padding: 0,
            }}
            aria-checked={!!value}
            role="switch"
        >
            <span
                style={{
                    position: 'absolute',
                    top: 3,
                    left: value ? 21 : 3,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    transition: 'left 0.2s',
                }}
            />
        </button>
    </div>
);

const SecretField = ({ label, section, field, value, onSecretChange }) => {
    // `value` is whatever the config holds (usually MASK_STRING)
    // `localValue` is what we show in the input
    const [localValue, setLocalValue] = useState('');
    const [show, setShow] = useState(false);
    const [editing, setEditing] = useState(false);

    // When config reloads, reset local state
    useEffect(() => {
        setLocalValue('');
        setEditing(false);
    }, [value]);

    const displayValue = editing ? localValue : (value === MASK_STRING ? MASK_STRING : (value || ''));

    const handleFocus = () => {
        setEditing(true);
        setLocalValue('');
    };

    const handleChange = (e) => {
        setLocalValue(e.target.value);
        onSecretChange(section, field, e.target.value);
    };

    const handleBlur = () => {
        if (localValue === '') {
            setEditing(false);
            onSecretChange(section, field, null); // null = "leave as is"
        }
    };

    return (
        <div>
            <label className={labelCls}>{label}</label>
            <div className="relative">
                <input
                    type={show ? 'text' : 'password'}
                    value={displayValue}
                    onFocus={handleFocus}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter new value to change"
                    className={inputCls + ' pr-10'}
                    autoComplete="new-password"
                />
                <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                >
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Leave blank to keep existing value.</p>
        </div>
    );
};

const ColorField = ({ label, value, onChange }) => {
    const safeVal = value && /^#[0-9a-fA-F]{3,6}$/.test(value) ? value : '#000000';
    return (
        <div>
            <label className={labelCls}>{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={safeVal}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
                    style={{ minWidth: 40 }}
                />
                <input
                    type="text"
                    value={value ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#000000"
                    className={inputCls}
                    maxLength={7}
                />
            </div>
        </div>
    );
};

// ─── Section Renderer ─────────────────────────────────────────────────────────

const SectionHeading = ({ children }) => (
    <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">{children}</h3>
);

const Card = ({ children, className = '' }) => (
    <div className={`bg-white border border-gray-200 rounded-2xl shadow-sm p-5 ${className}`}>
        {children}
    </div>
);

// ─── Build the fields tree for search ────────────────────────────────────────

// Returns array of { sectionId, sectionLabel, fieldKey, fieldLabel, element(config, handlers) }
// We use this for search only; normal rendering is done directly.
const buildFieldIndex = (config, handlers) => {
    if (!config) return [];
    const { set, onSecretChange } = handlers;
    const index = [];

    const add = (sectionId, fieldKey, fieldLabel, element) => {
        index.push({ sectionId, fieldKey, fieldLabel, element });
    };

    // general
    add('general', 'siteName', 'Site Name', <TextField key="siteName" label="Site Name" value={config.general?.siteName} onChange={(v) => set('general', 'siteName', v)} />);
    add('general', 'siteTitle', 'Site Title', <TextField key="siteTitle" label="Site Title" value={config.general?.siteTitle} onChange={(v) => set('general', 'siteTitle', v)} />);
    add('general', 'siteDescription', 'Site Description', <TextareaField key="siteDescription" label="Site Description" value={config.general?.siteDescription} onChange={(v) => set('general', 'siteDescription', v)} />);
    add('general', 'siteUrl', 'Site URL', <TextField key="siteUrl" label="Site URL" value={config.general?.siteUrl} onChange={(v) => set('general', 'siteUrl', v)} />);
    add('general', 'contactEmail', 'Contact Email', <TextField key="contactEmail" label="Contact Email" value={config.general?.contactEmail} onChange={(v) => set('general', 'contactEmail', v)} />);
    add('general', 'contactPhone', 'Contact Phone', <TextField key="contactPhone" label="Contact Phone" value={config.general?.contactPhone} onChange={(v) => set('general', 'contactPhone', v)} />);
    add('general', 'timezone', 'Timezone', <SelectField key="timezone" label="Timezone" value={config.general?.timezone} onChange={(v) => set('general', 'timezone', v)} options={[{value:'Asia/Dhaka',label:'Asia/Dhaka'},{value:'Asia/Kolkata',label:'Asia/Kolkata'},{value:'UTC',label:'UTC'},{value:'America/New_York',label:'America/New_York'},{value:'Europe/London',label:'Europe/London'}]} />);
    add('general', 'language', 'Language', <SelectField key="language" label="Language" value={config.general?.language} onChange={(v) => set('general', 'language', v)} options={[{value:'en',label:'English'},{value:'bn',label:'Bengali'}]} />);
    add('general', 'currency', 'Currency Code', <TextField key="currency" label="Currency Code" value={config.general?.currency} onChange={(v) => set('general', 'currency', v)} placeholder="BDT" />);
    add('general', 'currencySymbol', 'Currency Symbol', <TextField key="currencySymbol" label="Currency Symbol" value={config.general?.currencySymbol} onChange={(v) => set('general', 'currencySymbol', v)} placeholder="৳" />);
    add('general', 'maintenanceMode', 'Maintenance Mode', <ToggleField key="maintenanceMode" label="Maintenance Mode" description="Take the site offline for maintenance" value={config.general?.maintenanceMode} onChange={(v) => set('general', 'maintenanceMode', v)} />);
    add('general', 'maintenanceMessage', 'Maintenance Message', <TextareaField key="maintenanceMessage" label="Maintenance Message" value={config.general?.maintenanceMessage} onChange={(v) => set('general', 'maintenanceMessage', v)} />);

    // branding
    add('branding', 'logoUrl', 'Logo URL', <TextField key="logoUrl" label="Logo URL" value={config.branding?.logoUrl} onChange={(v) => set('branding', 'logoUrl', v)} />);
    add('branding', 'faviconUrl', 'Favicon URL', <TextField key="faviconUrl" label="Favicon URL" value={config.branding?.faviconUrl} onChange={(v) => set('branding', 'faviconUrl', v)} />);
    add('branding', 'primaryColor', 'Primary Color', <ColorField key="primaryColor" label="Primary Color" value={config.branding?.primaryColor} onChange={(v) => set('branding', 'primaryColor', v)} />);
    add('branding', 'secondaryColor', 'Secondary Color', <ColorField key="secondaryColor" label="Secondary Color" value={config.branding?.secondaryColor} onChange={(v) => set('branding', 'secondaryColor', v)} />);
    add('branding', 'accentColor', 'Accent Color', <ColorField key="accentColor" label="Accent Color" value={config.branding?.accentColor} onChange={(v) => set('branding', 'accentColor', v)} />);
    add('branding', 'darkMode', 'Dark Mode', <ToggleField key="darkMode" label="Dark Mode" description="Enable dark theme by default" value={config.branding?.darkMode} onChange={(v) => set('branding', 'darkMode', v)} />);

    // seo
    add('seo', 'metaKeywords', 'Meta Keywords', <TextareaField key="metaKeywords" label="Meta Keywords" value={config.seo?.metaKeywords} onChange={(v) => set('seo', 'metaKeywords', v)} />);
    add('seo', 'metaRobots', 'Meta Robots', <SelectField key="metaRobots" label="Meta Robots" value={config.seo?.metaRobots} onChange={(v) => set('seo', 'metaRobots', v)} options={[{value:'index, follow',label:'index, follow'},{value:'noindex, nofollow',label:'noindex, nofollow'},{value:'index, nofollow',label:'index, nofollow'},{value:'noindex, follow',label:'noindex, follow'}]} />);
    add('seo', 'googleAnalyticsId', 'Google Analytics ID', <TextField key="googleAnalyticsId" label="Google Analytics ID" value={config.seo?.googleAnalyticsId} onChange={(v) => set('seo', 'googleAnalyticsId', v)} placeholder="G-XXXXXXXXXX" />);
    add('seo', 'googleTagManagerId', 'Google Tag Manager ID', <TextField key="googleTagManagerId" label="Google Tag Manager ID" value={config.seo?.googleTagManagerId} onChange={(v) => set('seo', 'googleTagManagerId', v)} placeholder="GTM-XXXXXXX" />);
    add('seo', 'metaOgImage', 'OG Image URL', <TextField key="metaOgImage" label="OG Image URL" value={config.seo?.metaOgImage} onChange={(v) => set('seo', 'metaOgImage', v)} />);
    add('seo', 'metaOgType', 'OG Type', <SelectField key="metaOgType" label="OG Type" value={config.seo?.metaOgType} onChange={(v) => set('seo', 'metaOgType', v)} options={[{value:'website',label:'website'},{value:'article',label:'article'},{value:'product',label:'product'}]} />);

    // email
    add('email', 'smtpHost', 'SMTP Host', <TextField key="smtpHost" label="SMTP Host" value={config.email?.smtpHost} onChange={(v) => set('email', 'smtpHost', v)} />);
    add('email', 'smtpPort', 'SMTP Port', <NumberField key="smtpPort" label="SMTP Port" value={config.email?.smtpPort} onChange={(v) => set('email', 'smtpPort', v)} min={1} max={65535} />);
    add('email', 'smtpSecure', 'SMTP Secure', <ToggleField key="smtpSecure" label="SMTP Secure (SSL/TLS)" description="" value={config.email?.smtpSecure} onChange={(v) => set('email', 'smtpSecure', v)} />);
    add('email', 'smtpUsername', 'SMTP Username', <TextField key="smtpUsername" label="SMTP Username" value={config.email?.smtpUsername} onChange={(v) => set('email', 'smtpUsername', v)} />);
    add('email', 'smtpPassword', 'SMTP Password', <SecretField key="smtpPassword" label="SMTP Password" section="email" field="smtpPassword" value={config.email?.smtpPassword} onSecretChange={onSecretChange} />);
    add('email', 'smtpFromName', 'From Name', <TextField key="smtpFromName" label="From Name" value={config.email?.smtpFromName} onChange={(v) => set('email', 'smtpFromName', v)} />);
    add('email', 'smtpFromEmail', 'From Email', <TextField key="smtpFromEmail" label="From Email" value={config.email?.smtpFromEmail} onChange={(v) => set('email', 'smtpFromEmail', v)} />);
    add('email', 'sendgridApiKey', 'SendGrid API Key', <SecretField key="sendgridApiKey" label="SendGrid API Key" section="email" field="sendgridApiKey" value={config.email?.sendgridApiKey} onSecretChange={onSecretChange} />);

    // payment
    add('payment', 'stripePublicKey', 'Stripe Public Key', <TextField key="stripePublicKey" label="Stripe Public Key" value={config.payment?.stripePublicKey} onChange={(v) => set('payment', 'stripePublicKey', v)} />);
    add('payment', 'stripeSecretKey', 'Stripe Secret Key', <SecretField key="stripeSecretKey" label="Stripe Secret Key" section="payment" field="stripeSecretKey" value={config.payment?.stripeSecretKey} onSecretChange={onSecretChange} />);
    add('payment', 'stripeWebhookSecret', 'Stripe Webhook Secret', <SecretField key="stripeWebhookSecret" label="Stripe Webhook Secret" section="payment" field="stripeWebhookSecret" value={config.payment?.stripeWebhookSecret} onSecretChange={onSecretChange} />);
    add('payment', 'paytmMerchantId', 'Paytm Merchant ID', <TextField key="paytmMerchantId" label="Paytm Merchant ID" value={config.payment?.paytmMerchantId} onChange={(v) => set('payment', 'paytmMerchantId', v)} />);
    add('payment', 'paytmMerchantKey', 'Paytm Merchant Key', <SecretField key="paytmMerchantKey" label="Paytm Merchant Key" section="payment" field="paytmMerchantKey" value={config.payment?.paytmMerchantKey} onSecretChange={onSecretChange} />);
    add('payment', 'bKashNumber', 'bKash Number', <TextField key="bKashNumber" label="bKash Number" value={config.payment?.bKashNumber} onChange={(v) => set('payment', 'bKashNumber', v)} />);
    add('payment', 'nagadNumber', 'Nagad Number', <TextField key="nagadNumber" label="Nagad Number" value={config.payment?.nagadNumber} onChange={(v) => set('payment', 'nagadNumber', v)} />);
    add('payment', 'defaultPaymentMethod', 'Default Payment Method', <SelectField key="defaultPaymentMethod" label="Default Payment Method" value={config.payment?.defaultPaymentMethod} onChange={(v) => set('payment', 'defaultPaymentMethod', v)} options={[{value:'cash_on_delivery',label:'Cash on Delivery'},{value:'stripe',label:'Stripe'},{value:'paytm',label:'Paytm'},{value:'bkash',label:'bKash'},{value:'nagad',label:'Nagad'}]} />);

    // cloud
    add('cloud', 'cloudinaryCloudName', 'Cloudinary Cloud Name', <TextField key="cloudinaryCloudName" label="Cloudinary Cloud Name" value={config.cloud?.cloudinaryCloudName} onChange={(v) => set('cloud', 'cloudinaryCloudName', v)} />);
    add('cloud', 'cloudinaryApiKey', 'Cloudinary API Key', <SecretField key="cloudinaryApiKey" label="Cloudinary API Key" section="cloud" field="cloudinaryApiKey" value={config.cloud?.cloudinaryApiKey} onSecretChange={onSecretChange} />);
    add('cloud', 'cloudinaryApiSecret', 'Cloudinary API Secret', <SecretField key="cloudinaryApiSecret" label="Cloudinary API Secret" section="cloud" field="cloudinaryApiSecret" value={config.cloud?.cloudinaryApiSecret} onSecretChange={onSecretChange} />);
    add('cloud', 'cloudinaryFolder', 'Cloudinary Folder', <TextField key="cloudinaryFolder" label="Cloudinary Folder" value={config.cloud?.cloudinaryFolder} onChange={(v) => set('cloud', 'cloudinaryFolder', v)} />);

    // social
    add('social', 'facebookUrl', 'Facebook URL', <TextField key="facebookUrl" label="Facebook URL" value={config.social?.facebookUrl} onChange={(v) => set('social', 'facebookUrl', v)} />);
    add('social', 'twitterUrl', 'Twitter / X URL', <TextField key="twitterUrl" label="Twitter / X URL" value={config.social?.twitterUrl} onChange={(v) => set('social', 'twitterUrl', v)} />);
    add('social', 'instagramUrl', 'Instagram URL', <TextField key="instagramUrl" label="Instagram URL" value={config.social?.instagramUrl} onChange={(v) => set('social', 'instagramUrl', v)} />);
    add('social', 'youtubeUrl', 'YouTube URL', <TextField key="youtubeUrl" label="YouTube URL" value={config.social?.youtubeUrl} onChange={(v) => set('social', 'youtubeUrl', v)} />);
    add('social', 'linkedinUrl', 'LinkedIn URL', <TextField key="linkedinUrl" label="LinkedIn URL" value={config.social?.linkedinUrl} onChange={(v) => set('social', 'linkedinUrl', v)} />);
    add('social', 'whatsappNumber', 'WhatsApp Number', <TextField key="whatsappNumber" label="WhatsApp Number" value={config.social?.whatsappNumber} onChange={(v) => set('social', 'whatsappNumber', v)} placeholder="8801700000000" />);

    // shipping
    add('shipping', 'insideDhaka', 'Delivery — Inside Dhaka (Tk)', <NumberField key="insideDhaka" label="Delivery — Inside Dhaka (Tk)" value={config.shipping?.insideDhaka} onChange={(v) => set('shipping', 'insideDhaka', v)} min={0} />);
    add('shipping', 'outsideDhaka', 'Delivery — Outside Dhaka (Tk)', <NumberField key="outsideDhaka" label="Delivery — Outside Dhaka (Tk)" value={config.shipping?.outsideDhaka} onChange={(v) => set('shipping', 'outsideDhaka', v)} min={0} />);
    add('shipping', 'freeShippingThreshold', 'Free Shipping Threshold (Tk)', <NumberField key="freeShippingThreshold" label="Free Shipping Threshold (Tk)" value={config.shipping?.freeShippingThreshold} onChange={(v) => set('shipping', 'freeShippingThreshold', v)} min={0} />);
    add('shipping', 'estimatedDeliveryDays', 'Estimated Delivery Days', <TextField key="estimatedDeliveryDays" label="Estimated Delivery Days" value={config.shipping?.estimatedDeliveryDays} onChange={(v) => set('shipping', 'estimatedDeliveryDays', v)} placeholder="3-5" />);
    add('shipping', 'returnPolicyDays', 'Return Policy (days)', <NumberField key="returnPolicyDays" label="Return Policy (days)" value={config.shipping?.returnPolicyDays} onChange={(v) => set('shipping', 'returnPolicyDays', v)} min={0} max={365} />);

    // security
    add('security', 'maxLoginAttempts', 'Max Login Attempts', <NumberField key="maxLoginAttempts" label="Max Login Attempts" value={config.security?.maxLoginAttempts} onChange={(v) => set('security', 'maxLoginAttempts', v)} min={1} max={20} />);
    add('security', 'loginLockoutMinutes', 'Login Lockout (minutes)', <NumberField key="loginLockoutMinutes" label="Login Lockout (minutes)" value={config.security?.loginLockoutMinutes} onChange={(v) => set('security', 'loginLockoutMinutes', v)} min={1} max={1440} />);
    add('security', 'sessionTimeoutMinutes', 'Session Timeout (minutes)', <NumberField key="sessionTimeoutMinutes" label="Session Timeout (minutes)" value={config.security?.sessionTimeoutMinutes} onChange={(v) => set('security', 'sessionTimeoutMinutes', v)} min={5} max={1440} />);
    add('security', 'requireEmailVerification', 'Require Email Verification', <ToggleField key="requireEmailVerification" label="Require Email Verification" description="" value={config.security?.requireEmailVerification} onChange={(v) => set('security', 'requireEmailVerification', v)} />);
    add('security', 'requirePhoneVerification', 'Require Phone Verification', <ToggleField key="requirePhoneVerification" label="Require Phone Verification" description="" value={config.security?.requirePhoneVerification} onChange={(v) => set('security', 'requirePhoneVerification', v)} />);
    add('security', 'enableTwoFactorAuth', 'Enable Two-Factor Auth', <ToggleField key="enableTwoFactorAuth" label="Enable Two-Factor Auth" description="" value={config.security?.enableTwoFactorAuth} onChange={(v) => set('security', 'enableTwoFactorAuth', v)} />);

    // cache
    add('cache', 'cacheEnabled', 'Enable Caching', <ToggleField key="cacheEnabled" label="Enable Caching" description="Cache API responses for better performance" value={config.cache?.cacheEnabled} onChange={(v) => set('cache', 'cacheEnabled', v)} />);
    add('cache', 'cacheDuration', 'Cache Duration (seconds)', <NumberField key="cacheDuration" label="Cache Duration (seconds)" value={config.cache?.cacheDuration} onChange={(v) => set('cache', 'cacheDuration', v)} min={60} max={86400} />);
    add('cache', 'redisEnabled', 'Enable Redis', <ToggleField key="redisEnabled" label="Enable Redis" description="Use Redis for distributed caching" value={config.cache?.redisEnabled} onChange={(v) => set('cache', 'redisEnabled', v)} />);
    add('cache', 'redisUrl', 'Redis URL', <TextField key="redisUrl" label="Redis URL" value={config.cache?.redisUrl} onChange={(v) => set('cache', 'redisUrl', v)} placeholder="redis://localhost:6379" />);

    // apiKeys
    add('apiKeys', 'businessKoroApiKey', 'Business Koro API Key', <SecretField key="businessKoroApiKey" label="Business Koro API Key" section="apiKeys" field="businessKoroApiKey" value={config.apiKeys?.businessKoroApiKey} onSecretChange={onSecretChange} />);
    add('apiKeys', 'businessKoroBaseUrl', 'Business Koro Base URL', <TextField key="businessKoroBaseUrl" label="Business Koro Base URL" value={config.apiKeys?.businessKoroBaseUrl} onChange={(v) => set('apiKeys', 'businessKoroBaseUrl', v)} />);
    add('apiKeys', 'businessKoroDomain', 'Business Koro Domain', <TextField key="businessKoroDomain" label="Business Koro Domain" value={config.apiKeys?.businessKoroDomain} onChange={(v) => set('apiKeys', 'businessKoroDomain', v)} />);
    add('apiKeys', 'otherApiKey1', 'Custom API Key 1', <SecretField key="otherApiKey1" label="Custom API Key 1" section="apiKeys" field="otherApiKey1" value={config.apiKeys?.otherApiKey1} onSecretChange={onSecretChange} />);
    add('apiKeys', 'otherApiKey2', 'Custom API Key 2', <SecretField key="otherApiKey2" label="Custom API Key 2" section="apiKeys" field="otherApiKey2" value={config.apiKeys?.otherApiKey2} onSecretChange={onSecretChange} />);

    // features
    add('features', 'enableGuestCheckout', 'Guest Checkout', <ToggleField key="enableGuestCheckout" label="Guest Checkout" description="Allow purchases without registration" value={config.features?.enableGuestCheckout} onChange={(v) => set('features', 'enableGuestCheckout', v)} />);
    add('features', 'enableWishlist', 'Wishlist', <ToggleField key="enableWishlist" label="Wishlist" description="Enable wishlist feature for users" value={config.features?.enableWishlist} onChange={(v) => set('features', 'enableWishlist', v)} />);
    add('features', 'enableReviews', 'Product Reviews', <ToggleField key="enableReviews" label="Product Reviews" description="Allow customers to leave reviews" value={config.features?.enableReviews} onChange={(v) => set('features', 'enableReviews', v)} />);
    add('features', 'enableChat', 'Live Chat', <ToggleField key="enableChat" label="Live Chat" description="Show live chat widget on storefront" value={config.features?.enableChat} onChange={(v) => set('features', 'enableChat', v)} />);
    add('features', 'enableNewsletter', 'Newsletter', <ToggleField key="enableNewsletter" label="Newsletter" description="Enable newsletter subscription" value={config.features?.enableNewsletter} onChange={(v) => set('features', 'enableNewsletter', v)} />);
    add('features', 'enableSitemap', 'Sitemap', <ToggleField key="enableSitemap" label="Sitemap" description="Auto-generate XML sitemap" value={config.features?.enableSitemap} onChange={(v) => set('features', 'enableSitemap', v)} />);
    add('features', 'enablePWA', 'Progressive Web App (PWA)', <ToggleField key="enablePWA" label="Progressive Web App (PWA)" description="Enable PWA features" value={config.features?.enablePWA} onChange={(v) => set('features', 'enablePWA', v)} />);

    return index;
};

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

const SkeletonPulse = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
);

const LoadingSkeleton = () => (
    <div className="flex flex-col gap-4 p-2">
        <SkeletonPulse className="h-8 w-48" />
        <SkeletonPulse className="h-4 w-72" />
        <div className="flex gap-3 mt-4">
            <SkeletonPulse className="h-10 w-10 rounded-2xl" style={{ flexShrink: 0 }} />
            <div className="flex-1 flex flex-col gap-3">
                <SkeletonPulse className="h-12" />
                <SkeletonPulse className="h-12" />
                <SkeletonPulse className="h-12" />
                <SkeletonPulse className="h-12" />
                <SkeletonPulse className="h-12" />
            </div>
        </div>
    </div>
);

// ─── Reset Confirmation Modal ─────────────────────────────────────────────────

const ResetModal = ({ onConfirm, onCancel }) => (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        onClick={onCancel}
    >
        <div
            className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <RotateCcw size={18} className="text-red-500" />
                </span>
                <h2 className="text-base font-semibold text-gray-900">Reset to Defaults</h2>
            </div>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                This will reset all settings to factory defaults. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
                <button
                    onClick={onCancel}
                    className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-semibold"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                >
                    Reset All Settings
                </button>
            </div>
        </div>
    </div>
);

// ─── Changelog Panel ──────────────────────────────────────────────────────────

const SENSITIVE_PATTERN = /secret|key|password|token|apikey/i;

const maskIfSensitive = (fieldName, value) => {
    if (!value) return '—';
    if (SENSITIVE_PATTERN.test(fieldName)) return MASK_STRING;
    if (typeof value === 'string' && value.length > 30 && /[A-Za-z0-9+/=]{20,}/.test(value)) return MASK_STRING;
    return value;
};

const ChangeLogPanel = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [log, setLog] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLog = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get('/api/v1/admin/websiteconfig/changelog');
                setLog(data.changeLog || []);
            } catch (err) {
                enqueueSnackbar(err?.response?.data?.message || 'Failed to load changelog', { variant: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchLog();
    }, [enqueueSnackbar]);

    if (loading) {
        return (
            <Card>
                <SectionHeading>Change Log</SectionHeading>
                <div className="flex items-center justify-center py-10 text-gray-400">
                    <Loader2 size={20} className="animate-spin mr-2" /> Loading...
                </div>
            </Card>
        );
    }

    if (log.length === 0) {
        return (
            <Card>
                <SectionHeading>Change Log</SectionHeading>
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                    <History size={32} className="text-gray-300" />
                    <p className="text-sm">No configuration changes recorded yet.</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden p-0">
            <div className="px-5 pt-5 pb-3 border-b border-gray-100">
                <SectionHeading>Change Log</SectionHeading>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Field</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Old Value</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">New Value</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Changed At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {log.slice(0, 20).map((entry, i) => (
                            <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">{entry.field}</td>
                                <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{maskIfSensitive(entry.field, entry.oldValue)}</td>
                                <td className="px-4 py-3 text-gray-700 max-w-[180px] truncate">{maskIfSensitive(entry.field, entry.newValue)}</td>
                                <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                                    {entry.changedAt ? new Date(entry.changedAt).toLocaleString() : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const WebsiteConfig = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeCategory, setActiveCategory] = useState('general');
    const [searchQuery, setSearchQuery] = useState('');
    const [showResetModal, setShowResetModal] = useState(false);
    // pendingSecrets: { "section.field": newValue | null }
    // null means "user cleared it back, keep existing" → send ""
    // actual string means "user typed a new value" → send it
    const [pendingSecrets, setPendingSecrets] = useState({});

    // ── Fetch config ──────────────────────────────────────────────────────────
    const fetchConfig = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/v1/admin/websiteconfig');
            setConfig(data.config);
            setPendingSecrets({});
        } catch (err) {
            enqueueSnackbar(err?.response?.data?.message || 'Failed to load configuration', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    // ── State updaters ────────────────────────────────────────────────────────
    const set = useCallback((section, field, value) => {
        setConfig((prev) => ({
            ...prev,
            [section]: { ...prev[section], [field]: value },
        }));
    }, []);

    const onSecretChange = useCallback((section, field, value) => {
        // value === null means "cleared back to blank"
        setPendingSecrets((prev) => ({
            ...prev,
            [`${section}.${field}`]: value,
        }));
    }, []);

    const handlers = { set, onSecretChange };

    // ── Build field index for search ──────────────────────────────────────────
    const fieldIndex = config ? buildFieldIndex(config, handlers) : [];

    // ── Search filtering ──────────────────────────────────────────────────────
    const trimmedQuery = searchQuery.trim().toLowerCase();
    const isSearching = trimmedQuery.length > 0;

    const searchResults = isSearching
        ? fieldIndex.filter((f) => f.fieldLabel.toLowerCase().includes(trimmedQuery))
        : [];

    // Group search results by section
    const searchResultsBySectionId = {};
    searchResults.forEach((f) => {
        if (!searchResultsBySectionId[f.sectionId]) {
            searchResultsBySectionId[f.sectionId] = [];
        }
        searchResultsBySectionId[f.sectionId].push(f);
    });

    // ── Save handler ──────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        try {
            // Build payload: deep-clone config, then apply secret logic
            const payload = JSON.parse(JSON.stringify(config));

            SECRET_FIELDS.forEach((key) => {
                const [section, field] = key.split('.');
                const pending = pendingSecrets[key];
                if (pending === null || pending === undefined) {
                    // User never touched it or cleared back → send "" (keep backend value)
                    if (payload[section]) payload[section][field] = '';
                } else {
                    // User typed a new value → send it
                    if (payload[section]) payload[section][field] = pending;
                }
            });

            await axios.put('/api/v1/admin/websiteconfig', { config: payload });
            enqueueSnackbar('Configuration saved', { variant: 'success' });
            setPendingSecrets({});
        } catch (err) {
            enqueueSnackbar(err?.response?.data?.message || 'Failed to save configuration', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // ── Reset handler ─────────────────────────────────────────────────────────
    const handleReset = async () => {
        setShowResetModal(false);
        setSaving(true);
        try {
            await axios.put('/api/v1/admin/websiteconfig/reset');
            enqueueSnackbar('Configuration reset to defaults', { variant: 'success' });
            await fetchConfig();
        } catch (err) {
            enqueueSnackbar(err?.response?.data?.message || 'Reset failed', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // ── Render active category fields ─────────────────────────────────────────
    const renderCategoryContent = () => {
        if (!config) return null;

        if (activeCategory === 'changelog') {
            return <ChangeLogPanel />;
        }

        const sectionFields = fieldIndex.filter((f) => f.sectionId === activeCategory);

        if (sectionFields.length === 0) return null;

        return (
            <Card>
                <SectionHeading>
                    {CATEGORIES.find((c) => c.id === activeCategory)?.label}
                </SectionHeading>
                <div className="flex flex-col gap-4">
                    {sectionFields.map((f) => f.element)}
                </div>
            </Card>
        );
    };

    // ── Render search results ─────────────────────────────────────────────────
    const renderSearchResults = () => {
        const sectionIds = Object.keys(searchResultsBySectionId);
        if (sectionIds.length === 0) {
            return (
                <Card>
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                        <Search size={28} className="text-gray-300" />
                        <p className="text-sm">No settings found for "{searchQuery.trim()}"</p>
                    </div>
                </Card>
            );
        }

        return sectionIds.map((sectionId) => {
            const cat = CATEGORIES.find((c) => c.id === sectionId);
            const fields = searchResultsBySectionId[sectionId];
            return (
                <Card key={sectionId} className="mb-4">
                    <SectionHeading>{cat?.label}</SectionHeading>
                    <div className="flex flex-col gap-4">
                        {fields.map((f) => f.element)}
                    </div>
                </Card>
            );
        });
    };

    // ── Loading state ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <>
                <MetaData title="Website Configuration | Admin" />
                <LoadingSkeleton />
            </>
        );
    }

    // ── Main render ───────────────────────────────────────────────────────────
    return (
        <>
            <MetaData title="Website Configuration | Admin" />

            {showResetModal && (
                <ResetModal onConfirm={handleReset} onCancel={() => setShowResetModal(false)} />
            )}

            {/* ── Top Bar ──────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Website Configuration</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Manage all website settings from one place</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Search */}
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search settings…"
                            className="border border-gray-200 rounded-xl pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 w-48 bg-white"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>
                    {/* Save */}
                    <button
                        onClick={handleSave}
                        disabled={saving || activeCategory === 'changelog'}
                        className="bg-[#E84B0F] hover:bg-[#C63E0A] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
                    >
                        {saving ? (
                            <Loader2 size={15} className="animate-spin" />
                        ) : (
                            <Save size={15} />
                        )}
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    {/* Reset */}
                    <button
                        onClick={() => setShowResetModal(true)}
                        disabled={saving}
                        className="border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
                    >
                        <RotateCcw size={15} />
                        Reset to Defaults
                    </button>
                </div>
            </div>

            {/* ── Mobile: horizontal category pills ────────────────────────── */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 lg:hidden">
                {CATEGORIES.map(({ id, label, Icon }) => (
                    <button
                        key={id}
                        onClick={() => { setActiveCategory(id); setSearchQuery(''); }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
                            activeCategory === id && !isSearching
                                ? 'bg-orange-50 text-[#E84B0F] border-orange-200'
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        <Icon size={13} />
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Two-column layout ─────────────────────────────────────────── */}
            <div className="flex gap-5 items-start">

                {/* ── Sidebar (desktop only) ────────────────────────────────── */}
                <aside
                    className="hidden lg:flex flex-col gap-0.5 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
                    style={{ minWidth: 220, width: 220, flexShrink: 0 }}
                >
                    {CATEGORIES.map(({ id, label, Icon, count }) => (
                        <button
                            key={id}
                            onClick={() => { setActiveCategory(id); setSearchQuery(''); }}
                            className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-colors text-left border-l-2 ${
                                activeCategory === id && !isSearching
                                    ? 'border-[#E84B0F] text-[#E84B0F] bg-orange-50'
                                    : 'border-transparent text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Icon size={15} className="shrink-0" />
                            <span className="flex-1 truncate">{label}</span>
                            {count !== null && (
                                <span
                                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                        activeCategory === id && !isSearching
                                            ? 'bg-orange-100 text-[#E84B0F]'
                                            : 'bg-gray-100 text-gray-400'
                                    }`}
                                >
                                    {count}
                                </span>
                            )}
                        </button>
                    ))}
                </aside>

                {/* ── Content area ──────────────────────────────────────────── */}
                <div className="flex-1 min-w-0">
                    {isSearching ? renderSearchResults() : renderCategoryContent()}
                </div>
            </div>
        </>
    );
};

export default WebsiteConfig;
