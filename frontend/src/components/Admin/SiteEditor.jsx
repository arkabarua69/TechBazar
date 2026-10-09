import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import MetaData from '../Layouts/MetaData';
import BackdropLoader from '../Layouts/BackdropLoader';
import { DEFAULT_SITE_CONFIG } from '../../utils/siteConfig';
import { useTranslation } from '../../i18n/LanguageContext';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';

const clone = (obj) => JSON.parse(JSON.stringify(obj));

const Field = ({ label, value, onChange, textarea, type = 'text', placeholder = '' }) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">{label}</label>
        {textarea ? (
            <textarea
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                rows={3}
                placeholder={placeholder}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black"
            />
        ) : (
            <input
                type={type}
                value={value ?? ''}
                onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
                placeholder={placeholder}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black"
            />
        )}
    </div>
);

// Admin → Homepage: mobile app-style sidebar drawer + full-screen views
const SiteEditor = () => {

    const { enqueueSnackbar } = useSnackbar();
    const { t } = useTranslation();

    // Sidebar navigation: each nav item opens a full-screen view.
    // `labelKey`/`titleKey` resolve through the i18n catalog so they switch
    // between English and Bengali when the language toggle is used.
    const NAV_ITEMS = useMemo(() => [
        { id: 'announcement', labelKey: 'announcement', icon: '📢', titleKey: 'announcement_editor' },
        { id: 'hero', labelKey: 'hero_editor', icon: '🦸', titleKey: 'hero_editor' },
        { id: 'trustBadges', labelKey: 'trust_badges', icon: '✅', titleKey: 'trust_badges' },
        { id: 'settings', labelKey: 'settings', icon: '⚙️', titleKey: 'settings_editor' },
        { id: 'branding', labelKey: 'branding', icon: '🎨', titleKey: 'branding_editor' },
    ], []);

    const [config, setConfig] = useState(clone(DEFAULT_SITE_CONFIG));
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [activeTab, setActiveTab] = useState(NAV_ITEMS[0].id);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        setLoading(true);
        axios.get('/api/v1/siteconfig', { headers: { Accept: 'application/json' } })
            .then((res) => {
                if (res.data && res.data.config) {
                    setConfig({ ...clone(DEFAULT_SITE_CONFIG), ...clone(res.data.config) });
                }
            })
            .catch(() => enqueueSnackbar(t('default_content'), { variant: 'warning' }))
            .finally(() => setLoading(false));
    }, [enqueueSnackbar, t]);

    const setSection = (section, key, value) =>
        setConfig((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }));

    const setNested = (section, group, key, value) =>
        setConfig((prev) => ({
            ...prev,
            [section]: { ...prev[section], [group]: { ...prev[section][group], [key]: value } },
        }));

    const setArrayItem = (arrayKey, index, field, value) =>
        setConfig((prev) => {
            const arr = clone(prev[arrayKey] || []);
            arr[index] = { ...arr[index], [field]: value };
            return { ...prev, [arrayKey]: arr };
        });

    const addArrayItem = (arrayKey, template) =>
        setConfig((prev) => ({ ...prev, [arrayKey]: [...(prev[arrayKey] || []), template] }));

    const removeArrayItem = (arrayKey, index) =>
        setConfig((prev) => {
            const arr = clone(prev[arrayKey] || []);
            arr.splice(index, 1);
            return { ...prev, [arrayKey]: arr };
        });

    // ── branding / seo / navigation / content / chat editors ──
    const b = config.branding || {};
    const s = config.seo || {};
    const c = config.content || {};
    const n = config.navigation || {};
    const ch = config.chat || {};

    const setNavigationTabs = (tabs) =>
        setConfig((prev) => ({ ...prev, navigation: { ...prev.navigation, tabs } }));
    const setTabItem = (index, field, value) =>
        setNavigationTabs((n.tabs || []).map((tab, i) => (i === index ? { ...tab, [field]: value } : tab)));
    const addTab = () =>
        setNavigationTabs([...(n.tabs || []), { key: '', label: t('new_tab'), href: '/', icon: 'Home' }]);
    const removeTab = (index) =>
        setNavigationTabs((n.tabs || []).filter((_, i) => i !== index));

    const setPolicy = (policy) =>
        setConfig((prev) => ({ ...prev, content: { ...prev.content, policy } }));
    const setPolicySection = (index, field, value) =>
        setPolicy((c.policy || []).map((sec, i) => (i === index ? { ...sec, [field]: value } : sec)));
    const addPolicySection = () =>
        setPolicy([...(c.policy || []), { title: t('new_section'), body: [t('write_desc')] }]);
    const removePolicySection = (index) =>
        setPolicy((c.policy || []).filter((_, i) => i !== index));

    const setFaqs = (faqs) =>
        setConfig((prev) => ({ ...prev, content: { ...prev.content, faqs } }));
    const setFaq = (index, field, value) =>
        setFaqs((c.faqs || []).map((f, i) => (i === index ? { ...f, [field]: value } : f)));
    const addFaq = () =>
        setFaqs([...(c.faqs || []), { q: t('faq_q') + '?', a: t('faq_a') + '…' }]);
    const removeFaq = (index) =>
        setFaqs((c.faqs || []).filter((_, i) => i !== index));

    const setFooter = (footer) =>
        setConfig((prev) => ({ ...prev, content: { ...prev.content, footer } }));
    const setFooterColumns = (columns) => setFooter({ ...c.footer, columns });
    const setFooterColumn = (index, field, value) =>
        setFooterColumns((c.footer?.columns || []).map((col, i) => (i === index ? { ...col, [field]: value } : col)));
    const addFooterColumn = () =>
        setFooterColumns([...(c.footer?.columns || []), { title: t('new_group'), links: [{ name: t('shortcut_link'), redirect: '/policy', internal: true }] }]);
    const removeFooterColumn = (index) =>
        setFooterColumns((c.footer?.columns || []).filter((_, i) => i !== index));
    const setFooterLinks = (colIndex, links) =>
        setFooterColumns((c.footer?.columns || []).map((col, i) => (i === colIndex ? { ...col, links } : col)));
    const setFooterShortcut = (index, field, value) =>
        setFooter({ ...c.footer, shortcuts: (c.footer?.shortcuts || []).map((sc, i) => (i === index ? { ...sc, [field]: value } : sc)) });
    const addFooterShortcut = () =>
        setFooter({ ...c.footer, shortcuts: [...(c.footer?.shortcuts || []), { label: t('new_link'), href: '/policy', icon: 'Work' }] });
    const removeFooterShortcut = (index) =>
        setFooter({ ...c.footer, shortcuts: (c.footer?.shortcuts || []).filter((_, i) => i !== index) });

    // policy body: one bullet per line
    const bodyToText = (lines) => (lines || []).join('\n');
    const textToBody = (text) => text.split('\n').map((x) => x.trim()).filter(Boolean);

    // footer links: "Name => /path" (or "=> https://…") per line
    const linksToText = (links) => (links || []).map((l) => `${l.name} => ${l.redirect}`).join('\n');
    const textToLinks = (text) => text.split('\n').map((x) => x.trim()).filter(Boolean).map((line) => {
        const idx = line.indexOf('=>');
        const name = idx >= 0 ? line.slice(0, idx).trim() : line;
        const redirect = idx >= 0 ? line.slice(idx + 2).trim() : '/policy';
        return { name, redirect, internal: redirect.startsWith('/') };
    });

    const [newCategory, setNewCategory] = useState('');
    const setCategories = (cats) =>
        setConfig((prev) => ({ ...prev, categories: cats }));
    const updateCategory = (index, value) =>
        setCategories((config.categories || []).map((cat, i) => (i === index ? value : cat)));
    const addCategory = () => {
        const name = newCategory.trim();
        if (!name) return;
        if (!(config.categories || []).includes(name)) {
            setCategories([...(config.categories || []), name]);
        }
        setNewCategory('');
    };
    const removeCategory = (index) =>
        setCategories((config.categories || []).filter((_, i) => i !== index));

    const save = async () => {
        setSaving(true);
        try {
            await axios.put('/api/v1/admin/siteconfig', config, {
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            });
            enqueueSnackbar(t('saved'), { variant: 'success' });
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || t('save_failed'), { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const reset = async () => {
        try {
            const { data } = await axios.put('/api/v1/admin/siteconfig/reset', {}, { headers: { Accept: 'application/json' } });
            setConfig(clone(data.config));
            enqueueSnackbar(t('reset_msg'), { variant: 'success' });
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || t('save_failed'), { variant: 'error' });
        }
    };

    const a = config.announcement || {};
    const h = config.hero || {};
    const f = config.flashSale || {};

    const handleNav = (tabId) => {
        setActiveTab(tabId);
        setDrawerOpen(false);
    };

    const activeItem = NAV_ITEMS.find((n) => n.id === activeTab);

    // ===== render the full-screen view for each tab =====
    const renderTabContent = () => {
        switch (activeTab) {
            case 'announcement':
                return (
                    <div className="flex flex-col gap-4">
                        <h2 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">{t('trust_bar')}</h2>
                        <div className="grid sm:grid-cols-3 gap-3">
                            {(a.desktop || []).map((item, i) => (
                                <Field key={i} label={`${t('label_title')} ${i + 1}`} value={item}
                                    onChange={(v) => setConfig((prev) => {
                                        const arr = clone(prev.announcement.desktop);
                                        arr[i] = v;
                                        return { ...prev, announcement: { ...prev.announcement, desktop: arr } };
                                    })} />
                            ))}
                        </div>
                        <Field label={t('label_subtitle')} textarea value={a.mobile}
                            onChange={(v) => setSection('announcement', 'mobile', v)} />
                    </div>
                );

            case 'hero':
                return (
                    <div className="flex flex-col gap-4">
                        <h2 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">{t('magazine_hero')}</h2>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <Field label={t('label_badge')} value={h.badge} onChange={(v) => setSection('hero', 'badge', v)} />
                            <Field label={t('label_title')} value={h.title} onChange={(v) => setSection('hero', 'title', v)} />
                            <div className="sm:col-span-2">
                                <Field label={t('label_subtitle')} textarea value={h.subtitle} onChange={(v) => setSection('hero', 'subtitle', v)} />
                            </div>
                            <div className="sm:col-span-2">
                                <Field label={t('label_image')} value={h.image} onChange={(v) => setSection('hero', 'image', v)} />
                            </div>
                            <Field label={t('label_button_label')} value={h.buttonLabel} onChange={(v) => setSection('hero', 'buttonLabel', v)} />
                            <Field label={t('label_button_link')} value={h.buttonLink} onChange={(v) => setSection('hero', 'buttonLink', v)} />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3 border-t pt-3">
                            {['sideTop', 'sideBottom'].map((group, gi) => (
                                <div key={group} className="flex flex-col gap-3 bg-gray-50 rounded p-3">
                                    <p className="text-xs font-semibold text-gray-500 uppercase">
                                        {gi === 0 ? t('label_top_card') : t('label_bottom_card')}
                                    </p>
                                    <Field label={t('label_title')} value={h[group]?.title} onChange={(v) => setNested('hero', group, 'title', v)} />
                                    <Field label={t('label_subtitle')} value={h[group]?.subtitle} onChange={(v) => setNested('hero', group, 'subtitle', v)} />
                                    <Field label={t('label_image')} value={h[group]?.image} onChange={(v) => setNested('hero', group, 'image', v)} />
                                    <Field label={t('label_button_link')} value={h[group]?.link} onChange={(v) => setNested('hero', group, 'link', v)} />
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'trustBadges':
                return (
                    <div className="flex flex-col gap-4">
                        <h2 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">{t('trust_badges')}</h2>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {(config.trustBadges || []).map((badge, i) => (
                                <div key={i} className="bg-gray-50 rounded p-3 flex flex-col gap-2 relative">
                                    <button onClick={() => removeArrayItem('trustBadges', i)}
                                        className="absolute top-2 right-2 text-xs text-red-500 hover:underline">{t('btn_delete')}</button>
                                    <div className="grid grid-cols-[60px_1fr] gap-2">
                                        <Field label={t('label_icon')} value={badge.icon} onChange={(v) => setArrayItem('trustBadges', i, 'icon', v)} />
                                        <Field label={t('label_title')} value={badge.title} onChange={(v) => setArrayItem('trustBadges', i, 'title', v)} />
                                    </div>
                                    <Field label={t('label_desc')} value={badge.description} onChange={(v) => setArrayItem('trustBadges', i, 'description', v)} />
                                </div>
                            ))}
                        </div>
                        <button onClick={() => addArrayItem('trustBadges', { icon: '✨', title: t('new_feature'), description: t('write_desc') })}
                            className="text-sm self-start border border-dashed border-gray-400 rounded px-3 py-1.5 hover:bg-gray-50">{t('btn_add')} {t('trust_badges')}</button>
                    </div>
                );

            case 'settings':
                return (
                    <div className="flex flex-col gap-4">
                        <h2 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">{t('settings')}</h2>

                        {/* flash sale */}
                        <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
                            <h3 className="font-semibold text-sm text-gray-900">{t('flash_sale')}</h3>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input type="checkbox" checked={f.enabled !== false} onChange={(e) => setSection('flashSale', 'enabled', e.target.checked)} />
                                {t('label_show_flash')}
                            </label>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <Field label={t('label_title')} value={f.title} onChange={(v) => setSection('flashSale', 'title', v)} />
                                <Field label={t('label_subtitle')} value={f.subtitle} onChange={(v) => setSection('flashSale', 'subtitle', v)} />
                                <Field label={t('label_end_time')} type="time" value={f.endsAt} onChange={(v) => setSection('flashSale', 'endsAt', v)} />
                                <Field label={t('label_note')} value={f.note} onChange={(v) => setSection('flashSale', 'note', v)} />
                            </div>
                        </div>

                        {/* how to order */}
                        <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
                            <h3 className="font-semibold text-sm text-gray-900">{t('how_to_order')}</h3>
                            <div className="grid sm:grid-cols-3 gap-3">
                                {(config.howToOrder || []).map((step, i) => (
                                    <div key={i} className="bg-white rounded p-3 flex flex-col gap-2 relative">
                                        <button onClick={() => removeArrayItem('howToOrder', i)}
                                            className="absolute top-1 right-1 text-xs text-red-500 hover:underline">×</button>
                                        <div className="grid grid-cols-[50px_1fr] gap-2">
                                            <Field label={t('label_icon')} value={step.icon} onChange={(v) => setArrayItem('howToOrder', i, 'icon', v)} />
                                            <Field label={t('label_title')} value={step.title} onChange={(v) => setArrayItem('howToOrder', i, 'title', v)} />
                                        </div>
                                        <Field label={t('label_desc')} textarea value={step.description} onChange={(v) => setArrayItem('howToOrder', i, 'description', v)} />
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => addArrayItem('howToOrder', { icon: '📦', title: t('new_step'), description: t('write_desc') })}
                                className="text-sm self-start border border-dashed border-gray-400 rounded px-3 py-1.5 hover:bg-gray-50">{t('btn_add')} {t('new_step')}</button>
                        </div>

                        {/* reviews */}
                        <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
                            <h3 className="font-semibold text-sm text-gray-900">{t('customer_reviews')}</h3>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {(config.reviews || []).map((review, i) => (
                                    <div key={i} className="bg-white rounded p-3 flex flex-col gap-2 relative">
                                        <button onClick={() => removeArrayItem('reviews', i)}
                                            className="absolute top-1 right-1 text-xs text-red-500 hover:underline">×</button>
                                        <div className="grid grid-cols-3 gap-2">
                                            <Field label={t('label_title')} value={review.name} onChange={(v) => setArrayItem('reviews', i, 'name', v)} />
                                            <Field label={t('district')} value={review.district} onChange={(v) => setArrayItem('reviews', i, 'district', v)} />
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs font-medium text-gray-500">{t('rating')}</label>
                                                <select
                                                    value={review.rating || 5}
                                                    onChange={(e) => setArrayItem('reviews', i, 'rating', Number(e.target.value))}
                                                    className="border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-black">
                                                    {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} ★</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <Field label={t('label_desc')} textarea value={review.comment} onChange={(v) => setArrayItem('reviews', i, 'comment', v)} />
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => addArrayItem('reviews', { name: t('new_buyer'), district: '', rating: 5, comment: t('write_desc') })}
                                className="text-sm self-start border border-dashed border-gray-400 rounded px-3 py-1.5 hover:bg-gray-50">{t('btn_add')} {t('customer_reviews')}</button>
                        </div>

                        {/* payment / delivery / support */}
                        <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
                            <h3 className="font-semibold text-sm text-gray-900">{t('label_payment')}, {t('label_delivery')} & {t('label_support')}</h3>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <Field label={t('bkash')} value={(config.payment || {}).bKashNumber}
                                    onChange={(v) => setSection('payment', 'bKashNumber', v)} placeholder="017XXXXXXXX" />
                                <Field label={t('nagad')} value={(config.payment || {}).nagadNumber}
                                    onChange={(v) => setSection('payment', 'nagadNumber', v)} placeholder="017XXXXXXXX" />
                                <Field label={t('inside_dhaka')} type="number" value={(config.delivery || {}).insideDhaka}
                                    onChange={(v) => setSection('delivery', 'insideDhaka', v)} />
                                <Field label={t('outside_dhaka')} type="number" value={(config.delivery || {}).outsideDhaka}
                                    onChange={(v) => setSection('delivery', 'outsideDhaka', v)} />
                                <Field label={t('hotline')} value={(config.support || {}).hotline}
                                    onChange={(v) => setSection('support', 'hotline', v)} placeholder="017XXXXXXXX" />
                                <Field label={t('whatsapp')} value={(config.support || {}).whatsapp}
                                    onChange={(v) => setSection('support', 'whatsapp', v)} placeholder="88017XXXXXXXXX" />
                            </div>
                            <p className="text-xs text-gray-500">{t('payments_appear')}</p>
                        </div>

                        {/* categories */}
                        <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
                            <h3 className="font-semibold text-sm text-gray-900">{t('label_categories')}</h3>
                            <div className="flex flex-col gap-2">
                                {(config.categories || []).map((cat, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <input
                                            value={cat}
                                            onChange={(e) => updateCategory(i, e.target.value)}
                                            placeholder={t('category_name')}
                                            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black"
                                        />
                                        <button onClick={() => removeCategory(i)}
                                            className="text-xs text-red-500 hover:underline shrink-0">{t('btn_delete')}</button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }}
                                    placeholder={t('new_category')}
                                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black"
                                />
                                <button onClick={addCategory}
                                    className="text-sm border border-dashed border-gray-400 rounded px-3 py-1.5 hover:bg-gray-50 shrink-0">{t('btn_add')}</button>
                            </div>
                            <p className="text-xs text-gray-500">{t('category_hint')}</p>
                        </div>
                    </div>
                );

            case 'branding':
                return (
                    <div className="flex flex-col gap-4">
                        <h2 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">{t('branding')}</h2>

                        {/* branding */}
                        <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
                            <h3 className="font-semibold text-sm text-gray-900">{t('site_name')}</h3>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <Field label={t('site_name')} value={b.name} onChange={(v) => setSection('branding', 'name', v)} />
                                <Field label={t('tagline')} value={b.tagline} onChange={(v) => setSection('branding', 'tagline', v)} />
                                <div className="sm:col-span-2">
                                    <Field label={t('logo_url')} value={b.logoUrl} onChange={(v) => setSection('branding', 'logoUrl', v)} placeholder="https://…" />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">{t('logo_hint')}</p>
                        </div>

                        {/* seo */}
                        <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
                            <h3 className="font-semibold text-sm text-gray-900">{t('seo')}</h3>
                            <Field label={t('title_template')} value={s.titleTemplate} onChange={(v) => setSection('seo', 'titleTemplate', v)} placeholder="%s | TechBazar" />
                            <Field label={t('default_desc')} textarea value={s.description} onChange={(v) => setSection('seo', 'description', v)} />
                        </div>

                        {/* bottom tabs */}
                        <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
                            <h3 className="font-semibold text-sm text-gray-900">{t('bottom_tabs')}</h3>
                            {(n.tabs || []).map((tab, i) => (
                                <div key={i} className="bg-white rounded p-3 flex flex-col gap-2 relative">
                                    <button onClick={() => removeTab(i)} className="absolute top-1 right-1 text-xs text-red-500 hover:underline">×</button>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Field label={t('label_col_label')} value={tab.label} onChange={(v) => setTabItem(i, 'label', v)} />
                                        <Field label={t('label_col_icon')} value={tab.icon} onChange={(v) => setTabItem(i, 'icon', v)} placeholder={t('label_tab_placeholder')} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Field label={t('label_col_link')} value={tab.href} onChange={(v) => setTabItem(i, 'href', v)} placeholder="/products" />
                                        <Field label={t('label_col_key')} value={tab.key} onChange={(v) => setTabItem(i, 'key', v)} placeholder="shop" />
                                    </div>
                                </div>
                            ))}
                            <button onClick={addTab} className="text-sm self-start border border-dashed border-gray-400 rounded px-3 py-1.5 hover:bg-gray-50">{t('btn_add')} {t('new_tab')}</button>
                        </div>

                        {/* policy page */}
                        <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
                            <h3 className="font-semibold text-sm text-gray-900">{t('policy_page')}</h3>
                            <Field label={t('page_title')} value={c.policyTitle} onChange={(v) => setConfig((prev) => ({ ...prev, content: { ...prev.content, policyTitle: v } }))} />
                            {(c.policy || []).map((sec, i) => (
                                <div key={i} className="bg-white rounded p-3 flex flex-col gap-2 relative">
                                    <button onClick={() => removePolicySection(i)} className="absolute top-1 right-1 text-xs text-red-500 hover:underline">×</button>
                                    <Field label={t('section_title')} value={sec.title} onChange={(v) => setPolicySection(i, 'title', v)} />
                                    <Field label={t('bullets')} textarea value={bodyToText(sec.body)} onChange={(v) => setPolicySection(i, 'body', textToBody(v))} />
                                </div>
                            ))}
                            <button onClick={addPolicySection} className="text-sm self-start border border-dashed border-gray-400 rounded px-3 py-1.5 hover:bg-gray-50">{t('btn_add')} {t('new_section')}</button>
                        </div>

                        {/* footer */}
                        <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
                            <h3 className="font-semibold text-sm text-gray-900">{t('footer')}</h3>
                            <p className="text-xs text-gray-500">{t('footer_link_hint')}</p>
                            {(c.footer?.columns || []).map((col, ci) => (
                                <div key={ci} className="bg-white rounded p-3 flex flex-col gap-2 relative">
                                    <button onClick={() => removeFooterColumn(ci)} className="absolute top-1 right-1 text-xs text-red-500 hover:underline">×</button>
                                    <Field label={t('label_col_label')} value={col.title} onChange={(v) => setFooterColumn(ci, 'title', v)} />
                                    <Field label={t('btn_add')} textarea value={linksToText(col.links)} onChange={(v) => setFooterLinks(ci, textToLinks(v))} />
                                </div>
                            ))}
                            <button onClick={addFooterColumn} className="text-sm self-start border border-dashed border-gray-400 rounded px-3 py-1.5 hover:bg-gray-50">{t('btn_add')} {t('new_group')}</button>

                            {/* company block */}
                            <div className="border-t pt-3 flex flex-col gap-3">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase">{t('footer_company')}</h4>
                                <Field label={t('company_name')} value={c.footer?.company?.name} onChange={(v) => setFooter({ ...c.footer, company: { ...c.footer?.company, name: v } })} />
                                <Field label={t('mail_us')} textarea value={c.footer?.company?.mailUs} onChange={(v) => setFooter({ ...c.footer, company: { ...c.footer?.company, mailUs: v } })} />
                                <Field label={t('registered_office')} textarea value={c.footer?.company?.registered} onChange={(v) => setFooter({ ...c.footer, company: { ...c.footer?.company, registered: v } })} />
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <Field label={t('cin')} value={c.footer?.company?.cin} onChange={(v) => setFooter({ ...c.footer, company: { ...c.footer?.company, cin: v } })} />
                                    <Field label={t('telephone')} value={c.footer?.company?.telephone} onChange={(v) => setFooter({ ...c.footer, company: { ...c.footer?.company, telephone: v } })} />
                                </div>
                            </div>

                            {/* toolbar shortcuts */}
                            <div className="border-t pt-3 flex flex-col gap-3">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase">{t('toolbar_shortcuts')}</h4>
                                {(c.footer?.shortcuts || []).map((sc, i) => (
                                    <div key={i} className="bg-white rounded p-3 flex flex-col gap-2 relative">
                                        <button onClick={() => removeFooterShortcut(i)} className="absolute top-1 right-1 text-xs text-red-500 hover:underline">×</button>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Field label={t('shortcut_label')} value={sc.label} onChange={(v) => setFooterShortcut(i, 'label', v)} />
                                            <Field label={t('shortcut_icon')} value={sc.icon} onChange={(v) => setFooterShortcut(i, 'icon', v)} />
                                        </div>
                                        <Field label={t('shortcut_link')} value={sc.href} onChange={(v) => setFooterShortcut(i, 'href', v)} placeholder="/policy" />
                                    </div>
                                ))}
                                <button onClick={addFooterShortcut} className="text-sm self-start border border-dashed border-gray-400 rounded px-3 py-1.5 hover:bg-gray-50">{t('btn_add')} {t('new_link')}</button>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                                <Field label={t('copyright')} value={c.footer?.copyright} onChange={(v) => setFooter({ ...c.footer, copyright: v })} />
                                <Field label={t('since')} type="number" value={c.footer?.since} onChange={(v) => setFooter({ ...c.footer, since: v })} />
                            </div>
                        </div>

                        {/* account FAQs */}
                        <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
                            <h3 className="font-semibold text-sm text-gray-900">{t('account_faq')}</h3>
                            {(c.faqs || []).map((faq, i) => (
                                <div key={i} className="bg-white rounded p-3 flex flex-col gap-2 relative">
                                    <button onClick={() => removeFaq(i)} className="absolute top-1 right-1 text-xs text-red-500 hover:underline">×</button>
                                    <Field label={t('faq_q')} value={faq.q} onChange={(v) => setFaq(i, 'q', v)} />
                                    <Field label={t('faq_a')} textarea value={faq.a} onChange={(v) => setFaq(i, 'a', v)} />
                                </div>
                            ))}
                            <button onClick={addFaq} className="text-sm self-start border border-dashed border-gray-400 rounded px-3 py-1.5 hover:bg-gray-50">{t('btn_add')} {t('faq_q')}</button>
                        </div>

                        {/* live chat */}
                        <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
                            <h3 className="font-semibold text-sm text-gray-900">{t('live_chat')}</h3>
                            <Field label={t('welcome_msg')} textarea value={ch.welcomeMessage} onChange={(v) => setSection('chat', 'welcomeMessage', v)} />
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="text-center py-12 text-gray-400">
                        Select an item from the sidebar.
                    </div>
                );
        }
    };

    return (
        <>
            <MetaData title="Homepage Editor | TechBazar" />
            {(loading || saving) && <BackdropLoader />}

            {/* ===== header: hamburger/close + title + save ===== */}
            <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                    <button
                        onClick={drawerOpen ? () => setDrawerOpen(false) : () => setDrawerOpen(true)}
                        aria-label={drawerOpen ? t('close') : t('open_menu')}
                        className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center active:scale-95 transition shrink-0 sm:hidden"
                    >
                        {drawerOpen ? <CloseIcon sx={{ fontSize: '20px' }} /> : <MenuIcon sx={{ fontSize: '20px' }} />}
                    </button>
                    <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 truncate">
                        {activeItem ? t(activeItem.titleKey) : t('homepage')}
                    </h1>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={reset}
                        className="text-sm font-semibold border border-gray-300 bg-white rounded-full px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                        {t('reset_defaults')}
                    </button>
                    <button
                        onClick={save}
                        disabled={saving}
                        className="bg-black text-white rounded-full px-4 py-2 text-sm font-semibold hover:bg-gray-800 active:scale-95 transition flex items-center gap-1 disabled:opacity-50"
                    >
                        <SaveIcon sx={{ fontSize: '16px' }} />
                        {t('save')}
                    </button>
                </div>
            </div>

            <p className="text-sm text-gray-500 mb-4">
                {t('edit_hint')}
            </p>

            <div className="flex gap-4 min-h-screen">
                {/* ===== sidebar drawer (mobile overlay) ===== */}
                {drawerOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 sm:hidden"
                        onClick={() => setDrawerOpen(false)}
                    ></div>
                )}

                {/* sidebar: mobile drawer + desktop persistent */}
                <aside
                    className={`
                        fixed top-0 left-0 z-50 h-screen w-3/4 max-w-xs bg-white border-r border-gray-200 shadow-xl
                        transform transition-transform duration-300 ease-in-out
                        sm:fixed sm:top-0 sm:left-72 sm:z-30 sm:h-screen sm:w-64 sm:translate-x-0 sm:flex sm:flex-col sm:overflow-y-auto sm:border-r sm:bg-white
                        ${drawerOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
                    `}
                >
                    <div className="flex flex-col h-full pt-16 sm:pt-0 overflow-y-auto no-scrollbar">
                        <nav className="flex flex-col gap-1 p-3">
                            {NAV_ITEMS.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleNav(item.id)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                                        activeTab === item.id
                                            ? 'bg-black text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    <span className="font-medium">{t(item.labelKey)}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* ===== main content: full-screen view ===== */}
                <main className="flex-1 min-w-0 sm:ml-64">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 flex flex-col gap-4 min-w-0">
                        {renderTabContent()}
                    </div>
                </main>
            </div>
        </>
    );
};

export default SiteEditor;
