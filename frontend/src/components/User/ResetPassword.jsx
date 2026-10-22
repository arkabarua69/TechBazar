import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword, clearErrors } from '../../actions/userAction';
import { useSnackbar } from 'notistack';
import BackdropLoader from '../Layouts/BackdropLoader';
import MetaData from '../Layouts/MetaData';
import { useSiteConfig } from '../../context/SiteConfigContext';
import LockIcon from '@mui/icons-material/Lock';

const ResetPassword = () => {
    const { config } = useSiteConfig();
    const brandName = config?.branding?.name || 'Store';
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const params = useParams();
    const { error, success, loading } = useSelector((state) => state.forgotPassword);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newPassword.length < 8) {
            enqueueSnackbar('Password must be at least 8 characters', { variant: 'warning' });
            return;
        }
        if (newPassword !== confirmPassword) {
            enqueueSnackbar("Passwords don't match", { variant: 'error' });
            return;
        }
        dispatch(resetPassword(params.token, { password: newPassword }));
    };

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: 'error' });
            dispatch(clearErrors());
        }
        if (success) {
            enqueueSnackbar('Password reset successfully', { variant: 'success' });
            navigate('/login');
        }
    }, [dispatch, error, success, navigate, enqueueSnackbar]);

    return (
        <>
            <MetaData title={`Reset Password | ${brandName}`} />
            {loading && <BackdropLoader />}
            <div className="auth-page-bg min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-sm mx-auto">
                    <div className="auth-card p-7 sm:p-8">
                        <div className="text-center mb-6">
                            <LockIcon sx={{ fontSize: '2.5rem', color: 'var(--color-accent)' }} />
                            <h1 className="text-2xl font-bold mt-2" style={{ color: 'var(--color-accent)' }}>Reset Password</h1>
                            <p className="text-gray-500 text-sm mt-1">Create a new secure password</p>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                            <input
                                type="password"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                                className="input-field"
                            />
                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                                className="input-field"
                            />
                            <button type="submit" className="btn-accent w-full py-3 text-sm font-semibold mt-1">
                                Reset Password
                            </button>
                        </form>

                        <p className="text-center text-sm text-gray-500 mt-4">
                            <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--color-accent)' }}>
                                Back to Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ResetPassword;
