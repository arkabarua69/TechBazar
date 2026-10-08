import { useEffect } from 'react';
import Sidebar from './Sidebar';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import Loader from '../Layouts/Loader';
import MinCategory from '../Layouts/MinCategory';
import MetaData from '../Layouts/MetaData';

const Account = () => {

    const navigate = useNavigate();

    const { user, loading, isAuthenticated } = useSelector(state => state.user)

    useEffect(() => {
        if (isAuthenticated === false) {
            navigate("/login")
        }
    }, [isAuthenticated, navigate]);

    const getLastName = () => {
        const nameArray = user.name.split(" ");
        return nameArray[nameArray.length - 1];
    }

    return (
        <>
            <MetaData title="My Profile" />

            {loading ? <Loader /> :
                <>
                    <MinCategory />
                    <main className="w-full mt-4 sm:mt-0">

                        {/* <!-- row --> */}
                        <div className="flex gap-3.5 sm:w-11/12 sm:mt-4 m-auto mb-7">

                            <Sidebar activeTab={"profile"} />

                            {/* <!-- details column --> */}
                            <div className="surface flex-1 overflow-hidden">
                                {/* <!-- edit info container --> */}
                                <div className="flex flex-col gap-12 m-4 sm:mx-8 sm:my-6">
                                    {/* <!-- personal info --> */}
                                    <div className="flex flex-col gap-5 items-start">
                                        <span className="font-display font-bold text-base sm:text-lg text-slate-900">Personal Information <Link to="/account/update" className="text-sm text-primary-accent font-semibold ml-8 cursor-pointer hover:underline">Edit</Link></span>

                                        <div className="flex flex-col sm:flex-row items-center gap-3" id="personalInputs">
                                            <div className="flex flex-col gap-0.5 w-64 px-3 py-1.5 rounded-lg border border-line inputs cursor-not-allowed bg-cloud focus-within:border-primary-accent">
                                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">First Name</label>
                                                <input type="text" value={user.name.split(" ", 1)} className="text-sm bg-transparent outline-none border-none cursor-not-allowed text-slate-500" disabled />
                                            </div>
                                            <div className="flex flex-col gap-0.5 w-64 px-3 py-1.5 rounded-lg border border-line inputs cursor-not-allowed bg-cloud focus-within:border-primary-accent">
                                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Last Name</label>
                                                <input type="text" value={getLastName()} className="text-sm bg-transparent outline-none border-none cursor-not-allowed text-slate-500" disabled />
                                            </div>
                                        </div>

                                        {/* <!-- gender --> */}
                                        <div className="flex flex-col gap-2">
                                            <h2 className="text-sm font-medium text-slate-700">Your Gender</h2>
                                            <div className="flex items-center gap-8" id="radioInput">
                                                <div className="flex items-center gap-4 inputs text-slate-500 cursor-not-allowed">
                                                    <input type="radio" name="gender" checked={user.gender === "male"} id="male" className="h-4 w-4 cursor-not-allowed" disabled />
                                                    <label htmlFor="male" className="text-sm text-slate-600 cursor-not-allowed">Male</label>
                                                </div>
                                                <div className="flex items-center gap-4 inputs text-slate-500 cursor-not-allowed">
                                                    <input type="radio" name="gender" checked={user.gender === "female"} id="female" className="h-4 w-4 cursor-not-allowed" disabled />
                                                    <label htmlFor="female" className="text-sm text-slate-600 cursor-not-allowed">Female</label>
                                                </div>
                                            </div>
                                        </div>
                                        {/* <!-- gender --> */}

                                    </div>
                                    {/* <!-- personal info --> */}

                                    {/* <!-- email address info --> */}
                                    <div className="flex flex-col gap-5 items-start">
                                        <span className="font-display font-bold text-base sm:text-lg text-slate-900">Email Address
                                            <Link to="/account/update" className="text-sm text-primary-accent font-semibold ml-3 sm:ml-8 cursor-pointer hover:underline">Edit</Link>
                                            <Link to="/password/update" className="text-sm text-primary-accent font-semibold ml-3 sm:ml-8 hover:underline">Change Password</Link>
                                        </span>

                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col gap-0.5 sm:w-64 px-3 py-1.5 rounded-lg border border-line bg-cloud cursor-not-allowed focus-within:border-primary-accent">
                                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</label>
                                                <input type="email" value={user.email} className="text-sm bg-transparent outline-none border-none cursor-not-allowed text-slate-500" disabled />
                                            </div>
                                        </div>

                                    </div>
                                    {/* <!-- email address info --> */}

                                    {/* <!-- mobile number info --> */}
                                    <div className="flex flex-col gap-5 items-start">
                                        <span className="font-display font-bold text-base sm:text-lg text-slate-900">Mobile Number
                                            <span className="text-sm text-primary-accent font-semibold ml-3 sm:ml-8 cursor-pointer hover:underline" id="mobEditBtn">Edit</span>
                                        </span>

                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col gap-0.5 sm:w-64 px-3 py-1.5 rounded-lg border border-line bg-cloud cursor-not-allowed focus-within:border-primary-accent">
                                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mobile Number</label>
                                                <input type="tel" value="+919876543210" className="text-sm bg-transparent outline-none border-none text-slate-500 cursor-not-allowed" disabled />
                                            </div>
                                        </div>

                                    </div>
                                    {/* <!-- mobile number info --> */}

                                    {/* <!-- faqs --> */}
                                    <div className="flex flex-col gap-4 mt-4">
                                        <span className="font-display font-bold text-base sm:text-lg text-slate-900 mb-2">FAQS</span>
                                        <h4 className="text-sm font-semibold text-slate-900">What happens when I update my email address (or mobile number)?</h4>
                                        <p className="text-sm text-slate-600">Your login email id (or mobile number) changes, likewise. You'll receive all your account related communication on your updated email address (or mobile number).</p>

                                        <h4 className="text-sm font-semibold text-slate-900">When will my TechBazar account be updated with the new email address (or mobile number)?</h4>
                                        <p className="text-sm text-slate-600">It happens as soon as you confirm the verification code sent to your email (or mobile) and save the changes.</p>

                                        <h4 className="text-sm font-semibold text-slate-900">What happens to my existing TechBazar account when I update my email address (or mobile number)?</h4>
                                        <p className="text-sm text-slate-600">Updating your email address (or mobile number) doesn't invalidate your account. Your account remains fully functional. You'll continue seeing your Order history, saved information and personal details.</p>

                                        <h4 className="text-sm font-semibold text-slate-900">Does my Seller account get affected when I update my email address?</h4>
                                        <p className="text-sm text-slate-600">TechBazar has a 'single sign-on' policy. Any changes will reflect in your Seller account also.</p>

                                    </div>
                                    {/* <!-- faqs --> */}

                                    {/* <!-- deactivate account --> */}
                                    <Link className="btn-ghost text-sm" to="/">Deactivate Account</Link>
                                    {/* <!-- deactivate account --> */}
                                </div>
                                {/* <!-- edit info container --> */}

                                <img draggable="false" className="w-full object-contain" src="https://static-assets-web.flixcart.com/www/linchpin/fk-cp-zion/img/myProfileFooter_4e9fe2.png" alt="footer" />
                            </div>
                            {/* <!-- details column --> */}
                        </div>
                    </main>
                </>
            }
        </>
    );
};

export default Account;
