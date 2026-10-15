import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearErrors, loadUser, updateProfile } from '../../actions/userAction';
import { UPDATE_PROFILE_RESET } from '../../constants/userConstants';
import { useSnackbar } from 'notistack';
import BackdropLoader from '../Layouts/BackdropLoader';
import MetaData from '../Layouts/MetaData';

const UpdateProfile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const { user } = useSelector((state) => state.user);
    const { error, isUpdated, loading } = useSelector((state) => state.profile);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [gender, setGender] = useState('');
    const [avatar, setAvatar] = useState('');
    const [avatarPreview, setAvatarPreview] = useState('');

    const updateProfileHandler = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.set('name', name);
        formData.set('email', email);
        formData.set('gender', gender);
        if (avatar) formData.set('avatar', avatar);
        dispatch(updateProfile(formData));
    };

    const handleAvatarChange = (e) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.readyState === 2) {
                setAvatarPreview(reader.result);
                setAvatar(reader.result);
            }
        };
        reader.readAsDataURL(e.target.files[0]);
    };

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setGender(user.gender || '');
            setAvatarPreview(user.avatar?.url || '');
        }
        if (error) {
            enqueueSnackbar(error, { variant: 'error' });
            dispatch(clearErrors());
        }
        if (isUpdated) {
            enqueueSnackbar('Profile updated successfully', { variant: 'success' });
            dispatch(loadUser());
            navigate('/account');
            dispatch({ type: UPDATE_PROFILE_RESET });
        }
    }, [dispatch, error, user, isUpdated, navigate, enqueueSnackbar]);

    return (
        <>
            <MetaData title="Update Profile" />
            {loading && <BackdropLoader />}
            <div className="auth-page-bg min-h-screen flex items-center justify-center p-4 py-10">
                <div className="w-full max-w-md mx-auto">
                    <div className="auth-card p-7 sm:p-8">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold" style={{ color: '#E84B0F' }}>Edit Profile</h1>
                            <p className="text-gray-500 text-sm mt-1">Update your personal information</p>
                        </div>

                        <form onSubmit={updateProfileHandler} className="flex flex-col gap-4">
                            {/* Avatar */}
                            <label className="flex items-center gap-3 cursor-pointer self-start">
                                <div className="w-14 h-14 rounded-full overflow-hidden border-2 flex items-center justify-center shrink-0"
                                    style={{ borderColor: 'var(--color-accent)' }}>
                                    {avatarPreview
                                        ? <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                        : <span className="text-2xl">👤</span>}
                                </div>
                                <span className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>Change photo</span>
                                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                            </label>

                            <input
                                type="text"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                autoComplete="name"
                                className="input-field"
                            />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                className="input-field"
                            />

                            <div className="flex items-center gap-4 px-1">
                                <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Gender:</span>
                                <label className="flex items-center gap-1.5 cursor-pointer text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                    <input type="radio" name="gender" value="male" checked={gender === 'male'} onChange={(e) => setGender(e.target.value)} className="accent-orange-500" />
                                    Male
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                    <input type="radio" name="gender" value="female" checked={gender === 'female'} onChange={(e) => setGender(e.target.value)} className="accent-orange-500" />
                                    Female
                                </label>
                            </div>

                            <button type="submit" className="btn-accent w-full py-3 text-sm font-semibold">Save Changes</button>
                            <Link to="/account" className="btn-ghost w-full py-3 text-sm text-center">Cancel</Link>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UpdateProfile;
