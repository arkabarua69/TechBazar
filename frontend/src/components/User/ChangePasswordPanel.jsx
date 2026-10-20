import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearErrors, updatePassword } from '../../actions/userAction';
import { UPDATE_PASSWORD_RESET } from '../../constants/userConstants';
import { useSnackbar } from 'notistack';
import BackdropLoader from '../Layouts/BackdropLoader';
import MetaData from '../Layouts/MetaData';
import KeyIcon from '@mui/icons-material/Key';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

const ChangePasswordPanel = ({ onDone }) => {
    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const { error, isUpdated, loading } = useSelector((state) => state.profile);

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: 'error' });
            dispatch(clearErrors());
        }
        if (isUpdated) {
            enqueueSnackbar('Password updated successfully', { variant: 'success' });
            dispatch({ type: UPDATE_PASSWORD_RESET });
            onDone?.();
        }
    }, [dispatch, error, isUpdated, enqueueSnackbar, onDone]);

    const submit = (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            enqueueSnackbar('Passwords do not match', { variant: 'error' });
            return;
        }
        dispatch(updatePassword({ oldPassword, newPassword, confirmPassword }));
    };

    const field = {
        width: '100%',
        padding: '0.625rem 0.75rem 0.625rem 2.5rem',
        paddingRight: '2.5rem',
        fontSize: '0.8125rem',
        borderRadius: '0.625rem',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text-primary)',
        outline: 'none',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    };

    const focusHandlers = {
        onFocus: (e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,75,15,0.12)'; },
        onBlur: (e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; },
    };

    const Label = ({ children, icon }) => (
        <span className="text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
            {icon}
            {children}
        </span>
    );

    const PasswordField = ({ label, value, setValue, show, setShow, placeholder }) => (
        <div>
            <Label icon={<LockIcon sx={{ fontSize: 13 }} />}>{label}</Label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }}>
                    <LockIcon sx={{ fontSize: 16 }} />
                </span>
                <input
                    type={show ? 'text' : 'password'}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    required
                    style={field}
                    {...focusHandlers}
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-accent)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                >
                    {show ? <VisibilityOffIcon sx={{ fontSize: 16 }} /> : <VisibilityIcon sx={{ fontSize: 16 }} />}
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-4">
            {loading && <BackdropLoader />}

            <div
                className="flex flex-col gap-5 p-5 sm:p-6"
                style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--card-radius)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
            >
                <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
                        <KeyIcon sx={{ fontSize: 22 }} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>Change Password</h3>
                        <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Keep your account secure with a strong password</p>
                    </div>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-4">
                    <PasswordField label="Current Password" value={oldPassword} setValue={setOldPassword} show={showOld} setShow={setShowOld} placeholder="Enter current password" />
                    <PasswordField label="New Password" value={newPassword} setValue={setNewPassword} show={showNew} setShow={setShowNew} placeholder="Enter new password" />
                    <PasswordField label="Confirm Password" value={confirmPassword} setValue={setConfirmPassword} show={showConfirm} setShow={setShowConfirm} placeholder="Re-enter new password" />

                    <div className="flex items-center gap-2 pt-1">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200 disabled:opacity-60"
                            style={{ backgroundColor: 'var(--color-accent)', boxShadow: '0 4px 12px rgba(232,75,15,0.25)' }}
                            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                            onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
                        >
                            <SaveIcon sx={{ fontSize: 16 }} />
                            {loading ? 'Updating…' : 'Update Password'}
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

export default ChangePasswordPanel;