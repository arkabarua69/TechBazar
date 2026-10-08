import TextField from '@mui/material/TextField';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearErrors, forgotPassword } from '../../actions/userAction';
import { useSnackbar } from 'notistack';
import BackdropLoader from '../Layouts/BackdropLoader';
import MetaData from '../Layouts/MetaData';
import FormSidebar from './FormSidebar';

const ForgotPassword = () => {

    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();

    const { error, message, loading } = useSelector((state) => state.forgotPassword);

    const [email, setEmail] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.set("email", email);
        dispatch(forgotPassword(formData));
        setEmail("");
    }

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: "error" });
            dispatch(clearErrors());
        }
        if (message) {
            enqueueSnackbar(message, { variant: "success" });
        }
    }, [dispatch, error, message, enqueueSnackbar]);


    return (
        <>
            <MetaData title="Forgot Password" />

            {loading && <BackdropLoader />}
            <main className="w-full mt-4 sm:pt-6 sm:mt-0">

                {/* <!-- row --> */}
                <div className="surface flex overflow-hidden sm:w-5/6 md:w-4/6 lg:w-3/5 sm:mt-4 m-auto mb-7 shadow-lg">

                    <FormSidebar
                        title="Forgot Your Password?"
                        tag="Enter the email address associated with your account."
                    />

                    {/* <!-- login column --> */}
                    <div className="flex-1 overflow-hidden p-6 sm:p-10">

                        <div className="max-w-md mx-auto flex flex-col gap-7">

                            <div className="text-center flex flex-col gap-2">
                                <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">Forgot Password</h2>
                                <p className="text-sm text-slate-500">We'll send you a reset link to your email</p>
                            </div>

                            {/* <!-- input container --> */}
                            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                <div className="flex flex-col w-full gap-4">

                                    <TextField
                                        fullWidth
                                        label="Email Address"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                    />

                                    {/* <!-- button container --> */}
                                    <div className="flex flex-col gap-3 mt-1">
                                        <p className="text-xs text-slate-500 text-left">By continuing, you agree to TechBazar's <a href="/policy" className="text-primary-accent hover:underline font-medium"> Terms of Use</a> and <a href="/policy" className="text-primary-accent hover:underline font-medium"> Privacy Policy.</a></p>
                                        <button type="submit" className="btn-accent w-full py-3 text-sm font-bold uppercase tracking-wide">Submit</button>
                                    </div>
                                    {/* <!-- button container --> */}

                                </div>
                            </form>
                            {/* <!-- input container --> */}

                            <div className="text-center">
                                <Link to="/register" className="font-medium text-sm text-primary-accent hover:underline">New to TechBazar? Create an account</Link>
                            </div>
                        </div>

                    </div>
                    {/* <!-- login column --> */}
                </div>
                {/* <!-- row --> */}

            </main>
        </>
    );
};

export default ForgotPassword
