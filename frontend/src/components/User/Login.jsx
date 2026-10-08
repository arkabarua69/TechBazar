import TextField from '@mui/material/TextField';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearErrors, loginUser } from '../../actions/userAction';
import { useSnackbar } from 'notistack';
import BackdropLoader from '../Layouts/BackdropLoader';
import MetaData from '../Layouts/MetaData';

const Login = () => {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const location = useLocation();

    const { loading, isAuthenticated, error } = useSelector((state) => state.user);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = (e) => {
        e.preventDefault();
        dispatch(loginUser(email, password));
    }

    const redirect = location.search ? location.search.split("=")[1] : "account";

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: "error" });
            dispatch(clearErrors());
        }
        if (isAuthenticated) {
            navigate(`/${redirect}`)
        }
    }, [dispatch, error, isAuthenticated, redirect, navigate, enqueueSnackbar]);

    return (
        <>
            <MetaData title="Login | TechBazar" />

            {loading && <BackdropLoader />}
            <main className="w-full mt-4 sm:pt-6 sm:mt-0">

                {/* <!-- row --> */}
                <div className="surface flex overflow-hidden sm:w-5/6 md:w-4/6 lg:w-3/5 sm:mt-4 m-auto mb-7 shadow-lg">
                    {/* <!-- sidebar column  --> */}
                    <div className="loginSidebar bg-gradient-to-br from-primary-accent via-indigo-600 to-blue-700 p-8 sm:p-10 pr-12 hidden sm:flex flex-col justify-between gap-4 w-2/5 relative">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at top right, white, transparent 60%)' }}></div>
                        <div className="relative flex flex-col gap-4">
                            <h1 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight">Welcome Back</h1>
                            <p className="text-blue-100 text-base sm:text-lg pr-2">Login to get access to your Orders, Wishlist and Recommendations</p>
                        </div>
                        <div className="relative text-xs text-blue-100/90">Shop smarter. Track faster.</div>
                    </div>
                    {/* <!-- sidebar column  --> */}

                    {/* <!-- login column --> */}
                    <div className="flex-1 overflow-hidden p-6 sm:p-10">

                        {/* <!-- edit info container --> */}
                        <div className="max-w-md mx-auto flex flex-col gap-8">

                            <div className="text-center flex flex-col gap-2">
                                <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">Sign in to TechBazar</h2>
                                <p className="text-sm text-slate-500">Enter your credentials to continue</p>
                            </div>

                            {/* <!-- input container --> */}
                            <form onSubmit={handleLogin} className="flex flex-col gap-5">
                                <div className="flex flex-col w-full gap-4">

                                    <TextField
                                        fullWidth
                                        id="email"
                                        label="Email Address"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                    />
                                    <TextField
                                        fullWidth
                                        id="password"
                                        label="Password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                    />

                                    {/* <!-- button container --> */}
                                    <div className="flex flex-col gap-3 mt-1">
                                        <p className="text-xs text-slate-500 text-left">By continuing, you agree to TechBazar's <a href="/policy" className="text-primary-accent hover:underline font-medium"> Terms of Use</a> and <a href="/policy" className="text-primary-accent hover:underline font-medium"> Privacy Policy.</a></p>
                                        <button type="submit" className="btn-accent w-full py-3 text-sm font-bold uppercase tracking-wide">Login</button>
                                        <Link to="/password/forgot" className="btn-ghost w-full py-3 text-sm text-center font-semibold">Forgot Password?</Link>
                                    </div>
                                    {/* <!-- button container --> */}

                                </div>
                            </form>
                            {/* <!-- input container --> */}

                            <div className="text-center">
                                <Link to="/register" className="font-medium text-sm text-primary-accent hover:underline">New to TechBazar? Create an account</Link>
                            </div>
                        </div>
                        {/* <!-- edit info container --> */}

                    </div>
                    {/* <!-- login column --> */}
                </div>
                {/* <!-- row --> */}

            </main>
        </>
    );
};

export default Login;
