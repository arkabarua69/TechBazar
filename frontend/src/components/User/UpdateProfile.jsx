import { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField'
import { Avatar, FormControlLabel, Radio, RadioGroup } from '@mui/material';
import { useSnackbar } from 'notistack';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearErrors, loadUser, updateProfile } from '../../actions/userAction';
import { UPDATE_PROFILE_RESET } from '../../constants/userConstants';
import BackdropLoader from '../Layouts/BackdropLoader';
import MetaData from '../Layouts/MetaData';

const UpdateProfile = () => {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const { user } = useSelector((state) => state.user);
    const { error, isUpdated, loading } = useSelector((state) => state.profile);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [gender, setGender] = useState("");
    const [avatar, setAvatar] = useState("");
    const [avatarPreview, setAvatarPreview] = useState("");

    const updateProfileHandler = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.set("name", name);
        formData.set("email", email);
        formData.set("gender", gender);
        formData.set("avatar", avatar);

        dispatch(updateProfile(formData));
    }

    const handleUpdateDataChange = (e) => {
        const reader = new FileReader();
        setAvatar("");
        reader.onload = () => {
            if (reader.readyState === 2) {
                setAvatarPreview(reader.result);
                setAvatar(reader.result);
            }
        };

        reader.readAsDataURL(e.target.files[0]);
    }

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
            setGender(user.gender);
            setAvatarPreview(user.avatar?.url);
        }
        if (error) {
            enqueueSnackbar(error, { variant: "error" });
            dispatch(clearErrors());
        }
        if (isUpdated) {
            enqueueSnackbar("Profile Updated Successfully", { variant: "success" });
            dispatch(loadUser());
            navigate('/account');

            dispatch({ type: UPDATE_PROFILE_RESET });
        }
    }, [dispatch, error, user, isUpdated, navigate, enqueueSnackbar]);

    return (
        <>
            <MetaData title="Update Profile | TechBazar" />

            {loading && <BackdropLoader />}
            <main className="w-full mt-4 sm:pt-6 sm:mt-0">

                {/* <!-- row --> */}
                <div className="surface flex overflow-hidden sm:w-5/6 md:w-4/6 lg:w-3/5 sm:mt-4 m-auto mb-7 shadow-lg">
                    {/* <!-- sidebar column  --> */}
                    <div className="loginSidebar bg-gradient-to-br from-primary-accent to-blue-700 px-9 py-10 hidden sm:flex flex-col justify-between gap-4 w-2/5 relative">
                        <div className="flex flex-col gap-4">
                            <h1 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight">Update Your Profile</h1>
                            <p className="text-blue-100 text-base sm:text-lg pr-2">Keep your details up to date</p>
                        </div>
                        <div className="text-xs text-blue-100/90">Shop smarter. Track faster.</div>
                    </div>
                    {/* <!-- sidebar column  --> */}

                    {/* <!-- signup column --> */}
                    <div className="flex-1 overflow-hidden p-6 sm:p-10">

                        <div className="max-w-md mx-auto flex flex-col gap-7">

                            <div className="text-center flex flex-col gap-2">
                                <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">Edit Profile</h2>
                                <p className="text-sm text-slate-500">Update your personal information</p>
                            </div>

                            {/* <!-- personal info procedure container --> */}
                            <form
                                onSubmit={updateProfileHandler}
                                encType="multipart/form-data"
                                className="flex flex-col gap-5"
                            >
                                <div className="flex flex-col gap-4 items-start">

                                    {/* <!-- input container column --> */}
                                    <div className="flex flex-col w-full justify-between sm:flex-col gap-3 items-center">
                                        <TextField
                                            fullWidth
                                            label="Full Name"
                                            name="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            autoComplete="name"
                                        />
                                        <TextField
                                            fullWidth
                                            label="Email Address"
                                            type="email"
                                            name="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoComplete="email"
                                        />
                                    </div>
                                    {/* <!-- input container column --> */}

                                    {/* <!-- gender input --> */}
                                    <div className="flex flex-col gap-2">
                                        <h2 className="text-sm font-medium text-slate-700">Your Gender</h2>
                                        <div className="flex items-center gap-6" id="radioInput">
                                            <RadioGroup
                                                row
                                                aria-labelledby="radio-buttons-group-label"
                                                name="radio-buttons-group"
                                            >
                                                <FormControlLabel name="gender" value="male" checked={gender === "male"} onChange={(e) => setGender(e.target.value)} control={<Radio required />} label="Male" />
                                                <FormControlLabel name="gender" value="female" checked={gender === "female"} onChange={(e) => setGender(e.target.value)} control={<Radio required />} label="Female" />
                                            </RadioGroup>
                                        </div>
                                    </div>
                                    {/* <!-- gender input --> */}

                                    <div className="flex flex-col w-full justify-between sm:flex-row gap-3 items-center">
                                        <Avatar
                                            alt="Avatar Preview"
                                            src={avatarPreview}
                                            sx={{ width: 56, height: 56 }}
                                        />
                                        <label className="btn-ghost w-full py-3 text-sm cursor-pointer text-center">
                                            <input
                                                type="file"
                                                name="avatar"
                                                accept="image/*"
                                                onChange={handleUpdateDataChange}
                                                className="hidden"
                                            />
                                            Change Profile Picture
                                        </label>
                                    </div>
                                    <button type="submit" className="btn-accent w-full py-3 text-sm font-bold uppercase tracking-wide mt-1">Update Profile</button>
                                    <Link className="btn-ghost w-full py-3 text-sm text-center" to="/account">Cancel</Link>
                                </div>

                            </form>
                            {/* <!-- personal info procedure container --> */}
                        </div>

                    </div>
                    {/* <!-- signup column --> */}
                </div>
                {/* <!-- row --> */}

            </main>
        </>
    );
};

export default UpdateProfile;
