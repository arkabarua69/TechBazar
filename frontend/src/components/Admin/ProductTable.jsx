import { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { Link } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
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
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { shortOrderId } from '../../utils/adminHelpers';

const ProductTable = () => {

    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();

    const isMobile = useMediaQuery('(max-width:639px)');

    const { products, error } = useSelector((state) => state.products);
    const { loading, isDeleted, error: deleteError } = useSelector((state) => state.product);

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

    const columns = [
        {
            field: "id",
            headerName: "Product ID",
            minWidth: 100,
            flex: 0.5,
        },
        {
            field: "name",
            headerName: "Name",
            minWidth: 200,
            flex: 1,
            renderCell: (params) => {
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full">
                            <img draggable="false" src={params.row.image} alt={params.row.name} className="w-full h-full rounded-full object-contain" />
                        </div>
                        {params.row.name}
                    </div>
                )
            },
        },
        {
            field: "category",
            headerName: "Category",
            minWidth: 100,
            flex: 0.1,
        },
        {
            field: "stock",
            headerName: "Stock",
            type: "number",
            headerAlign: "left",
            align: "left",
            minWidth: 70,
            flex: 0.1,
            renderCell: (params) => {
                return (
                    <>
                        {
                            params.row.stock < 10 ? (
                                <span className="font-medium text-red-700 rounded-full bg-red-200 p-1 w-6 h-6 flex items-center justify-center">{params.row.stock}</span>
                            ) : (
                                <span className="">{params.row.stock}</span>
                            )
                        }
                    </>
                )
            },
        },
        {
            field: "price",
            headerName: "Price",
            type: "number",
            minWidth: 100,
            headerAlign: "left",
            align: "left",
            flex: 0.2,
            renderCell: (params) => {
                return (
                    <span>Tk {params.row.price.toLocaleString()}</span>
                );
            },
        },
        {
            field: "cprice",
            headerName: "Cutted Price",
            type: "number",
            minWidth: 100,
            headerAlign: "left",
            align: "left",
            flex: 0.2,
            renderCell: (params) => {
                return (
                    <span>Tk {params.row.cprice.toLocaleString()}</span>
                );
            },
        },
        {
            field: "rating",
            headerName: "Rating",
            type: "number",
            minWidth: 100,
            flex: 0.1,
            align: "left",
            headerAlign: "left",
            renderCell: (params) => {
                return <Rating readOnly value={params.row.rating} size="small" precision={0.5} />
            }
        },
        {
            field: "featured",
            headerName: "Featured",
            minWidth: 110,
            flex: 0.3,
            sortable: false,
            renderCell: (params) => {
                return (
                    <button
                        onClick={() => toggleFeaturedHandler(params.row.id)}
                        disabled={togglingId === params.row.id}
                        title={params.row.featured ? "Remove from homepage Featured section" : "Show first in homepage Featured section"}
                        className={`text-xs rounded px-2 py-1 font-medium disabled:opacity-50 ${
                            params.row.featured
                                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}>
                        {params.row.featured
                            ? <span className="inline-flex items-center gap-1"><StarIcon sx={{ fontSize: '14px' }} /> Featured</span>
                            : <span className="inline-flex items-center gap-1"><StarBorderIcon sx={{ fontSize: '14px' }} /> Feature</span>}
                    </button>
                );
            },
        },
        {
            field: "actions",
            headerName: "Actions",
            minWidth: 100,
            flex: 0.3,
            type: "number",
            sortable: false,
            renderCell: (params) => {
                return (
                    <Actions editRoute={"product"} deleteHandler={deleteProductHandler} id={params.row.id} />
                );
            },
        },
    ];

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
                    <Link
                        to="/admin/new_product"
                        className="inline-flex items-center gap-1.5 bg-[#E84B0F] hover:bg-[#C63E0A] text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm active:scale-95 transition"
                    >
                        <span className="text-base leading-none">+</span> New Product
                    </Link>
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

            {/* ===== MOBILE: card-based app layout (no horizontal scroll) ===== */}
            <div className="sm:hidden flex flex-col gap-3">
                {rows.length === 0 && !loading && (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-sm">
                        No products found.
                    </div>
                )}
                {rows.map((product) => (
                    <article key={product.id} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden ring-1 ring-black/[0.02] active:scale-[0.995] transition-transform">
                        {/* card header: image + name + rating + stock */}
                        <div className="flex items-start gap-3 p-3">
                            <div className="relative shrink-0">
                                <img
                                    draggable="false"
                                    src={product.image}
                                    alt={product.name}
                                    className="w-16 h-16 object-contain rounded-xl border border-gray-100 bg-gray-50"
                                />
                                {product.cprice > product.price && (
                                    <span className="absolute -top-1.5 -left-1.5 text-[10px] font-bold bg-[#E84B0F] text-white px-1.5 py-0.5 rounded-full shadow-sm">
                                        -{Math.round(((product.cprice - product.price) / product.cprice) * 100)}%
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{product.name}</p>
                                <p className="text-[11px] text-gray-400 mt-1">#{shortOrderId(product.id)}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <Rating readOnly value={product.rating} size="small" precision={0.5} sx={{ fontSize: '0.95rem' }} />
                                    <span className="text-[11px] text-gray-500">{(product.rating || 0).toFixed(1)}</span>
                                </div>
                            </div>

                            {/* stock badge */}
                            <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                                product.stock <= 0
                                    ? 'bg-red-100 text-red-700'
                                    : product.stock < 10
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-green-100 text-green-700'
                            }`}>
                                {product.stock <= 0 ? 'Out of stock' : `${product.stock} in stock`}
                            </span>
                        </div>

                        {/* tappable body → details bottom sheet */}
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => setSheetId(product.id)}
                            onKeyDown={(e) => { if (e.key === 'Enter') setSheetId(product.id); }}
                            className="flex items-center justify-between gap-3 px-3 py-2.5 cursor-pointer active:bg-gray-50 transition-colors border-t border-gray-100"
                        >
                            <div className="flex items-baseline gap-2">
                                <span className="font-extrabold text-gray-900 text-base">Tk {product.price.toLocaleString()}</span>
                                {product.cprice > product.price && (
                                    <span className="text-xs text-gray-400 line-through">Tk {product.cprice.toLocaleString()}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{product.category}</span>
                                <ChevronRightIcon sx={{ fontSize: '1.15rem' }} className="text-gray-400" />
                            </div>
                        </div>

                        {/* featured toggle + actions */}
                        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50/70">
                            <button
                                onClick={() => toggleFeaturedHandler(product.id)}
                                disabled={togglingId === product.id}
                                title={product.featured ? "Remove from homepage Featured section" : "Show first in homepage Featured section"}
                                className={`text-xs rounded-full px-3 py-1 font-medium disabled:opacity-50 ${
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
                    </article>
                ))}
            </div>

            {/* ===== DESKTOP: table (visible on sm+ screens) ===== */}
            <div className="hidden sm:block bg-white rounded-2xl border border-gray-200/80 shadow-sm w-full overflow-hidden" style={{ height: 'min(560px, 68vh)' }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    disableSelectIconOnClick
                    disableRowSelectionOnClick
                    columnVisibilityModel={isMobile ? { category: false, cprice: false, rating: false, featured: false } : {}}
                    sx={{
                        boxShadow: 0,
                        border: 0,
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#fafafa',
                            borderBottom: '1px solid #f0f0f0',
                        },
                        '& .MuiDataGrid-columnHeaderTitle': {
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em',
                            color: '#6b7280',
                        },
                        '& .MuiDataGrid-cell': {
                            borderBottom: '1px solid #f5f5f5',
                        },
                        '& .MuiDataGrid-row:hover': {
                            backgroundColor: '#fff7f2',
                        },
                        '& .MuiDataGrid-footerContainer': {
                            borderTop: '1px solid #f0f0f0',
                        },
                    }}
                />
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
