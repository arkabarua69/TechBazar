import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MetaData from '../Layouts/MetaData';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const OrderSuccess = ({ success }) => {
    const navigate = useNavigate();
    const [time, setTime] = useState(4);

    useEffect(() => {
        if (time === 0) {
            navigate(success ? '/orders' : '/cart');
            return;
        }
        const id = setInterval(() => setTime((t) => t - 1), 1000);
        return () => clearInterval(id);
    }, [time, success, navigate]);

    return (
        <>
            <MetaData title={`Payment ${success ? 'Successful' : 'Failed'}`} />
            <div
                className="min-h-screen flex items-center justify-center p-6"
                style={{ backgroundColor: 'var(--color-bg)' }}
            >
                <div className="surface max-w-md w-full p-8 sm:p-12 text-center flex flex-col items-center gap-5">
                    {/* Status icon */}
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center"
                        style={{
                            backgroundColor: success ? 'rgba(22,163,74,0.1)' : 'rgba(239,68,68,0.1)',
                        }}
                    >
                        {success
                            ? <CheckCircleIcon sx={{ fontSize: '3rem', color: 'var(--color-success)' }} />
                            : <CancelIcon sx={{ fontSize: '3rem', color: 'var(--color-danger)' }} />}
                    </div>

                    <div className="flex flex-col gap-2">
                        <h1
                            className="font-bold text-xl sm:text-2xl"
                            style={{ color: success ? 'var(--color-success)' : 'var(--color-danger)' }}
                        >
                            {success ? 'Order Placed Successfully!' : 'Payment Failed'}
                        </h1>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {success
                                ? 'Your order has been confirmed. Track it in My Orders.'
                                : 'Something went wrong with the payment. Please try again.'}
                        </p>
                    </div>

                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Redirecting to {success ? 'orders' : 'cart'} in {time}s…
                    </p>

                    <Link
                        to={success ? '/orders' : '/cart'}
                        className="btn-accent px-8 py-3 text-sm font-semibold"
                    >
                        {success ? 'View My Orders' : 'Back to Cart'}
                    </Link>

                    {success && (
                        <Link to="/" className="text-sm font-medium hover:underline" style={{ color: 'var(--color-accent)' }}>
                            Continue Shopping
                        </Link>
                    )}
                </div>
            </div>
        </>
    );
};

export default OrderSuccess;
