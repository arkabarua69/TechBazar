import { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import useMediaQuery from '@mui/material/useMediaQuery';
import { clearErrors, deleteReview, getAllReviews } from '../../actions/productAction';
import Rating from '@mui/material/Rating';
import Actions from './Actions';
import { DELETE_REVIEW_RESET } from '../../constants/productConstants';
import MetaData from '../Layouts/MetaData';
import BackdropLoader from '../Layouts/BackdropLoader';
import { Star, MessageSquare, PackageSearch } from 'lucide-react';

const initials = (name = '') =>
    name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase() || '?';

const Stat = ({ icon, label, value, tone }) => {
    const tones = {
        orange: 'bg-[#E84B0F]/10 text-[#E84B0F]',
        amber: 'bg-amber-100 text-amber-600',
    };
    return (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-3 flex items-center gap-2.5">
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
                {icon}
            </span>
            <div className="min-w-0">
                <p className="text-lg font-extrabold text-gray-900 leading-none">{value}</p>
                <p className="text-[11px] text-gray-500 truncate">{label}</p>
            </div>
        </div>
    );
};

const ReviewsTable = () => {

    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const isMobile = useMediaQuery('(max-width:639px)');
    const [productId, setProductId] = useState("");

    const { reviews, error } = useSelector((state) => state.reviews);
    const { loading, isDeleted, error: deleteError } = useSelector((state) => state.review);

    useEffect(() => {
        if (productId.length === 24) {
            dispatch(getAllReviews(productId));
        }
        if (error) {
            enqueueSnackbar(error, { variant: "error" });
            dispatch(clearErrors());
        }
        if (deleteError) {
            enqueueSnackbar(deleteError, { variant: "error" });
            dispatch(clearErrors());
        }
        if (isDeleted) {
            enqueueSnackbar("Review Deleted Successfully", { variant: "success" });
            dispatch({ type: DELETE_REVIEW_RESET });
        }
    }, [dispatch, error, deleteError, isDeleted, productId, enqueueSnackbar]);

    const deleteReviewHandler = (id) => {
        dispatch(deleteReview(id, productId));
    }

    const columns = [
        {
            field: "user",
            headerName: "User",
            minWidth: 180,
            flex: 0.5,
            renderCell: (params) => (
                <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-[#E84B0F]/10 text-[#E84B0F] text-xs font-bold flex items-center justify-center shrink-0">
                        {initials(params.row.user)}
                    </span>
                    <span className="font-medium text-gray-800 truncate">{params.row.user}</span>
                </div>
            ),
        },
        {
            field: "rating",
            headerName: "Rating",
            type: "number",
            minWidth: 160,
            flex: 0.3,
            align: "left",
            headerAlign: "left",
            renderCell: (params) => {
                return <Rating readOnly value={params.row.rating} size="small" precision={0.5} />
            }
        },
        {
            field: "comment",
            headerName: "Comment",
            minWidth: 240,
            flex: 0.7,
        },
        {
            field: "id",
            headerName: "Review ID",
            minWidth: 200,
            flex: 0.4,
        },
        {
            field: "actions",
            headerName: "Actions",
            minWidth: 90,
            flex: 0.2,
            type: "number",
            sortable: false,
            renderCell: (params) => {
                return (
                    <Actions editRoute={"review"} deleteHandler={deleteReviewHandler} id={params.row.id} />
                );
            },
        },
    ];

    const rows = [];

    reviews && reviews.forEach((rev) => {
        rows.push({
            id: rev._id,
            rating: rev.rating,
            comment: rev.comment,
            user: rev.name,
        });
    });

    const avg = rows.length ? (rows.reduce((s, r) => s + (r.rating || 0), 0) / rows.length).toFixed(1) : '0.0';

    return (
        <>
            <MetaData title="Admin Reviews" />

            {loading && <BackdropLoader />}

            {/* ── App-style header ── */}
            <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-[#E84B0F]/10 text-[#E84B0F] flex items-center justify-center shrink-0">
                    <Star size={22} strokeWidth={2} />
                </span>
                <div className="min-w-0">
                    <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-tight">Reviews</h1>
                    <p className="text-xs text-gray-500">Look up any product's ratings and comments</p>
                </div>
            </div>

            {/* ── Product lookup ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-2">
                    <PackageSearch size={14} className="text-[#E84B0F]" /> Product ID
                </label>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Star size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Paste the 24-character product ID…"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                            className="w-full outline-none border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-[#E84B0F] focus:ring-2 focus:ring-[#E84B0F]/20 transition"
                        />
                    </div>
                    {productId && (
                        <button onClick={() => setProductId('')} className="text-sm font-semibold text-gray-500 hover:text-gray-800 border border-gray-200 rounded-xl px-3 py-2.5">
                            Clear
                        </button>
                    )}
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                    {productId.length === 24
                        ? 'Loading reviews for this product…'
                        : `${productId.length}/24 characters — reviews load automatically once the ID is complete.`}
                </p>
            </div>

            {/* ── Stats ── */}
            {rows.length > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <Stat icon={<MessageSquare size={16} />} label="Reviews" value={rows.length} tone="orange" />
                    <Stat icon={<Star size={16} />} label="Average rating" value={avg} tone="amber" />
                </div>
            )}

            {/* ── Empty state ── */}
            {rows.length === 0 && !loading && (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
                    <Star size={40} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-sm font-semibold text-gray-600">No reviews to show</p>
                    <p className="text-xs text-gray-400 mt-1">
                        Enter a product ID above to load its customer reviews.
                    </p>
                </div>
            )}

            {rows.length > 0 && (
                <>
                    {/* ===== MOBILE: card list ===== */}
                    <div className="sm:hidden flex flex-col gap-3">
                        {rows.map((r) => (
                            <article key={r.id} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-3 ring-1 ring-black/[0.02]">
                                <div className="flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-full bg-[#E84B0F]/10 text-[#E84B0F] text-sm font-bold flex items-center justify-center shrink-0">
                                        {initials(r.user)}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-sm text-gray-900 truncate">{r.user}</p>
                                        <Rating readOnly value={r.rating} size="small" precision={0.5} />
                                    </div>
                                    <Actions editRoute={"review"} deleteHandler={deleteReviewHandler} id={r.id} />
                                </div>
                                {r.comment && (
                                    <p className="text-sm text-gray-600 mt-2.5 bg-gray-50 rounded-xl px-3 py-2 break-words">
                                        {r.comment}
                                    </p>
                                )}
                            </article>
                        ))}
                    </div>

                    {/* ===== DESKTOP: table ===== */}
                    <div className="hidden sm:block bg-white rounded-2xl border border-gray-200/80 shadow-sm w-full overflow-hidden" style={{ height: 'min(520px, 66vh)' }}>
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            pageSize={10}
                            rowsPerPageOptions={[10, 25, 50]}
                            disableSelectIconOnClick
                            disableRowSelectionOnClick
                            columnVisibilityModel={isMobile ? { rating: false, comment: false } : {}}
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
                                    display: 'flex',
                                    alignItems: 'center',
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
                </>
            )}
        </>
    );
};

export default ReviewsTable;
