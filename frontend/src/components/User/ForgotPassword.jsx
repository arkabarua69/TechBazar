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
                <div className="surface flex overflow-hidden sm:w-4/6 sm:mt-4 m-auto mb-7">

                    <FormSidebar
                        title="Forgot Your Password?"
                        tag="Enter the email address associated with your account."
                    />

                    {/* <!-- login column --> */}
                    <div className="flex-1 overflow-hidden p-6 sm:p-8">
                        <h2 className="text-center font-display font-extrabold text-xl sm:text-2xl text-slate-900">Forgot Password</h2>

                        {/* <!-- edit info container --> */}
                        <div className="text-center mt-6">

                            {/* <!-- input container --> */}
                            <form onSubmit={handleSubmit}>
                                <div className="flex flex-col w-full gap-4">

                                    <TextField
                                        fullWidth
                                        label="Email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />

                                    {/* <!-- button container --> */}
                                    <div className="flex flex-col gap-2.5 mt-2 mb-32">
                                        <p className="text-xs text-slate-500 text-left">By continuing, you agree to TechBazar's <a href="/policy" className="text-primary-accent hover:underline"> Terms of Use</a> and <a href="/policy" className="text-primary-accent hover:underline"> Privacy Policy.</a></p>
                                        <button type="submit" className="btn-accent w-full py-3 text-sm font-bold">Submit</button>
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

export default ForgotPassword
