import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { clearErrors, deleteUser, getAllUsers } from '../../actions/userAction';
import { DELETE_USER_RESET } from '../../constants/userConstants';
import Actions from './Actions';
import MetaData from '../Layouts/MetaData';
import BackdropLoader from '../Layouts/BackdropLoader';
import { Users, ShieldCheck, UserRound, Search, Mail, Calendar, Phone } from 'lucide-react';

const rolePill = (role) =>
    role === 'admin'
        ? 'bg-green-100 text-green-700'
        : 'bg-purple-100 text-purple-700';

// Small KPI tile used in the stats strip.
const Stat = ({ icon, label, value, tone }) => {
    const tones = {
        orange: 'bg-[#E84B0F]/10 text-[#E84B0F]',
        green: 'bg-green-100 text-green-600',
        purple: 'bg-purple-100 text-purple-600',
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

const initials = (name = '') =>
    name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase() || '?';

// Small switch for the per-user COD (Cash on Delivery) permission.
const CodSwitch = ({ checked, disabled, busy, onToggle, title }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        title={title}
        disabled={disabled || busy}
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'} ${disabled ? 'opacity-70 cursor-default' : 'cursor-pointer'} ${busy ? 'opacity-50' : ''}`}
    >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
);

const UserTable = () => {

    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();

    const { users, error } = useSelector((state) => state.users);
    const { loading, isDeleted, error: deleteError } = useSelector((state) => state.profile);

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
            enqueueSnackbar("User Deleted Successfully", { variant: "success" });
            dispatch({ type: DELETE_USER_RESET });
        }
        dispatch(getAllUsers());
    }, [dispatch, error, deleteError, isDeleted, enqueueSnackbar]);

    const deleteUserHandler = (id) => {
        dispatch(deleteUser(id));
    }

    // COD permission toggle — unlocks/disables the COD confirm button in
    // checkout for that one user (Admin → Users → COD switch). Admins are
    // always allowed to use COD, so their switch is locked ON.
    const [togglingId, setTogglingId] = useState(null);
    const toggleCodHandler = async (id, next) => {
        setTogglingId(id);
        try {
            await axios.put(`/api/v1/admin/user/${id}/cod`, { codAllowed: next }, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });
            enqueueSnackbar(next ? 'COD enabled for this user' : 'COD disabled for this user', { variant: 'success' });
            dispatch(getAllUsers());
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Could not update COD permission', { variant: 'error' });
        } finally {
            setTogglingId(null);
        }
    };

    const rows = [];

    users && users.forEach((item) => {
        rows.unshift({
            id: item._id,
            name: item.name,
            avatar: item.avatar?.url,
            email: item.email,
            gender: (item.gender || '').toUpperCase(),
            phone: item.phone || '',
            role: item.role,
            codAllowed: !!item.codAllowed,
            registeredOn: new Date(item.createdAt).toISOString().substring(0, 10),
        });
    });

    const admins = rows.filter((r) => r.role === 'admin').length;
    const customers = rows.length - admins;

    // ── Gmail-based search ───────────────────────────────────────
    const [query, setQuery] = useState('');
    const filteredRows = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((u) =>
            (u.email || '').toLowerCase().includes(q) ||
            (u.name || '').toLowerCase().includes(q)
        );
    }, [rows, query]);

    return (
        <>
            <MetaData title="Admin Users" />

            {loading && <BackdropLoader />}

            {/* ── Header ── */}
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                        <span className="w-11 h-11 rounded-2xl bg-[#E84B0F]/10 text-[#E84B0F] flex items-center justify-center shrink-0">
                            <Users size={22} strokeWidth={2} />
                        </span>
                        <div>
                            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-tight">Users</h1>
                            <p className="text-xs text-gray-500">
                                {rows.length} registered account{rows.length === 1 ? '' : 's'}
                            </p>
                        </div>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by gmail or name…"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E84B0F]/30 focus:border-[#E84B0F]/40 shadow-sm"
                        />
                    </div>
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <Stat icon={<Users size={16} />} label="Total" value={rows.length} tone="orange" />
                    <Stat icon={<ShieldCheck size={16} />} label="Admins" value={admins} tone="green" />
                    <Stat icon={<UserRound size={16} />} label="Customers" value={customers} tone="purple" />
                </div>
            </div>

            {/* ===== USERS: card grid (mobile → tablet → desktop) ===== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {filteredRows.length === 0 && !loading && (
                    <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-sm">
                        {query ? 'No users match your search.' : 'No users found.'}
                    </div>
                )}
                {filteredRows.map((u) => (
                    <article
                        key={u.id}
                        className="group bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md hover:border-gray-300 overflow-hidden ring-1 ring-black/[0.02] transition-all flex"
                    >
                        {/* LEFT: avatar */}
                        <div className="shrink-0 w-[30%] max-w-[120px] min-w-[88px] bg-gradient-to-br from-gray-50 to-white border-r border-gray-100 flex items-center justify-center p-3">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center ring-1 ring-black/5">
                                {u.avatar ? (
                                    <img draggable="false" src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-lg font-bold text-gray-500">{initials(u.name)}</span>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: details */}
                        <div className="flex flex-col flex-1 min-w-0">
                            {/* details */}
                            <div className="flex flex-col flex-1 p-3 gap-1.5">
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm leading-snug truncate">{u.name || '—'}</p>
                                    <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                                        <Mail size={11} className="shrink-0" /> {u.email}
                                    </p>
                                    {u.phone && (
                                        <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                                            <Phone size={11} className="shrink-0" /> {u.phone}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${rolePill(u.role)}`}>{u.role}</span>
                                    {u.gender && (
                                        <span className="text-[10px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{u.gender}</span>
                                    )}
                                    <span className="text-[11px] text-gray-400 flex items-center gap-1 ml-auto">
                                        <Calendar size={11} /> {u.registeredOn}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 mt-auto pt-1">
                                    <span className="text-[10px] font-bold text-gray-400">COD</span>
                                    <CodSwitch
                                        checked={u.role === 'admin' ? true : u.codAllowed}
                                        disabled={u.role === 'admin'}
                                        busy={togglingId === u.id}
                                        title={u.role === 'admin' ? 'Admins can always use COD' : 'Cash on Delivery for this user'}
                                        onToggle={() => toggleCodHandler(u.id, !(u.role === 'admin' ? true : u.codAllowed))}
                                    />
                                    <span className={`text-[10px] font-bold ml-auto ${u.role === 'admin' || u.codAllowed ? 'text-green-600' : 'text-gray-400'}`}>
                                        {u.role === 'admin' || u.codAllowed ? 'Allowed' : 'Locked'}
                                    </span>
                                </div>
                            </div>

                            {/* footer: actions */}
                            <div className="flex items-center justify-end px-3 py-2 border-t border-gray-100 bg-gray-50/70">
                                <Actions editRoute={"user"} deleteHandler={deleteUserHandler} id={u.id} name={u.name} />
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {query && filteredRows.length > 0 && (
                <p className="text-xs text-gray-400 text-center">
                    Showing {filteredRows.length} of {rows.length} user{rows.length === 1 ? '' : 's'}
                </p>
            )}
        </>
    );
};

export default UserTable;
