import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import MetaData from '../Layouts/MetaData';
import ThemeEditor from './ThemeEditor';
import RichTextEditor from './RichTextEditor';
import ImgBBSettings from './ImgBBSettings';
import ImgBBUploader from './ImgBBUploader';
import { DEFAULT_SITE_CONFIG } from '../../utils/siteConfig';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { API_ORIGIN } from '../../utils/apiOrigin';
import {
    Globe,
    Layout,
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
    Settings,
    History,
    Save,
    RotateCcw,
    Eye,
    EyeOff,
    X,
    Loader2,
    Database,
    Trash2,
    RefreshCw,
    Image,
    Bell,
    Send,
    CheckCircle2,
    AlertCircle,
    RadioTower,
    ShoppingCart,
    ScrollText,
    Package,
    Star,
    Copyright,
} from 'lucide-react';
// ─── Constants ────────────────────────────────────────────────────────────────
const MASK_STRING = '••••••••••••••••••••';
const CATEGORIES = [
    { id: 'general',   label: 'General',       Icon: Globe,       count: 12 },
    { id: 'branding',  label: 'Branding',       Icon: Palette,     count: 6  },
    { id: 'seo',       label: 'SEO',            Icon: Search,      count: 6  },
    { id: 'email',     label: 'Email / SMTP',   Icon: Mail,        count: 8  },
    { id: 'payment',   label: 'Payment',        Icon: CreditCard,  count: 6  },
    { id: 'cloud',     label: 'Cloud Storage',  Icon: Cloud,       count: 4  },
    { id: 'imgbb',     label: 'ImgBB Settings', Icon: Image,       count: null },
    { id: 'social',    label: 'Social Media',   Icon: Share2,      count: 6  },
    { id: 'socialLogin', label: 'Social Login', Icon: Key,         count: 10 },
    { id: 'discord',   label: 'Discord Alerts', Icon: Bell,        count: 5  },
    { id: 'shipping',  label: 'Shipping',       Icon: Truck,       count: 5  },
    { id: 'security',  label: 'Security',       Icon: Shield,      count: 6  },
    { id: 'cache',     label: 'Cache',          Icon: Zap,         count: 4  },
    { id: 'apiKeys',   label: 'API Keys',       Icon: Key,         count: 2  },
    { id: 'features',  label: 'Features',       Icon: Sliders,     count: 7  },
    { id: 'database',  label: 'Database',       Icon: Database,    count: null },
    { id: 'homepage',  label: 'Homepage',       Icon: Layout,      count: null },
    { id: 'footer',    label: 'Footer',         Icon: Copyright, count: null },
    { id: 'changelog', label: 'Change Log',     Icon: History,     count: null },
];
// Fields that carry sensitive data – if value still equals MASK_STRING, send "" on save
const SECRET_FIELDS = new Set([
    'email.smtpPassword',
    'email.sendgridApiKey',
    'payment.stripeSecretKey',
    'payment.stripeWebhookSecret',
    'cloud.cloudinaryApiKey',
    'cloud.cloudinaryApiSecret',
    'imgbb.apiKey',
    'apiKeys.otherApiKey1',
    'apiKeys.otherApiKey2',
    'socialLogin.googleClientSecret',
    'socialLogin.facebookAppSecret',
    'socialLogin.discordClientSecret',
    'discord.webhookUrl',
    'discord.webhooks.main',
    'discord.webhooks.orders',
    'discord.webhooks.logs',
    'discord.webhooks.products',
    'discord.webhooks.reviews',
    'database.mongoUri',
]);
// ─── Field Components ─────────────────────────────────────────────────────────
const inputCls =
    'border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 w-full bg-white';
const labelCls = 'text-xs font-medium text-gray-500 mb-1 block';
const TextField = ({ label, value, onChange, placeholder = '', hint = '' }) => (
    <div>
        <label className={labelCls}>{label}</label>
        <input
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={inputCls}
        />
        {hint ? <p className="mt-1 text-[11px] leading-snug text-gray-400">{hint}</p> : null}
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
const TextareaField = ({ label, value, onChange, placeholder = '', plain = false }) => (
    <div>
        <label className={labelCls}>{label}</label>
        {plain ? (
            <textarea
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className={inputCls + ' resize-y'}
            />
        ) : (
            <RichTextEditor value={value || ''} onChange={onChange} placeholder={placeholder} />
        )}
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
                backgroundColor: value ? 'var(--color-accent)' : '#d1d5db',
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
const SectionHeading = ({ children, icon }) => (
    <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-100">
        <span className="w-7 h-7 rounded-lg bg-[#E84B0F] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#E84B0F]/30">
            {icon || <span className="w-2.5 h-2.5 rounded-[3px] bg-white" />}
        </span>
        <h3 className="text-sm font-bold text-gray-900 tracking-tight">{children}</h3>
    </div>
);
const Card = ({ children, className = '' }) => (
    <div className={`bg-white border border-gray-200/80 rounded-2xl shadow-sm hover:shadow-md hover:border-[#E84B0F]/25 transition-all duration-200 p-4 sm:p-5 ${className}`}>
        {children}
    </div>
);
// ─── Social login: show the exact redirect URIs to register ───────────────────
const CallbackUrlsInfo = () => {
    const [urls, setUrls] = useState(null);
    const [copied, setCopied] = useState('');
    useEffect(() => {
        axios.get('/api/v1/admin/sociallogin/callback-urls', {
            headers: { Accept: 'application/json' },
            // Tell the server which origin the OAuth popup actually uses
            // (:4000 in dev, the live site in production).
            params: { origin: API_ORIGIN || window.location.origin },
        })
            .then((res) => setUrls(res.data))
            .catch(() => setUrls(null));
    }, []);
    const copy = (key, value) => {
        try {
            navigator.clipboard.writeText(value);
            setCopied(key);
            setTimeout(() => setCopied(''), 1500);
        } catch (_) {}
    };
    if (!urls) return null;
    const rows = [
        { key: 'google', label: 'Google redirect URI', value: urls.google },
        { key: 'facebook', label: 'Facebook redirect URI', value: urls.facebook },
        { key: 'discord', label: 'Discord redirect URI', value: urls.discord },
    ];
    return (
        <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-3">
            <p className="text-xs font-semibold text-gray-700">Redirect URIs to register</p>
            <p className="text-[11px] text-gray-500 mt-0.5 mb-2 leading-relaxed">
                Paste the matching URI into each provider's developer console (Authorized redirect URI / OAuth2 redirect).
            </p>
            <div className="flex flex-col gap-2">
                {rows.map(({ key, label, value }) => (
                    <div key={key} className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
                            <code className="block text-[11px] text-gray-700 break-all">{value}</code>
                        </div>
                        <button
                            type="button"
                            onClick={() => copy(key, value)}
                            className="shrink-0 text-[11px] font-semibold text-[#E84B0F] border border-[#E84B0F]/30 rounded-lg px-2 py-1 hover:bg-white transition-colors"
                        >
                            {copied === key ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
// ─── Build the fields tree for search ─────────────────────────────────────────
// Returns array of { sectionId, sectionLabel, fieldKey, fieldLabel, element(config, handlers) }
// We use this for search only; normal rendering is done directly.
const buildFieldIndex = (config, handlers) => {
    if (!config) return [];
    const { set, onSecretChange, onAutoSaveSeo = async () => {} } = handlers;
    const index = [];
    const add = (sectionId, fieldKey, fieldLabel, element) => {
        index.push({ sectionId, fieldKey, fieldLabel, element });
    };
    // general
    add('general', 'siteName', 'Site Name', <TextField key="siteName" label="Site Name" value={config.general?.siteName} onChange={(v) => set('general', 'siteName', v)} />);
    add('general', 'tagline', 'Tagline', <TextField key="tagline" label="Tagline" value={config.general?.tagline} onChange={(v) => set('general', 'tagline', v)} placeholder="e.g. Best prices, fast delivery" />);
    add('general', 'siteTitle', 'Site Title', <TextField key="siteTitle" label="Site Title" value={config.general?.siteTitle} onChange={(v) => set('general', 'siteTitle', v)} placeholder="e.g. GeForce HuB — Online Shopping" hint="Shown in the homepage browser tab and social previews. Leave empty to keep the default page title." />);
    add('general', 'siteDescription', 'Site Description', <TextareaField key="siteDescription" plain label="Site Description" value={config.general?.siteDescription} onChange={(v) => set('general', 'siteDescription', v)} />);
    add('general', 'siteUrl', 'Site URL', <TextField key="siteUrl" label="Site URL" value={config.general?.siteUrl} onChange={(v) => set('general', 'siteUrl', v)} />);
    add('general', 'contactEmail', 'Contact Email', <TextField key="contactEmail" label="Contact Email" value={config.general?.contactEmail} onChange={(v) => set('general', 'contactEmail', v)} />);
    add('general', 'contactPhone', 'Contact Phone', <TextField key="contactPhone" label="Contact Phone" value={config.general?.contactPhone} onChange={(v) => set('general', 'contactPhone', v)} />);
    add('general', 'timezone', 'Timezone', <SelectField key="timezone" label="Timezone" value={config.general?.timezone} onChange={(v) => set('general', 'timezone', v)} options={[{value:'Asia/Dhaka',label:'Asia/Dhaka'},{value:'Asia/Kolkata',label:'Asia/Kolkata'},{value:'UTC',label:'UTC'},{value:'America/New_York',label:'America/New_York'},{value:'Europe/London',label:'Europe/London'}]} />);
    add('general', 'language', 'Language', <SelectField key="language" label="Language" value={config.general?.language} onChange={(v) => set('general', 'language', v)} options={[{value:'en',label:'English'},{value:'bn',label:'Bengali'}]} />);
    add('general', 'currency', 'Currency Code', <TextField key="currency" label="Currency Code" value={config.general?.currency} onChange={(v) => set('general', 'currency', v)} placeholder="BDT" />);
    add('general', 'currencySymbol', 'Currency Symbol', <TextField key="currencySymbol" label="Currency Symbol" value={config.general?.currencySymbol} onChange={(v) => set('general', 'currencySymbol', v)} placeholder="৳" />);
    add('general', 'maintenanceMode', 'Maintenance Mode', <ToggleField key="maintenanceMode" label="Maintenance Mode" description="Take the site offline for maintenance" value={config.general?.maintenanceMode} onChange={(v) => set('general', 'maintenanceMode', v)} />);
    add('general', 'maintenanceMessage', 'Maintenance Message', <TextareaField key="maintenanceMessage" plain label="Maintenance Message" value={config.general?.maintenanceMessage} onChange={(v) => set('general', 'maintenanceMessage', v)} />);
    // branding
    add('branding', 'logoUrl', 'Logo URL', <TextField key="logoUrl" label="Logo URL" value={config.branding?.logoUrl} onChange={(v) => set('branding', 'logoUrl', v)} />);
    add('branding', 'faviconUrl', 'Favicon URL', <TextField key="faviconUrl" label="Favicon URL" value={config.branding?.faviconUrl} onChange={(v) => set('branding', 'faviconUrl', v)} />);
    add('branding', 'primaryColor', 'Primary Color', <ColorField key="primaryColor" label="Primary Color" value={config.branding?.primaryColor} onChange={(v) => set('branding', 'primaryColor', v)} />);
    add('branding', 'secondaryColor', 'Secondary Color', <ColorField key="secondaryColor" label="Secondary Color" value={config.branding?.secondaryColor} onChange={(v) => set('branding', 'secondaryColor', v)} />);
    add('branding', 'accentColor', 'Accent Color', <ColorField key="accentColor" label="Accent Color" value={config.branding?.accentColor} onChange={(v) => set('branding', 'accentColor', v)} />);
    add('branding', 'darkMode', 'Dark Mode', <ToggleField key="darkMode" label="Dark Mode" description="Enable dark theme by default" value={config.branding?.darkMode} onChange={(v) => set('branding', 'darkMode', v)} />);
    // seo
    add('seo', 'metaKeywords', 'Meta Keywords', <TextareaField key="metaKeywords" plain label="Meta Keywords" value={config.seo?.metaKeywords} onChange={(v) => set('seo', 'metaKeywords', v)} />);
    add('seo', 'metaRobots', 'Meta Robots', <SelectField key="metaRobots" label="Meta Robots" value={config.seo?.metaRobots} onChange={(v) => set('seo', 'metaRobots', v)} options={[{value:'index, follow',label:'index, follow'},{value:'noindex, nofollow',label:'noindex, nofollow'},{value:'index, nofollow',label:'index, nofollow'},{value:'noindex, follow',label:'noindex, follow'}]} />);
    add('seo', 'googleAnalyticsId', 'Google Analytics ID', <TextField key="googleAnalyticsId" label="Google Analytics ID" value={config.seo?.googleAnalyticsId} onChange={(v) => set('seo', 'googleAnalyticsId', v)} placeholder="G-XXXXXXXXXX" />);
    add('seo', 'googleTagManagerId', 'Google Tag Manager ID', <TextField key="googleTagManagerId" label="Google Tag Manager ID" value={config.seo?.googleTagManagerId} onChange={(v) => set('seo', 'googleTagManagerId', v)} placeholder="GTM-XXXXXXX" />);
    add('seo', 'metaOgImage', 'OG Image', (
        <ImgBBUploader
            key="metaOgImage"
            label="OG Image — social share preview (recommended 1200×630)"
            currentUrl={config.seo?.metaOgImage || ''}
            onUploaded={(url) => set('seo', 'metaOgImage', url)}
            onAutoSave={(url) => onAutoSaveSeo('metaOgImage', url)}
            previewClass="max-h-40 max-w-full object-contain rounded-lg"
        />
    ));
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
    add('payment', 'bKashNumber', 'bKash Number', <TextField key="bKashNumber" label="bKash Number" value={config.payment?.bKashNumber} onChange={(v) => set('payment', 'bKashNumber', v)} />);
    add('payment', 'nagadNumber', 'Nagad Number', <TextField key="nagadNumber" label="Nagad Number" value={config.payment?.nagadNumber} onChange={(v) => set('payment', 'nagadNumber', v)} />);
    add('payment', 'defaultPaymentMethod', 'Default Payment Method', <SelectField key="defaultPaymentMethod" label="Default Payment Method" value={config.payment?.defaultPaymentMethod} onChange={(v) => set('payment', 'defaultPaymentMethod', v)} options={[{value:'cash_on_delivery',label:'Cash on Delivery'},{value:'stripe',label:'Stripe'},{value:'bkash',label:'bKash'},{value:'nagad',label:'Nagad'}]} />);
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
    // socialLogin (Google / Facebook / Discord OAuth)
    add('socialLogin', 'callbackUrls', 'Redirect URIs', <CallbackUrlsInfo key="callbackUrls" />);
    add('socialLogin', 'googleEnabled', 'Google Login', <ToggleField key="googleEnabled" label="Enable Google Login" description="Let customers sign in with their Google account" value={config.socialLogin?.googleEnabled} onChange={(v) => set('socialLogin', 'googleEnabled', v)} />);
    add('socialLogin', 'googleClientId', 'Google Client ID', <TextField key="googleClientId" label="Google Client ID" value={config.socialLogin?.googleClientId} onChange={(v) => set('socialLogin', 'googleClientId', v)} placeholder="xxxxxxxx.apps.googleusercontent.com" />);
    add('socialLogin', 'googleClientSecret', 'Google Client Secret', <SecretField key="googleClientSecret" label="Google Client Secret" section="socialLogin" field="googleClientSecret" value={config.socialLogin?.googleClientSecret} onSecretChange={onSecretChange} />);
    add('socialLogin', 'facebookEnabled', 'Facebook Login', <ToggleField key="facebookEnabled" label="Enable Facebook Login" description="Let customers sign in with their Facebook account" value={config.socialLogin?.facebookEnabled} onChange={(v) => set('socialLogin', 'facebookEnabled', v)} />);
    add('socialLogin', 'facebookAppId', 'Facebook App ID', <TextField key="facebookAppId" label="Facebook App ID" value={config.socialLogin?.facebookAppId} onChange={(v) => set('socialLogin', 'facebookAppId', v)} placeholder="1234567890" />);
    add('socialLogin', 'facebookAppSecret', 'Facebook App Secret', <SecretField key="facebookAppSecret" label="Facebook App Secret" section="socialLogin" field="facebookAppSecret" value={config.socialLogin?.facebookAppSecret} onSecretChange={onSecretChange} />);
    add('socialLogin', 'discordEnabled', 'Discord Login', <ToggleField key="discordEnabled" label="Enable Discord Login" description="Let customers sign in with their Discord account" value={config.socialLogin?.discordEnabled} onChange={(v) => set('socialLogin', 'discordEnabled', v)} />);
    add('socialLogin', 'discordClientId', 'Discord Client ID', <TextField key="discordClientId" label="Discord Client ID" value={config.socialLogin?.discordClientId} onChange={(v) => set('socialLogin', 'discordClientId', v)} placeholder="1234567890123456789" />);
    add('socialLogin', 'discordClientSecret', 'Discord Client Secret', <SecretField key="discordClientSecret" label="Discord Client Secret" section="socialLogin" field="discordClientSecret" value={config.socialLogin?.discordClientSecret} onSecretChange={onSecretChange} />);
    add('socialLogin', 'callbackBaseUrl', 'Callback Base URL', <TextField key="callbackBaseUrl" label="Callback Base URL (optional)" value={config.socialLogin?.callbackBaseUrl} onChange={(v) => set('socialLogin', 'callbackBaseUrl', v)} placeholder="Leave empty to auto-detect, e.g. https://your-site.com" />);
    // discord (multi-channel notifications)
    add('discord', 'enabled', 'Discord Alerts', <ToggleField key="enabled" label="Enable Discord Notifications" description="Master switch for every Discord channel" value={config.discord?.enabled} onChange={(v) => set('discord', 'enabled', v)} />);
    DISCORD_CHANNELS.forEach((role) => {
        add('discord', `webhooks.${role.key}`, `${role.label} webhook`, (
            <DiscordChannelRow key={role.key} role={role} config={config} set={set} />
        ));
    });
    add('discord', 'notifyOnCreate', 'New Products', <ToggleField key="notifyOnCreate" label="New Product Added" description="Post an embed with full details and images when a product is added" value={config.discord?.notifyOnCreate} onChange={(v) => set('discord', 'notifyOnCreate', v)} />);
    add('discord', 'notifyOnUpdate', 'Product Updates', <ToggleField key="notifyOnUpdate" label="Product Updated" description="Post when a product is edited" value={config.discord?.notifyOnUpdate} onChange={(v) => set('discord', 'notifyOnUpdate', v)} />);
    add('discord', 'notifyOnDelete', 'Product Removed', <ToggleField key="notifyOnDelete" label="Product Removed" description="Post when a product is deleted" value={config.discord?.notifyOnDelete} onChange={(v) => set('discord', 'notifyOnDelete', v)} />);
    // shipping
    add('shipping', 'insideDhaka', 'Delivery – Inside Dhaka (Tk)', <NumberField key="insideDhaka" label="Delivery – Inside Dhaka (Tk)" value={config.shipping?.insideDhaka} onChange={(v) => set('shipping', 'insideDhaka', v)} min={0} />);
    add('shipping', 'outsideDhaka', 'Delivery – Outside Dhaka (Tk)', <NumberField key="outsideDhaka" label="Delivery – Outside Dhaka (Tk)" value={config.shipping?.outsideDhaka} onChange={(v) => set('shipping', 'outsideDhaka', v)} min={0} />);
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
    if (!value) return '–';
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
                                    {entry.changedAt ? new Date(entry.changedAt).toLocaleString() : '–'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

// ─── Branding Panel (logo, site identity + full ThemeEditor) ─────────────────

const BrandingPanel = () => {
    const { enqueueSnackbar } = useSnackbar();
    const { reloadConfig } = useSiteConfig();

    // Branding fields live in websiteconfig (logo, favicon, colors)
    const [brandConfig, setBrandConfig] = useState(null);
    const [brandLoading, setBrandLoading] = useState(true);
    const [brandSaving, setBrandSaving] = useState(false);

    // Theme lives in siteconfig (same endpoint as HomepagePanel)
    const [theme, setTheme] = useState(null);
    const [themeLoading, setThemeLoading] = useState(true);
    const [themeSaving, setThemeSaving] = useState(false);

    // ── Load branding (websiteconfig) ──────────────────────────────────────────
    useEffect(() => {
        setBrandLoading(true);
        axios.get('/api/v1/admin/websiteconfig', { headers: { Accept: 'application/json' } })
            .then((res) => { if (res.data?.config) setBrandConfig(res.data.config); })
            .catch(() => enqueueSnackbar('Failed to load branding config', { variant: 'error' }))
            .finally(() => setBrandLoading(false));
    }, [enqueueSnackbar]);

    // ── Load theme (siteconfig) ────────────────────────────────────────────────
    useEffect(() => {
        setThemeLoading(true);
        axios.get('/api/v1/siteconfig', { headers: { Accept: 'application/json' } })
            .then((res) => { if (res.data?.config?.theme) setTheme(res.data.config.theme); })
            .catch(() => enqueueSnackbar('Failed to load theme', { variant: 'error' }))
            .finally(() => setThemeLoading(false));
    }, [enqueueSnackbar]);

    const setBrand = (field, value) =>
        setBrandConfig((prev) => ({ ...prev, branding: { ...prev.branding, [field]: value } }));

    // ── Auto-save a single branding field immediately to DB ───────────────────
    const autoSaveBrandField = async (field, url) => {
        await axios.put('/api/v1/admin/websiteconfig', {
            config: { branding: { ...((brandConfig?.branding) || {}), [field]: url } }
        });
        // Also update local state so the next full save includes it
        setBrand(field, url);
        reloadConfig(); // logo/favicon update on the live site immediately
    };

    // ── Save branding fields ───────────────────────────────────────────────────
    const saveBranding = async () => {
        if (!brandConfig) return;
        setBrandSaving(true);
        try {
            await axios.put('/api/v1/admin/websiteconfig', { config: { branding: brandConfig.branding } });
            reloadConfig(); // header logo/name update live
            enqueueSnackbar('Branding saved', { variant: 'success' });
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Save failed', { variant: 'error' });
        } finally {
            setBrandSaving(false);
        }
    };

    // ── Save theme ─────────────────────────────────────────────────────────────
    const saveTheme = async () => {
        if (!theme) return;
        setThemeSaving(true);
        try {
            await axios.put('/api/v1/admin/siteconfig', { theme }, {
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            });
            enqueueSnackbar('Theme saved', { variant: 'success' });
            reloadConfig();
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Theme save failed', { variant: 'error' });
        } finally {
            setThemeSaving(false);
        }
    };

    if (brandLoading || themeLoading) {
        return (
            <Card>
                <div className="flex items-center justify-center py-16 text-gray-400">
                    <Loader2 size={22} className="animate-spin mr-2" /> Loading branding settings...
                </div>
            </Card>
        );
    }

    const b = brandConfig?.branding || {};

    return (
        <div className="flex flex-col gap-5">

            {/* ── Site Identity ──────────────────────────────────────────────────── */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <SectionHeading>Site Identity</SectionHeading>
                    <button
                        onClick={saveBranding}
                        disabled={brandSaving}
                        className="bg-[#E84B0F] hover:bg-[#C63E0A] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
                    >
                        {brandSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {brandSaving ? 'Saving...' : 'Save Branding'}
                    </button>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        {/* Logo — upload via ImgBB or paste URL */}
                        <ImgBBUploader
                            label="Logo"
                            currentUrl={b.logoUrl ?? ''}
                            onUploaded={(url) => setBrand('logoUrl', url)}
                            onAutoSave={(url) => autoSaveBrandField('logoUrl', url)}
                            previewClass="max-h-12 max-w-full object-contain"
                        />
                        {/* Favicon — upload via ImgBB or paste URL */}
                        <ImgBBUploader
                            label="Favicon"
                            currentUrl={b.faviconUrl ?? ''}
                            onUploaded={(url) => setBrand('faviconUrl', url)}
                            onAutoSave={(url) => autoSaveBrandField('faviconUrl', url)}
                            accept="image/*,.ico"
                            previewClass="max-h-8 max-w-full object-contain"
                        />
                    </div>

                    {/* Colours now live in the Theme section below — it is the
                        single source of truth so the two never conflict. */}
                    <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-3">
                        <p className="text-xs font-semibold text-gray-700">Colours are managed in the Theme section</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                            Use <strong>Theme &amp; Visual Customisation</strong> below for the accent, backgrounds,
                            header/footer and text colours. It applies everywhere on the storefront instantly.
                        </p>
                    </div>
                </div>
            </Card>

            {/* ── Theme & Visual Customisation ───────────────────────────────────── */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <SectionHeading>Theme &amp; Visual Customisation</SectionHeading>
                    <button
                        onClick={saveTheme}
                        disabled={themeSaving}
                        className="bg-[#E84B0F] hover:bg-[#C63E0A] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
                    >
                        {themeSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {themeSaving ? 'Saving...' : 'Save Theme'}
                    </button>
                </div>
                <p className="text-xs text-gray-400 mb-4 -mt-2">
                    Changes apply instantly as a live preview. Click <strong>Save Theme</strong> to persist site-wide.
                </p>
                {theme ? (
                    <ThemeEditor theme={theme} onChange={setTheme} />
                ) : (
                    <div className="flex items-center gap-2 text-gray-400 py-8 text-sm justify-center">
                        <Loader2 size={16} className="animate-spin" /> Loading theme...
                    </div>
                )}
            </Card>
        </div>
    );
};
// ─── Database Panel ───────────────────────────────────────────────────────────

const DatabasePanel = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [status, setStatus] = useState(null);
    const [statusLoading, setStatusLoading] = useState(true);
    const [uri, setUri] = useState('');
    const [uriDirty, setUriDirty] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [saving, setSaving] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [seedResult, setSeedResult] = useState(null);
    const [showDropModal, setShowDropModal] = useState(false);
    const [dropConfirm, setDropConfirm] = useState('');
    const [dropping, setDropping] = useState(false);

    const fetchStatus = async () => {
        setStatusLoading(true);
        try {
            const { data } = await axios.get('/api/v1/admin/database/status');
            setStatus(data);
            if (!uriDirty) setUri(data.currentUri || '');
        } catch (err) {
            enqueueSnackbar('Failed to load database status', { variant: 'error' });
        } finally {
            setStatusLoading(false);
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchStatus(); }, []);

    const handleTest = async () => {
        if (!uri || (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://'))) {
            enqueueSnackbar('Enter a valid MongoDB URI', { variant: 'warning' });
            return;
        }
        setTesting(true);
        setTestResult(null);
        try {
            const { data } = await axios.post('/api/v1/admin/database/test', { uri });
            setTestResult({ success: true, info: data.info });
            enqueueSnackbar('Connection test successful', { variant: 'success' });
        } catch (err) {
            setTestResult({ success: false, message: err.response?.data?.message || 'Test failed' });
            enqueueSnackbar(err.response?.data?.message || 'Test failed', { variant: 'error' });
        } finally {
            setTesting(false);
        }
    };

    const handleSaveUri = async () => {
        if (!uri || (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://'))) {
            enqueueSnackbar('Enter a valid MongoDB URI', { variant: 'warning' });
            return;
        }
        setSaving(true);
        try {
            const { data } = await axios.put('/api/v1/admin/database/uri', { uri });
            enqueueSnackbar(data.message, { variant: 'success' });
            setUriDirty(false);
            fetchStatus();
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Save failed', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleSeed = async () => {
        setSeeding(true);
        setSeedResult(null);
        try {
            const { data } = await axios.post('/api/v1/admin/database/seed');
            setSeedResult(data.results);
            enqueueSnackbar(data.message, { variant: 'success' });
            fetchStatus();
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Seed failed', { variant: 'error' });
        } finally {
            setSeeding(false);
        }
    };

    const handleDrop = async () => {
        if (dropConfirm !== 'DROP_ALL_DATA') {
            enqueueSnackbar('Type DROP_ALL_DATA to confirm', { variant: 'warning' });
            return;
        }
        setDropping(true);
        try {
            const { data } = await axios.post('/api/v1/admin/database/drop', { confirm: dropConfirm });
            enqueueSnackbar(data.message, { variant: 'success' });
            setShowDropModal(false);
            setDropConfirm('');
            fetchStatus();
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Drop failed', { variant: 'error' });
        } finally {
            setDropping(false);
        }
    };

    const stateColor = (s) => {
        if (s === 'connected') return 'text-green-600 bg-green-50 border border-green-200';
        if (s === 'connecting') return 'text-yellow-600 bg-yellow-50 border border-yellow-200';
        return 'text-red-600 bg-red-50 border border-red-200';
    };

    const formatBytes = (b) => {
        if (!b) return '0 B';
        const k = 1024;
        const sz = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(b) / Math.log(k));
        return (b / Math.pow(k, i)).toFixed(1) + ' ' + sz[i];
    };

    return (
        <div className="flex flex-col gap-5">
            {showDropModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowDropModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                                <Trash2 size={18} className="text-red-500" />
                            </span>
                            <h2 className="text-base font-semibold text-gray-900">Clear All Data</h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                            Deletes all documents from every collection. Cannot be undone.
                            Type <strong>DROP_ALL_DATA</strong> to confirm.
                        </p>
                        <input type="text" value={dropConfirm} onChange={(e) => setDropConfirm(e.target.value)}
                            placeholder="DROP_ALL_DATA"
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full mb-4 focus:outline-none focus:border-red-400 font-mono" />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => { setShowDropModal(false); setDropConfirm(''); }}
                                className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-semibold">Cancel</button>
                            <button onClick={handleDrop} disabled={dropping || dropConfirm !== 'DROP_ALL_DATA'}
                                className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                                {dropping ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                Clear All Data
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Card>
                <div className="flex items-center justify-between mb-3">
                    <SectionHeading>Connection Status</SectionHeading>
                    <button onClick={fetchStatus} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 -mt-3">
                        <RefreshCw size={12} /> Refresh
                    </button>
                </div>
                {statusLoading ? (
                    <div className="flex items-center gap-2 text-gray-400 py-4 text-sm">
                        <Loader2 size={16} className="animate-spin" /> Checking connection...
                    </div>
                ) : status ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <span className={"px-3 py-1 rounded-full text-xs font-bold uppercase " + stateColor(status.status)}>
                                {status.status}
                            </span>
                            {status.stats && (
                                <span className="text-xs text-gray-400 font-mono">{status.stats.host} / {status.stats.name}</span>
                            )}
                        </div>
                        {status.stats && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: 'Collections', value: status.stats.collections },
                                    { label: 'Documents', value: Number(status.stats.documents || 0).toLocaleString() },
                                    { label: 'Data Size', value: formatBytes(status.stats.dataSize) },
                                    { label: 'Storage', value: formatBytes(status.stats.storageSize) },
                                ].map(function(item) { return (
                                    <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                                        <p className="text-lg font-bold text-gray-800">{item.value != null ? item.value : '-'}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
                                    </div>
                                ); })}
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400">Unable to fetch status.</p>
                )}
            </Card>

            <Card>
                <SectionHeading>MongoDB URI</SectionHeading>
                <p className="text-xs text-gray-400 mb-4">
                    Stored encrypted in the database. A server restart is required to apply a new URI.
                </p>
                <div className="flex flex-col gap-3">
                    <div>
                        <label className={labelCls}>MongoDB Connection URI</label>
                        <input type="text" value={uri}
                            onChange={(e) => { setUri(e.target.value); setUriDirty(true); setTestResult(null); }}
                            placeholder="mongodb+srv://user:password@cluster.mongodb.net/dbname"
                            className={inputCls} />
                        <p className="text-xs text-gray-400 mt-1">Format: mongodb+srv://user:pass@cluster.host/database</p>
                    </div>
                    {testResult && (
                        <div className={"rounded-xl p-3 text-sm border " + (testResult.success ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200')}>
                            {testResult.success ? (
                                <div>
                                    <p className="font-semibold">Connection successful</p>
                                    {testResult.info && (
                                        <p className="text-xs mt-1 opacity-80 font-mono">
                                            {testResult.info.host} / {testResult.info.name} — {testResult.info.collections} collections, {Number(testResult.info.documents || 0).toLocaleString()} docs
                                        </p>
                                    )}
                                </div>
                            ) : <p>{testResult.message}</p>}
                        </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={handleTest} disabled={testing || !uri}
                            className="border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                            {testing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                            {testing ? 'Testing...' : 'Test Connection'}
                        </button>
                        <button onClick={handleSaveUri} disabled={saving || !uriDirty}
                            className="bg-[#E84B0F] hover:bg-[#C63E0A] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {saving ? 'Saving...' : 'Save URI'}
                        </button>
                    </div>
                </div>
            </Card>

            <Card>
                <SectionHeading>Seed Database</SectionHeading>
                <p className="text-sm text-gray-500 mb-3">
                    Creates demo admin (<strong>admin@example.com</strong> / <strong>admin1234</strong>), a regular user, and sample products.
                    Safe to run multiple times — skips existing data.
                </p>
                <button onClick={handleSeed} disabled={seeding}
                    className="bg-[#E84B0F] hover:bg-[#C63E0A] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
                    {seeding ? <Loader2 size={15} className="animate-spin" /> : <Database size={15} />}
                    {seeding ? 'Seeding...' : 'Run Seed'}
                </button>
                {seedResult && (
                    <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Seed Results</p>
                        <div className="text-xs font-mono text-gray-600 flex flex-col gap-1">
                            {(seedResult.users || []).map((u, i) => (
                                <p key={i}>{u.includes('created') ? '+' : '-'} {u}</p>
                            ))}
                            {seedResult.products && (seedResult.products.skipped
                                ? <p className="text-gray-400 mt-1">Products: {seedResult.products.existing} exist (skipped)</p>
                                : <p className="text-green-600 mt-1">+ Products: {seedResult.products.seeded} seeded</p>
                            )}
                        </div>
                    </div>
                )}
            </Card>

            <Card>
                <SectionHeading>Danger Zone</SectionHeading>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-200">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-red-700">Clear All Database Data</p>
                        <p className="text-xs text-red-500 mt-0.5">Deletes all documents from every collection. Irreversible.</p>
                    </div>
                    <button onClick={() => setShowDropModal(true)}
                        className="border border-red-300 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shrink-0">
                        <Trash2 size={14} /> Clear Data
                    </button>
                </div>
            </Card>
        </div>
    );
};
// ─── Homepage Panel (embedded SiteEditor) ─────────────────────────────────────

const HomepageField = ({ label, value, onChange, textarea, plain, type = 'text', placeholder = '' }) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500">{label}</label>
        {textarea || plain ? (
            plain ? (
                <textarea
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    rows={3}
                    placeholder={placeholder}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#E84B0F] focus:ring-2 focus:ring-[#E84B0F]/20 transition resize-y w-full"
                />
            ) : (
                <RichTextEditor value={value || ''} onChange={onChange} placeholder={placeholder} />
            )
        ) : (
            <input
                type={type}
                value={value ?? ''}
                onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
                placeholder={placeholder}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#E84B0F] focus:ring-2 focus:ring-[#E84B0F]/20 transition w-full"
            />
        )}
    </div>
);

const HomepagePanel = ({ registerSave, registerReset, onSavingChange }) => {
    const { enqueueSnackbar } = useSnackbar();
    const { reloadConfig } = useSiteConfig();
    const [hpConfig, setHpConfig] = useState(null);
    const [hpLoading, setHpLoading] = useState(true);
    const [hpSaving, setHpSaving] = useState(false);

    useEffect(() => {
        setHpLoading(true);
        axios.get('/api/v1/siteconfig', { headers: { Accept: 'application/json' } })
            .then((res) => {
                if (res.data?.config) {
                    const merged = { ...JSON.parse(JSON.stringify(DEFAULT_SITE_CONFIG)), ...JSON.parse(JSON.stringify(res.data.config)) };
                    // Banners are objects { image, badge, title, subtitle }.
                    // Normalise legacy string entries, and seed the first slot
                    // from the legacy single image so an existing hero shows up.
                    if (merged.hero) {
                        const toBanner = (b) => (typeof b === 'string'
                            ? { image: b, badge: '', title: '', subtitle: '', buttonLabel: '', buttonLink: '' }
                            : { image: b?.image || '', badge: b?.badge || '', title: b?.title || '', subtitle: b?.subtitle || '', buttonLabel: b?.buttonLabel || '', buttonLink: b?.buttonLink || '' });
                        let banners = (Array.isArray(merged.hero.banners) ? merged.hero.banners : []).map(toBanner);
                        if (!banners.some((b) => b.image)) banners = merged.hero.image ? [toBanner(merged.hero.image)] : [];
                        // Show the current live text in every slot: blank banner
                        // fields inherit the shared hero copy (the storefront
                        // does the same fallback), so saving persists real copy.
                        merged.hero.banners = banners.map((b) => ({
                            ...b,
                            badge: b.badge || merged.hero.badge || '',
                            title: b.title || merged.hero.title || '',
                            subtitle: b.subtitle || merged.hero.subtitle || '',
                            buttonLabel: b.buttonLabel || merged.hero.buttonLabel || 'Shop Now',
                            buttonLink: b.buttonLink || merged.hero.buttonLink || '/products',
                        }));
                    }
                    setHpConfig(merged);
                }
            })
            .catch(() => enqueueSnackbar('Using default homepage content', { variant: 'warning' }))
            .finally(() => setHpLoading(false));
    }, [enqueueSnackbar]);

    const setHpSection = (section, key, value) =>
        setHpConfig((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }));

    const setHpNested = (section, group, key, value) =>
        setHpConfig((prev) => ({
            ...prev,
            [section]: { ...prev[section], [group]: { ...prev[section]?.[group], [key]: value } },
        }));

    // ── Auto-save a single nested image URL to siteconfig immediately ────────
    // Merges just the changed field so other settings are not overwritten
    const autoSaveHpNested = async (section, group, key, url) => {
        setHpNested(section, group, key, url);
        await axios.put('/api/v1/admin/siteconfig',
            { [section]: { [group]: { [key]: url } } },
            { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
        );
    };

    // Persist the hero banner list immediately (used by each banner uploader).
    const setHeroBanners = (banners) =>
        setHpConfig((prev) => ({ ...prev, hero: { ...prev.hero, banners } }));

    // Update one field (image/badge/title/subtitle) of a single banner.
    const setHeroBannerField = (index, field, value) =>
        setHpConfig((prev) => {
            const banners = JSON.parse(JSON.stringify(prev.hero?.banners || []));
            while (banners.length <= index) banners.push({ image: '', badge: '', title: '', subtitle: '', buttonLabel: '', buttonLink: '' });
            banners[index] = { ...banners[index], [field]: value };
            return { ...prev, hero: { ...prev.hero, banners } };
        });

    const autoSaveHeroBanners = async (banners) => {
        setHeroBanners(banners);
        try {
            await axios.put('/api/v1/admin/siteconfig',
                { hero: { banners } },
                { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });
            reloadConfig();
        } catch {
            enqueueSnackbar('Image uploaded but could not save — press Save', { variant: 'warning' });
        }
    };

    const setHpArrayItem = (arrayKey, index, field, value) =>
        setHpConfig((prev) => {
            const arr = JSON.parse(JSON.stringify(prev[arrayKey] || []));
            arr[index] = { ...arr[index], [field]: value };
            return { ...prev, [arrayKey]: arr };
        });

    const addHpArrayItem = (arrayKey, template) =>
        setHpConfig((prev) => ({ ...prev, [arrayKey]: [...(prev[arrayKey] || []), template] }));

    const removeHpArrayItem = (arrayKey, index) =>
        setHpConfig((prev) => {
            const arr = JSON.parse(JSON.stringify(prev[arrayKey] || []));
            arr.splice(index, 1);
            return { ...prev, [arrayKey]: arr };
        });

    // Auto-save a single review's image URL immediately (like the logo uploader).
    const autoSaveReviewImage = async (index, url) => {
        const arr = JSON.parse(JSON.stringify(hpConfig.reviews || []));
        arr[index] = { ...arr[index], image: url || '' };
        setHpConfig((prev) => ({ ...prev, reviews: arr }));
        try {
            await axios.put('/api/v1/admin/siteconfig',
                { reviews: arr },
                { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });
            reloadConfig();
        } catch {
            enqueueSnackbar('Image uploaded but could not save — press Save', { variant: 'warning' });
        }
    };

    const saveHp = async () => {
        setHpSaving(true);
        try {
            await axios.put('/api/v1/admin/siteconfig', hpConfig, {
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            });
            enqueueSnackbar('Homepage saved', { variant: 'success' });
            reloadConfig();
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Save failed', { variant: 'error' });
        } finally {
            setHpSaving(false);
        }
    };

    const resetHp = async () => {
        try {
            const { data } = await axios.put('/api/v1/admin/siteconfig/reset', {}, { headers: { Accept: 'application/json' } });
            setHpConfig(JSON.parse(JSON.stringify(data.config)));
            enqueueSnackbar('Homepage reset to defaults', { variant: 'success' });
            reloadConfig();
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Reset failed', { variant: 'error' });
        }
    };

    // The Homepage tab has no save bar of its own — the page-wide Save/Reset
    // buttons in the top bar drive these handlers instead.
    useEffect(() => {
        registerSave?.(saveHp);
    });
    useEffect(() => {
        registerReset?.(resetHp);
    });
    useEffect(() => {
        onSavingChange?.(hpSaving);
    }, [hpSaving, onSavingChange]);
    useEffect(() => () => onSavingChange?.(false), [onSavingChange]);

    if (hpLoading || !hpConfig) {
        return (
            <Card>
                <div className="flex items-center justify-center py-16 text-gray-400">
                    <Loader2 size={22} className="animate-spin mr-2" /> Loading homepage settings...
                </div>
            </Card>
        );
    }

    const a = hpConfig.announcement || {};
    const h = hpConfig.hero || {};
    const heroBanners = Array.isArray(h.banners) && h.banners.length
        ? h.banners.slice(0, 3)
        : [{ image: '', badge: '', title: '', subtitle: '' }];
    const s = hpConfig.seo || {};
    const n = hpConfig.navigation || {};
    const c = hpConfig.content || {};
    const ch = hpConfig.chat || {};

    const bodyToText = (lines) => (Array.isArray(lines) && lines.length === 1 && /<[a-z][\s\S]*>/i.test(lines[0]) ? lines[0] : (lines || []).join('\n'));
    // Rich text (HTML) is kept as a single array item; plain text splits per line.
    const textToBody = (text) => (/<[a-z][\s\S]*>/i.test(text || '') ? [text] : String(text || '').split('\n').map((x) => x.trim()).filter(Boolean));

    return (
        <div className="flex flex-col gap-5">
            {/* Announcements */}
            <Card>
                <SectionHeading>Announcements &amp; Trust Bar</SectionHeading>
                <div className="flex flex-col gap-3">
                    <div className="grid sm:grid-cols-3 gap-3">
                        {(a.desktop || []).map((item, i) => (
                            <HomepageField key={i} label={`Announcement ${i + 1}`} value={item}
                                onChange={(v) => setHpConfig((prev) => {
                                    const arr = JSON.parse(JSON.stringify(prev.announcement.desktop));
                                    arr[i] = v;
                                    return { ...prev, announcement: { ...prev.announcement, desktop: arr } };
                                })} />
                        ))}
                    </div>
                    <HomepageField label="Mobile announcement text" plain value={a.mobile}
                        onChange={(v) => setHpSection('announcement', 'mobile', v)} />
                </div>
            </Card>

            {/* Hero */}
            <Card>
                <SectionHeading icon={<Layout size={14} />}>Hero Section</SectionHeading>

                {/* Banners — up to 3, each with its own copy, shown as an auto-rotating slider */}
                <div className="rounded-xl bg-gray-50 border border-dashed border-gray-300 p-3">
                    <p className="text-[11px] font-bold text-[#E84B0F] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <Image size={12} /> Hero banners
                    </p>
                    <p className="text-[11px] text-gray-400 mb-3">
                        Add up to 3 banners. Each banner has its own badge, title, subtitle, button label and button link — they rotate automatically on the homepage.
                    </p>
                    <div className="flex flex-col gap-4">
                        {heroBanners.map((banner, i) => (
                            <div key={i} className="rounded-lg border border-gray-200 bg-white p-3 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-600">Banner {i + 1}</span>
                                    {heroBanners.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => autoSaveHeroBanners(heroBanners.filter((_, idx) => idx !== i))}
                                            className="text-[11px] text-red-500 hover:underline"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <ImgBBUploader
                                    label={`Banner ${i + 1} image`}
                                    currentUrl={banner.image ?? ''}
                                    onUploaded={(u) => {
                                        const next = [...heroBanners];
                                        next[i] = { ...next[i], image: u };
                                        setHeroBanners(next);
                                    }}
                                    onAutoSave={(u) => {
                                        const next = [...heroBanners];
                                        next[i] = { ...next[i], image: u };
                                        autoSaveHeroBanners(next);
                                    }}
                                    previewClass="max-h-28 max-w-full object-cover rounded-lg w-full shadow-sm"
                                />
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <HomepageField label="Badge" value={banner.badge} onChange={(v) => setHeroBannerField(i, 'badge', v)} />
                                    <HomepageField label="Title" value={banner.title} onChange={(v) => setHeroBannerField(i, 'title', v)} />
                                    <div className="sm:col-span-2">
                                        <HomepageField label="Subtitle" plain value={banner.subtitle} onChange={(v) => setHeroBannerField(i, 'subtitle', v)} />
                                    </div>
                                    <HomepageField label="Button label" value={banner.buttonLabel} placeholder="Shop Now" onChange={(v) => setHeroBannerField(i, 'buttonLabel', v)} />
                                    <HomepageField label="Button link" value={banner.buttonLink} placeholder="/products" onChange={(v) => setHeroBannerField(i, 'buttonLink', v)} />
                                </div>
                            </div>
                        ))}
                    </div>
                    {heroBanners.length < 3 && (
                        <button
                            type="button"
                            onClick={() => autoSaveHeroBanners([...heroBanners, { image: '', badge: '', title: '', subtitle: '', buttonLabel: h?.buttonLabel || 'Shop Now', buttonLink: h?.buttonLink || '/products' }])}
                            className="mt-3 text-sm border border-dashed border-gray-400 rounded-xl px-3 py-1.5 hover:bg-gray-50"
                        >
                            + Add banner
                        </button>
                    )}
                </div>

                {/* Side cards */}
                <div className="grid sm:grid-cols-2 gap-3 border-t border-gray-100 mt-4 pt-4">
                    {['sideTop', 'sideBottom'].map((group, gi) => (
                        <div key={group} className="flex flex-col gap-3 bg-[#FFF7F2] rounded-xl p-3 border border-[#F3E8E0] shadow-sm">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#F3E8E0]">
                                <span className="w-7 h-7 rounded-lg bg-[#E84B0F] text-white flex items-center justify-center shrink-0">
                                    <Image size={14} />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-900 leading-tight">
                                        {gi === 0 ? 'Top side card' : 'Bottom side card'}
                                    </p>
                                    <p className="text-[10px] text-gray-400 leading-tight">hero.{group}</p>
                                </div>
                            </div>
                            <HomepageField label="Title" value={h[group]?.title} onChange={(v) => setHpNested('hero', group, 'title', v)} />
                            <HomepageField label="Subtitle" value={h[group]?.subtitle} onChange={(v) => setHpNested('hero', group, 'subtitle', v)} />
                            <div className="rounded-lg border border-dashed border-[#E8C9B5] bg-white/70 p-2">
                                <ImgBBUploader
                                    label="Card Image"
                                    currentUrl={h[group]?.image ?? ''}
                                    onUploaded={(url) => setHpNested('hero', group, 'image', url)}
                                    onAutoSave={(url) => autoSaveHpNested('hero', group, 'image', url)}
                                    previewClass="max-h-28 max-w-full object-cover rounded-lg w-full shadow-sm"
                                />
                            </div>
                            <HomepageField label="Link" value={h[group]?.link} onChange={(v) => setHpNested('hero', group, 'link', v)} />
                        </div>
                    ))}
                </div>
            </Card>

            {/* Trust Badges */}
            <Card>
                <SectionHeading>Trust Badges</SectionHeading>
                <div className="grid sm:grid-cols-2 gap-3">
                    {(hpConfig.trustBadges || []).map((badge, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2 relative">
                            <button onClick={() => removeHpArrayItem('trustBadges', i)}
                                className="absolute top-2 right-2 text-xs text-red-500 hover:underline">Remove</button>
                            <div className="grid grid-cols-[80px_1fr] gap-2">
                                <HomepageField label="Icon/Emoji" value={badge.icon} onChange={(v) => setHpArrayItem('trustBadges', i, 'icon', v)} />
                                <HomepageField label="Title" value={badge.title} onChange={(v) => setHpArrayItem('trustBadges', i, 'title', v)} />
                            </div>
                            <HomepageField label="Description" value={badge.description} onChange={(v) => setHpArrayItem('trustBadges', i, 'description', v)} />
                        </div>
                    ))}
                </div>
                <button onClick={() => addHpArrayItem('trustBadges', { icon: '', title: 'New Feature', description: 'Description' })}
                    className="mt-3 text-sm border border-dashed border-gray-400 rounded-xl px-3 py-1.5 hover:bg-gray-50">+ Add Badge</button>
            </Card>

            {/* Flash Sale has its own admin page → Admin → Flash Sale */}

            {/* How to Order */}
            <Card>
                <SectionHeading>How to Order Steps</SectionHeading>
                <div className="grid sm:grid-cols-3 gap-3">
                    {(hpConfig.howToOrder || []).map((step, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2 relative">
                            <button onClick={() => removeHpArrayItem('howToOrder', i)}
                                className="absolute top-1 right-1 text-xs text-red-500 hover:underline">x</button>
                            <div className="grid grid-cols-[60px_1fr] gap-2">
                                <HomepageField label="Icon" value={step.icon} onChange={(v) => setHpArrayItem('howToOrder', i, 'icon', v)} />
                                <HomepageField label="Title" value={step.title} onChange={(v) => setHpArrayItem('howToOrder', i, 'title', v)} />
                            </div>
                            <HomepageField label="Description" textarea value={step.description} onChange={(v) => setHpArrayItem('howToOrder', i, 'description', v)} />
                        </div>
                    ))}
                </div>
                <button onClick={() => addHpArrayItem('howToOrder', { icon: '', title: 'New Step', description: '' })}
                    className="mt-3 text-sm border border-dashed border-gray-400 rounded-xl px-3 py-1.5 hover:bg-gray-50">+ Add Step</button>
            </Card>

            {/* Customer Reviews */}
            <Card>
                <SectionHeading>Customer Reviews</SectionHeading>
                <div className="grid sm:grid-cols-2 gap-3">
                    {(hpConfig.reviews || []).map((review, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2 relative">
                            <button onClick={() => removeHpArrayItem('reviews', i)}
                                className="absolute top-1 right-1 text-xs text-red-500 hover:underline">x</button>
                            <div className="grid grid-cols-3 gap-2">
                                <HomepageField label="Name" value={review.name} onChange={(v) => setHpArrayItem('reviews', i, 'name', v)} />
                                <HomepageField label="District" value={review.district} onChange={(v) => setHpArrayItem('reviews', i, 'district', v)} />
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-gray-500">Rating</label>
                                    <select value={review.rating || 5} onChange={(e) => setHpArrayItem('reviews', i, 'rating', Number(e.target.value))}
                                        className="border border-gray-200 rounded-xl px-2 py-2 text-sm bg-white focus:outline-none focus:border-orange-400">
                                        {[5,4,3,2,1].map((r) => <option key={r} value={r}>{r} stars</option>)}
                                    </select>
                                </div>
                            </div>
                            <HomepageField label="Comment" textarea value={review.comment} onChange={(v) => setHpArrayItem('reviews', i, 'comment', v)} />
                            <ImgBBUploader
                                label="Customer image (optional)"
                                currentUrl={review.image || ''}
                                onUploaded={(url) => setHpArrayItem('reviews', i, 'image', url || '')}
                                onAutoSave={(url) => autoSaveReviewImage(i, url)}
                                previewClass="max-h-20 max-w-full object-contain"
                            />
                        </div>
                    ))}
                </div>
                <button onClick={() => addHpArrayItem('reviews', { name: '', district: '', rating: 5, comment: '', image: '' })}
                    className="mt-3 text-sm border border-dashed border-gray-400 rounded-xl px-3 py-1.5 hover:bg-gray-50">+ Add Review</button>
            </Card>

            {/* Payment / Delivery / Support */}
            <Card>
                <SectionHeading>Payment, Delivery &amp; Support</SectionHeading>
                <div className="grid sm:grid-cols-2 gap-3">
                    <HomepageField label="bKash Number" value={(hpConfig.payment || {}).bKashNumber} onChange={(v) => setHpSection('payment', 'bKashNumber', v)} placeholder="017XXXXXXXX" />
                    <HomepageField label="Nagad Number" value={(hpConfig.payment || {}).nagadNumber} onChange={(v) => setHpSection('payment', 'nagadNumber', v)} placeholder="017XXXXXXXX" />
                    <HomepageField label="Delivery — Inside Dhaka (Tk)" type="number" value={(hpConfig.delivery || {}).insideDhaka} onChange={(v) => setHpSection('delivery', 'insideDhaka', v)} />
                    <HomepageField label="Delivery — Outside Dhaka (Tk)" type="number" value={(hpConfig.delivery || {}).outsideDhaka} onChange={(v) => setHpSection('delivery', 'outsideDhaka', v)} />
                    <HomepageField label="Hotline" value={(hpConfig.support || {}).hotline} onChange={(v) => setHpSection('support', 'hotline', v)} placeholder="017XXXXXXXX" />
                    <HomepageField label="WhatsApp" value={(hpConfig.support || {}).whatsapp} onChange={(v) => setHpSection('support', 'whatsapp', v)} placeholder="88017XXXXXXXXX" />
                </div>
            </Card>

            {/* SEO */}
            <Card>
                <SectionHeading>SEO</SectionHeading>
                <div className="flex flex-col gap-3">
                    <HomepageField label="Title template (%s = page name)" value={s.titleTemplate} onChange={(v) => setHpSection('seo', 'titleTemplate', v)} placeholder="%s | Store" />
                    <HomepageField label="Default meta description" plain value={s.description} onChange={(v) => setHpSection('seo', 'description', v)} />
                </div>
            </Card>

            {/* Navigation Tabs */}
            <Card>
                <SectionHeading>Mobile Bottom Navigation Tabs</SectionHeading>
                {(n.tabs || []).map((tab, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2 relative mb-2">
                        <button onClick={() => setHpConfig((prev) => ({ ...prev, navigation: { ...prev.navigation, tabs: (prev.navigation?.tabs || []).filter((_, idx) => idx !== i) } }))}
                            className="absolute top-1 right-1 text-xs text-red-500 hover:underline">x</button>
                        <div className="grid grid-cols-2 gap-2">
                            <HomepageField label="Label" value={tab.label} onChange={(v) => setHpConfig((prev) => { const tabs = JSON.parse(JSON.stringify(prev.navigation?.tabs || [])); tabs[i] = { ...tabs[i], label: v }; return { ...prev, navigation: { ...prev.navigation, tabs } }; })} />
                            <HomepageField label="Icon" value={tab.icon} onChange={(v) => setHpConfig((prev) => { const tabs = JSON.parse(JSON.stringify(prev.navigation?.tabs || [])); tabs[i] = { ...tabs[i], icon: v }; return { ...prev, navigation: { ...prev.navigation, tabs } }; })} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <HomepageField label="Link (href)" value={tab.href} onChange={(v) => setHpConfig((prev) => { const tabs = JSON.parse(JSON.stringify(prev.navigation?.tabs || [])); tabs[i] = { ...tabs[i], href: v }; return { ...prev, navigation: { ...prev.navigation, tabs } }; })} />
                            <HomepageField label="Key" value={tab.key} onChange={(v) => setHpConfig((prev) => { const tabs = JSON.parse(JSON.stringify(prev.navigation?.tabs || [])); tabs[i] = { ...tabs[i], key: v }; return { ...prev, navigation: { ...prev.navigation, tabs } }; })} />
                        </div>
                    </div>
                ))}
                <button onClick={() => setHpConfig((prev) => ({ ...prev, navigation: { ...prev.navigation, tabs: [...(prev.navigation?.tabs || []), { key: '', label: 'New Tab', href: '/', icon: 'Home' }] } }))}
                    className="text-sm border border-dashed border-gray-400 rounded-xl px-3 py-1.5 hover:bg-gray-50">+ Add Tab</button>
            </Card>

            {/* Policy Page */}
            <Card>
                <SectionHeading>Policy Page</SectionHeading>
                <div className="flex flex-col gap-3">
                    <HomepageField label="Page Title" value={c.policyTitle} onChange={(v) => setHpConfig((prev) => ({ ...prev, content: { ...prev.content, policyTitle: v } }))} />
                    {(c.policy || []).map((sec, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2 relative">
                            <button onClick={() => setHpConfig((prev) => ({ ...prev, content: { ...prev.content, policy: (prev.content?.policy || []).filter((_, idx) => idx !== i) } }))}
                                className="absolute top-1 right-1 text-xs text-red-500 hover:underline">x</button>
                            <HomepageField label="Section Title" value={sec.title} onChange={(v) => setHpConfig((prev) => { const policy = JSON.parse(JSON.stringify(prev.content?.policy || [])); policy[i] = { ...policy[i], title: v }; return { ...prev, content: { ...prev.content, policy } }; })} />
                            <HomepageField label="Bullets (one per line)" plain value={bodyToText(sec.body)} onChange={(v) => setHpConfig((prev) => { const policy = JSON.parse(JSON.stringify(prev.content?.policy || [])); policy[i] = { ...policy[i], body: textToBody(v) }; return { ...prev, content: { ...prev.content, policy } }; })} />
                        </div>
                    ))}
                    <button onClick={() => setHpConfig((prev) => ({ ...prev, content: { ...prev.content, policy: [...(prev.content?.policy || []), { title: 'New Section', body: [''] }] } }))}
                        className="text-sm border border-dashed border-gray-400 rounded-xl px-3 py-1.5 hover:bg-gray-50">+ Add Section</button>
                </div>
            </Card>

            {/* Footer moved to its own admin tab */}

            {/* Account FAQs */}
            <Card>
                <SectionHeading>Account Page FAQs</SectionHeading>
                {(c.faqs || []).map((faq, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2 relative mb-2">
                        <button onClick={() => setHpConfig((prev) => ({ ...prev, content: { ...prev.content, faqs: (prev.content?.faqs || []).filter((_, idx) => idx !== i) } }))}
                            className="absolute top-1 right-1 text-xs text-red-500 hover:underline">x</button>
                        <HomepageField label="Question" value={faq.q} onChange={(v) => setHpConfig((prev) => { const faqs = JSON.parse(JSON.stringify(prev.content?.faqs || [])); faqs[i] = { ...faqs[i], q: v }; return { ...prev, content: { ...prev.content, faqs } }; })} />
                        <HomepageField label="Answer" textarea value={faq.a} onChange={(v) => setHpConfig((prev) => { const faqs = JSON.parse(JSON.stringify(prev.content?.faqs || [])); faqs[i] = { ...faqs[i], a: v }; return { ...prev, content: { ...prev.content, faqs } }; })} />
                    </div>
                ))}
                <button onClick={() => setHpConfig((prev) => ({ ...prev, content: { ...prev.content, faqs: [...(prev.content?.faqs || []), { q: 'Question?', a: 'Answer...' }] } }))}
                    className="text-sm border border-dashed border-gray-400 rounded-xl px-3 py-1.5 hover:bg-gray-50">+ Add FAQ</button>
            </Card>

            {/* Live Chat */}
            <Card>
                <SectionHeading>Live Chat</SectionHeading>
                <HomepageField label="Welcome Message" plain value={ch.welcomeMessage} onChange={(v) => setHpSection('chat', 'welcomeMessage', v)} />
            </Card>

        </div>
    );
};

// ─── Footer Panel (separate from Homepage) ────────────────────────────────────
const FooterPanel = ({ registerSave, registerReset, onSavingChange }) => {
    const { enqueueSnackbar } = useSnackbar();
    const { reloadConfig } = useSiteConfig();
    const [hpConfig, setHpConfig] = useState(null);
    const [hpLoading, setHpLoading] = useState(true);
    const [hpSaving, setHpSaving] = useState(false);

    useEffect(() => {
        setHpLoading(true);
        axios.get('/api/v1/siteconfig', { headers: { Accept: 'application/json' } })
            .then((res) => {
                if (res.data?.config) {
                    const merged = { ...JSON.parse(JSON.stringify(DEFAULT_SITE_CONFIG)), ...JSON.parse(JSON.stringify(res.data.config)) };
                    setHpConfig(merged);
                }
            })
            .catch(() => enqueueSnackbar('Using default footer content', { variant: 'warning' }))
            .finally(() => setHpLoading(false));
    }, [enqueueSnackbar]);

    const saveHp = useCallback(async () => {
        if (!hpConfig) return;
        setHpSaving(true);
        if (onSavingChange) onSavingChange(true);
        try {
            const payload = {
                announcement: hpConfig.announcement,
                hero: hpConfig.hero,
                trustBadges: hpConfig.trustBadges,
                // flashSale is managed on its own page (Admin → Flash Sale);
                // intentionally omitted so saving the homepage can't clobber it.
                payment: hpConfig.payment,
                delivery: hpConfig.delivery,
                support: hpConfig.support,
                categories: hpConfig.categories,
                categoryImages: hpConfig.categoryImages,
                branding: hpConfig.branding,
                seo: hpConfig.seo,
                navigation: hpConfig.navigation,
                content: hpConfig.content,
                chat: hpConfig.chat,
                theme: hpConfig.theme,
            };
            await axios.put('/api/v1/admin/siteconfig', payload, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });
            await reloadConfig();
            enqueueSnackbar('Footer updated successfully', { variant: 'success' });
        } catch (err) {
            enqueueSnackbar(err?.response?.data?.message || 'Failed to update footer', { variant: 'error' });
        } finally {
            setHpSaving(false);
            if (onSavingChange) onSavingChange(false);
        }
    }, [hpConfig, enqueueSnackbar, reloadConfig, onSavingChange]);

    const resetHp = useCallback(() => {
        if (!hpConfig) return;
        setHpConfig({ ...JSON.parse(JSON.stringify(DEFAULT_SITE_CONFIG)) });
        enqueueSnackbar('Footer reset to defaults (not saved yet)', { variant: 'info' });
    }, [hpConfig, enqueueSnackbar]);

    useEffect(() => { if (registerSave) registerSave(saveHp); }, [registerSave, saveHp]);
    useEffect(() => { if (registerReset) registerReset(resetHp); }, [registerReset, resetHp]);
    useEffect(() => { if (onSavingChange) onSavingChange(hpSaving); }, [hpSaving, onSavingChange]);

    if (hpLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E84B0F]"></div>
            </div>
        );
    }
    if (!hpConfig) return null;

    const c = hpConfig.content || {};

    const linksToText = (links = []) => (links || []).map((l) => `${l.name || ''} => ${l.redirect || ''}`).join('\n');
    const textToLinks = (txt = '') => txt.split('\n').map((line) => {
        const s = line.trim();
        if (!s) return null;
        const i = s.indexOf('=>');
        if (i < 0) return { name: s, redirect: s.startsWith('http') ? s : `/${s.replace(/^\/+/, '')}`, internal: !s.startsWith('http') };
        const name = s.slice(0, i).trim();
        const redirect = s.slice(i + 2).trim();
        const internal = !/^https?:\/\//i.test(redirect);
        return { name, redirect, internal };
    }).filter(Boolean);

    return (
        <div className="flex flex-col gap-5">
            <Card>
                <SectionHeading>Footer Columns</SectionHeading>
                <p className="text-xs text-gray-500 mb-3">Manage footer link groups. Use "Social" as the column title to show icons. Format: Name =&gt; /path or Name =&gt; https://...</p>
                {(c.footer?.columns || []).map((col, ci) => (
                    <div key={ci} className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2 relative mb-2">
                        <button onClick={() => setHpConfig((prev) => ({ ...prev, content: { ...prev.content, footer: { ...prev.content?.footer, columns: (prev.content?.footer?.columns || []).filter((_, idx) => idx !== ci) } } }))}
                            className="absolute top-1 right-1 text-xs text-red-500 hover:underline">Remove</button>
                        <HomepageField label="Column Title" value={col.title} onChange={(v) => setHpConfig((prev) => { const cols = JSON.parse(JSON.stringify(prev.content?.footer?.columns || [])); cols[ci] = { ...cols[ci], title: v }; return { ...prev, content: { ...prev.content, footer: { ...prev.content?.footer, columns: cols } } }; })} />
                        <HomepageField label="Links (one per line)" plain value={linksToText(col.links)} onChange={(v) => setHpConfig((prev) => { const cols = JSON.parse(JSON.stringify(prev.content?.footer?.columns || [])); cols[ci] = { ...cols[ci], links: textToLinks(v) }; return { ...prev, content: { ...prev.content, footer: { ...prev.content?.footer, columns: cols } } }; })} />
                    </div>
                ))}
                <button onClick={() => setHpConfig((prev) => ({ ...prev, content: { ...prev.content, footer: { ...prev.content?.footer, columns: [...(prev.content?.footer?.columns || []), { title: 'New Group', links: [] }] } } }))}
                    className="text-sm border border-dashed border-gray-400 rounded-xl px-3 py-1.5 hover:bg-gray-50">+ Add Column</button>
            </Card>

            <Card>
                <SectionHeading>Footer Company Info</SectionHeading>
                <div className="flex flex-col gap-3">
                    <HomepageField label="Company Name" value={c.footer?.company?.name} onChange={(v) => setHpConfig((prev) => ({ ...prev, content: { ...prev.content, footer: { ...prev.content?.footer, company: { ...prev.content?.footer?.company, name: v } } } }))} />
                    <HomepageField label="Address / Mail Us" plain value={c.footer?.company?.address || c.footer?.company?.mailUs} onChange={(v) => setHpConfig((prev) => ({ ...prev, content: { ...prev.content, footer: { ...prev.content?.footer, company: { ...prev.content?.footer?.company, address: v, mailUs: v } } } }))} />
                    <div className="grid sm:grid-cols-2 gap-3">
                        <HomepageField label="Email" value={c.footer?.company?.email} onChange={(v) => setHpConfig((prev) => ({ ...prev, content: { ...prev.content, footer: { ...prev.content?.footer, company: { ...prev.content?.footer?.company, email: v } } } }))} />
                        <HomepageField label="Telephone" value={c.footer?.company?.telephone} onChange={(v) => setHpConfig((prev) => ({ ...prev, content: { ...prev.content, footer: { ...prev.content?.footer, company: { ...prev.content?.footer?.company, telephone: v } } } }))} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <HomepageField label="CIN" value={c.footer?.company?.cin} onChange={(v) => setHpConfig((prev) => ({ ...prev, content: { ...prev.content, footer: { ...prev.content?.footer, company: { ...prev.content?.footer?.company, cin: v } } } }))} />
                        <HomepageField label="Registered Address" value={c.footer?.company?.registered} onChange={(v) => setHpConfig((prev) => ({ ...prev, content: { ...prev.content, footer: { ...prev.content?.footer, company: { ...prev.content?.footer?.company, registered: v } } } }))} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <HomepageField label="App Store URL" value={c.footer?.company?.appStoreUrl} onChange={(v) => setHpConfig((prev) => ({ ...prev, content: { ...prev.content, footer: { ...prev.content?.footer, company: { ...prev.content?.footer?.company, appStoreUrl: v } } } }))} />
                        <HomepageField label="Play Store URL" value={c.footer?.company?.playStoreUrl} onChange={(v) => setHpConfig((prev) => ({ ...prev, content: { ...prev.content, footer: { ...prev.content?.footer, company: { ...prev.content?.footer?.company, playStoreUrl: v } } } }))} />
                    </div>
                </div>
            </Card>

            <Card>
                <SectionHeading>Copyright</SectionHeading>
                <div className="grid sm:grid-cols-2 gap-3">
                    <HomepageField label="Copyright Text" value={c.footer?.copyright} onChange={(v) => setHpConfig((prev) => ({ ...prev, content: { ...prev.content, footer: { ...prev.content?.footer, copyright: v } } }))} />
                    <HomepageField label="Since Year" type="number" value={c.footer?.since} onChange={(v) => setHpConfig((prev) => ({ ...prev, content: { ...prev.content, footer: { ...prev.content?.footer, since: Number(v) } } }))} />
                </div>
            </Card>
        </div>
    );
};
// ─── Discord notifications panel ──────────────────────────────────────────────
// Multi-channel logging: each role (orders / logs / products / reviews) can
// have its own webhook, falling back to the main one. URLs are secrets — the
// server never sends them back, so an untouched field shows the bullet
// placeholder and an empty value keeps the stored one.
const DISCORD_CHANNELS = [
    { key: 'main',     label: 'Main / Fallback', Icon: RadioTower,   hint: 'Used for any channel that has no webhook of its own.' },
    { key: 'orders',   label: 'Orders',          Icon: ShoppingCart, hint: 'New orders, cancellations, status changes, payment verification.' },
    { key: 'logs',     label: 'Activity Log',    Icon: ScrollText,   hint: 'Register / login / logout, product add-edit-delete, chat messages, errors.' },
    { key: 'products', label: 'Products',        Icon: Package,      hint: 'Full product embed with images when a product is added / updated / removed.' },
    { key: 'reviews',  label: 'Reviews',         Icon: Star,         hint: 'New and removed product reviews with rating and comment.' },
];

const MASK_RE = /^[•*]{4,}$/;
const isMask = (value) => value === MASK_STRING || MASK_RE.test(String(value || ''));

const DiscordChannelRow = ({ role, config, set }) => {
    const { enqueueSnackbar } = useSnackbar();
    const { reloadConfig } = useSiteConfig();
    const [busy, setBusy] = useState(false);
    const [touched, setTouched] = useState(false);
    const [value, setValue] = useState('');

    const stored = config.discord?.webhooks?.[role.key] ?? '';
    const storedMasked = isMask(stored);

    const save = async () => {
        const url = value.trim();
        if (!url) {
            enqueueSnackbar('Paste a Discord webhook URL first', { variant: 'warning' });
            return false;
        }
        if (!/^https:\/\/(canary\.|ptb\.)?discord(app)?\.com\/api\/webhooks\//i.test(url)) {
            enqueueSnackbar('That does not look like a Discord webhook URL (https://discord.com/api/webhooks/…)', { variant: 'error' });
            return false;
        }
        setBusy(true);
        try {
            await axios.put('/api/v1/admin/websiteconfig', {
                config: { discord: { webhooks: { [role.key]: url } } },
            });
            set('discord', 'webhooks', { ...(config.discord?.webhooks || {}), [role.key]: MASK_STRING });
            setTouched(false);
            setValue('');
            reloadConfig();
            enqueueSnackbar(`${role.label} webhook saved`, { variant: 'success' });
            return true;
        } catch (err) {
            enqueueSnackbar(err?.response?.data?.message || 'Could not save the webhook', { variant: 'error' });
            return false;
        } finally {
            setBusy(false);
        }
    };

    const clear = async () => {
        setBusy(true);
        try {
            await axios.put('/api/v1/admin/websiteconfig', {
                config: { discord: { webhooks: { [role.key]: null } } },
            });
            set('discord', 'webhooks', { ...(config.discord?.webhooks || {}), [role.key]: '' });
            setTouched(false);
            setValue('');
            reloadConfig();
            enqueueSnackbar(`${role.label} webhook cleared`, { variant: 'success' });
        } catch (err) {
            enqueueSnackbar(err?.response?.data?.message || 'Could not clear the webhook', { variant: 'error' });
        } finally {
            setBusy(false);
        }
    };

    const sendTest = async () => {
        if (touched && value.trim()) {
            const ok = await save();
            if (!ok) return;
        }
        setBusy(true);
        try {
            const { data } = await axios.post('/api/v1/admin/discord/test', { role: role.key });
            enqueueSnackbar(data?.message || 'Test message sent', { variant: 'success' });
        } catch (err) {
            enqueueSnackbar(err?.response?.data?.message || 'Discord test failed', { variant: 'error' });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="rounded-xl border border-gray-200 p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                        <role.Icon size={14} />
                    </span>
                    <span className="text-sm font-semibold text-gray-800">{role.label}</span>
                </div>
                {storedMasked ? (
                    <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Connected
                    </span>
                ) : (
                    <span className="text-[11px] text-gray-400">Not set</span>
                )}
            </div>
            <p className="text-[11px] text-gray-400 -mt-1">{role.hint}</p>

            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={touched ? value : (storedMasked ? MASK_STRING : '')}
                    onFocus={() => { if (!touched) { setTouched(true); setValue(''); } }}
                    onChange={(e) => { setTouched(true); setValue(e.target.value); }}
                    placeholder="https://discord.com/api/webhooks/…"
                    className={`${inputCls} font-mono text-xs`}
                    spellCheck={false}
                    autoComplete="off"
                />
                <button
                    type="button"
                    onClick={save}
                    disabled={busy || !touched || !value.trim()}
                    className="px-3 py-2 rounded-xl text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-40 whitespace-nowrap flex items-center justify-center gap-1.5"
                >
                    <Save size={13} /> Save
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={sendTest}
                    disabled={busy}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                >
                    {busy ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    Send test
                </button>
                {storedMasked && (
                    <button
                        type="button"
                        onClick={clear}
                        disabled={busy}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-100 text-red-500 hover:bg-red-50 flex items-center gap-1.5"
                    >
                        <Trash2 size={12} /> Remove
                    </button>
                )}
            </div>
        </div>
    );
};

const DiscordPanel = ({ config, set }) => {
    const d = config.discord || {};

    return (
        <div className="flex flex-col gap-4">
            <Card>
                <SectionHeading icon={<Bell size={16} />}>Discord Notifications</SectionHeading>
                <p className="text-xs text-gray-500 -mt-2 mb-1 leading-relaxed">
                    Every important store event is posted to Discord as a rich embed. Give each type its
                    own channel so orders, activity and products stay separate. Create a webhook per
                    channel in Discord: <span className="font-medium text-gray-600">Channel → Edit Channel → Integrations → Webhooks → New Webhook</span>,
                    then paste the <span className="font-medium text-gray-600">Webhook URL</span> below.
                    Any channel left empty falls back to <span className="font-medium text-gray-600">Main</span>.
                </p>

                <div className="mb-3">
                    <ToggleField
                        label="Enable Discord Notifications"
                        description="Master switch for every channel below"
                        value={d.enabled !== false}
                        onChange={(v) => set('discord', 'enabled', v)}
                    />
                </div>

                <div className="flex flex-col gap-3">
                    {DISCORD_CHANNELS.map((role) => (
                        <DiscordChannelRow key={role.key} role={role} config={config} set={set} />
                    ))}
                </div>
            </Card>

            <Card>
                <SectionHeading icon={<Bell size={16} />}>Product embed options</SectionHeading>
                <div className="flex flex-col gap-3">
                    <ToggleField
                        label="New Product Added"
                        description="Full embed: price, stock, category, brand, rating, description and all images"
                        value={d.notifyOnCreate !== false}
                        onChange={(v) => set('discord', 'notifyOnCreate', v)}
                    />
                    <ToggleField
                        label="Product Updated"
                        description="Posted when a product is edited"
                        value={d.notifyOnUpdate !== false}
                        onChange={(v) => set('discord', 'notifyOnUpdate', v)}
                    />
                    <ToggleField
                        label="Product Removed"
                        description="Posted when a product is deleted"
                        value={d.notifyOnDelete !== false}
                        onChange={(v) => set('discord', 'notifyOnDelete', v)}
                    />
                </div>
                <div className="mt-3 rounded-xl bg-blue-50 border border-blue-100 p-3 flex gap-2">
                    <AlertCircle size={15} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                        Webhook URLs save instantly with their own <span className="font-semibold">Save</span> button.
                        The master switch and product toggles save with the page-wide{' '}
                        <span className="font-semibold">Save</span> button at the top.
                    </p>
                </div>
            </Card>

            <Card>
                <SectionHeading icon={<Bell size={16} />}>What goes where</SectionHeading>
                <div className="text-xs text-gray-600 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                        <ShoppingCart size={14} className="text-gray-400 shrink-0 mt-0.5" />
                        <div><span className="font-semibold text-gray-800">Orders</span> — new order, cancelled, forwarded, failed, fulfilment change, payment verified.</div>
                    </div>
                    <div className="flex items-start gap-2">
                        <ScrollText size={14} className="text-gray-400 shrink-0 mt-0.5" />
                        <div><span className="font-semibold text-gray-800">Activity Log</span> — register, login, logout, password reset/changed, product add/edit/delete, chat messages, server errors (5xx).</div>
                    </div>
                    <div className="flex items-start gap-2">
                        <Package size={14} className="text-gray-400 shrink-0 mt-0.5" />
                        <div><span className="font-semibold text-gray-800">Products</span> — full product card with images on add / update / remove.</div>
                    </div>
                    <div className="flex items-start gap-2">
                        <Star size={14} className="text-gray-400 shrink-0 mt-0.5" />
                        <div><span className="font-semibold text-gray-800">Reviews</span> — new review, review updated, review removed.</div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const WebsiteConfig = () => {
    const { enqueueSnackbar } = useSnackbar();
    const { reloadConfig } = useSiteConfig();
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
    // The Homepage tab renders its own panel; it registers its save/reset
    // handlers here so the page-wide Save/Reset buttons can drive them.
    const homepageSaveRef = useRef(null);
    const homepageResetRef = useRef(null);
    const [homepageSaving, setHomepageSaving] = useState(false);
    useEffect(() => {
        if (activeCategory !== 'homepage') setHomepageSaving(false);
    }, [activeCategory]);
    // ── Fetch config ─────────────────────────────────────────────────────────────
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
    // ── State updaters ────────────────────────────────────────────────────────────
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
    // Keep a ref to the latest config so single-field auto-saves don't race
    // React state updates (used by the OG image uploader).
    const configRef = useRef(null);
    useEffect(() => {
        configRef.current = config;
    }, [config]);
    // Persist one SEO field immediately (OG image upload → live right away).
    const autoSaveSeoField = useCallback(async (field, value) => {
        set('seo', field, value);
        if (!configRef.current) return;
        const seo = { ...(configRef.current.seo || {}), [field]: value };
        await axios.put('/api/v1/admin/websiteconfig', { config: { seo } });
        reloadConfig(); // mirrors into SiteConfig → header/meta update live
    }, [set, reloadConfig]);
    const handlers = { set, onSecretChange, onAutoSaveSeo: autoSaveSeoField };
    // ── Build field index for search ──────────────────────────────────────────────
    const fieldIndex = config ? buildFieldIndex(config, handlers) : [];
    // ── Search filtering ──────────────────────────────────────────────────────────
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
    // ── Save handler ──────────────────────────────────────────────────────────────
    const handleSave = async () => {
        // The Homepage tab owns SiteConfig content; it registers its own save.
        if (activeCategory === 'homepage') {
            await homepageSaveRef.current?.();
            return;
        }
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

            // The backend mirrors storefront-facing fields (branding, contact,
            // payment, delivery, social, SEO) into SiteConfig. Refresh the
            // shared SiteConfigContext so the header/footer/theme update live.
            reloadConfig();

            enqueueSnackbar('Configuration saved', { variant: 'success' });
            setPendingSecrets({});
        } catch (err) {
            enqueueSnackbar(err?.response?.data?.message || 'Failed to save configuration', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };
    // ── Reset handler ─────────────────────────────────────────────────────────────
    const handleReset = async () => {
        setShowResetModal(false);
        // Reset just the homepage content when that tab is open.
        if (activeCategory === 'homepage') {
            await homepageResetRef.current?.();
            return;
        }
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
    // ── Render active category fields ─────────────────────────────────────────────
    const renderCategoryContent = () => {
        if (!config) return null;
        if (activeCategory === 'branding') {
            return <BrandingPanel />;
        }
        if (activeCategory === 'database') {
            return <DatabasePanel />;
        }
        if (activeCategory === 'homepage') {
            return (
                <HomepagePanel
                    registerSave={(fn) => { homepageSaveRef.current = fn; }}
                    registerReset={(fn) => { homepageResetRef.current = fn; }}
                    onSavingChange={setHomepageSaving}
                />
            );
        }
        if (activeCategory === 'footer') {
            return (
                <FooterPanel
                    registerSave={(fn) => { homepageSaveRef.current = fn; }}
                    registerReset={(fn) => { homepageResetRef.current = fn; }}
                    onSavingChange={setHomepageSaving}
                />
            );
        }
        if (activeCategory === 'changelog') {
            return <ChangeLogPanel />;
        }
        if (activeCategory === 'imgbb') {
            return <ImgBBSettings />;
        }
        if (activeCategory === 'discord') {
            return <DiscordPanel config={config} set={set} />;
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
    // ── Render search results ─────────────────────────────────────────────────────
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
    // ── Loading state ─────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <>
                <MetaData title="Website Configuration | Admin" />
                <LoadingSkeleton />
            </>
        );
    }
    // ── Shared save-button state (used by the top bar + the mobile sticky bar) ──
    const activeSaving = activeCategory === 'homepage' ? homepageSaving : saving;
    const saveDisabled = activeSaving || ['changelog', 'database', 'branding', 'imgbb'].includes(activeCategory);
    const saveTitle = activeCategory === 'imgbb' ? 'Use the ImgBB Settings save button' : undefined;
    // ── Main render ───────────────────────────────────────────────────────────────
    return (
        <>
            <MetaData title="Website Configuration | Admin" />
            {showResetModal && (
                <ResetModal onConfirm={handleReset} onCancel={() => setShowResetModal(false)} />
            )}
            {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-start sm:justify-between rounded-2xl border border-gray-200/80 bg-gradient-to-br from-white to-orange-50/60 shadow-sm p-4 sm:p-5">
                <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-[#E84B0F]/10 text-[#E84B0F] flex items-center justify-center shrink-0">
                        <Settings size={18} />
                    </span>
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-gray-900">Website Configuration</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Manage all website settings from one place</p>
                    </div>
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
                    {/* Save (desktop) */}
                    <button
                        onClick={handleSave}
                        disabled={saveDisabled}
                        title={saveTitle}
                        className="hidden sm:flex bg-[#E84B0F] hover:bg-[#C63E0A] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold items-center gap-2 transition-colors"
                    >
                        {activeSaving ? (
                            <Loader2 size={15} className="animate-spin" />
                        ) : (
                            <Save size={15} />
                        )}
                        {activeSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                    {/* Reset (desktop) */}
                    <button
                        onClick={() => setShowResetModal(true)}
                        disabled={saving}
                        className="hidden sm:flex border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 px-4 py-2 rounded-xl text-sm font-semibold items-center gap-2 transition-colors"
                    >
                        <RotateCcw size={15} />
                        Reset to Defaults
                    </button>
                </div>
            </div>
            {/* ── Mobile: horizontal category tab bar ──────────────────────────── */}
            <div className="lg:hidden -mx-0.5 mb-4 -mt-1">
                <div className="flex gap-2 overflow-x-auto bg-white border border-gray-200/80 rounded-2xl p-2 shadow-sm">
                    {CATEGORIES.map(({ id, label, Icon }) => (
                        <button
                            key={id}
                            onClick={() => { setActiveCategory(id); setSearchQuery(''); }}
                            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border shrink-0 ${
                                activeCategory === id && !isSearching
                                    ? 'bg-[#E84B0F] text-white border-[#E84B0F] shadow-sm shadow-[#E84B0F]/30'
                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-orange-50 hover:text-[#E84B0F]'
                            }`}
                        >
                            <Icon size={14} />
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            {/* ── Two-column layout ─────────────────────────────────────────────── */}
            <div className="flex gap-5 items-start">
                {/* ── Sidebar (desktop only) ────────────────────────────────────── */}
                <aside
                    className="hidden lg:flex flex-col gap-1 bg-white border border-gray-200/80 rounded-2xl shadow-sm p-2"
                    style={{ minWidth: 220, width: 220, flexShrink: 0 }}
                >
                    {CATEGORIES.map(({ id, label, Icon, count }) => (
                        <button
                            key={id}
                            onClick={() => { setActiveCategory(id); setSearchQuery(''); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors text-left rounded-xl ${
                                activeCategory === id && !isSearching
                                    ? 'bg-[#E84B0F] text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-orange-50 hover:text-[#E84B0F]'
                            }`}
                        >
                            <Icon size={15} className="shrink-0" />
                            <span className="flex-1 truncate">{label}</span>
                            {count !== null && (
                                <span
                                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                        activeCategory === id && !isSearching
                                            ? 'bg-white/25 text-white'
                                            : 'bg-gray-100 text-gray-400'
                                    }`}
                                >
                                    {count}
                                </span>
                            )}
                        </button>
                    ))}
                </aside>
                {/* ── Content area ──────────────────────────────────────────────── */}
                <div className="flex-1 min-w-0 flex flex-col gap-4 pb-16 sm:pb-0">
                    {isSearching ? renderSearchResults() : renderCategoryContent()}
                </div>
            </div>

            {/* ── Mobile: sticky action bar (sits above the bottom nav) ────────── */}
            <div
                className="sm:hidden fixed left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 px-3 py-2.5 shadow-[0_-4px_16px_rgba(15,23,42,0.05)]"
                style={{ bottom: 'calc(52px + env(safe-area-inset-bottom))' }}
            >
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowResetModal(true)}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-semibold py-2.5 disabled:opacity-50 active:scale-95 transition"
                    >
                        <RotateCcw size={15} />
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saveDisabled}
                        title={saveTitle}
                        className="flex-[2] flex items-center justify-center gap-1.5 bg-[#E84B0F] text-white rounded-xl text-sm font-bold py-2.5 disabled:opacity-50 active:scale-95 transition"
                    >
                        {activeSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                        {activeSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </>
    );
};
export default WebsiteConfig;
