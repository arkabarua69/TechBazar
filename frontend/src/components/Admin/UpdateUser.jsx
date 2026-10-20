import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { clearErrors, getUserDetails, updateUser } from '../../actions/userAction';
import { UPDATE_USER_RESET, REMOVE_USER_DETAILS } from '../../constants/userConstants';
import Loading from './Loading';
import MetaData from '../Layouts/MetaData';
import BackdropLoader from '../Layouts/BackdropLoader';
import { Users, Phone, Mail, User as UserIcon, ShieldCheck } from 'lucide-react';

const UpdateUser = () => {

    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const params = useParams();
    const navigate = useNavigate();

    const { user, error, loading } = useSelector((state) => state.userDetails);
    const { isUpdated, error: updateError, loading: updateLoading } = useSelector((state) => state.profile);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [gender, setGender] = useState("");
    const [role, setRole] = useState("");

    const userId = params.id;

    const updateUserSubmitHandler = (e) => {
        e.preventDefault();

        const userData = {
            name,
            email,
            phone,
            gender,
            role,
        };

        dispatch(updateUser(userId, userData));
    }

    useEffect(() => {
        if (!user || user._id !== userId) {
            dispatch(getUserDetails(userId));
        } else {
            setName(user.name || "");
            setEmail(user.email || "");
            setPhone(user.phone || "");
            setGender(user.gender || "");
            setRole(user.role || "user");
        }
        if (error) {
            enqueueSnackbar(error, { variant: "error" });
            dispatch(clearErrors());
        }
        if (updateError) {
            enqueueSnackbar(updateError, { variant: "error" });
            dispatch(clearErrors());
        }
        if (isUpdated) {
            enqueueSnackbar("User Updated Successfully", { variant: "success" });
            dispatch({ type: UPDATE_USER_RESET });
            dispatch({ type: REMOVE_USER_DETAILS });
            navigate("/admin/users");
        }
    }, [dispatch, error, userId, user, navigate, isUpdated, updateError, enqueueSnackbar]);

    const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E84B0F]/30 focus:border-[#E84B0F]/40 shadow-sm";

    return (
        <>
            <MetaData title="Admin: Update User" />

            {updateLoading && <BackdropLoader />}

            {loading ? <Loading /> : (
                <div className="flex flex-col gap-4">
                    {/* ── Header ── */}
                    <div className="flex items-center gap-3">
                        <span className="w-11 h-11 rounded-2xl bg-[#E84B0F]/10 text-[#E84B0F] flex items-center justify-center shrink-0">
                            <Users size={22} strokeWidth={2} />
                        </span>
                        <div>
                            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-tight">Update User</h1>
                            <p className="text-xs text-gray-500">Edit account details and permissions</p>
                        </div>
                    </div>

                    {/* ── Card ── */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm mx-auto w-full max-w-xl overflow-hidden">
                        <div className="px-5 sm:px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-[#E84B0F]/5 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-[#E84B0F]/10 text-[#E84B0F] flex items-center justify-center shrink-0">
                                    <UserIcon size={22} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-900 truncate">{name || '—'}</p>
                                    <p className="text-xs text-gray-500 truncate">{email || '—'}</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={updateUserSubmitHandler} className="p-5 sm:p-8 space-y-5">
                            {/* Full name */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Full Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="Full name"
                                    className={inputClass}
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                                    <Mail size={12} /> Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="email@example.com"
                                    className={inputClass}
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                                    <Phone size={12} /> Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="01XXXXXXXXX"
                                    className={inputClass}
                                />
                            </div>

                            {/* Gender */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Gender *</label>
                                <div className="flex items-center gap-4">
                                    {['male', 'female'].map((g) => (
                                        <label key={g} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer text-sm font-medium transition-colors ${gender === g ? 'border-[#E84B0F] bg-[#E84B0F]/5 text-[#E84B0F]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                            <input
                                                type="radio"
                                                name="gender"
                                                value={g}
                                                checked={gender === g}
                                                onChange={(e) => setGender(e.target.value)}
                                                required
                                                className="accent-[#E84B0F]"
                                            />
                                            <span className="capitalize">{g}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Role */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                                    <ShieldCheck size={12} /> Role *
                                </label>
                                <select
                                    name="role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    required
                                    className={inputClass}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button type="submit" className="flex-1 text-white py-3 bg-[#E84B0F] hover:bg-[#C63E0A] shadow-sm rounded-xl font-semibold active:scale-[0.99] transition">
                                    Update User
                                </button>
                                <Link to="/admin/users" className="flex-1 text-center text-gray-700 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition">
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default UpdateUser;
