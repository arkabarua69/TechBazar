import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DownloadIcon from '@mui/icons-material/Download';
import MetaData from '../Layouts/MetaData';
import { useSnackbar } from 'notistack';

// ── source badge config ────────────────────────────────────────────────────
const SOURCE_META = {
    product:     { label: 'Product',     color: 'bg-blue-100 text-blue-700' },
    brand_logo:  { label: 'Brand Logo',  color: 'bg-purple-100 text-purple-700' },
    hero_banner: { label: 'Hero Banner', color: 'bg-orange-100 text-orange-700' },
    hero_card:   { label: 'Hero Card',   color: 'bg-amber-100 text-amber-700' },
    site_logo:   { label: 'Logo',        color: 'bg-green-100 text-green-700' },
    favicon:     { label: 'Favicon',     color: 'bg-teal-100 text-teal-700' },
    og_image:    { label: 'OG Image',    color: 'bg-rose-100 text-rose-700' },
};

const ALL_FILTERS = [
    { key: 'all',         label: 'All'          },
    { key: 'product',     label: 'Products'     },
    { key: 'brand_logo',  label: 'Brand Logos'  },
    { key: 'hero_banner', label: 'Banners'      },
    { key: 'hero_card',   label: 'Hero Cards'   },
    { key: 'site_logo',   label: 'Logos'        },
];

const formatBytes = (b) => {
    if (!b) return '';
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

// ── Lightbox ──────────────────────────────────────────────────────────────
const Lightbox = ({ image, onClose, onPrev, onNext, hasPrev, hasNext, canDelete, onDelete, onDownload }) => {
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' && hasNext) onNext();
            if (e.key === 'ArrowLeft' && hasPrev) onPrev();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, onPrev, onNext, hasPrev, hasNext]);

    if (!image) return null;

    const sm = SOURCE_META[image.source] || { label: image.source, color: 'bg-gray-100 text-gray-600' };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.88)' }}
            onClick={onClose}
        >
            {/* Close */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 text-white/70 hover:text-white bg-black/40 rounded-full p-2 transition-colors"
                aria-label="Close"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Prev */}
            {hasPrev && (
                <button
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    className="absolute left-3 sm:left-6 text-white/70 hover:text-white bg-black/40 rounded-full p-3 transition-colors z-50"
                    aria-label="Previous"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            )}

            {/* Next */}
            {hasNext && (
                <button
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                    className="absolute right-3 sm:right-6 text-white/70 hover:text-white bg-black/40 rounded-full p-3 transition-colors z-50"
                    aria-label="Next"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )}

            {/* Image card */}
            <div
                className="relative flex flex-col items-center max-w-4xl w-full mx-4 sm:mx-16"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={image.url}
                    alt={image.label}
                    className="max-h-[70vh] max-w-full rounded-2xl shadow-2xl object-contain bg-black/20"
                    loading="lazy"
                />

                {/* Info bar */}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-white/80">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${sm.color}`}>
                        {sm.label}
                    </span>
                    <span className="font-medium text-white">{image.label}</span>
                    {image.sublabel && (
                        <span className="text-white/50 text-xs">— {image.sublabel}</span>
                    )}
                    {image.width > 0 && (
                        <span className="text-white/50 text-xs">{image.width}×{image.height}</span>
                    )}
                    {image.size > 0 && (
                        <span className="text-white/50 text-xs">{formatBytes(image.size)}</span>
                    )}
                </div>

                {/* Actions */}
                <div className="mt-2 flex gap-3">
                    <a
                        href={image.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-white/60 hover:text-white underline transition-colors"
                    >
                        Open full size <OpenInNewIcon sx={{ fontSize: '12px', verticalAlign: 'middle' }} />
                    </a>
                    {image.source === 'product' && image.sourceId && (
                        <Link
                            to={`/product/${image.sourceId}`}
                            className="text-xs text-orange-400 hover:text-orange-300 underline transition-colors"
                        >
                            View product →
                        </Link>
                    )}
                    <button
                        onClick={() => onDownload(image)}
                        className="flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200 underline transition-colors"
                    >
                        <DownloadIcon sx={{ fontSize: '14px' }} /> Download
                    </button>
                    {canDelete && (
                        <button
                            onClick={() => onDelete(image)}
                            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 underline transition-colors"
                        >
                            <DeleteOutlineIcon sx={{ fontSize: '14px' }} /> Remove image
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Skeleton card ─────────────────────────────────────────────────────────
const SkeletonCard = () => (
    <div className="animate-pulse rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
        <div className="bg-gray-200" style={{ paddingBottom: '75%', position: 'relative' }} />
        <div className="p-3 flex flex-col gap-2">
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-2.5 bg-gray-200 rounded w-1/2" />
        </div>
    </div>
);

// ── Main Gallery Component ─────────────────────────────────────────────────
const ImageGallery = () => {
    const { enqueueSnackbar } = useSnackbar();
    // Only signed-in admins may remove images — regular visitors never see
    // the delete controls (and the API rejects them too).
    const { user } = useSelector((state) => state.user);
    const isAdmin = user?.role === 'admin';

    const [images, setImages]           = useState([]);
    const [loading, setLoading]         = useState(true);
    const [filter, setFilter]           = useState('all');
    const [search, setSearch]           = useState('');
    const [lightboxIdx, setLightboxIdx] = useState(null);
    const [loadedSet, setLoadedSet]     = useState(new Set());
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting]       = useState(false);

    // ── Fetch ────────────────────────────────────────────────────────────
    useEffect(() => {
        setLoading(true);
        axios.get('/api/v1/gallery')
            .then((res) => setImages(res.data.images || []))
            .catch(() => enqueueSnackbar('Could not load gallery', { variant: 'error' }))
            .finally(() => setLoading(false));
    }, [enqueueSnackbar]);

    // ── Remove image (admin only) ────────────────────────────────────────
    const confirmDelete = async () => {
        if (!deleteTarget || deleting) return;
        setDeleting(true);
        try {
            await axios.delete('/api/v1/admin/gallery', { data: { url: deleteTarget.url } });
            setImages((prev) => prev.filter((img) => img.url !== deleteTarget.url));
            setDeleteTarget(null);
            setLightboxIdx(null);
            enqueueSnackbar('Image removed', { variant: 'success' });
        } catch (err) {
            enqueueSnackbar(
                err.response?.data?.message || 'Could not remove image',
                { variant: 'error' }
            );
        } finally {
            setDeleting(false);
        }
    };

    // ── Download image (public) ──────────────────────────────────────────
    const handleDownload = async (img) => {
        if (!img?.url) return;
        try {
            const res = await axios.get('/api/v1/gallery/download', {
                params: { url: img.url },
                responseType: 'blob',
            });

            const disposition = res.headers['content-disposition'] || '';
            const match = /filename="?([^";]+)"?/i.exec(disposition);
            const fallbackName = `${(img.label || 'image').replace(/[^a-z0-9._-]+/gi, '-')}.jpg`;
            const filename = match ? match[1] : fallbackName;

            const objectUrl = URL.createObjectURL(res.data);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            link.remove();
            // Revoke after the download has had a moment to start.
            setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
            enqueueSnackbar('Download started', { variant: 'success' });
        } catch (err) {
            const status = err.response?.status;
            enqueueSnackbar(
                status === 404 ? 'Image not found' : 'Could not download image',
                { variant: 'error' }
            );
        }
    };

    // ── Filtered list ─────────────────────────────────────────────────────
    const filtered = images.filter((img) => {
        const matchFilter = filter === 'all' || img.source === filter;
        const q = search.trim().toLowerCase();
        const matchSearch = !q ||
            img.label?.toLowerCase().includes(q) ||
            img.sublabel?.toLowerCase().includes(q) ||
            img.source?.toLowerCase().includes(q);
        return matchFilter && matchSearch;
    });

    // ── Lightbox nav ──────────────────────────────────────────────────────
    const openLightbox  = useCallback((idx) => setLightboxIdx(idx), []);
    const closeLightbox = useCallback(() => setLightboxIdx(null), []);
    const prevImage     = useCallback(() => setLightboxIdx((i) => Math.max(0, i - 1)), []);
    const nextImage     = useCallback(() => setLightboxIdx((i) => Math.min(filtered.length - 1, i + 1)), [filtered.length]);

    const markLoaded = (url) => setLoadedSet((s) => new Set(s).add(url));

    return (
        <>
            <MetaData title="Image Gallery" />

            <main className="min-h-screen" style={{ backgroundColor: 'var(--color-bg, #f5f5f5)' }}>
                {/* ── Hero header ───────────────────────────────────────── */}
                <div
                    className="py-10 sm:py-14 px-4 text-center"
                    style={{ background: 'linear-gradient(135deg, var(--color-accent, #E84B0F) 0%, #c63e0a 100%)' }}
                >
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        Image Gallery
                    </h1>
                    <p className="text-white/70 text-sm mt-1">
                        All images hosted on ImgBB — {loading ? '…' : images.length} photos
                    </p>
                </div>

                <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">

                    {/* ── Toolbar ───────────────────────────────────────── */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center">

                        {/* Search */}
                        <div className="relative flex-1 max-w-sm">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                            </svg>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, category…"
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Count badge */}
                        <span className="text-xs text-gray-500 font-medium shrink-0">
                            {loading ? 'Loading…' : `${filtered.length} image${filtered.length !== 1 ? 's' : ''}`}
                        </span>
                    </div>

                    {/* ── Filter tabs ───────────────────────────────────── */}
                    <div className="flex gap-2 flex-wrap mb-6">
                        {ALL_FILTERS.map(({ key, label }) => {
                            const count = key === 'all'
                                ? images.length
                                : images.filter((i) => i.source === key).length;
                            if (key !== 'all' && count === 0) return null;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setFilter(key)}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                        filter === key
                                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600'
                                    }`}
                                >
                                    {label}
                                    <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold ${
                                        filter === key ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Grid ──────────────────────────────────────────── */}
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                            {Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
                            <svg className="w-14 h-14 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 3l18 18" />
                            </svg>
                            <p className="text-base font-medium">No images found</p>
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="text-sm text-orange-500 hover:underline"
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                            {filtered.map((img, idx) => {
                                const sm = SOURCE_META[img.source] || { label: img.source, color: 'bg-gray-100 text-gray-600' };
                                const isLoaded = loadedSet.has(img.url);
                                return (
                                    <div
                                        key={img.url}
                                        className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-orange-400 hover:shadow-lg transition-all duration-200"
                                    >
                                        <button
                                            onClick={() => openLightbox(idx)}
                                            className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-orange-400"
                                            aria-label={`View ${img.label}`}
                                        >
                                        {/* Image wrapper — fixed aspect ratio */}
                                        <div className="relative overflow-hidden bg-gray-100" style={{ paddingBottom: '75%' }}>
                                            {!isLoaded && (
                                                <div className="absolute inset-0 animate-pulse bg-gray-200" />
                                            )}
                                            <img
                                                src={img.thumbUrl || img.url}
                                                alt={img.label}
                                                loading="lazy"
                                                onLoad={() => markLoaded(img.url)}
                                                className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                                            />

                                            {/* Hover overlay */}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                                                <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                                                </svg>
                                            </div>

                                            {/* Source badge */}
                                            <div className="absolute top-2 left-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sm.color} shadow-sm`}>
                                                    {sm.label}
                                                </span>
                                            </div>

                                            {/* Dimensions badge */}
                                            {img.width > 0 && (
                                                <div className="absolute bottom-2 right-2">
                                                    <span className="text-[9px] font-medium bg-black/50 text-white px-1.5 py-0.5 rounded-md">
                                                        {img.width}×{img.height}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card footer */}
                                        <div className="px-2.5 py-2">
                                            <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
                                                {img.label}
                                            </p>
                                            {img.sublabel && (
                                                <p className="text-[10px] text-gray-400 truncate mt-0.5">
                                                    {img.sublabel}
                                                </p>
                                            )}
                                            {img.size > 0 && (
                                                <p className="text-[10px] text-gray-300 mt-0.5">
                                                    {formatBytes(img.size)}
                                                </p>
                                            )}
                                        </div>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Back link ─────────────────────────────────────── */}
                    {!loading && (
                        <div className="mt-10 flex justify-center">
                            <Link
                                to="/"
                                className="text-sm text-gray-500 hover:text-orange-500 transition-colors flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to Home
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            {/* ── Lightbox ──────────────────────────────────────────────── */}
            {lightboxIdx !== null && (
                <Lightbox
                    image={filtered[lightboxIdx]}
                    onClose={closeLightbox}
                    onPrev={prevImage}
                    onNext={nextImage}
                    hasPrev={lightboxIdx > 0}
                    hasNext={lightboxIdx < filtered.length - 1}
                    canDelete={isAdmin}
                    onDelete={(img) => setDeleteTarget(img)}
                    onDownload={handleDownload}
                />
            )}

            {/* ── Remove confirmation (admin only) ──────────────────────── */}
            {deleteTarget && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70"
                    onClick={() => { if (!deleting) setDeleteTarget(null); }}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-gray-900">Remove this image?</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            <span className="font-medium text-gray-700">{deleteTarget.label}</span> will be
                            removed from the gallery and from every place it is used (product photos,
                            banners, logo, OG image). This cannot be undone.
                        </p>
                        <div className="mt-4 flex items-center gap-3">
                            <img
                                src={deleteTarget.thumbUrl || deleteTarget.url}
                                alt=""
                                className="w-20 h-16 object-cover rounded-xl border border-gray-200 bg-gray-50"
                            />
                            <p className="text-xs text-gray-400 break-all line-clamp-2">{deleteTarget.url}</p>
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleting}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleting ? 'Removing…' : 'Remove image'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ImageGallery;
