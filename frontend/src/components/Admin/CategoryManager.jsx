import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import MetaData from '../Layouts/MetaData';
import ImgBBUploader from './ImgBBUploader';
import { resolveCategoryImage } from '../../utils/categoryIcons';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { useTranslation } from '../../i18n/LanguageContext';
import CategoryIcon from '@mui/icons-material/Category';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import InventoryIcon from '@mui/icons-material/Inventory';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import CloseIcon from '@mui/icons-material/Close';

const norm = (c) => String(typeof c === 'string' ? c : c?.name || '').trim();

// Admin → Category: lists every category on the website with its image, and
// lets the admin add / rename / remove them and change each category image
// (upload to ImgBB or paste a URL). Categories + images are stored in the site
// config and reflected on the storefront immediately after saving.
const CategoryManager = () => {
    const { enqueueSnackbar } = useSnackbar();
    const { t } = useTranslation();
    const { reloadConfig } = useSiteConfig();

    // items: [{ name, image }]  — image ''  → use the built-in keyword image
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [editingIndex, setEditingIndex] = useState(null);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        axios.get('/api/v1/siteconfig', { headers: { Accept: 'application/json' } })
            .then((res) => {
                const cfg = res.data?.config || {};
                const names = Array.isArray(cfg.categories) ? cfg.categories.map(norm).filter(Boolean) : [];
                const images = cfg.categoryImages && typeof cfg.categoryImages === 'object' ? cfg.categoryImages : {};
                if (alive) setItems(names.map((name) => ({ name, image: images[name] || '' })));
            })
            .catch(() => alive && enqueueSnackbar('Could not load categories', { variant: 'error' }))
            .finally(() => alive && setLoading(false));
        return () => { alive = false; };
    }, [enqueueSnackbar]);

    const buildSavePayload = (list) => {
        const cleaned = list.map((it) => ({ name: norm(it.name), image: String(it.image || '').trim() })).filter((it) => it.name);
        const categoryImages = {};
        cleaned.forEach((it) => { if (it.image) categoryImages[it.name] = it.image; });
        return { cleaned, categories: cleaned.map((it) => it.name), categoryImages };
    };

    const updateCategory = (index, value) =>
        setItems((prev) => prev.map((it, i) => (i === index ? { ...it, name: value } : it)));

    const removeCategory = (index) =>
        setItems((prev) => prev.filter((_, i) => i !== index));

    const addCategory = (name) => {
        const clean = norm(name);
        if (!clean) return;
        if (items.some((it) => norm(it.name).toLowerCase() === clean.toLowerCase())) {
            enqueueSnackbar(`"${clean}" already exists`, { variant: 'warning' });
            return;
        }
        setItems((prev) => [...prev, { name: clean, image: '' }]);
        setNewCategory('');
    };

    // Fired as soon as a new image URL is chosen (local state update).
    const handleImageUploaded = (index, url) =>
        setItems((prev) => prev.map((it, i) => (i === index ? { ...it, image: url || '' } : it)));

    // Persist the image map to the DB right away (like the logo uploader).
    const handleImageAutoSave = async (index, url) => {
        const list = items.map((it, i) => (i === index ? { ...it, image: url || '' } : it));
        const { categoryImages } = buildSavePayload(list);
        await axios.put('/api/v1/admin/siteconfig', { categoryImages }, {
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        });
        reloadConfig();
    };

    const save = async () => {
        const { cleaned, categories, categoryImages } = buildSavePayload(items);

        const seen = new Set();
        for (const name of categories) {
            const key = name.toLowerCase();
            if (seen.has(key)) {
                enqueueSnackbar(`Duplicate category "${name}"`, { variant: 'error' });
                return;
            }
            seen.add(key);
        }
        if (!cleaned.length) {
            enqueueSnackbar('Add at least one category', { variant: 'error' });
            return;
        }

        setSaving(true);
        try {
            await axios.put('/api/v1/admin/siteconfig', { categories, categoryImages }, {
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            });
            setItems(cleaned);
            reloadConfig();
            enqueueSnackbar('Categories saved', { variant: 'success' });
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Save failed', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const editing = editingIndex != null ? items[editingIndex] : null;

    return (
        <>
            <MetaData title="Category | Admin" />
            <div className="pb-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                        <span className="w-11 h-11 rounded-2xl bg-primary-accent/10 text-primary-accent flex items-center justify-center">
                            <CategoryIcon sx={{ fontSize: '1.4rem' }} />
                        </span>
                        <div>
                            <h2 className="text-xl font-extrabold text-gray-900 leading-tight">{t('categories', 'Category')}</h2>
                            <p className="text-xs text-gray-500">
                                Every category on your website and its image · {items.length} total
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={save}
                        disabled={saving || loading}
                        className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${
                            saving || loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary-accent hover:bg-primary-accent/90'
                        }`}
                    >
                        <SaveIcon sx={{ fontSize: '18px' }} />
                        {saving ? 'Saving…' : 'Save Categories'}
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="animate-pulse bg-gray-200 rounded-2xl h-44" />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Category cards */}
                        {items.length === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                                <span className="mx-auto w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                                    <ImageOutlinedIcon />
                                </span>
                                <p className="text-sm text-gray-500 mt-3">No categories yet — add your first one below.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {items.map((cat, i) => {
                                    const hasCustom = !!cat.image;
                                    return (
                                        <div
                                            key={i}
                                            className="group relative bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center gap-3 shadow-sm hover:shadow-md hover:border-primary-accent/40 transition-all"
                                        >
                                            <button
                                                onClick={() => removeCategory(i)}
                                                title="Remove category"
                                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity z-10"
                                            >
                                                <DeleteOutlineIcon sx={{ fontSize: '16px' }} />
                                            </button>

                                            {hasCustom && (
                                                <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wide text-primary-accent bg-primary-accent/10 px-1.5 py-0.5 rounded">
                                                    Custom
                                                </span>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => setEditingIndex(i)}
                                                title="Change image"
                                                className="relative w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-2 bg-primary-accent/5"
                                                style={{ borderColor: hasCustom ? 'var(--color-accent)' : 'var(--color-border)' }}
                                            >
                                                <img
                                                    src={resolveCategoryImage(cat.name, cat.image ? { [cat.name]: cat.image } : {})}
                                                    alt={cat.name || 'category'}
                                                    className="w-11 h-11 object-contain"
                                                    draggable="false"
                                                />
                                                <span className="absolute inset-0 bg-black/45 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <PhotoCameraOutlinedIcon sx={{ fontSize: '18px' }} />
                                                </span>
                                            </button>

                                            <input
                                                value={cat.name}
                                                onChange={(e) => updateCategory(i, e.target.value)}
                                                placeholder="Category name"
                                                className="w-full text-center text-sm font-medium text-gray-800 border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none focus:border-primary-accent bg-gray-50 focus:bg-white"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => setEditingIndex(i)}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-primary-accent transition-colors"
                                            >
                                                <PhotoCameraOutlinedIcon sx={{ fontSize: '15px' }} /> Change image
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Add new */}
                        <div className="mt-4 bg-white border border-dashed border-gray-300 rounded-2xl p-4 flex flex-col sm:flex-row gap-2 sm:items-center">
                            <input
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') { e.preventDefault(); addCategory(newCategory); }
                                }}
                                placeholder="New category name (e.g. Mobiles, Fashion, Home)"
                                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-accent"
                            />
                            <button
                                onClick={() => addCategory(newCategory)}
                                className="inline-flex items-center justify-center gap-1.5 border border-gray-300 hover:bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700"
                            >
                                <AddIcon sx={{ fontSize: '18px' }} /> Add Category
                            </button>
                        </div>

                        {/* Hint */}
                        <div className="mt-4 flex items-start gap-2 text-xs text-gray-400">
                            <CheckCircleIcon sx={{ fontSize: '15px' }} className="mt-px shrink-0" />
                            <span>
                                Tap a category image to upload your own (or paste a URL). Leave it blank to keep the default image.
                                <span className="inline-flex items-center gap-1 ml-1"><InventoryIcon sx={{ fontSize: '13px' }} />Categories are used on the homepage grid, the product filters and product forms.</span>
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* Image editor modal */}
            {editing && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                    onClick={() => setEditingIndex(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="w-8 h-8 rounded-lg bg-primary-accent/10 text-primary-accent flex items-center justify-center shrink-0">
                                    <ImageOutlinedIcon sx={{ fontSize: '18px' }} />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{norm(editing.name) || 'Category'} image</p>
                                    <p className="text-xs text-gray-400">Upload a file or paste an image URL</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditingIndex(null)}
                                className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 flex items-center justify-center shrink-0"
                            >
                                <CloseIcon sx={{ fontSize: '18px' }} />
                            </button>
                        </div>

                        <div className="p-5 flex flex-col gap-4">
                            {/* Current / default preview */}
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-100 bg-gray-50">
                                    <img
                                        src={resolveCategoryImage(editing.name, editing.image ? { [editing.name]: editing.image } : {})}
                                        alt={editing.name}
                                        className="w-14 h-14 object-contain"
                                    />
                                </div>
                                <span className="text-[11px] text-gray-400">
                                    {editing.image ? 'Current custom image' : 'Current default image'}
                                </span>
                            </div>

                            <ImgBBUploader
                                label="Category image"
                                currentUrl={editing.image || ''}
                                onUploaded={(url) => handleImageUploaded(editingIndex, url)}
                                onAutoSave={(url) => handleImageAutoSave(editingIndex, url)}
                                previewClass="max-h-28 max-w-full object-contain"
                            />

                            <button
                                onClick={() => setEditingIndex(null)}
                                className="mt-1 w-full bg-primary-accent hover:bg-primary-accent/90 text-white text-sm font-semibold py-2.5 rounded-xl"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CategoryManager;
