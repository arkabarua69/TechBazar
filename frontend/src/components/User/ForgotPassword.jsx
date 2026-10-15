import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearErrors, forgotPassword } from '../../actions/userAction';
import { useSnackbar } from 'notistack';
import BackdropLoader from '../Layouts/BackdropLoader';
import MetaData from '../Layouts/MetaData';
import { useSiteConfig } from '../../context/SiteConfigContext';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

const ForgotPassword = () => {
    const { config } = useSiteConfig();
    const brandName = config?.branding?.name || 'Store';
    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const { error, message, loading } = useSelector((state) => state.forgotPassword);
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(forgotPassword({ email }));
    };

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: 'error' });
            dispatch(clearErrors());
        }
        if (message) {
            enqueueSnackbar(message, { variant: 'success' });
            setSent(true);
            setEmail('');
        }
    }, [dispatch, error, message, enqueueSnackbar]);

    return (
        <>
            <MetaData title={`Forgot Password | ${brandName}`} />
            {loading && <BackdropLoader />}
            <div className="auth-page-bg min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-sm mx-auto">
                    <div className="auth-card p-7 sm:p-8">
                        {sent ? (
                            <div className="text-center flex flex-col gap-4 py-4">
                                <MarkEmailReadIcon sx={{ fontSize: '3rem', color: 'var(--color-accent)' }} />
                                <h2 className="text-xl font-bold" style={{ color: '#E84B0F' }}>Check your email</h2>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    We've sent a password reset link to your email. Please check your inbox and spam folder.
                                </p>
                                <Link to="/login" className="btn-accent w-full py-3 text-sm font-semibold">
                                    Back to Login
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="text-center mb-6">
                                    <VpnKeyIcon sx={{ fontSize: '2.5rem', color: 'var(--color-accent)' }} />
                                    <h1 className="text-2xl font-bold mt-2" style={{ color: '#E84B0F' }}>Forgot Password?</h1>
                                    <p className="text-gray-500 text-sm mt-1">Enter your email to get a reset link</p>
                                </div>

                                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                        className="input-field"
                                    />
                                    <button type="submit" className="btn-accent w-full py-3 text-sm font-semibold mt-1">
                                        Send Reset Link
                                    </button>
                                </form>

                                <p className="text-center text-sm text-gray-500 mt-4">
                                    Remember your password?{' '}
                                    <Link to="/login" className="font-semibold hover:underline" style={{ color: '#E84B0F' }}>
                                        Sign in
                                    </Link>
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ForgotPassword;
