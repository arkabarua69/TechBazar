import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

const pad = (n) => String(n).padStart(2, '0');

// remaining time until today's "HH:MM" deadline (rolls to tomorrow if passed)
const getRemaining = (endsAt = '23:59') => {
    const [h, m] = String(endsAt).split(':').map((v) => parseInt(v, 10));
    const now = new Date();
    const target = new Date();
    target.setHours(isNaN(h) ? 23 : h, isNaN(m) ? 59 : m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);

    let diff = Math.max(0, Math.floor((target - now) / 1000));
    const hours = Math.floor(diff / 3600); diff -= hours * 3600;
    const minutes = Math.floor(diff / 60);
    const seconds = diff - minutes * 60;
    return { hours, minutes, seconds };
};

// "Deal of the Day" — one flash-sale banner with a live countdown and
// limited-stock gadgets (app-style, works on desktop + mobile)
const FlashSale = ({ flashSale = {}, products = [] }) => {
    const [left, setLeft] = useState(() => getRemaining(flashSale.endsAt));

    useEffect(() => {
        const id = setInterval(() => setLeft(getRemaining(flashSale.endsAt)), 1000);
        return () => clearInterval(id);
    }, [flashSale.endsAt]);

    if (flashSale.enabled === false) return null;

    const SLOTS = 4;
    const usable = [...products].filter((p) => p && p.images && p.images[0] && p.stock > 0);

    // Per-product price/stock overrides — these belong to the flash-sale strip
    // only and never modify the real product document.
    const overrides = (flashSale.overrides && typeof flashSale.overrides === 'object') ? flashSale.overrides : {};
    const applyOverride = (p) => {
        const o = overrides[String(p._id)];
        if (!o) return p;
        return {
            ...p,
            price:       o.price       !== undefined ? o.price       : p.price,
            cuttedPrice: o.cuttedPrice !== undefined ? o.cuttedPrice : p.cuttedPrice,
            stock:       o.stock       !== undefined ? o.stock       : p.stock,
        };
    };

    // 1) Products explicitly picked in Admin → Flash Sale, in the saved order.
    const pickedIds = Array.isArray(flashSale.productIds) ? flashSale.productIds : [];
    const byId = new Map(usable.map((p) => [String(p._id), p]));
    const picked = pickedIds.map((id) => byId.get(String(id))).filter(Boolean).map(applyOverride);

    // 2) Auto-fill the remaining slots with the lowest-stock products
    //    (classic "limited stock" deal behaviour).
    const pickedSet = new Set(picked.map((p) => String(p._id)));
    const auto = usable
        .filter((p) => !pickedSet.has(String(p._id)))
        .sort((a, b) => (a.stock || 0) - (b.stock || 0));

    const limited = [...picked, ...auto].slice(0, SLOTS);

    const timeBoxes = [
        { value: left.hours, label: 'hrs' },
        { value: left.minutes, label: 'min' },
        { value: left.seconds, label: 'sec' },
    ];

    return (
        <section>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-50 via-white to-red-50 border border-line text-slate-900 shadow-sm">
                {/* decorative blobs */}
                <div className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 bg-yellow-200/50 rounded-full blur-2xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-10 w-56 h-56 bg-red-200/40 rounded-full blur-2xl" />

                <div className="relative p-4 sm:p-6">
                    {/* headline + countdown */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                        <div className="flex flex-col gap-1 min-w-0">
                            <span className="w-fit inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-red-600 text-white rounded-full px-3 py-1">
                                <LocalFireDepartmentIcon sx={{ fontSize: '14px' }} />
                                Flash Sale
                            </span>
                            <h2 className="font-display font-extrabold text-lg sm:text-2xl leading-tight mt-1.5 text-slate-900">
                                {flashSale.title || 'Deal of the Day'}
                            </h2>
                            <p className="text-slate-600 text-xs sm:text-sm">
                                {flashSale.subtitle || 'Limited stock — order fast'}
                            </p>
                        </div>

                        {/* countdown */}
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-slate-500 hidden sm:block max-w-20 leading-tight text-right">
                                Ends in
                            </span>
                            {timeBoxes.map((box) => (
                                <div key={box.label} className="bg-white border border-line rounded-lg px-2.5 py-1.5 text-center w-14 shadow-sm">
                                    <div className="font-display font-bold text-base sm:text-xl leading-none tabular-nums text-slate-900">
                                        {pad(box.value)}
                                    </div>
                                    <div className="text-[9px] text-slate-500 mt-1">{box.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {flashSale.note && (
                        <p className="text-[11px] text-slate-500 mt-3 inline-flex items-center gap-1">
                            <HourglassEmptyIcon sx={{ fontSize: '13px' }} />
                            {flashSale.note}
                        </p>
                    )}

                    {/* limited stock gadgets */}
                    {limited.length > 0 && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mt-4">
                            {limited.map((product) => {
                                const price = product.price || 0;
                                const cut = product.cuttedPrice || 0;
                                const off = cut > price && price > 0
                                    ? Math.round(((cut - price) / cut) * 100)
                                    : 0;
                                return (
                                <Link
                                    key={product._id}
                                    to={`/product/${product._id}`}
                                    className="group bg-white rounded-xl border border-line overflow-hidden flex flex-col text-slate-900 hover:shadow-md hover:-translate-y-0.5 transition duration-200"
                                >
                                    <div className="h-24 sm:h-28 bg-white overflow-hidden flex items-center justify-center relative">
                                        {off > 0 && (
                                            <span className="absolute top-1.5 left-1.5 z-10 text-[9px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded-full">
                                                {off}% OFF
                                            </span>
                                        )}
                                        <img
                                            draggable="false"
                                            src={product.images[0].url}
                                            alt={product.name}
                                            className="h-full w-full object-contain p-1.5 group-hover:scale-105 transition duration-300"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5 p-2.5 sm:p-3">
                                        <p className="text-[11px] sm:text-xs font-medium text-slate-800 line-clamp-2 leading-snug">
                                            {product.name}
                                        </p>
                                        <div className="flex items-baseline justify-between gap-1">
                                            <span className="flex items-baseline gap-1.5 min-w-0">
                                                <span className="font-extrabold text-sm sm:text-base text-slate-900">
                                                    Tk {price.toLocaleString()}
                                                </span>
                                                {cut > price && (
                                                    <span className="text-[10px] text-slate-400 line-through">
                                                        Tk {cut.toLocaleString()}
                                                    </span>
                                                )}
                                            </span>
                                            <span className="text-[10px] font-bold text-red-500 shrink-0">
                                                Stock: {product.stock}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-yellow-500 px-1.5 py-0.5 rounded-full w-fit">
                                            Cash on Delivery
                                        </span>
                                    </div>
                                </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default FlashSale;
