import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { clearErrors, deleteProduct, getAdminProducts } from '../../actions/productAction';
import Rating from '@mui/material/Rating';
import { DELETE_PRODUCT_RESET } from '../../constants/productConstants';
import Actions from './Actions';
import MetaData from '../Layouts/MetaData';
import BackdropLoader from '../Layouts/BackdropLoader';
import BottomSheet from './BottomSheet';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import DownloadIcon from '@mui/icons-material/Download';
import { shortOrderId } from '../../utils/adminHelpers';
import { buildCsv, downloadCsv } from '../../utils/csv';

const ProductTable = () => {

    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();

    const { products, error } = useSelector((state) => state.products);
    const { loading, isDeleted, error: deleteError } = useSelector((state) => state.product);

    // Product descriptions are rich text — strip the markup for CSV cells.
    const stripHtml = (value) =>
        String(value || '')
            .replace(/<\/p>\s*<p>/gi, ' ')
            .replace(/<\s*br\s*\/?>/gi, ' ')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/gi, ' ')
            .replace(/&amp;/gi, '&')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/&quot;/gi, '"')
            .replace(/&#39;/gi, "'")
            .replace(/\s+/g, ' ')
            .trim();

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: "error" });
            dispatch(clearErrors());
        }
        if (deleteError) {
            enqueueSnackbar(deleteError, { variant: "error" });
            dispatch(clearErrors());
        }
        if (isDeleted) {
            enqueueSnackbar("Product Deleted Successfully", { variant: "success" });
            dispatch({ type: DELETE_PRODUCT_RESET });
        }
        dispatch(getAdminProducts());
    }, [dispatch, error, deleteError, isDeleted, enqueueSnackbar]);

    const deleteProductHandler = (id) => {
        dispatch(deleteProduct(id));
    }

    // Featured on/off — admin picks which products the homepage shows first
    const [togglingId, setTogglingId] = useState(null);
    const toggleFeaturedHandler = async (id) => {
        setTogglingId(id);
        try {
            await axios.put(`/api/v1/admin/product/${id}/featured`, {}, { headers: { Accept: 'application/json' } });
            enqueueSnackbar('Featured selection updated', { variant: "success" });
            dispatch(getAdminProducts());
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Could not update featured flag', { variant: "error" });
        } finally {
            setTogglingId(null);
        }
    }

    const rows = [];

    products && products.forEach((item) => {
        const firstImage = item.images?.[0]?.url || "";
        rows.unshift({
            id: item._id,
            name: item.name,
            image: firstImage,
            category: item.category,
            stock: item.stock,
            price: item.price,
            cprice: item.cuttedPrice,
            rating: item.ratings,
            featured: !!item.featured,
        });
    });

    // Mobile bottom-sheet for product details
    const [sheetId, setSheetId] = useState(null);
    const sheetRow = rows.find((r) => r.id === sheetId) || null;

    // ── CSV export ──────────────────────────────────────────────
    // The full catalogue is exported (every product field), independent of
    // whatever the table currently filters/sorts.
    const [exporting, setExporting] = useState(false);
    const exportCsvHandler = () => {
        if (!products?.length) {
            enqueueSnackbar('No products to export', { variant: 'warning' });
            return;
        }
        setExporting(true);
        try {
            const columns = [
                { header: 'Product ID', get: (p) => p._id },
                { header: 'Name', get: (p) => p.name },
                { header: 'Description', get: (p) => stripHtml(p.description) },
                { header: 'Category', get: (p) => p.category },
                { header: 'Brand', get: (p) => p.brand?.name },
                { header: 'Price', get: (p) => p.price },
                { header: 'Cutted Price', get: (p) => p.cuttedPrice },
                { header: 'Stock', get: (p) => p.stock },
                { header: 'Warranty (months)', get: (p) => p.warranty },
                { header: 'Colors', get: (p) => (p.colors || []).join(' | ') },
                { header: 'Sizes', get: (p) => (p.sizes || []).join(' | ') },
                { header: 'In the Box', get: (p) => (p.inTheBox || []).join(' | ') },
                { header: 'Highlights', get: (p) => (p.highlights || []).join(' | ') },
                { header: 'Specifications', get: (p) => (p.specifications || []).filter(s => s.title || s.description).map((s) => [s.title, s.description].filter(Boolean).join(': ')).join(' | ') },
                { header: 'Featured', get: (p) => (p.featured ? 'Yes' : 'No') },
                { header: 'Rating', get: (p) => p.ratings },
                { header: 'Num of Reviews', get: (p) => p.numOfReviews },
                { header: 'Image URLs', get: (p) => (p.images || []).map((i) => i.url).filter(Boolean).join(' | ') },
                { header: 'Created At', get: (p) => (p.createdAt ? new Date(p.createdAt).toLocaleString() : '') },
            ];

            // Oldest → newest so the export reads chronologically.
            const ordered = [...products].sort(
                (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
            );

            const csv = buildCsv(columns, ordered);
            const stamp = new Date().toISOString().slice(0, 10);
            downloadCsv(`products-${stamp}.csv`, csv);
            enqueueSnackbar(`Exported ${ordered.length} product${ordered.length === 1 ? '' : 's'}`, { variant: 'success' });
        } finally {
            setExporting(false);
        }
    };

    // Quick catalog stats for the header strip
    const stats = {
        total: rows.length,
        inStock: rows.filter((r) => r.stock > 0).length,
        low: rows.filter((r) => r.stock > 0 && r.stock < 10).length,
        out: rows.filter((r) => r.stock <= 0).length,
    };

    return (
        <>
            <MetaData title="Admin Products" />

            {loading && <BackdropLoader />}

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                        <span className="w-11 h-11 rounded-2xl bg-[#E84B0F]/10 text-[#E84B0F] flex items-center justify-center shrink-0">
                            <Inventory2Icon sx={{ fontSize: '1.35rem' }} />
                        </span>
                        <div>
                            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-tight">Products</h1>
                            <p className="text-xs text-gray-500">{stats.total} product{stats.total === 1 ? '' : 's'} in your catalog</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={exportCsvHandler}
                            disabled={exporting || stats.total === 0}
                            title="Download the full catalogue as a CSV file"
                            className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold shadow-sm active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <DownloadIcon sx={{ fontSize: '1.05rem' }} />
                            <span>Export CSV</span>
                        </button>
                        <Link
                            to="/admin/new_product"
                            className="inline-flex items-center gap-1.5 bg-[#E84B0F] hover:bg-[#C63E0A] text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm active:scale-95 transition"
                        >
                            <span className="text-base leading-none">+</span> New Product
                        </Link>
                    </div>
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                    {[
                        { label: 'Total', value: stats.total, tint: 'text-gray-900', bg: 'bg-gray-50', ring: 'ring-gray-100' },
                        { label: 'In stock', value: stats.inStock, tint: 'text-green-700', bg: 'bg-green-50', ring: 'ring-green-100' },
                        { label: 'Low stock', value: stats.low, tint: 'text-orange-700', bg: 'bg-orange-50', ring: 'ring-orange-100' },
                        { label: 'Out of stock', value: stats.out, tint: 'text-red-700', bg: 'bg-red-50', ring: 'ring-red-100' },
                    ].map((s) => (
                        <div key={s.label} className={`rounded-2xl ${s.bg} ring-1 ${s.ring} px-3.5 py-3`}>
                            <p className={`text-xl font-extrabold leading-none ${s.tint}`}>{s.value}</p>
                            <p className="text-[11px] font-medium text-gray-500 mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ===== PRODUCTS: card grid (mobile → tablet → desktop) ===== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {rows.length === 0 && !loading && (
                    <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-sm">
                        No products found.
                    </div>
                )}
                {rows.map((product) => {
                    const off = product.cprice > product.price
                        ? Math.round(((product.cprice - product.price) / product.cprice) * 100)
                        : 0;
                    return (
                        <article
                            key={product.id}
                            className="group bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md hover:border-gray-300 overflow-hidden ring-1 ring-black/[0.02] transition-all flex"
                        >
                            {/* LEFT: product image */}
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => setSheetId(product.id)}
                                onKeyDown={(e) => { if (e.key === 'Enter') setSheetId(product.id); }}
                                className="relative shrink-0 w-[38%] max-w-[160px] min-w-[104px] bg-gradient-to-br from-gray-50 to-white border-r border-gray-100 cursor-pointer flex items-center justify-center p-3"
                            >
                                <img
                                    draggable="false"
                                    src={product.image}
                                    alt={product.name}
                                    className="max-h-[112px] max-w-full object-contain group-hover:scale-[1.05] transition-transform duration-300"
                                />
                                {off > 0 && (
                                    <span className="absolute top-2 left-2 text-[10px] font-bold bg-[#E84B0F] text-white px-2 py-0.5 rounded-full shadow-sm">
                                        -{off}%
                                    </span>
                                )}
                                {product.stock <= 0 && (
                                    <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                        Out of stock
                                    </span>
                                )}
                            </div>

                            {/* RIGHT: details + actions */}
                            <div className="flex flex-col flex-1 min-w-0">
                                {/* details */}
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setSheetId(product.id)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') setSheetId(product.id); }}
                                    className="flex flex-col flex-1 p-3 gap-1.5 cursor-pointer"
                                >
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{product.name || '—'}</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">#{shortOrderId(product.id)}</p>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Rating readOnly value={product.rating} size="small" precision={0.5} sx={{ fontSize: '0.9rem' }} />
                                        <span className="text-[11px] text-gray-500">{(product.rating || 0).toFixed(1)}</span>
                                        {product.category && (
                                            <span className="text-[10px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[45%] ml-auto">{product.category}</span>
                                        )}
                                    </div>

                                    <div className="flex flex-nowrap items-baseline gap-1.5 mt-auto pt-1 min-w-0">
                                        <span className="font-extrabold text-gray-900 text-base whitespace-nowrap shrink-0">Tk {(product.price || 0).toLocaleString()}</span>
                                        {product.cprice > product.price && (
                                            <span className="text-xs text-gray-400 line-through whitespace-nowrap truncate">{product.cprice.toLocaleString()}</span>
                                        )}
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto whitespace-nowrap shrink-0 ${
                                            product.stock <= 0
                                                ? 'bg-red-100 text-red-700'
                                                : product.stock < 10
                                                    ? 'bg-orange-100 text-orange-700'
                                                    : 'bg-green-100 text-green-700'
                                        }`}>
                                            {product.stock <= 0 ? 'Out of stock' : `${product.stock} in stock`}
                                        </span>
                                    </div>
                                </div>

                                {/* footer: featured toggle + actions */}
                                <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50/70">
                                    <button
                                        onClick={() => toggleFeaturedHandler(product.id)}
                                        disabled={togglingId === product.id}
                                        title={product.featured ? "Remove from homepage Featured section" : "Show first in homepage Featured section"}
                                        className={`text-xs rounded-full px-2.5 py-1 font-medium disabled:opacity-50 transition-colors ${
                                            product.featured
                                                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                        }`}
                                    >
                                        {product.featured
                                            ? <span className="inline-flex items-center gap-1"><StarIcon sx={{ fontSize: '14px' }} /> Featured</span>
                                            : <span className="inline-flex items-center gap-1"><StarBorderIcon sx={{ fontSize: '14px' }} /> Feature</span>}
                                    </button>
                                    <Actions
                                        editRoute={"product"}
                                        deleteHandler={deleteProductHandler}
                                        id={product.id}
                                        name={product.name}
                                    />
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>

            {/* ===== Bottom sheet: product details (mobile) ===== */}
            <BottomSheet
                open={!!sheetRow}
                onClose={() => setSheetId(null)}
                title={sheetRow ? `#${shortOrderId(sheetRow.id)} · ${(sheetRow.name || '').length > 30 ? sheetRow.name.substring(0, 30) + '…' : sheetRow.name}` : 'Product Details'}
            >
                {sheetRow && (
                    <div className="space-y-4">
                        <img
                            draggable="false"
                            src={sheetRow.image}
                            alt={sheetRow.name}
                            className="w-28 h-28 object-contain rounded-xl border bg-white"
                        />
                        <div className="space-y-2 text-sm">
                            <p><span className="font-medium text-gray-600">Product:</span> {sheetRow.name}</p>
                            <p><span className="font-medium text-gray-600">Category:</span> {sheetRow.category}</p>
                            <div className="flex items-baseline gap-2">
                                <p><span className="font-medium text-gray-600">Price:</span> Tk {sheetRow.price.toLocaleString()}</p>
                                {sheetRow.cprice > sheetRow.price && (
                                    <span className="line-through text-gray-500">Tk {sheetRow.cprice.toLocaleString()}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-600">Stock:</span>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                    sheetRow.stock <= 0
                                        ? 'bg-red-100 text-red-700'
                                        : sheetRow.stock < 10
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'bg-green-100 text-green-700'
                                }`}>
                                    {sheetRow.stock <= 0 ? 'Out of stock' : `${sheetRow.stock} in stock`}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-600">Rating:</span>
                                <Rating readOnly value={sheetRow.rating} size="small" precision={0.5} />
                                <span>{(sheetRow.rating || 0).toFixed(1)}</span>
                            </div>
                            <p>
                                <span className="font-medium text-gray-600">Featured:</span>
                                <span className={sheetRow.featured ? "text-yellow-700 font-medium" : "text-gray-500"}>
                                    {sheetRow.featured ? "Yes" : "No"}
                                </span>
                            </p>
                        </div>
                    </div>
                )}
            </BottomSheet>
        </>
    );
};

export default ProductTable;
