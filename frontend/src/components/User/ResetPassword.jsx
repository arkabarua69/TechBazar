import TextField from '@mui/material/TextField';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword, clearErrors } from '../../actions/userAction';
import { useSnackbar } from 'notistack';
import BackdropLoader from '../Layouts/BackdropLoader';
import MetaData from '../Layouts/MetaData';
import FormSidebar from './FormSidebar';

const ResetPassword = () => {

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const params = useParams();

  const { error, success, loading } = useSelector((state) => state.forgotPassword);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      enqueueSnackbar("Password length must be atleast 8 characters", { variant: "warning" });
      return;
    }
    if (newPassword !== confirmPassword) {
      enqueueSnackbar("Password Doesn't Match", { variant: "error" });
      return;
    }

    const formData = new FormData();
    formData.set("password", newPassword);
    formData.set("confirmPassword", confirmPassword);
    dispatch(resetPassword(params.token, formData));
  }

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearErrors());
    }
    if (success) {
      enqueueSnackbar("Password Updated Successfully", { variant: "success" });
      navigate("/login")
    }
  }, [dispatch, error, success, navigate, enqueueSnackbar]);

  return (
    <>
      <MetaData title="Password Reset | TechBazar" />

      {loading && <BackdropLoader />}
      <main className="w-full mt-4 sm:pt-6 sm:mt-0">

        {/* <!-- row --> */}
        <div className="surface flex flex-col sm:flex-row overflow-hidden w-full sm:w-5/6 md:w-4/6 lg:w-3/5 sm:mt-4 m-auto mb-7 shadow-lg rounded-lg">

          <FormSidebar
            title="Reset Password"
            tag="Get access to your Orders, Wishlist and Recommendations"
          />

          {/* <!-- login column --> */}
          <div className="flex-1 overflow-hidden p-4 sm:p-10 order-1 sm:order-2">

            <div className="max-w-md mx-auto flex flex-col gap-7">

              <div className="text-center flex flex-col gap-2">
                <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">Reset Password</h2>
                <p className="text-sm text-slate-500">Create a new password for your account</p>
              </div>

              {/* <!-- input container --> */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                <div className="flex flex-col w-full gap-4">

                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    name="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type="password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />

                  {/* <!-- button container --> */}
                  <div className="flex flex-col gap-3 mt-1">
                    <p className="text-xs text-slate-500 text-center sm:text-left">By continuing, you agree to TechBazar's <a href="/policy" className="text-primary-accent hover:underline font-medium"> Terms of Use</a> and <a href="/policy" className="text-primary-accent hover:underline font-medium"> Privacy Policy.</a></p>
                    <button type="submit" className="btn-accent w-full py-3 text-sm font-bold uppercase tracking-wide">Submit</button>
                  </div>
                  {/* <!-- button container --> */}

                </div>
              </form>
              {/* <!-- input container --> */}

              <div className="text-center">
                <Link to="/register" className="font-medium text-sm text-primary-accent hover:underline block w-full text-center">New to TechBazar? Create an account</Link>
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

export default ResetPassword;
