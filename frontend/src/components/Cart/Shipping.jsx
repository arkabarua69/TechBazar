import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { saveShippingInfo } from '../../actions/cartAction';
import PriceSidebar from './PriceSidebar';
import Stepper from './Stepper';
import MetaData from '../Layouts/MetaData';

const DIVISIONS = [
    'Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh',
];

const Shipping = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const { cartItems, shippingInfo } = useSelector((state) => state.cart);

    const [address, setAddress] = useState(shippingInfo?.address || '');
    const [city, setCity] = useState(shippingInfo?.city || '');
    const [state, setState] = useState(shippingInfo?.state || '');
    const [pincode, setPincode] = useState(shippingInfo?.pincode || '');
    const [phoneNo, setPhoneNo] = useState(shippingInfo?.phoneNo || '');

    const shippingSubmit = (e) => {
        e.preventDefault();
        const phone = phoneNo.replace(/\D/g, '');
        if (phone.length < 10 || phone.length > 11) {
            enqueueSnackbar('Enter a valid phone number (10–11 digits)', { variant: 'error' });
            return;
        }
        dispatch(saveShippingInfo({ address, city, country: 'BD', state, pincode, phoneNo: phone }));
        navigate('/order/confirm');
    };

    const Field = ({ label, value, onChange, type = 'text', required = true, placeholder }) => (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                {label}{required && <span style={{ color: 'var(--color-accent)' }}>*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                placeholder={placeholder || label}
                className="input-field"
            />
        </div>
    );

    return (
        <>
            <MetaData title="Shipping Details" />
            <main className="w-full sm:w-11/12 mx-auto flex flex-col gap-4 px-3 sm:px-4 pb-10 mt-3 sm:mt-6">
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <div className="flex-1">
                        <Stepper activeStep={1}>
                            <div className="w-full">
                                <form onSubmit={shippingSubmit} autoComplete="off"
                                    className="flex flex-col gap-4 w-full sm:w-3/4 mx-1 sm:mx-8 my-4">

                                    <Field label="Full Address" value={address} onChange={setAddress}
                                        placeholder="House, Road, Area" />

                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="City / Upazila" value={city} onChange={setCity} placeholder="City" />
                                        <Field label="Postal Code" value={pincode} onChange={setPincode} type="number" placeholder="1200" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Division (State) */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-semibold uppercase tracking-wider"
                                                style={{ color: 'var(--color-text-muted)' }}>
                                                Division<span style={{ color: 'var(--color-accent)' }}>*</span>
                                            </label>
                                            <select
                                                value={state}
                                                onChange={(e) => setState(e.target.value)}
                                                required
                                                className="input-field"
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <option value="">Select Division</option>
                                                {DIVISIONS.map((d) => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Phone */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-semibold uppercase tracking-wider"
                                                style={{ color: 'var(--color-text-muted)' }}>
                                                Phone<span style={{ color: 'var(--color-accent)' }}>*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={phoneNo}
                                                onChange={(e) => setPhoneNo(e.target.value)}
                                                required
                                                placeholder="01XXXXXXXXX"
                                                className="input-field"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn-accent w-full sm:w-auto sm:self-start px-8 py-3 text-sm font-semibold mt-2"
                                    >
                                        Save & Continue
                                    </button>
                                </form>
                            </div>
                        </Stepper>
                    </div>
                    <PriceSidebar cartItems={cartItems} />
                </div>
            </main>
        </>
    );
};

export default Shipping;
