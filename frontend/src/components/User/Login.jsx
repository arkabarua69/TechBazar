import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearErrors, loginUser } from '../../actions/userAction';
import { useSnackbar } from 'notistack';
import BackdropLoader from '../Layouts/BackdropLoader';
import MetaData from '../Layouts/MetaData';
import { useSiteConfig } from '../../context/SiteConfigContext';
import SocialLoginButtons from './SocialLoginButtons';

// Login page — reference design: peach background, white rounded card, orange-red accent
const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const location = useLocation();
    const { config } = useSiteConfig();

    const { loading, isAuthenticated, error } = useSelector((state) => state.user);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const brandName = config.branding?.name || 'Store';

    const handleLogin = (e) => {
        e.preventDefault();
        dispatch(loginUser(email, password));
    };

    const redirect = location.search ? location.search.split('=')[1] : 'account';

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: 'error' });
            dispatch(clearErrors());
        }
        if (isAuthenticated) navigate(`/${redirect}`);
    }, [dispatch, error, isAuthenticated, redirect, navigate, enqueueSnackbar]);

    return (
        <>
            <MetaData title={`Login | ${brandName}`} />
            {loading && <BackdropLoader />}

            {/* Full-page peach background */}
            <div className="auth-page-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

                {/* Geometric dots pattern */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="absolute rounded-full border border-orange-200/30"
                            style={{
                                width: `${120 + i * 80}px`, height: `${120 + i * 80}px`,
                                top: `${10 + i * 8}%`, left: `${5 + i * 4}%`,
                                opacity: 0.3 - i * 0.04,
                            }}
                        />
                    ))}
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="absolute rounded-full border border-orange-300/20"
                            style={{
                                width: `${80 + i * 60}px`, height: `${80 + i * 60}px`,
                                bottom: `${5 + i * 10}%`, right: `${8 + i * 5}%`,
                                opacity: 0.25 - i * 0.05,
                            }}
                        />
                    ))}
                </div>

                <div className="w-full max-w-sm mx-auto relative z-10">

                    {/* White phone-shaped card */}
                    <div className="auth-card p-8">

                        {/* Title */}
                        <div className="text-center mb-7">
                            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>Login here</h1>
                            <p className="text-gray-600 font-medium mt-1 text-sm">Welcome back you've been missed!</p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleLogin} className="flex flex-col gap-3">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                className="input-field"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className="input-field"
                            />

                            {/* Forgot password */}
                            <div className="text-right -mt-1">
                                <Link to="/password/forgot" className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
                                    Forgot your password?
                                </Link>
                            </div>

                            {/* Sign in button */}
                            <button type="submit" className="btn-accent w-full py-3 text-sm font-semibold mt-1">
                                Sign in
                            </button>
                        </form>

                        {/* Create account */}
                        <p className="text-center text-sm text-gray-500 mt-4">
                            <Link to="/register" className="text-gray-700 font-medium hover:text-orange-600 transition">
                                Create new account
                            </Link>
                        </p>

                        {/* Social login — only providers configured in the admin
                            panel (Google / Facebook / Discord) are shown. */}
                        <SocialLoginButtons redirect={redirect} />

                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;
