import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearErrors, loadUser, updateProfile } from '../../actions/userAction';
import { UPDATE_PROFILE_RESET } from '../../constants/userConstants';
import { useSnackbar } from 'notistack';
import BackdropLoader from '../Layouts/BackdropLoader';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import WcIcon from '@mui/icons-material/Wc';
import EditIcon from '@mui/icons-material/Edit';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

const useIsMobile = () => {
    const [mobile, setMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        const onChange = () => setMobile(mq.matches);
        onChange();
        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else mq.addListener(onChange);
        return () => {
            if (mq.removeEventListener) mq.removeEventListener('change', onChange);
            else mq.removeListener(onChange);
        };
    }, []);
    return mobile;
};

const EditProfilePanel = ({ onDone }) => {
    const mobile = useIsMobile();
    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const { user } = useSelector((state) => state.user);
    const { error, isUpdated, loading } = useSelector((state) => state.profile);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [gender, setGender] = useState('');
    const [avatar, setAvatar] = useState('');
    const [avatarPreview, setAvatarPreview] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setGender(user.gender || '');
            setAvatarPreview(user.avatar?.url || '');
        }
    }, [user]);

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: 'error' });
            dispatch(clearErrors());
        }
        if (isUpdated) {
            enqueueSnackbar('Profile updated successfully', { variant: 'success' });
            dispatch(loadUser());
            dispatch({ type: UPDATE_PROFILE_RESET });
            onDone?.();
        }
    }, [dispatch, error, isUpdated, enqueueSnackbar, onDone]);

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.readyState === 2) {
                setAvatarPreview(reader.result);
                setAvatar(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const submit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.set('name', name);
        formData.set('email', email);
        formData.set('gender', gender);
        if (avatar) formData.set('avatar', avatar);
        dispatch(updateProfile(formData));
    };

    const field = {
        width: '100%',
        padding: '0.625rem 0.75rem',
        fontSize: '0.8125rem',
        borderRadius: '0.625rem',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text-primary)',
        outline: 'none',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    };

    const focusHandlers = {
        onFocus: (e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--shadow-accent-soft)'; },
        onBlur: (e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; },
    };

    const Label = ({ children, icon }) => (
        <span className="text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            {icon}
            {children}
        </span>
    );

    return (
        <div className="flex flex-col gap-4">
            {loading && <BackdropLoader />}

            <div
                className="flex flex-col gap-5 p-5 sm:p-6"
                style={{
                    backgroundColor: mobile ? 'transparent' : 'var(--color-surface)',
                    border: mobile ? 'none' : '1px solid var(--color-border)',
                    borderRadius: mobile ? '0' : 'var(--card-radius)',
                    boxShadow: mobile ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
                }}
            >
                <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
                        <EditIcon sx={{ fontSize: 22 }} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>Edit Profile</h3>
                        <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Update your personal information and photo</p>
                    </div>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-4">
                    {/* Avatar */}
                    <label className="flex items-center gap-4 cursor-pointer self-start group">
                        <div
                            className="w-16 h-16 rounded-full overflow-hidden border-2 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:shadow-lg"
                            style={{ borderColor: 'var(--color-accent)', boxShadow: '0 2px 8px var(--accent-15)' }}
                        >
                            {avatarPreview
                                ? <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                : <PersonIcon sx={{ fontSize: '28px', color: 'var(--color-accent)' }} />}
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold transition-colors" style={{ color: 'var(--color-accent)' }}>
                            <PhotoCameraIcon sx={{ fontSize: 16 }} />
                            Change photo
                        </span>
                        <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <Label icon={<PersonIcon sx={{ fontSize: 13 }} />}>Full Name</Label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    autoComplete="name"
                                    style={field}
                                    {...focusHandlers}
                                />
                            </div>
                        </div>
                        <div>
                            <Label icon={<EmailIcon sx={{ fontSize: 13 }} />}>Email Address</Label>
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    style={field}
                                    {...focusHandlers}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label icon={<WcIcon sx={{ fontSize: 13 }} />}>Gender</Label>
                        <div className="flex items-center gap-4 px-1">
                            {['male', 'female'].map((g) => (
                                <label
                                    key={g}
                                    className="flex items-center gap-2 cursor-pointer text-sm px-3.5 py-2 rounded-lg border transition-all duration-150"
                                    style={gender === g
                                        ? { borderColor: 'var(--color-accent)', backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)', fontWeight: 600 }
                                        : { borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                                >
                                    <input
                                        type="radio"
                                        name="gender"
                                        value={g}
                                        checked={gender === g}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="sr-only"
                                    />
                                    <span
                                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150"
                                        style={gender === g
                                            ? { borderColor: 'var(--color-accent)', backgroundColor: 'var(--color-accent)' }
                                            : { borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                                    >
                                        {gender === g && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </span>
                                    {g === 'male' ? 'Male' : 'Female'}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200 disabled:opacity-60"
                            style={{ backgroundColor: 'var(--color-accent)', boxShadow: '0 4px 12px var(--shadow-accent-mid)' }}
                            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                            onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
                        >
                            <SaveIcon sx={{ fontSize: 16 }} />
                            {loading ? 'Saving…' : 'Save Changes'}
                        </button>
                        <button
                            type="button"
                            onClick={() => onDone?.()}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                        >
                            <CloseIcon sx={{ fontSize: 16 }} />
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfilePanel;