import { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField'
import Avatar from '@mui/material/Avatar'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import { useSnackbar } from 'notistack';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearErrors, registerUser } from '../../actions/userAction';
import BackdropLoader from '../Layouts/BackdropLoader';
import MetaData from '../Layouts/MetaData';
import FormSidebar from './FormSidebar';
import { useSiteConfig } from '../../context/SiteConfigContext';

const Register = () => {
    const { config } = useSiteConfig();
    const brandName = config?.branding?.name || 'Store';

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const { loading, isAuthenticated, error } = useSelector((state) => state.user);

    const [user, setUser] = useState({
        name: "",
        email: "",
        gender: "",
        password: "",
        cpassword: "",
    });

    const { name, email, gender, password, cpassword } = user;

    const [avatar, setAvatar] = useState("");
    const [avatarPreview, setAvatarPreview] = useState("preview.png");

    const handleRegister = (e) => {
        e.preventDefault();
        if (password.length < 8) {
            enqueueSnackbar("Password length must be atleast 8 characters", { variant: "warning" });
            return;
        }
        if (password !== cpassword) {
            enqueueSnackbar("Password Doesn't Match", { variant: "error" });
            return;
        }

        const formData = new FormData();
        formData.set("name", name);
        formData.set("email", email);
        formData.set("gender", gender);
        formData.set("password", password);
        formData.set("avatar", avatar);

        dispatch(registerUser(formData));
    }

    const handleDataChange = (e) => {
        if (e.target.name === "avatar") {
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
    }

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: "error" });
            dispatch(clearErrors());
        }
        if (isAuthenticated) {
            navigate('/')
        }
    }, [dispatch, error, isAuthenticated, navigate, enqueueSnackbar]);

    return (
        <>
            <MetaData title="Register" />

            {loading && <BackdropLoader />}
            <main className="w-full mt-4 sm:pt-6 sm:mt-0">

                {/* <!-- row --> */}
                <div className="surface flex flex-col sm:flex-row overflow-hidden w-full sm:w-5/6 md:w-4/6 lg:w-3/5 sm:mt-4 m-auto mb-7 shadow-lg rounded-lg">

                    <FormSidebar
                        title="Looks like you're new here!"
                        tag="Sign up with your mobile number to get started"
                    />

                    {/* <!-- signup column --> */}
                    <div className="flex-1 overflow-hidden p-4 sm:p-10 order-1 sm:order-2">

                        <div className="max-w-md mx-auto flex flex-col gap-7">

                            <div className="text-center flex flex-col gap-2">
                                <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">Create your account</h2>
                                <p className="text-sm text-slate-500">Sign up to start shopping with {brandName}</p>
                            </div>

                            {/* <!-- personal info procedure container --> */}
                            <form
                                onSubmit={handleRegister}
                                encType="multipart/form-data"
                                className="flex flex-col gap-5"
                            >
                                <div className="flex flex-col gap-4 items-start">

                                    {/* <!-- input container column --> */}
                                    <div className="flex flex-col w-full justify-between sm:flex-col gap-3 items-center">
                                        <TextField
                                            fullWidth
                                            id="full-name"
                                            label="Full Name"
                                            name="name"
                                            value={name}
                                            onChange={handleDataChange}
                                            required
                                            autoComplete="name"
                                        />
                                        <TextField
                                            fullWidth
                                            id="email"
                                            label="Email Address"
                                            type="email"
                                            name="email"
                                            value={email}
                                            onChange={handleDataChange}
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
                                                <FormControlLabel name="gender" value="male" onChange={handleDataChange} control={<Radio required />} label="Male" />
                                                <FormControlLabel name="gender" value="female" onChange={handleDataChange} control={<Radio required />} label="Female" />
                                            </RadioGroup>
                                        </div>
                                    </div>
                                    {/* <!-- gender input --> */}

                                    {/* <!-- input container column --> */}
                                    <div className="flex flex-col w-full justify-between sm:flex-row gap-3 items-center">
                                        <TextField
                                            fullWidth
                                            id="password"
                                            label="Password"
                                            type="password"
                                            name="password"
                                            value={password}
                                            onChange={handleDataChange}
                                            required
                                            autoComplete="new-password"
                                        />
                                        <TextField
                                            fullWidth
                                            id="confirm-password"
                                            label="Confirm Password"
                                            type="password"
                                            name="cpassword"
                                            value={cpassword}
                                            onChange={handleDataChange}
                                            required
                                            autoComplete="new-password"
                                        />
                                    </div>
                                    {/* <!-- input container column --> */}

                                    <div className="flex flex-col sm:flex-row w-full justify-between gap-3 items-center">
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
                                                onChange={handleDataChange}
                                                className="hidden"
                                            />
                                            Choose Profile Picture
                                        </label>
                                    </div>
                                    <button type="submit" className="btn-accent w-full py-3 text-sm font-bold uppercase tracking-wide mt-1">Signup</button>
                                </div>

                            </form>
                            {/* <!-- personal info procedure container --> */}

                            <div className="text-center">
                                <Link to="/login" className="font-medium text-sm text-primary-accent hover:underline block w-full text-center">Existing User? Log in</Link>
                            </div>
                        </div>

                    </div>
                    {/* <!-- signup column --> */}
                </div>
                {/* <!-- row --> */}

            </main>
        </>
    );
};

export default Register;
