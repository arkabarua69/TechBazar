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
                <div className="surface flex overflow-hidden sm:w-4/6 sm:mt-4 m-auto mb-7">
                    {/* <!-- sidebar column  --> */}
                    <div className="loginSidebar bg-primary-accent p-10 pr-12 hidden sm:flex flex-col gap-4 w-2/5">
                        <h1 className="font-display font-bold text-white text-3xl">Login</h1>
                        <p className="text-blue-100 text-lg">Get access to your Orders, Wishlist and Recommendations</p>
                    </div>
                    {/* <!-- sidebar column  --> */}

                    {/* <!-- login column --> */}
                    <div className="flex-1 overflow-hidden p-6 sm:p-8">

                        {/* <!-- edit info container --> */}
                        <div className="text-center">

                            {/* <!-- input container --> */}
                            <form onSubmit={handleLogin}>
                                <div className="flex flex-col w-full gap-4">

                                    <TextField
                                        fullWidth
                                        id="email"
                                        label="Email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <TextField
                                        fullWidth
                                        id="password"
                                        label="Password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    {/* <span className="text-xxs text-red-500 font-medium text-left mt-0.5">Please enter valid Email ID/Mobile number</span> */}

                                    {/* <!-- button container --> */}
                                    <div className="flex flex-col gap-2.5 mt-2 mb-32">
                                        <p className="text-xs text-slate-500 text-left">By continuing, you agree to TechBazar's <a href="/policy" className="text-primary-accent hover:underline"> Terms of Use</a> and <a href="/policy" className="text-primary-accent hover:underline"> Privacy Policy.</a></p>
                                        <button type="submit" className="btn-accent w-full py-3 text-sm font-bold">Login</button>
                                        <Link to="/password/forgot" className="btn-ghost w-full py-3 text-sm text-center">Forgot Password?</Link>
                                    </div>
                                    {/* <!-- button container --> */}

                                </div>
                            </form>
                            {/* <!-- input container --> */}

                            <Link to="/register" className="font-medium text-sm text-primary-accent hover:underline">New to TechBazar? Create an account</Link>
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
