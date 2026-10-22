import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearErrors, loadUser, updatePassword } from '../../actions/userAction';
import { UPDATE_PASSWORD_RESET } from '../../constants/userConstants';
import { useSnackbar } from 'notistack';
import BackdropLoader from '../Layouts/BackdropLoader';
import MetaData from '../Layouts/MetaData';

const UpdatePassword = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const { error, isUpdated, loading } = useSelector((state) => state.profile);

    const [oldPassword, setOldPassword] = useState('');
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
        const formData = new FormData();
        formData.set('oldPassword', oldPassword);
        formData.set('newPassword', newPassword);
        formData.set('confirmPassword', confirmPassword);
        dispatch(updatePassword(formData));
    };

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: 'error' });
            dispatch(clearErrors());
        }
        if (isUpdated) {
            enqueueSnackbar('Password updated successfully', { variant: 'success' });
            dispatch(loadUser());
            navigate('/account');
            dispatch({ type: UPDATE_PASSWORD_RESET });
        }
    }, [dispatch, error, isUpdated, navigate, enqueueSnackbar]);

    return (
        <>
            <MetaData title="Change Password" />
            {loading && <BackdropLoader />}
            <div className="auth-page-bg min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-sm mx-auto">
                    <div className="auth-card p-7 sm:p-8">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>Change Password</h1>
                            <p className="text-gray-500 text-sm mt-1">Enter your current and new password</p>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                            <input
                                type="password"
                                placeholder="Current Password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className="input-field"
                            />
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

                            <button type="submit" className="btn-accent w-full py-3 text-sm font-semibold mt-2">
                                Update Password
                            </button>
                            <Link to="/account" className="btn-ghost w-full py-3 text-sm text-center">Cancel</Link>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UpdatePassword;
