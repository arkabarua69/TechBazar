import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearErrors, registerUser } from '../../actions/userAction';
import { useSnackbar } from 'notistack';
import BackdropLoader from '../Layouts/BackdropLoader';
import MetaData from '../Layouts/MetaData';
import { useSiteConfig } from '../../context/SiteConfigContext';

const Register = () => {
    const { config } = useSiteConfig();
    const brandName = config?.branding?.name || 'Store';
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const { loading, isAuthenticated, error } = useSelector((state) => state.user);

    const [user, setUser] = useState({ name: '', email: '', gender: '', password: '', cpassword: '' });
    const { name, email, gender, password, cpassword } = user;
    const [avatar, setAvatar] = useState('');
    const [avatarPreview, setAvatarPreview] = useState('');

    const handleRegister = (e) => {
        e.preventDefault();
        if (password.length < 8) {
            enqueueSnackbar('Password must be at least 8 characters', { variant: 'warning' });
            return;
        }
        if (password !== cpassword) {
            enqueueSnackbar("Passwords don't match", { variant: 'error' });
            return;
        }
        if (!gender) {
            enqueueSnackbar('Please select your gender', { variant: 'warning' });
            return;
        }
        const formData = new FormData();
        formData.set('name', name);
        formData.set('email', email);
        formData.set('gender', gender);
        formData.set('password', password);
        if (avatar) formData.set('avatar', avatar);
        dispatch(registerUser(formData));
    };

    const handleDataChange = (e) => {
        if (e.target.name === 'avatar') {
            const reader = new FileReader();
            reader.onload = () => {
                if (reader.readyState === 2) {
                    setAvatarPreview(reader.result);
                    setAvatar(reader.result);
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        } else {
            setUser({ ...user, [e.target.name]: e.target.value });
        }
    };

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: 'error' });
            dispatch(clearErrors());
        }
        if (isAuthenticated) navigate('/');
    }, [dispatch, error, isAuthenticated, navigate, enqueueSnackbar]);

    return (
        <>
            <MetaData title={`Register | ${brandName}`} />
            {loading && <BackdropLoader />}
            <div className="auth-page-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden py-8">
                {/* Background decorative circles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="absolute rounded-full border border-orange-200/30"
                            style={{ width: `${100 + i * 70}px`, height: `${100 + i * 70}px`, top: `${8 + i * 8}%`, left: `${3 + i * 4}%`, opacity: 0.25 - i * 0.04 }} />
                    ))}
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="absolute rounded-full border border-orange-300/20"
                            style={{ width: `${70 + i * 50}px`, height: `${70 + i * 50}px`, bottom: `${5 + i * 10}%`, right: `${6 + i * 5}%`, opacity: 0.2 - i * 0.05 }} />
                    ))}
                </div>

                <div className="w-full max-w-md mx-auto relative z-10">
                    <div className="auth-card p-7 sm:p-8">
                        {/* Header */}
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold" style={{ color: '#E84B0F' }}>Create Account</h1>
                            <p className="text-gray-500 text-sm mt-1">Sign up and start shopping with {brandName}</p>
                        </div>

                        <form onSubmit={handleRegister} className="flex flex-col gap-3">
                            {/* Name */}
                            <input
                                type="text"
                                name="name"
                                placeholder="Full Name"
                                value={name}
                                onChange={handleDataChange}
                                required
                                autoComplete="name"
                                className="input-field"
                            />
                            {/* Email */}
                            <input
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={handleDataChange}
                                required
                                autoComplete="email"
                                className="input-field"
                            />
                            {/* Password row */}
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={handleDataChange}
                                    required
                                    autoComplete="new-password"
                                    className="input-field"
                                />
                                <input
                                    type="password"
                                    name="cpassword"
                                    placeholder="Confirm Password"
                                    value={cpassword}
                                    onChange={handleDataChange}
                                    required
                                    autoComplete="new-password"
                                    className="input-field"
                                />
                            </div>

                            {/* Gender */}
                            <div className="flex items-center gap-4 px-1">
                                <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Gender:</span>
                                <label className="flex items-center gap-1.5 cursor-pointer text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                    <input type="radio" name="gender" value="male" checked={gender === 'male'} onChange={handleDataChange} className="accent-orange-500" />
                                    Male
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                    <input type="radio" name="gender" value="female" checked={gender === 'female'} onChange={handleDataChange} className="accent-orange-500" />
                                    Female
                                </label>
                            </div>

                            {/* Avatar upload */}
                            <label className="flex items-center gap-3 cursor-pointer px-1">
                                <div className="w-11 h-11 rounded-full border-2 border-dashed flex items-center justify-center shrink-0 overflow-hidden"
                                    style={{ borderColor: 'var(--color-border)' }}>
                                    {avatarPreview
                                        ? <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover rounded-full" />
                                        : <span className="text-xl">👤</span>}
                                </div>
                                <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                    {avatarPreview ? 'Change photo' : 'Add profile photo (optional)'}
                                </span>
                                <input type="file" name="avatar" accept="image/*" onChange={handleDataChange} className="hidden" />
                            </label>

                            <button type="submit" className="btn-accent w-full py-3 text-sm font-semibold mt-1">
                                Create Account
                            </button>
                        </form>

                        <p className="text-center text-sm text-gray-500 mt-4">
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold hover:underline" style={{ color: '#E84B0F' }}>
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Register;
