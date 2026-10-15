import { useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import useMediaQuery from '@mui/material/useMediaQuery';
import { clearErrors, deleteUser, getAllUsers } from '../../actions/userAction';
import { DELETE_USER_RESET } from '../../constants/userConstants';
import Actions from './Actions';
import MetaData from '../Layouts/MetaData';
import BackdropLoader from '../Layouts/BackdropLoader';
import { Users, ShieldCheck, UserRound } from 'lucide-react';

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

const UserTable = () => {

    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();

    const isMobile = useMediaQuery('(max-width:639px)');

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

    const columns = [
        {
            field: "name",
            headerName: "Name",
            minWidth: 200,
            flex: 1,
            renderCell: (params) => {
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                            {params.row.avatar ? (
                                <img draggable="false" src={params.row.avatar} alt={params.row.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold text-gray-500">{initials(params.row.name)}</span>
                            )}
                        </div>
                        <span className="font-medium text-gray-800 truncate">{params.row.name}</span>
                    </div>
                )
            },
        },
        {
            field: "email",
            headerName: "Email",
            minWidth: 200,
            flex: 0.2,
        },
        {
            field: "gender",
            headerName: "Gender",
            minWidth: 100,
            flex: 0.1,
        },
        {
            field: "role",
            headerName: "Role",
            minWidth: 100,
            flex: 0.2,
            renderCell: (params) => (
                <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${rolePill(params.row.role)}`}>
                    {params.row.role}
                </span>
            ),
        },
        {
            field: "registeredOn",
            headerName: "Registered On",
            type: "date",
            minWidth: 150,
            flex: 0.2,
        },
        {
            field: "actions",
            headerName: "Actions",
            minWidth: 120,
            flex: 0.3,
            type: "number",
            sortable: false,
            renderCell: (params) => {
                return (
                    <Actions editRoute={"user"} deleteHandler={deleteUserHandler} id={params.row.id} name={params.row.name} />
                );
            },
        },
    ];

    const rows = [];

    users && users.forEach((item) => {
        rows.unshift({
            id: item._id,
            name: item.name,
            avatar: item.avatar?.url,
            email: item.email,
            gender: (item.gender || '').toUpperCase(),
            role: item.role,
            registeredOn: new Date(item.createdAt).toISOString().substring(0, 10),
        });
    });

    const admins = rows.filter((r) => r.role === 'admin').length;
    const customers = rows.length - admins;

    return (
        <>
            <MetaData title="Admin Users" />

            {loading && <BackdropLoader />}

            {/* ── App-style header ── */}
            <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-[#E84B0F]/10 text-[#E84B0F] flex items-center justify-center shrink-0">
                    <Users size={22} strokeWidth={2} />
                </span>
                <div className="min-w-0">
                    <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-tight">Users</h1>
                    <p className="text-xs text-gray-500">
                        {rows.length} registered account{rows.length === 1 ? '' : 's'}
                    </p>
                </div>
            </div>

            {/* ── Stats strip ── */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <Stat icon={<Users size={16} />} label="Total" value={rows.length} tone="orange" />
                <Stat icon={<ShieldCheck size={16} />} label="Admins" value={admins} tone="green" />
                <Stat icon={<UserRound size={16} />} label="Customers" value={customers} tone="purple" />
            </div>

            {/* ===== MOBILE: card list ===== */}
            <div className="sm:hidden flex flex-col gap-3">
                {rows.length === 0 && !loading && (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-sm">
                        No users found.
                    </div>
                )}
                {rows.map((u) => (
                    <article key={u.id} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-3 flex items-center gap-3 ring-1 ring-black/[0.02]">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                            {u.avatar ? (
                                <img draggable="false" src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-sm font-bold text-gray-500">{initials(u.name)}</span>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-gray-900 truncate">{u.name}</p>
                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${rolePill(u.role)}`}>{u.role}</span>
                                <span className="text-[11px] text-gray-400">{u.registeredOn}</span>
                            </div>
                        </div>
                        <Actions editRoute={"user"} deleteHandler={deleteUserHandler} id={u.id} name={u.name} />
                    </article>
                ))}
            </div>

            {/* ===== DESKTOP: table ===== */}
            <div className="hidden sm:block bg-white rounded-2xl border border-gray-200/80 shadow-sm w-full overflow-hidden" style={{ height: 'min(560px, 68vh)' }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    disableSelectIconOnClick
                    disableRowSelectionOnClick
                    columnVisibilityModel={isMobile ? { gender: false, registeredOn: false } : {}}
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
    );
};

export default UserTable;
