import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MetaData from '../Layouts/MetaData';
import successfull from '../../assets/images/Transaction/success.png';
import failed from '../../assets/images/Transaction/failed.png';

const OrderSuccess = ({ success }) => {

    const navigate = useNavigate();
    const [time, setTime] = useState(3);

    useEffect(() => {
        if (time === 0) {
            if (success) {
                navigate("/orders")
            } else {
                navigate("/cart")
            }
            return;
        };
        const intervalId = setInterval(() => {
            setTime(time - 1);
        }, 1000);

        return () => clearInterval(intervalId);
        // eslint-disable-next-line
    }, [time]);

    return (
        <>
            <MetaData title={`Transaction ${success ? "Successfull" : "Failed"}`} />

            <main className="w-full sm:w-11/12 mx-auto flex flex-col gap-4 px-3 sm:px-4 pb-10 mt-3 sm:mt-6">

                {/* <!-- row --> */}
                <div className="surface p-8 sm:p-12 text-center max-w-lg mx-auto flex flex-col items-center justify-center gap-3">
                    {success && (
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-green/10 text-primary-green text-2xl font-bold">✓</span>
                    )}
                    <img draggable="false" className="w-1/2 h-60 object-contain" src={success ? successfull : failed} alt="Transaction Status" />
                    <h1 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900">Transaction {success ? "Successfull" : "Failed"}</h1>
                    <p className="mt-2 text-sm text-slate-600">Redirecting to {success ? "orders" : "cart"} in {time} sec</p>
                    <Link to={success ? "/orders" : "/cart"} className="btn-accent mt-2 py-2.5 px-6 text-sm font-bold uppercase rounded-lg">go to {success ? "orders" : "cart"}</Link>
                </div>
                {/* <!-- row --> */}

            </main>
        </>
    );
};

export default OrderSuccess;
