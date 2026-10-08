import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import MetaData from '../Layouts/MetaData';
import BackdropLoader from '../Layouts/BackdropLoader';
import { DEFAULT_SITE_CONFIG } from '../../utils/siteConfig';

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
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
            />
        ) : (
            <input
                type={type}
                value={value ?? ''}
                onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
                placeholder={placeholder}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
            />
        )}
    </div>
);

const Card = ({ title, children }) => (
    <section className="bg-white rounded-xl shadow-lg p-5 flex flex-col gap-4">
        <h2 className="font-semibold uppercase text-sm tracking-wide text-gray-600 border-b pb-2">{title}</h2>
        {children}
    </section>
);

// Admin → Homepage: every landing-page section is editable here
const SiteEditor = () => {

    const { enqueueSnackbar } = useSnackbar();
    const [config, setConfig] = useState(clone(DEFAULT_SITE_CONFIG));
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setLoading(true);
        axios.get('/api/v1/siteconfig', { headers: { Accept: 'application/json' } })
            .then((res) => {
                if (res.data && res.data.config) {
                    setConfig({ ...clone(DEFAULT_SITE_CONFIG), ...clone(res.data.config) });
                }
            })
            .catch(() => enqueueSnackbar('Using default content (backend unreachable)', { variant: 'warning' }))
            .finally(() => setLoading(false));
    }, [enqueueSnackbar]);

    // generic updates
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

    // categories (plain string list)
    const [newCategory, setNewCategory] = useState('');
    const setCategories = (cats) =>
        setConfig((prev) => ({ ...prev, categories: cats }));
    const updateCategory = (index, value) =>
        setCategories((config.categories || []).map((c, i) => (i === index ? value : c)));
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
            enqueueSnackbar('Homepage content saved', { variant: 'success' });
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Save failed', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const reset = async () => {
        try {
            const { data } = await axios.put('/api/v1/admin/siteconfig/reset', {}, { headers: { Accept: 'application/json' } });
            setConfig(clone(data.config));
            enqueueSnackbar('Restored defaults', { variant: 'success' });
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Reset failed', { variant: 'error' });
        }
    };

    const a = config.announcement || {};
    const h = config.hero || {};
    const f = config.flashSale || {};

    return (
        <>
            <MetaData title="Homepage Editor | TechBazar" />
            {(loading || saving) && <BackdropLoader />}

            <div className="flex items-center justify-between gap-3 flex-wrap">
                <h1 className="text-lg font-medium uppercase">homepage editor</h1>
                <div className="flex gap-2">
                    <button onClick={reset} className="text-sm border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-100">Reset defaults</button>
                    <button onClick={save} className="text-sm bg-black text-white rounded px-3 py-1.5 hover:bg-gray-800">Save changes</button>
                </div>
            </div>
            <p className="text-sm text-gray-500">এখানে পরিবর্তন করে Save চাপলেই ল্যান্ডিং পেজে সরাসরি আপডেট হবে।</p>

            <div className="flex flex-col gap-5 mt-2">

                {/* 1. announcement bar */}
                <Card title="১. টপ অ্যানাউন্সমেন্ট ও ট্রাস্ট বার">
                    <div className="grid sm:grid-cols-3 gap-3">
                        {(a.desktop || []).map((item, i) => (
                            <Field key={i} label={`ডেস্কটপ তথ্য ${i + 1}`} value={item}
                                onChange={(v) => setConfig((prev) => {
                                    const arr = clone(prev.announcement.desktop);
                                    arr[i] = v;
                                    return { ...prev, announcement: { ...prev.announcement, desktop: arr } };
                                })} />
                        ))}
                    </div>
                    <Field label="মোবাইল (স্লাইডিং টেক্সট)" textarea value={a.mobile}
                        onChange={(v) => setSection('announcement', 'mobile', v)} />
                </Card>

                {/* 2. hero */}
                <Card title="২. হিরো সেকশন (Magazine Hero)">
                    <div className="grid sm:grid-cols-2 gap-3">
                        <Field label="ব্যাজ" value={h.badge} onChange={(v) => setSection('hero', 'badge', v)} />
                        <Field label="শিরোনাম" value={h.title} onChange={(v) => setSection('hero', 'title', v)} />
                        <div className="sm:col-span-2">
                            <Field label="সাব-টাইটেল" textarea value={h.subtitle} onChange={(v) => setSection('hero', 'subtitle', v)} />
                        </div>
                        <div className="sm:col-span-2">
                            <Field label="ব্যানার ছবির URL" value={h.image} onChange={(v) => setSection('hero', 'image', v)} />
                        </div>
                        <Field label="বাটন লেবেল" value={h.buttonLabel} onChange={(v) => setSection('hero', 'buttonLabel', v)} />
                        <Field label="বাটন লিংক" value={h.buttonLink} onChange={(v) => setSection('hero', 'buttonLink', v)} />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 border-t pt-3">
                        {['sideTop', 'sideBottom'].map((group, gi) => (
                            <div key={group} className="flex flex-col gap-3 bg-gray-50 rounded p-3">
                                <p className="text-xs font-semibold text-gray-500 uppercase">{gi === 0 ? 'উপরের কার্ড (New Arrivals)' : 'নিচের কার্ড (Flash Deals)'}</p>
                                <Field label="শিরোনাম" value={h[group]?.title} onChange={(v) => setNested('hero', group, 'title', v)} />
                                <Field label="সাব-টাইটেল" value={h[group]?.subtitle} onChange={(v) => setNested('hero', group, 'subtitle', v)} />
                                <Field label="ছবির URL" value={h[group]?.image} onChange={(v) => setNested('hero', group, 'image', v)} />
                                <Field label="লিংক" value={h[group]?.link} onChange={(v) => setNested('hero', group, 'link', v)} />
                            </div>
                        ))}
                    </div>
                </Card>

                {/* 3. trust badges */}
                <Card title="৩. আস্থা বৃদ্ধির ব্যাজ (৪টি ফিচার)">
                    <div className="grid sm:grid-cols-2 gap-3">
                        {(config.trustBadges || []).map((badge, i) => (
                            <div key={i} className="bg-gray-50 rounded p-3 flex flex-col gap-2 relative">
                                <button onClick={() => removeArrayItem('trustBadges', i)}
                                    className="absolute top-2 right-2 text-xs text-red-500 hover:underline">মুছুন</button>
                                <div className="grid grid-cols-[60px_1fr] gap-2">
                                    <Field label="আইকন" value={badge.icon} onChange={(v) => setArrayItem('trustBadges', i, 'icon', v)} />
                                    <Field label="শিরোনাম" value={badge.title} onChange={(v) => setArrayItem('trustBadges', i, 'title', v)} />
                                </div>
                                <Field label="বর্ণনা" value={badge.description} onChange={(v) => setArrayItem('trustBadges', i, 'description', v)} />
                            </div>
                        ))}
                    </div>
                    <button onClick={() => addArrayItem('trustBadges', { icon: '✨', title: 'নতুন ফিচার', description: 'বর্ণনা লিখুন' })}
                        className="text-sm self-start border border-dashed border-gray-400 rounded px-3 py-1.5 hover:bg-gray-50">+ ব্যাজ যোগ করুন</button>
                </Card>

                {/* 4. flash sale */}
                <Card title="৪. হট ডিল ও কাউন্টডাউন ব্যানার (Flash Sale)">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={f.enabled !== false} onChange={(e) => setSection('flashSale', 'enabled', e.target.checked)} />
                        ফ্ল্যাশ সেল সেকশন দেখান
                    </label>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <Field label="শিরোনাম" value={f.title} onChange={(v) => setSection('flashSale', 'title', v)} />
                        <Field label="সাব-টাইটেল" value={f.subtitle} onChange={(v) => setSection('flashSale', 'subtitle', v)} />
                        <Field label="শেষ হওয়ার সময় (24-ঘণ্টা)" type="time" value={f.endsAt} onChange={(v) => setSection('flashSale', 'endsAt', v)} />
                        <Field label="নোট" value={f.note} onChange={(v) => setSection('flashSale', 'note', v)} />
                    </div>
                </Card>

                {/* 5. how to order */}
                <Card title="৫. কীভাবে অর্ডার করবেন? (৩ ধাপ)">
                    <div className="grid sm:grid-cols-3 gap-3">
                        {(config.howToOrder || []).map((step, i) => (
                            <div key={i} className="bg-gray-50 rounded p-3 flex flex-col gap-2 relative">
                                <button onClick={() => removeArrayItem('howToOrder', i)}
                                    className="absolute top-2 right-2 text-xs text-red-500 hover:underline">মুছুন</button>
                                <div className="grid grid-cols-[60px_1fr] gap-2">
                                    <Field label="আইকন" value={step.icon} onChange={(v) => setArrayItem('howToOrder', i, 'icon', v)} />
                                    <Field label="শিরোনাম" value={step.title} onChange={(v) => setArrayItem('howToOrder', i, 'title', v)} />
                                </div>
                                <Field label="বর্ণনা" textarea value={step.description} onChange={(v) => setArrayItem('howToOrder', i, 'description', v)} />
                            </div>
                        ))}
                    </div>
                    <button onClick={() => addArrayItem('howToOrder', { icon: '📦', title: 'নতুন ধাপ', description: 'বর্ণনা লিখুন' })}
                        className="text-sm self-start border border-dashed border-gray-400 rounded px-3 py-1.5 hover:bg-gray-50">+ ধাপ যোগ করুন</button>
                </Card>

                {/* 6. reviews */}
                <Card title="৬. কাস্টমার রিভিউ ও সোশ্যাল প্রুফ">
                    <div className="grid sm:grid-cols-2 gap-3">
                        {(config.reviews || []).map((review, i) => (
                            <div key={i} className="bg-gray-50 rounded p-3 flex flex-col gap-2 relative">
                                <button onClick={() => removeArrayItem('reviews', i)}
                                    className="absolute top-2 right-2 text-xs text-red-500 hover:underline">মুছুন</button>
                                <div className="grid grid-cols-3 gap-2">
                                    <Field label="নাম" value={review.name} onChange={(v) => setArrayItem('reviews', i, 'name', v)} />
                                    <Field label="জেলা" value={review.district} onChange={(v) => setArrayItem('reviews', i, 'district', v)} />
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-500">রেটিং</label>
                                        <select
                                            value={review.rating || 5}
                                            onChange={(e) => setArrayItem('reviews', i, 'rating', Number(e.target.value))}
                                            className="border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-black">
                                            {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} ★</option>)}
                                        </select>
                                    </div>
                                </div>
                                <Field label="মতামত" textarea value={review.comment} onChange={(v) => setArrayItem('reviews', i, 'comment', v)} />
                            </div>
                        ))}
                    </div>
                    <button onClick={() => addArrayItem('reviews', { name: 'নতুন ক্রেতা', district: 'ঢাকা', rating: 5, comment: 'মতামত লিখুন' })}
                        className="text-sm self-start border border-dashed border-gray-400 rounded px-3 py-1.5 hover:bg-gray-50">+ রিভিউ যোগ করুন</button>
                </Card>

                {/* 7. payment / delivery / support settings */}
                <Card title="৭. পেমেন্ট, ডেলিভারি ও সাপোর্ট সেটিংস">
                    <div className="grid sm:grid-cols-2 gap-3">
                        <Field label="বিকাশ নম্বর (ডেলিভারি চার্জ)" value={(config.payment || {}).bKashNumber}
                            onChange={(v) => setSection('payment', 'bKashNumber', v)} placeholder="017XXXXXXXX" />
                        <Field label="নগদ নম্বর (ডেলিভারি চার্জ)" value={(config.payment || {}).nagadNumber}
                            onChange={(v) => setSection('payment', 'nagadNumber', v)} placeholder="017XXXXXXXX" />
                        <Field label="ডেলিভারি চার্জ — ঢাকার ভেতরে (৳)" type="number" value={(config.delivery || {}).insideDhaka}
                            onChange={(v) => setSection('delivery', 'insideDhaka', v)} />
                        <Field label="ডেলিভারি চার্জ — ঢাকার বাইরে (৳)" type="number" value={(config.delivery || {}).outsideDhaka}
                            onChange={(v) => setSection('delivery', 'outsideDhaka', v)} />
                        <Field label="হেল্পলাইন নম্বর" value={(config.support || {}).hotline}
                            onChange={(v) => setSection('support', 'hotline', v)} placeholder="017XXXXXXXX" />
                        <Field label="WhatsApp নম্বর (কান্ট্রি কোডসহ)" value={(config.support || {}).whatsapp}
                            onChange={(v) => setSection('support', 'whatsapp', v)} placeholder="88017XXXXXXXXX" />
                    </div>
                    <p className="text-xs text-gray-500">
                        এই নম্বরগুলো চেকআউট পেজ, প্রোডাক্ট ডিটেইলস ও মোবাইল মেনুতে দেখাবে — কোড ছাড়াই বদলানো যাবে।
                    </p>
                </Card>

                {/* 8. categories */}
                <Card title="৮. পণ্যের ক্যাটাগরি">
                    <div className="flex flex-col gap-2">
                        {(config.categories || []).map((cat, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <input
                                    value={cat}
                                    onChange={(e) => updateCategory(i, e.target.value)}
                                    placeholder="ক্যাটাগরির নাম"
                                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                                />
                                <button onClick={() => removeCategory(i)}
                                    className="text-xs text-red-500 hover:underline shrink-0">মুছুন</button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }}
                            placeholder="নতুন ক্যাটাগরির নাম"
                            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                        />
                        <button onClick={addCategory}
                            className="text-sm border border-dashed border-gray-400 rounded px-3 py-1.5 hover:bg-gray-50">+ ক্যাটাগরি যোগ করুন</button>
                    </div>
                    <p className="text-xs text-gray-500">
                        এই ক্যাটাগরিগুলো শপ পেজের ফিল্টার, মোবাইল মেনু, টপ ক্যাটাগরি বার, প্রোডাক্ট ফর্মের সিলেক্ট ও অ্যাডমিন চার্টে দেখাবে।
                    </p>
                </Card>

                <div className="flex justify-end pb-6">
                    <button onClick={save} className="bg-black text-white rounded px-6 py-2.5 text-sm font-medium hover:bg-gray-800">Save changes</button>
                </div>
            </div>
        </>
    );
};

export default SiteEditor;
