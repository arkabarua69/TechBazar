import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import MetaData from '../Layouts/MetaData';
import { categoryImage } from '../../utils/categoryIcons';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { useTranslation } from '../../i18n/LanguageContext';
import CategoryIcon from '@mui/icons-material/Category';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import InventoryIcon from '@mui/icons-material/Inventory';

const norm = (c) => String(typeof c === 'string' ? c : c?.name || '').trim();

// Admin → Category: a dedicated tab that lists every category on the website
// together with its image, and lets the admin add / rename / remove them.
// Categories are stored in the site config (config.categories) and immediately
// reflected on the storefront after saving.
const CategoryManager = () => {
    const { enqueueSnackbar } = useSnackbar();
    const { t } = useTranslation();
    const { reloadConfig } = useSiteConfig();

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newCategory, setNewCategory] = useState('');

    useEffect(() => {
        let alive = true;
        setLoading(true);
        axios.get('/api/v1/siteconfig', { headers: { Accept: 'application/json' } })
            .then((res) => {
                const list = res.data?.config?.categories;
                if (alive) setCategories(Array.isArray(list) ? list.map(norm).filter(Boolean) : []);
            })
            .catch(() => alive && enqueueSnackbar('Could not load categories', { variant: 'error' }))
            .finally(() => alive && setLoading(false));
        return () => { alive = false; };
    }, [enqueueSnackbar]);

    const updateCategory = (index, value) =>
        setCategories((prev) => prev.map((c, i) => (i === index ? value : c)));

    const removeCategory = (index) =>
        setCategories((prev) => prev.filter((_, i) => i !== index));

    const addCategory = (name) => {
        const clean = norm(name);
        if (!clean) return;
        if (categories.some((c) => c.toLowerCase() === clean.toLowerCase())) {
            enqueueSnackbar(`"${clean}" already exists`, { variant: 'warning' });
            return;
        }
        setCategories((prev) => [...prev, clean]);
        setNewCategory('');
    };

    const save = async () => {
        // normalise: trim and drop blank rows
        const cleaned = categories.map(norm).filter(Boolean);
        const seen = new Set();
        for (const c of cleaned) {
            const key = c.toLowerCase();
            if (seen.has(key)) {
                enqueueSnackbar(`Duplicate category "${c}"`, { variant: 'error' });
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
            await axios.put('/api/v1/admin/siteconfig', { categories: cleaned }, {
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            });
            setCategories(cleaned);
            reloadConfig();
            enqueueSnackbar('Categories saved', { variant: 'success' });
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Save failed', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

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
                                Every category on your website and its image · {categories.length} total
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
                            <div key={i} className="animate-pulse bg-gray-200 rounded-2xl h-40" />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Category cards */}
                        {categories.length === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                                <span className="mx-auto w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                                    <ImageOutlinedIcon />
                                </span>
                                <p className="text-sm text-gray-500 mt-3">No categories yet — add your first one below.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {categories.map((cat, i) => (
                                    <div
                                        key={i}
                                        className="group relative bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center gap-3 shadow-sm hover:shadow-md hover:border-primary-accent/40 transition-all"
                                    >
                                        <button
                                            onClick={() => removeCategory(i)}
                                            title="Remove category"
                                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                        >
                                            <DeleteOutlineIcon sx={{ fontSize: '16px' }} />
                                        </button>

                                        <div
                                            className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-2 bg-primary-accent/5"
                                            style={{ borderColor: 'var(--color-border)' }}
                                        >
                                            <img
                                                src={categoryImage(cat)}
                                                alt={cat || 'category'}
                                                className="w-11 h-11 object-contain"
                                                draggable="false"
                                            />
                                        </div>

                                        <input
                                            value={cat}
                                            onChange={(e) => updateCategory(i, e.target.value)}
                                            placeholder="Category name"
                                            className="w-full text-center text-sm font-medium text-gray-800 border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none focus:border-primary-accent bg-gray-50 focus:bg-white"
                                        />
                                    </div>
                                ))}
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

                        {/* Preview hint */}
                        <div className="mt-4 flex items-start gap-2 text-xs text-gray-400">
                            <CheckCircleIcon sx={{ fontSize: '15px' }} className="mt-px shrink-0" />
                            <span>
                                The image is chosen automatically from the category name and updates as you type.
                                <span className="inline-flex items-center gap-1 ml-1"><InventoryIcon sx={{ fontSize: '13px' }} />Categories are used on the homepage grid, the product filters and product forms.</span>
                            </span>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default CategoryManager;
