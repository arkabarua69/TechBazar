import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import MetaData from '../Layouts/MetaData';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { useTranslation } from '../../i18n/LanguageContext';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import InventoryIcon from '@mui/icons-material/Inventory';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';

// Admin → Flash Sale.
// Settings (title / subtitle / end time / note) plus the products that appear
// in the storefront "Deal of the Day" strip. Picked products show first, in the
// chosen order; any leftover slots are auto-filled with the lowest-stock
// in-stock items by the storefront itself.
const SLOT_COUNT = 4;

const FlashSaleManager = () => {
    const { enqueueSnackbar } = useSnackbar();
    const { t } = useTranslation();
    const { reloadConfig } = useSiteConfig();

    const [fs, setFs] = useState(null);          // flashSale config object
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [query, setQuery] = useState('');

    // ── Load config + full product catalogue ──────────────────────────────────
    useEffect(() => {
        let alive = true;
        setLoading(true);
        Promise.all([
            axios.get('/api/v1/siteconfig', { headers: { Accept: 'application/json' } }),
            axios.get('/api/v1/products/all', { headers: { Accept: 'application/json' } }),
        ])
            .then(([cfgRes, prodRes]) => {
                if (!alive) return;
                const cfg = cfgRes.data?.config || {};
                setFs({
                    enabled: cfg.flashSale?.enabled !== false,
                    title: cfg.flashSale?.title || '',
                    subtitle: cfg.flashSale?.subtitle || '',
                    endsAt: cfg.flashSale?.endsAt || '23:59',
                    note: cfg.flashSale?.note || '',
                    productIds: Array.isArray(cfg.flashSale?.productIds) ? cfg.flashSale.productIds.map(String) : [],
                    overrides: (cfg.flashSale?.overrides && typeof cfg.flashSale.overrides === 'object') ? cfg.flashSale.overrides : {},
                });
                setAllProducts(prodRes.data?.products || []);
            })
            .catch(() => alive && enqueueSnackbar('Could not load flash sale settings', { variant: 'error' }))
            .finally(() => alive && setLoading(false));
        return () => { alive = false; };
    }, [enqueueSnackbar]);

    // Quick lookup + the picked products, in their saved order.
    const productById = useMemo(() => {
        const map = new Map();
        allProducts.forEach((p) => map.set(String(p._id), p));
        return map;
    }, [allProducts]);

    const picked = useMemo(
        () => (fs?.productIds || []).map((id) => {
            const p = productById.get(id);
            if (!p) return null;
            const o = fs?.overrides?.[id] || {};
            return {
                ...p,
                // effective values shown in the editor (override → product)
                ovPrice:       o.price       !== undefined ? o.price       : (p.price || 0),
                ovCuttedPrice: o.cuttedPrice !== undefined ? o.cuttedPrice : (p.cuttedPrice || 0),
                ovStock:       o.stock       !== undefined ? o.stock       : (p.stock || 0),
                hasOverride:   o.price !== undefined || o.cuttedPrice !== undefined || o.stock !== undefined,
            };
        }).filter(Boolean),
        [fs, productById]
    );

    // Candidate list for the picker (name/category search, not already picked).
    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        const pickedSet = new Set(fs?.productIds || []);
        return allProducts
            .filter((p) => !pickedSet.has(String(p._id)))
            .filter((p) => `${p.name || ''} ${p.category || ''}`.toLowerCase().includes(q))
            .slice(0, 24);
    }, [allProducts, query, fs]);

    // ── Mutations ─────────────────────────────────────────────────────────────
    const setField = (field, value) => setFs((prev) => ({ ...prev, [field]: value }));

    const addProduct = (id) => {
        const sid = String(id);
        setFs((prev) => (prev.productIds.includes(sid) ? prev : { ...prev, productIds: [...prev.productIds, sid] }));
        setQuery('');
    };

    const removeProduct = (id) => {
        const sid = String(id);
        setFs((prev) => {
            const overrides = { ...(prev.overrides || {}) };
            delete overrides[sid];
            return { ...prev, productIds: prev.productIds.filter((x) => x !== sid), overrides };
        });
    };

    // value === '' clears the override (falls back to the real product value).
    const setOverride = (id, field, value) => {
        const sid = String(id);
        setFs((prev) => {
            const overrides = { ...(prev.overrides || {}) };
            const entry = { ...(overrides[sid] || {}) };
            if (value === '' || value === null || value === undefined) {
                delete entry[field];
            } else {
                const n = Number(value);
                if (!Number.isFinite(n) || n < 0) return prev;
                entry[field] = n;
            }
            if (Object.keys(entry).length) overrides[sid] = entry; else delete overrides[sid];
            return { ...prev, overrides };
        });
    };

    const clearOverride = (id) => {
        const sid = String(id);
        setFs((prev) => {
            const overrides = { ...(prev.overrides || {}) };
            delete overrides[sid];
            return { ...prev, overrides };
        });
    };

    const moveProduct = (index, dir) => {
        setFs((prev) => {
            const next = [...prev.productIds];
            const target = index + dir;
            if (target < 0 || target >= next.length) return prev;
            [next[index], next[target]] = [next[target], next[index]];
            return { ...prev, productIds: next };
        });
    };

    const save = async () => {
        if (!fs) return;
        setSaving(true);
        try {
            await axios.put(
                '/api/v1/admin/siteconfig',
                { flashSale: fs },
                { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
            );
            reloadConfig();
            enqueueSnackbar('Flash sale saved', { variant: 'success' });
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Save failed', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const inputCls = 'w-full text-sm text-gray-800 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:border-primary-accent';

    if (loading || !fs) {
        return (
            <>
                <MetaData title="Flash Sale | Admin" />
                <div className="pb-6 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-gray-200 rounded-2xl h-24" />
                    ))}
                </div>
            </>
        );
    }

    return (
        <>
            <MetaData title="Flash Sale | Admin" />
            <div className="pb-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                        <span className="w-11 h-11 rounded-2xl bg-primary-accent/10 text-primary-accent flex items-center justify-center">
                            <LocalFireDepartmentIcon sx={{ fontSize: '1.5rem' }} />
                        </span>
                        <div>
                            <h2 className="text-xl font-extrabold text-gray-900 leading-tight">{t('flash_sale', 'Flash Sale')}</h2>
                            <p className="text-xs text-gray-500">
                                Deal of the Day strip on the homepage · {picked.length} product{picked.length === 1 ? '' : 's'} picked
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={save}
                        disabled={saving}
                        className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${
                            saving ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary-accent hover:bg-primary-accent/90'
                        }`}
                    >
                        <SaveIcon sx={{ fontSize: '18px' }} />
                        {saving ? 'Saving…' : 'Save Flash Sale'}
                    </button>
                </div>

                {/* Settings */}
                <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm p-4 sm:p-5 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                        <input
                            type="checkbox"
                            id="flashEnabled"
                            checked={fs.enabled !== false}
                            onChange={(e) => setField('enabled', e.target.checked)}
                            className="w-4 h-4 accent-orange-500"
                        />
                        <label htmlFor="flashEnabled" className="text-sm font-medium text-gray-700">Show flash sale section</label>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-gray-500">Title</span>
                            <input className={inputCls} value={fs.title} onChange={(e) => setField('title', e.target.value)} placeholder="Deal of the Day" />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-gray-500">Subtitle</span>
                            <input className={inputCls} value={fs.subtitle} onChange={(e) => setField('subtitle', e.target.value)} placeholder="Limited stock — order fast" />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-gray-500">End time (24h)</span>
                            <input type="time" className={inputCls} value={fs.endsAt} onChange={(e) => setField('endsAt', e.target.value)} />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-gray-500">Note</span>
                            <input className={inputCls} value={fs.note} onChange={(e) => setField('note', e.target.value)} placeholder="Order before the offer ends" />
                        </label>
                    </div>
                </div>

                {/* Picked products */}
                <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm p-4 sm:p-5 mb-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <h3 className="text-sm font-bold text-gray-900">Products in the flash sale</h3>
                        <span className="text-xs text-gray-400">Shown first · then auto-filled to {SLOT_COUNT}</span>
                    </div>

                    {picked.length === 0 ? (
                        <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center">
                            <span className="mx-auto w-11 h-11 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                                <InventoryIcon />
                            </span>
                            <p className="text-sm text-gray-500 mt-2">
                                No products picked — the storefront will auto-pick the lowest-stock items.
                            </p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {picked.map((p, i) => (
                                <div key={p._id} className="relative bg-gray-50 border border-gray-200 rounded-2xl p-3 flex flex-col gap-2">
                                    <button
                                        onClick={() => removeProduct(p._id)}
                                        title="Remove"
                                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center z-10"
                                    >
                                        <CloseIcon sx={{ fontSize: '16px' }} />
                                    </button>
                                    <span className="absolute top-2 left-2 text-[10px] font-bold text-white bg-primary-accent rounded-full w-6 h-6 flex items-center justify-center z-10">
                                        {i + 1}
                                    </span>
                                    <div className="h-24 flex items-center justify-center overflow-hidden">
                                        {p.images?.[0]?.url ? (
                                            <img src={p.images[0].url} alt={p.name} className="h-full w-full object-contain" draggable="false" />
                                        ) : (
                                            <ImageOutlinedIcon className="text-gray-300" />
                                        )}
                                    </div>
                                    <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug">{p.name}</p>

                                    {/* price / cuttedPrice / stock override — flash-sale only */}
                                    <div className="grid grid-cols-3 gap-1.5">
                                        <label className="flex flex-col gap-0.5">
                                            <span className="text-[10px] font-medium text-gray-500">Price</span>
                                            <input
                                                type="number" min="0" inputMode="numeric"
                                                value={p.ovPrice}
                                                onChange={(e) => setOverride(p._id, 'price', e.target.value)}
                                                className="w-full text-xs text-gray-800 border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-primary-accent"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-0.5">
                                            <span className="text-[10px] font-medium text-gray-500">Cut price</span>
                                            <input
                                                type="number" min="0" inputMode="numeric"
                                                value={p.ovCuttedPrice}
                                                onChange={(e) => setOverride(p._id, 'cuttedPrice', e.target.value)}
                                                className="w-full text-xs text-gray-800 border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-primary-accent"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-0.5">
                                            <span className="text-[10px] font-medium text-gray-500">Stock</span>
                                            <input
                                                type="number" min="0" inputMode="numeric"
                                                value={p.ovStock}
                                                onChange={(e) => setOverride(p._id, 'stock', e.target.value)}
                                                className="w-full text-xs text-gray-800 border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-primary-accent"
                                            />
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between gap-1">
                                        <span className={`text-[10px] font-semibold ${p.hasOverride ? 'text-primary-accent' : 'text-gray-400'}`}>
                                            {p.hasOverride ? 'Flash-sale override' : 'Uses product values'}
                                        </span>
                                        {p.hasOverride && (
                                            <button onClick={() => clearOverride(p._id)} className="text-[10px] font-semibold text-gray-400 hover:text-red-500">
                                                Reset
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between gap-1 mt-auto">
                                        <span className="text-xs font-bold text-gray-900">Tk {Number(p.ovPrice || 0).toLocaleString()}</span>
                                        <span className={`text-[10px] font-bold ${p.ovStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {p.ovStock > 0 ? `${p.ovStock} in stock` : 'Out of stock'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => moveProduct(i, -1)}
                                            disabled={i === 0}
                                            className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-gray-500 border border-gray-200 rounded-lg py-1 hover:bg-white disabled:opacity-40"
                                        >
                                            <ArrowUpwardIcon sx={{ fontSize: '13px' }} /> Up
                                        </button>
                                        <button
                                            onClick={() => moveProduct(i, 1)}
                                            disabled={i === picked.length - 1}
                                            className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-gray-500 border border-gray-200 rounded-lg py-1 hover:bg-white disabled:opacity-40"
                                        >
                                            <ArrowDownwardIcon sx={{ fontSize: '13px' }} /> Down
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product picker */}
                <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm p-4 sm:p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Add products from your catalogue</h3>
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: '18px' }} />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search products by name or category…"
                            className={`${inputCls} pl-10`}
                        />
                    </div>

                    {query.trim() && (
                        <div className="mt-3 max-h-80 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-xl">
                            {results.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-6">No matching products.</p>
                            ) : (
                                results.map((p) => (
                                    <button
                                        key={p._id}
                                        onClick={() => addProduct(p._id)}
                                        className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-gray-50 transition-colors"
                                    >
                                        <span className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                            {p.images?.[0]?.url ? (
                                                <img src={p.images[0].url} alt={p.name} className="w-full h-full object-contain" draggable="false" />
                                            ) : (
                                                <ImageOutlinedIcon className="text-gray-300" sx={{ fontSize: '18px' }} />
                                            )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-medium text-gray-800 truncate">{p.name}</span>
                                            <span className="block text-xs text-gray-400">
                                                {p.category || '—'} · Tk {(p.price || 0).toLocaleString()} · {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                                            </span>
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-accent shrink-0">
                                            <AddIcon sx={{ fontSize: '16px' }} /> Add
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                    {!query.trim() && (
                        <p className="text-xs text-gray-400 mt-3">
                            {allProducts.length} products in your catalogue — search above to pick the ones to feature.
                        </p>
                    )}
                </div>
            </div>
        </>
    );
};

export default FlashSaleManager;
